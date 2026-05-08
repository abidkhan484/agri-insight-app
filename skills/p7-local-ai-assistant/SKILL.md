---
name: p7-local-ai-assistant
description: Implement P7 Local AI Assistant — Ollama (Gemma2:2b or Llama3:8b) local LLM, ChromaDB vector store with ZBNF document embeddings, LlamaIndex RAG pipeline, Flask REST API, Bangla query support, and structlog Python logging. Zero API cost — runs entirely on local hardware. Requires P0 + P6 complete.
triggers:
  - implement p7
  - local ai assistant
  - ollama rag
  - chromadb llamaindex
  - zbnf ai chat
  - bangla ai assistant
  - local llm farming
---

# P7 — Local AI Assistant Implementation Workflow

## Dependency Check
**P0 must be complete.** P6 knowledge content should be finalized before P7 (provides RAG documents).
P7 can be developed locally in parallel with P8, but deploy after P6.

## Required Reading
- `tasks/p7-local-ai-assistant.md` — full phase checklist
- `skills/zbnf-formulation/SKILL.md` — entire document goes into ChromaDB as source knowledge
- All files in `docs/` — these become RAG source documents

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: Environment Setup

Python 3.10+ required. Create a separate Python project:

```bash
mkdir ai-assistant && cd ai-assistant
python3 -m venv venv
source venv/bin/activate
pip install llama-index chromadb flask flask-cors structlog \
            llama-index-vector-stores-chroma \
            llama-index-llms-ollama \
            llama-index-embeddings-ollama
```

Install Ollama (runs locally — no API key, no cost):
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull gemma2:2b      # Primary — fast, ~1.5GB RAM
ollama pull llama3:8b      # Alternative — higher quality, ~5GB RAM
```

`requirements.txt`:
```
llama-index>=0.10.0
llama-index-vector-stores-chroma>=0.1.0
llama-index-llms-ollama>=0.1.0
llama-index-embeddings-ollama>=0.1.0
chromadb>=0.4.0
flask>=3.0.0
flask-cors>=4.0.0
structlog>=24.0.0
python-dotenv>=1.0.0
```

#### Phase 2: Logger Setup (`config/logger.py`)

```python
import structlog
import logging

def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
    )
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
    )

logger = structlog.get_logger()
```

#### Phase 3: Document Ingestion (`scripts/ingest.py`)

**Ingest these sources into ChromaDB:**
1. `skills/zbnf-formulation/SKILL.md` (most important — primary knowledge)
2. `docs/farmer-guide-bn-en.md`
3. `docs/api-reference.md`
4. All task MD files in `tasks/`

```python
import os
from pathlib import Path
from dotenv import load_dotenv
import chromadb
from llama_index.core import (
    SimpleDirectoryReader, VectorStoreIndex, StorageContext, Settings
)
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from config.logger import logger, configure_logging

load_dotenv()
configure_logging(os.getenv("LOG_LEVEL", "INFO"))

# Source document paths — relative to workspace root
SOURCE_DIRS = [
    Path("../skills/zbnf-formulation"),
    Path("../docs"),
    Path("../tasks"),
]

CHROMA_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")  # free, local Ollama model

def ingest():
    logger.info("ingestion_start", sources=[str(d) for d in SOURCE_DIRS])

    # Load documents
    docs = []
    for dir_path in SOURCE_DIRS:
        if dir_path.exists():
            reader = SimpleDirectoryReader(
                input_dir=str(dir_path),
                required_exts=[".md"],
                recursive=True,
            )
            loaded = reader.load_data()
            docs.extend(loaded)
            logger.info("docs_loaded", directory=str(dir_path), count=len(loaded))
        else:
            logger.warning("source_dir_missing", path=str(dir_path))

    logger.info("total_docs_loaded", count=len(docs))

    # Set up ChromaDB
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = chroma_client.get_or_create_collection("zbnf_knowledge")
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # Configure local embedding model
    Settings.embed_model = OllamaEmbedding(model_name=EMBED_MODEL)
    Settings.llm = None  # Embedding only at ingest time

    # Build index
    index = VectorStoreIndex.from_documents(
        docs, storage_context=storage_context, show_progress=True
    )
    logger.info("ingestion_complete", chroma_path=CHROMA_PATH)
    return index

if __name__ == "__main__":
    ingest()
```

Run ingestion:
```bash
ollama pull nomic-embed-text  # local embedding model
python scripts/ingest.py
```

#### Phase 4: RAG Query Engine (`services/rag.py`)

```python
import os
from dotenv import load_dotenv
import chromadb
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from config.logger import logger

load_dotenv()

