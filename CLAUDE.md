# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenShorts is an AI-powered vertical video generator that transforms long YouTube videos or local uploads into viral-ready short clips (9:16 format) for TikTok, Instagram Reels, and YouTube Shorts.

Two main modes:
- **OpenShorts**: clips long videos into vertical shorts (core pipeline)
- **SaaSShorts**: generates UGC-style AI actor videos for SaaS products from a URL

Primary LLM is **Ollama** (local, default model `qwen3.5:4b`). Gemini is used optionally for some title/thumbnail workflows when a client-side API key is supplied.

## Development Commands

### Local Development (Docker)
```bash
docker compose up --build   # Build and run full stack
```
- Backend: http://localhost:8001 (mapped from container port 8000)
- Frontend: http://localhost:5175 (Vite proxies API calls to backend)

Ollama must be running on the host at `localhost:11434` — the backend container reaches it via `host.docker.internal:11434`.

### Frontend Only (Dashboard)
```bash
cd dashboard
npm install
npm run dev       # Dev server with HMR (port 5173)
npm run build     # Production build
npm run lint      # ESLint (strict, --max-warnings 0)
```

### Backend Only
```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Architecture

### Core Processing Pipeline
1. **Ingest** - YouTube download (yt-dlp) or local upload
2. **Transcription** - faster-whisper with word-level timestamps
3. **Scene Detection** - PySceneDetect for segment boundaries
4. **AI Analysis** - Ollama (or Gemini if key provided) identifies 3-15 viral moments (15-60 sec each)
5. **FFmpeg Extraction** - Precise clip cutting
6. **AI Cropping** - Vertical reframing with subject tracking
7. **Effects/Subtitles** - Optional AI-generated FFmpeg filters
8. **Hook Overlay** - Text overlays with styled fonts
9. **Voice Dubbing** - Optional ElevenLabs AI translation (30+ languages)
10. **S3 Backup** - Silent background upload
11. **Social Distribution** - Upload-Post API (async upload)

### Key Files
| File | Purpose |
|------|---------|
| `main.py` | Core video processing: transcription, scene detection, clip extraction, vertical reframing |
| `app.py` | FastAPI server with async job queue and all REST endpoints |
| `llm_client.py` | Thin Ollama abstraction for text, JSON, and vision generation |
| `editor.py` | AI-driven dynamic video effects (FFmpeg filter generation via Ollama/Gemini) |
| `hooks.py` | Hook text overlay generation with font rendering |
| `thumbnail.py` | Thumbnail analysis and viral title suggestion via Ollama |
| `saasshorts.py` | SaaSShorts pipeline: scrape SaaS URL → script → AI actor → voiceover → video |
| `s3_uploader.py` | AWS S3 upload with caching; also serves gallery/actor endpoints |
| `subtitles.py` | SRT generation, FFmpeg subtitle burning, and dubbed video transcription |
| `translate.py` | ElevenLabs dubbing API for AI voice translation |
| `dashboard/src/App.jsx` | Main React component with state management |
| `dashboard/src/components/TranslateModal.jsx` | Voice dubbing UI with language selection |

### Dual-Mode Video Reframing
- **TRACK Mode** (single subject): MediaPipe face detection + YOLOv8 fallback with "Heavy Tripod" stabilization
- **GENERAL Mode** (groups/landscapes): Blurred background layout preserving full width

### Key Classes
- `SmoothedCameraman` - Stabilized camera movement with safe zone logic (prevents jitter)
- `SpeakerTracker` - Prevents rapid speaker switching, handles temporary occlusions

### API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/process` | Submit video for processing |
| POST | `/api/batch` | Submit batch of videos |
| GET | `/api/status/{job_id}` | Poll job status and logs |
| POST | `/api/edit` | Apply AI video effects |
| POST | `/api/subtitle` | Generate and apply subtitles (auto-transcribes dubbed videos) |
| POST | `/api/hook` | Add text hook overlays |
| POST | `/api/translate` | AI voice dubbing via ElevenLabs |
| GET | `/api/translate/languages` | List supported dubbing languages |
| POST | `/api/social/post` | Post to social media (async upload) |
| GET | `/api/social/user` | Fetch social account info |
| GET | `/api/models` | List available Ollama models |
| POST | `/api/models/pull` | Pull a new Ollama model |
| POST | `/api/thumbnail/upload` | Upload thumbnail image |
| POST | `/api/thumbnail/analyze` | Analyze thumbnail for improvements |
| POST | `/api/thumbnail/titles` | Generate viral title suggestions |
| POST | `/api/thumbnail/generate` | Generate new thumbnail variant |
| POST | `/api/thumbnail/describe` | Describe thumbnail content |
| POST | `/api/thumbnail/publish` | Publish thumbnail (async) |
| GET | `/api/thumbnail/publish/status/{publish_id}` | Poll thumbnail publish status |
| POST | `/api/saasshorts/analyze` | Analyze SaaS URL and generate scripts |
| POST | `/api/saasshorts/actor-upload` | Upload custom actor image |
| POST | `/api/saasshorts/actor-options` | Generate AI actor portrait options |
| GET | `/api/saasshorts/actor-gallery` | List saved actor portraits |
| POST | `/api/saasshorts/generate` | Generate full SaaSShorts video |
| GET | `/api/saasshorts/status/{job_id}` | Poll SaaSShorts job status |
| GET | `/api/saasshorts/voices` | List available ElevenLabs voices |
| POST | `/api/saasshorts/post` | Post SaaSShorts video to social |
| GET | `/api/saasshorts/gallery` | List generated SaaSShorts videos |
| GET | `/gallery` | HTML video gallery page |
| GET | `/video/{video_id}` | HTML single video page |

