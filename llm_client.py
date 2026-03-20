"""
Thin LLM abstraction for OpenShorts.
Uses Ollama (local) for text generation. Gemini stays available for multimodal features.
"""
import json
import os
import ollama


DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:9b")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")


def _get_client():
    return ollama.Client(host=OLLAMA_HOST)


def generate_text(prompt: str, model: str = None) -> str:
    """Send a text prompt to Ollama and return the response text."""
    model = model or DEFAULT_MODEL
    client = _get_client()
    response = client.chat(model=model, messages=[{"role": "user", "content": prompt}])
    return response["message"]["content"]


def generate_json(prompt: str, model: str = None) -> dict:
    """Send a text prompt and parse the response as JSON."""
    model = model or DEFAULT_MODEL
    client = _get_client()
    response = client.chat(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        format="json",
    )
    text = response["message"]["content"]

    # Clean markdown wrappers
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Extract JSON object
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1:
        text = text[start_idx : end_idx + 1]

    return json.loads(text)
