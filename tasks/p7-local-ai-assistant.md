---
title: "P7 — Local AI Assistant"
weight: 70
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p7-local-ai-assistant/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 🤖 P7 — Local AI Assistant (Tool G)

## Objective

Set up a RAG (Retrieval Augmented Generation) system that runs entirely locally — Ollama LLM + ChromaDB vector store + your ZBNF docs as the knowledge base — allowing farmers to ask ZBNF questions in Bangla and get grounded, relevant answers without any API cost.

## Prerequisites

- Laptop with 8GB+ RAM (16GB recommended for Llama 3 8B)
- Python ≥ 3.10
- ZBNF documentation content finalized (this project's `docs/` folder)

## Subtasks

### Phase 1: Ollama Setup

- [x] Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
- [x] Pull model: `ollama pull gemma2:2b` (low-end) or `ollama pull llama3:8b` (recommended)
- [x] Verify: `ollama run gemma2:2b "What is Jeevamrutha?"` returns a coherent answer
- [x] Test Bangla: `ollama run gemma2:2b "জীবামৃত কি?"` — confirm Bangla support quality
- [x] Document hardware performance: response time, RAM usage

### Phase 2: Knowledge Base Indexing

- [x] Install dependencies: `pip install llama-index chromadb sentence-transformers`
- [x] Create `indexer.py` that:
  1. Loads all `.md` files from `docs/` recursively
  2. Chunks documents (512 tokens, 50-token overlap)
  3. Generates embeddings using `sentence-transformers/all-MiniLM-L6-v2`
  4. Stores in ChromaDB (local, file-based at `./chroma_db/`)
- [x] Run indexing: verify document count and chunk count
- [x] Add re-indexing script for when docs are updated

### Phase 3: RAG Query Engine

- [x] Create `query.py` with RAG pipeline:
  1. Receive user question (Bangla or English)
  2. Embed the question
  3. Retrieve top-5 relevant chunks from ChromaDB
  4. Construct prompt: system instruction + retrieved context + user question
  5. Send to Ollama API (`POST http://localhost:11434/api/generate`)
  6. Return the grounded answer
- [x] System prompt: "You are a ZBNF farming expert for Bangladesh. Answer only from the provided context. If unsure, say so. Respond in the same language as the question."
- [x] Add source citation: include which doc section the answer came from

### Phase 4: Web UI

- [x] Build a simple web UI (Flask or Streamlit):
  - Chat-style input/output
  - "Sources" expandable section showing retrieved doc chunks
  - Bangla input support
  - Loading indicator during inference
- [x] Alternative: integrate with [Jan.ai](https://jan.ai) desktop UI
- [x] Test with 20+ common farmer questions

### Phase 5: Optimization & Testing

- [x] Benchmark: query latency on target hardware (aim for <10s on 8GB RAM)
- [x] Test with Bangla-only queries — document quality of Bangla responses per model
- [x] Create a test suite of 30 questions with expected answer themes
- [x] Tune chunk size and retrieval count (k) for best answer quality
- [x] Document which model works best for Bangla ZBNF queries

## Acceptance Criteria

- [x] `ollama` runs locally and responds to queries
- [x] All ZBNF docs indexed in ChromaDB (verify count)
- [x] RAG query returns ZBNF-grounded answers (not hallucinated)
- [x] Bangla queries return Bangla answers with reasonable quality
- [x] Web UI allows conversational interaction
- [x] Full system works offline after initial setup
- [x] Response time < 15 seconds on 8GB RAM machine
- [x] `structlog` JSON logging used throughout Python service — no `print()` statements
- [x] Flask `/ask` endpoint rejects questions > 1000 characters (400 response)
- [x] `ALLOWED_ORIGINS` CORS controlled by `.env` variable — not hardcoded
- [x] Graceful Bangla/English error message when Ollama unavailable
- [x] `docs/architecture.md` updated with AI pipeline diagram (ChromaDB → LlamaIndex → Ollama → Flask → Telegram)

## Estimated Effort

⏱️ **3–5 days** (Completed)

## Dependencies

| Dependency | Status |
|---|---|
| ZBNF documentation content finalized | Completed |
| No code dependencies on other tasks | — |
| Hardware: 8GB+ RAM laptop | Required |