### Concurrency Model
Async job queue with semaphore-based concurrency control. Configure via `MAX_CONCURRENT_JOBS` env var (default: 5). Jobs auto-cleanup after 1 hour.

## Environment Variables

**Server-side (.env or docker-compose environment):**
- `OLLAMA_HOST` - Ollama endpoint (default: `http://localhost:11434`; in Docker: `http://host.docker.internal:11434`)
- `OLLAMA_MODEL` - Text/JSON model (default: `qwen3.5:4b`)
- `OLLAMA_VISION_MODEL` - Vision model for thumbnail analysis (default: `minicpm-v`)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` - S3 backup (optional)
- `MAX_CONCURRENT_JOBS` - Concurrent processing limit (default: 5)
- `VITE_API_URL` - Production API URL override (frontend build)

**Client-side (browser localStorage, encrypted):**
- `GEMINI_API_KEY` - Google Gemini API key (optional; used by thumbnail/title workflows)
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice dubbing and SaaSShorts TTS (optional)
- `UPLOAD_POST_API_KEY` - Upload-Post API key for social posting (optional)

> Client-side API keys are stored encrypted in the browser and sent via request headers only when needed. Never stored server-side.

## Tech Stack
- **Backend:** Python 3.11, FastAPI, ollama (primary LLM), google-genai (optional), faster-whisper, ultralytics (YOLOv8), mediapipe, opencv-python, yt-dlp, FFmpeg, httpx, Pillow
- **Frontend:** React 18, Vite 4, Tailwind CSS 3.4
- **External APIs:** Ollama (local), ElevenLabs (dubbing + TTS), fal.ai (Flux Pro image gen, Kling Avatar v2 video), Upload-Post (social), Google Gemini (optional thumbnail/title)
- **Infrastructure:** Docker + Docker Compose, AWS S3 (optional)

## Gotchas

- Docker maps backend to port **8001** on the host, not 8000. Use `http://localhost:8001` when testing the API directly.
- Ollama must be running on the host before starting the stack. The container reaches it via `host.docker.internal:11434`.
- Pull required Ollama models before first run: `ollama pull qwen3.5:4b && ollama pull minicpm-v`
- SaaSShorts uses fal.ai for image/video generation — requires a `FAL_KEY` env var (not documented in docker-compose yet; set it manually).
- File uploads cap at 2 GB (`MAX_FILE_SIZE_MB = 2048`). Jobs auto-purge after 1 hour.
- `test_pipeline.py`, `verify_aesthetic.py`, `verify_custom_hook.py`, `verify_hooks.py` are standalone smoke-test scripts, not a pytest suite. Run them directly with `python <file>.py`.
