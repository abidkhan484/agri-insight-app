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
    try:
        collection = chroma_client.get_collection("zbnf_knowledge")
    except Exception as e:
        logger.error("chroma_collection_missing", error=str(e))
        return None

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
    if engine is None:
        return {
            "answer": "দুঃখিত, নলেজ বেস ইনডেক্স করা হয়নি। অনুগ্রহ করে ইনজেশন স্ক্রিপ্টটি চালান। / Sorry, knowledge base not indexed. Please run ingestion script.",
            "sources": [],
            "status": "error"
        }
    
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
        return {
            "answer": "দুঃখিত, উত্তর খুঁজে পাওয়া যায়নি। / Sorry, could not find an answer.",
            "sources": [],
            "status": "error"
        }
