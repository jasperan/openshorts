"""
Local Video Translation/Dubbing Module

Uses edge-tts (Microsoft Edge TTS, no API key) for speech synthesis
and Ollama for text translation. Fully local, zero cloud dependencies.
"""

import os
import asyncio
import subprocess
import tempfile
from typing import Optional

import edge_tts

import llm_client
from subtitles import transcribe_audio

# Supported target languages for dubbing
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "pl": "Polish",
    "hi": "Hindi",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "ru": "Russian",
    "tr": "Turkish",
    "nl": "Dutch",
    "sv": "Swedish",
    "id": "Indonesian",
    "fil": "Filipino",
    "ms": "Malay",
    "vi": "Vietnamese",
    "th": "Thai",
    "uk": "Ukrainian",
    "el": "Greek",
    "cs": "Czech",
    "fi": "Finnish",
    "ro": "Romanian",
    "da": "Danish",
    "bg": "Bulgarian",
    "hr": "Croatian",
    "sk": "Slovak",
    "ta": "Tamil",
}

# Best edge-tts voice for each language (natural-sounding neural voices)
LANGUAGE_VOICES = {
    "en": "en-US-AriaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "it": "it-IT-ElsaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "pl": "pl-PL-ZofiaNeural",
    "hi": "hi-IN-SwaraNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ar": "ar-SA-ZariyahNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "tr": "tr-TR-EmelNeural",
    "nl": "nl-NL-ColetteNeural",
    "sv": "sv-SE-SofieNeural",
    "id": "id-ID-GadisNeural",
    "fil": "fil-PH-BlessicaNeural",
    "ms": "ms-MY-YasminNeural",
    "vi": "vi-VN-HoaiMyNeural",
    "th": "th-TH-PremwadeeNeural",
    "uk": "uk-UA-PolinaNeural",
    "el": "el-GR-AthinaNeural",
    "cs": "cs-CZ-VlastaNeural",
    "fi": "fi-FI-SelmaNeural",
    "ro": "ro-RO-AlinaNeural",
    "da": "da-DK-ChristelNeural",
    "bg": "bg-BG-KalinaNeural",
    "hr": "hr-HR-GabrijelaNeural",
    "sk": "sk-SK-ViktoriaNeural",
    "ta": "ta-IN-PallaviNeural",
}


def _extract_audio(video_path: str, output_path: str) -> str:
    """Extract audio track from video as WAV."""
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "1",
        output_path,
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return output_path


def _translate_text(text: str, target_language: str, source_language: Optional[str] = None) -> str:
    """Translate text using Ollama."""
    lang_name = SUPPORTED_LANGUAGES.get(target_language, target_language)
    source_name = SUPPORTED_LANGUAGES.get(source_language, "the original language") if source_language else "the original language"

    prompt = f"""Translate the following text from {source_name} to {lang_name}.
Return ONLY the translated text, nothing else. Preserve paragraph breaks.

Text to translate:
{text}"""

    return llm_client.generate_text(prompt)


async def _generate_speech_async(text: str, voice: str, output_path: str):
    """Generate speech from text using edge-tts."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


def _generate_speech(text: str, voice: str, output_path: str):
    """Sync wrapper for edge-tts speech generation."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context (FastAPI), create a new thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, _generate_speech_async(text, voice, output_path))
                future.result()
        else:
            loop.run_until_complete(_generate_speech_async(text, voice, output_path))
    except RuntimeError:
        asyncio.run(_generate_speech_async(text, voice, output_path))


def _merge_audio_video(video_path: str, audio_path: str, output_path: str):
    """Replace video's audio track with new audio, adjusting speed to match video duration."""
    # Get video duration
    probe_cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", video_path,
    ]
    video_duration = float(subprocess.check_output(probe_cmd).decode().strip())

    # Get audio duration
    probe_cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", audio_path,
    ]
    audio_duration = float(subprocess.check_output(probe_cmd).decode().strip())

    # Calculate tempo adjustment (keep within FFmpeg's 0.5-2.0 range)
    if video_duration > 0 and audio_duration > 0:
        tempo = audio_duration / video_duration
        tempo = max(0.5, min(2.0, tempo))
    else:
        tempo = 1.0

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-filter_complex", f"[1:a]atempo={tempo:.4f}[a]",
        "-map", "0:v",
        "-map", "[a]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        output_path,
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)


def translate_video(
    video_path: str,
    output_path: str,
    target_language: str,
    source_language: Optional[str] = None,
    max_wait_seconds: int = 600,
    poll_interval: int = 5,
) -> str:
    """
    Translate a video to a target language using local AI.

    Pipeline: transcribe -> translate text -> TTS -> merge audio

    Args:
        video_path: Path to input video
        output_path: Path to save translated video
        target_language: Target language code (e.g., 'es', 'fr', 'de')
        source_language: Source language code (auto-detected if None)
        max_wait_seconds: Unused (kept for API compatibility)
        poll_interval: Unused (kept for API compatibility)

    Returns:
        Path to the translated video
    """
    print(f"[Translate] Starting local translation to {target_language}...")

    with tempfile.TemporaryDirectory(prefix="openshorts_translate_") as tmpdir:
        # 1. Transcribe the video
        print("[Translate] Step 1/4: Transcribing audio...")
        transcript = transcribe_audio(video_path)

        # Extract full text from transcript
        full_text = " ".join(
            seg.get("text", "") for seg in transcript.get("segments", [])
        ).strip()

        if not full_text:
            raise Exception("No speech detected in video")

        detected_lang = transcript.get("language", source_language or "en")
        print(f"[Translate] Detected language: {detected_lang}")

        # 2. Translate the text
        print(f"[Translate] Step 2/4: Translating to {target_language}...")
        translated_text = _translate_text(full_text, target_language, source_language or detected_lang)
        print(f"[Translate] Translated text ({len(translated_text)} chars)")

        # 3. Generate speech
        voice = LANGUAGE_VOICES.get(target_language, "en-US-AriaNeural")
        print(f"[Translate] Step 3/4: Generating speech with voice {voice}...")
        tts_audio_path = os.path.join(tmpdir, "tts_output.mp3")
        _generate_speech(translated_text, voice, tts_audio_path)

        if not os.path.exists(tts_audio_path) or os.path.getsize(tts_audio_path) == 0:
            raise Exception("TTS generation failed - no audio produced")

        # 4. Merge with original video
        print("[Translate] Step 4/4: Merging translated audio with video...")
        _merge_audio_video(video_path, tts_audio_path, output_path)

    print(f"[Translate] Translation complete: {output_path}")
    return output_path


def get_supported_languages() -> dict:
    """Return dict of supported language codes and names."""
    return SUPPORTED_LANGUAGES.copy()
