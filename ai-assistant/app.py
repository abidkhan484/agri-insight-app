import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services.rag import answer_question
from config.logger import logger, configure_logging

load_dotenv()
configure_logging(os.getenv("LOG_LEVEL", "INFO"))

app = Flask(__name__)
# ALLOWED_ORIGINS should be a comma-separated list of origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
CORS(app, origins=allowed_origins)

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
