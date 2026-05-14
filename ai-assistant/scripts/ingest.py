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

# Load from .env file
load_dotenv()
configure_logging(os.getenv("LOG_LEVEL", "INFO"))

# Base project directory (parent of ai-assistant)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Source document paths
SOURCE_DIRS = [
    BASE_DIR / "skills/zbnf-formulation",
    BASE_DIR / "docs",
    BASE_DIR / "tasks",
]

CHROMA_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

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

    if not docs:
        logger.error("no_docs_found")
        return

    # Set up ChromaDB
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = chroma_client.get_or_create_collection("zbnf_knowledge")
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # Configure local embedding model
    Settings.embed_model = OllamaEmbedding(model_name=EMBED_MODEL, base_url=OLLAMA_URL)
    Settings.llm = None  # Embedding only at ingest time

    # Build index
    index = VectorStoreIndex.from_documents(
        docs, storage_context=storage_context, show_progress=True
    )
    logger.info("ingestion_complete", chroma_path=CHROMA_PATH)
    return index

if __name__ == "__main__":
    ingest()
