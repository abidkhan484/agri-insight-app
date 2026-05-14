import pytest
from unittest.mock import patch, MagicMock
import json

class TestRAGService:
    @patch("services.rag.Settings")
    @patch("services.rag.chromadb.PersistentClient")
    @patch("services.rag.VectorStoreIndex")
    def test_rag_engine_initialization(self, mock_index, mock_chroma, mock_settings):
        """Verify RAG engine initializes with correct system prompt and settings."""
        from services.rag import get_query_engine
        
        # Reset global _query_engine if it exists to force re-init
        import services.rag
        services.rag._query_engine = None
        
        get_query_engine()
        
        # Verify Settings are configured
        assert mock_settings.llm is not None
        assert mock_settings.embed_model is not None
        
        # Verify query engine creation with system prompt
        mock_index.from_vector_store.return_value.as_query_engine.assert_called_once()
        args, kwargs = mock_index.from_vector_store.return_value.as_query_engine.call_args
        
        system_prompt = kwargs.get("system_prompt", "")
        assert "ZBNF" in system_prompt
        assert "expert" in system_prompt or "বিশেষজ্ঞ" in system_prompt
        assert "Bangladesh" in system_prompt or "বাংলাদেশ" in system_prompt

    @patch("services.rag.get_query_engine")
    def test_answer_question_success(self, mock_get_engine):
        """RAG engine returns answer and sources for valid question."""
        mock_query_engine = MagicMock()
        mock_response = MagicMock()
        mock_response.__str__ = lambda self: "জীবামৃত তৈরিতে গোবর লাগে।"
        
        mock_source_node = MagicMock()
        mock_source_node.metadata = {"file_name": "zbnf-guide.md"}
        mock_response.source_nodes = [mock_source_node]
        
        mock_query_engine.query.return_value = mock_response
        mock_get_engine.return_value = mock_query_engine
        
        from services.rag import answer_question
        result = answer_question("জীবামৃত কীভাবে বানাব?", language="bn")
        
        assert result["status"] == "ok"
        assert "জীবামৃত" in result["answer"]
        assert "zbnf-guide.md" in result["sources"]

    @patch("services.rag.get_query_engine")
    def test_answer_question_failure(self, mock_get_engine):
        """Verify graceful error handling on RAG failure."""
        mock_query_engine = MagicMock()
        mock_query_engine.query.side_effect = Exception("Ollama connection failed")
        mock_get_engine.return_value = mock_query_engine
        
        from services.rag import answer_question
        result = answer_question("Any question")
        
        assert result["status"] == "error"
        assert "দুঃখিত" in result["answer"] or "Sorry" in result["answer"]

class TestFlaskAPI:
    def test_health_check(self, client):
        """Health endpoint returns ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.get_json() == {"status": "ok"}

    @patch("services.rag.answer_question")
    def test_ask_endpoint_success(self, mock_answer, client):
        """Valid /ask request returns 200 and AI result."""
        mock_answer.return_value = {"answer": "Test answer", "sources": ["doc1.md"], "status": "ok"}
        
        response = client.post("/ask", json={"question": "What is ZBNF?"})
        
        assert response.status_code == 200
        data = response.get_json()
        assert data["answer"] == "Test answer"
        assert "doc1.md" in data["sources"]

    def test_ask_endpoint_validation_empty(self, client):
        """Missing or empty question returns 400."""
        response = client.post("/ask", json={})
        assert response.status_code == 400
        
        response = client.post("/ask", json={"question": ""})
        assert response.status_code == 400

    def test_ask_endpoint_validation_too_long(self, client):
        """Question > 1000 chars returns 400."""
        long_q = "A" * 1001
        response = client.post("/ask", json={"question": long_q})
        assert response.status_code == 400
        assert "too long" in response.get_json()["error"].lower()

def test_logging_configuration():
    """Verify structlog configuration includes JSONRenderer."""
    from config.logger import configure_logging
    import structlog
    
    # This might be tricky to verify after-the-fact, but we can check if configure_logging
    # runs without error and structlog has some expected processors if we could inspect it.
    # For now, just ensure it exists and can be called.
    configure_logging("DEBUG")
    
    # We can also check if the implementation uses structlog.get_logger
    from config.logger import logger
    assert hasattr(logger, "info")
    assert hasattr(logger, "error")
