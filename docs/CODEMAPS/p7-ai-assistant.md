# P7 — Local AI Assistant Codemap

**Last Updated:** 2025-05-22
**Entry Points:** `ai-assistant/app.py`

## Architecture

```
User Query ──▶ Flask (/ask) ──▶ RAG Service (rag.py)
                                  │
      ┌───────────────────────────┴────────────────────────────┐
      ▼                                                        ▼
ChromaDB (Vector Store) ◀───────▶ Ollama (Embedding & LLM)
(zbnf_knowledge collection)       (nomic-embed-text & gemma2:2b)
```

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| `app.py` | Flask API entry point | `app` | `flask`, `rag.py`, `logger.py` |
| `services/rag.py` | Core RAG logic | `answer_question` | `llama-index`, `chromadb`, `ollama` |
| `scripts/ingest.py` | Knowledge base indexing | Script execution | `llama-index`, `chromadb` |
| `config/logger.py` | Structured logging | `logger`, `configure_logging` | `structlog` |

## Data Flow

1. **Ingestion**: `ingest.py` reads `docs/*.md` and `skills/*/SKILL.md` → Chunks them → Embeds with Ollama → Saves to ChromaDB.
2. **Query**: Farmer sends `/ask` via Telegram → `agri-bot` calls Flask `/ask` → `rag.py` retrieves context from ChromaDB → Ollama generates answer → Returns to farmer.

## External Dependencies

- **Ollama** - Local LLM runtime
- **LlamaIndex** - RAG orchestration framework
- **ChromaDB** - Vector database
- **Flask** - Web framework for AI service

## Related Areas

- [P6 — ZBNF Knowledge](./p6-zbnf-knowledge.md) - Source of documentation for indexing.
- [P0 — Shared Foundation](../architecture.md) - Telegram bot interaction.