LLM_MODEL    = os.getenv("OLLAMA_MODEL", "gemma2:2b")
EMBED_MODEL  = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHROMA_PATH  = os.getenv("CHROMA_DB_PATH", "./chroma_db")
OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

_query_engine = None

def get_query_engine():
    global _query_engine
    if _query_engine is not None:
        return _query_engine

    logger.info("rag_engine_init", model=LLM_MODEL, embed=EMBED_MODEL)

    Settings.llm = Ollama(model=LLM_MODEL, base_url=OLLAMA_URL, request_timeout=120.0)
    Settings.embed_model = OllamaEmbedding(model_name=EMBED_MODEL, base_url=OLLAMA_URL)

    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = chroma_client.get_collection("zbnf_knowledge")
    vector_store = ChromaVectorStore(chroma_collection=collection)
    index = VectorStoreIndex.from_vector_store(vector_store)

    system_prompt = """আপনি একজন ZBNF (জিরো বাজেট প্রাকৃতিক কৃষি) বিশেষজ্ঞ।
বাংলাদেশের কৃষকদের সাহায্য করুন।
শুধুমাত্র ZBNF পদ্ধতিতে চিকিৎসার পরামর্শ দিন।
সংখ্যা ও অনুপাত সঠিকভাবে উল্লেখ করুন।
You are a ZBNF (Zero Budget Natural Farming) expert assistant.
Help farmers in Bangladesh with precise advice.
Only recommend ZBNF treatments with exact ratios.
Always cite context from the ZBNF knowledge base."""

    _query_engine = index.as_query_engine(
        similarity_top_k=4,
        response_mode="compact",
        system_prompt=system_prompt,
    )
    logger.info("rag_engine_ready")
    return _query_engine

def answer_question(question: str, language: str = "bn") -> dict:
    logger.info("query_received", language=language, question_length=len(question))
    engine = get_query_engine()
    try:
        response = engine.query(question)
        answer = str(response)
        sources = [
            node.metadata.get("file_name", "unknown")
            for node in (response.source_nodes or [])
        ]
        logger.info("query_answered", sources=sources, answer_length=len(answer))
        return {"answer": answer, "sources": sources, "status": "ok"}
    except Exception as e:
        logger.error("query_failed", error=str(e))
        return {"answer": "দুঃখিত, উত্তর খুঁজে পাওয়া যায়নি। / Sorry, could not find an answer.", "sources": [], "status": "error"}
```

#### Phase 5: Flask REST API (`app.py`)

```python
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services.rag import answer_question
from config.logger import logger, configure_logging

load_dotenv()
configure_logging(os.getenv("LOG_LEVEL", "INFO"))

app = Flask(__name__)
CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","))

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(silent=True)
    if not data or not data.get("question"):
        return jsonify({"error": "question field required"}), 400

    question = str(data["question"]).strip()
    language = str(data.get("language", "bn"))

    # Input validation — reject suspiciously long inputs
    if len(question) > 1000:
        logger.warning("question_too_long", length=len(question))
        return jsonify({"error": "Question too long (max 1000 chars)"}), 400

    result = answer_question(question, language)
    return jsonify(result)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info("flask_start", port=port)
    app.run(host="0.0.0.0", port=port, debug=(os.getenv("FLASK_ENV") == "development"))
```

`.env.example`:
```
OLLAMA_MODEL=gemma2:2b
EMBED_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_DB_PATH=./chroma_db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
PORT=5000
```

#### Phase 6: Telegram `/ask` Integration (`bot/commands/ask.js`)

```js
import logger from '../../config/logger.js';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:5000';

