"""
Thin LLM abstraction for OpenShorts.
Uses Ollama (local) for all generation: text, JSON, and vision.
"""
import json
import os
import ollama


DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:4b")
DEFAULT_VISION_MODEL = os.environ.get("OLLAMA_VISION_MODEL", "minicpm-v")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")


def _get_client():
    return ollama.Client(host=OLLAMA_HOST, timeout=300)


def extract_json(text: str, kind: str = "object"):
    """Strip markdown fences and parse the first JSON object/array in `text`.

    kind="object" extracts between the outermost '{' and '}'.
    kind="array"  extracts between the outermost '[' and ']'.
    Raises ValueError if no delimiters are found; json.JSONDecodeError on bad JSON.
    """
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    open_ch, close_ch = ("[", "]") if kind == "array" else ("{", "}")
    start_idx = text.find(open_ch)
    end_idx = text.rfind(close_ch)
    if start_idx != -1 and end_idx != -1:
        text = text[start_idx : end_idx + 1]
    else:
        raise ValueError(f"No JSON {kind} found in LLM response: {text[:200]}")

    return json.loads(text)


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
    )
    text = response["message"]["content"]

    if not text or not text.strip():
        raise ValueError("LLM returned empty response")

    return extract_json(text, kind="object")


def generate_vision(prompt: str, image_paths: list, model: str = None) -> str:
    """Send images + text prompt to an Ollama vision model."""
    model = model or DEFAULT_VISION_MODEL
    client = _get_client()

    # Read images as raw bytes - ollama client handles encoding
    images = []
    for path in image_paths:
        with open(path, "rb") as f:
            images.append(f.read())

    response = client.chat(
        model=model,
        messages=[{"role": "user", "content": prompt, "images": images}],
    )
    return response["message"]["content"]


def generate_vision_json(prompt: str, image_paths: list, model: str = None) -> dict:
    """Send images + text prompt and parse response as JSON."""
    text = generate_vision(prompt, image_paths, model)

    # Clean markdown wrappers
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1:
        text = text[start_idx : end_idx + 1]

    return json.loads(text)