export function registerAskCommand(bot, db) {
  bot.command('ask', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const question = ctx.message.text.replace('/ask', '').trim();

    logger.info('Ask command received', { telegramId: `id:${telegramId}` });

    if (!question) {
      return ctx.reply(
        '❓ প্রশ্ন লিখুন: /ask জীবামৃত কীভাবে তৈরি করব?\n' +
        'Type your question: /ask How do I make Jeevamrutha?'
      );
    }

    if (question.length > 500) {
      return ctx.reply('প্রশ্ন ৫০০ অক্ষরের বেশি হবে না।\nQuestion must be under 500 characters.');
    }

    const thinking = await ctx.reply('🤔 ভাবছি...\nThinking...');

    try {
      const response = await fetch(`${AI_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language: 'bn' }),
        signal: AbortSignal.timeout(90000), // 90s timeout
      });

      if (!response.ok) throw new Error(`AI API error: ${response.status}`);
      const data = await response.json();

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        `🌾 *AI উত্তর / AI Answer*\n\n${data.answer}`,
        { parse_mode: 'Markdown' }
      );
      logger.info('Ask response sent', { telegramId: `id:${telegramId}`, sources: data.sources });
    } catch (err) {
      logger.error('Ask command failed', { error: err.message });
      await ctx.telegram.editMessageText(
        ctx.chat.id, thinking.message_id, null,
        'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।\nSorry, unable to answer right now.'
      );
    }
  });
}
```

---

### Step 2 — qa

Python test file (`tests/test_rag.py`):

```python
import pytest
from unittest.mock import patch, MagicMock

class TestRAGService:
    def test_answer_question_success(self):
        """RAG engine returns answer and sources for valid question."""
        with patch("services.rag.get_query_engine") as mock_engine:
            mock_response = MagicMock()
            mock_response.__str__ = lambda self: "জীবামৃত তৈরিতে ১০ কেজি গোবর প্রয়োজন।"
            mock_response.source_nodes = []
            mock_engine.return_value.query.return_value = mock_response

            from services.rag import answer_question
            result = answer_question("জীবামৃত কীভাবে তৈরি করব?", "bn")

        assert result["status"] == "ok"
        assert "গোবর" in result["answer"]

    def test_answer_question_error_returns_graceful_message(self):
        """RAG engine failure returns user-friendly Bangla/English message."""
        with patch("services.rag.get_query_engine") as mock_engine:
            mock_engine.return_value.query.side_effect = RuntimeError("model not found")

            from services.rag import answer_question
            result = answer_question("কোনো প্রশ্ন", "bn")

        assert result["status"] == "error"
        assert "দুঃখিত" in result["answer"]

    def test_api_rejects_empty_question(self, client):
        """Flask /ask endpoint rejects missing question field."""
        response = client.post("/ask", json={})
        assert response.status_code == 400

    def test_api_rejects_long_question(self, client):
        """Flask /ask endpoint rejects questions > 1000 chars."""
        long_q = "ক" * 1001
        response = client.post("/ask", json={"question": long_q})
        assert response.status_code == 400
```

QA checklist:
- [ ] `ollama pull gemma2:2b` completes without error
- [ ] `python scripts/ingest.py` indexes all SKILL.md + docs files
- [ ] ChromaDB collection contains > 0 documents after ingestion
- [ ] `POST /ask {"question": "জীবামৃত কীভাবে বানাবো?"}` returns correct answer
- [ ] `/ask` bot command sends response within 90 seconds
- [ ] Long question (>500 chars via bot, >1000 via API) rejected
- [ ] structlog output is JSON format in stdout
- [ ] `ALLOWED_ORIGINS` env var controls CORS correctly

---

### Step 3 — reviewer

- [ ] No Ollama API key exposure — it's local; no key needed
- [ ] Flask `ALLOWED_ORIGINS` restricts CORS to known frontends
- [ ] Question length validated at both bot and API layer (defense in depth)
- [ ] No farmer PII in structlog calls — only `id:` prefixed identifiers
- [ ] ChromaDB persistence path from `.env` — not hardcoded
- [ ] Timeout on external Ollama call prevents bot hang
- [ ] Bangla fallback message when AI fails

---

### Step 4 — doc-updater

- `README.md` → P7: Ollama install, ingest script, Flask start command
- `docs/architecture.md` → AI pipeline: ChromaDB → LlamaIndex → Ollama → Flask → Telegram
- `docs/developer-setup.md` → Python venv setup, Ollama install
- `docs/farmer-guide-bn-en.md` → `/ask` command usage
- `tasks/p7-local-ai-assistant.md` → mark completed phases

---

### Step 5 — committer

```
feat(p7): add local AI assistant with Ollama RAG pipeline

- Ollama (gemma2:2b) + ChromaDB + LlamaIndex RAG
- ingest.py indexes SKILL.md + docs into ChromaDB vector store
- Flask /ask REST API with CORS, input validation, 1000-char limit
- /ask Telegram command with 90s timeout + graceful fallback
- Bangla system prompt for farmer-appropriate responses
- structlog JSON logging throughout Python service
- Zero external API cost — fully local inference
```

---

## Hardware Requirements for Local Inference

| Model | RAM Required | Inference Speed | Recommendation |
|-------|-------------|----------------|---------------|
| `gemma2:2b` | ~3 GB | Fast (< 10s) | Default — runs on RPi 5 8GB |
| `llama3:8b` | ~8 GB | Medium (15–30s) | Better quality — needs laptop/server |
| `mistral:7b` | ~7 GB | Medium | Alternative to Llama3 |

> For a Raspberry Pi 4 with 4GB RAM: use `gemma2:2b` with `--num-ctx 2048`.
