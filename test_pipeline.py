#!/usr/bin/env python3
"""
End-to-end pipeline test for OpenShorts.
Tests: submit job, poll status, verify clips generated.
"""
import urllib.request
import json
import time
import sys
import os

BASE = os.environ.get("OPENSHORTS_URL", "http://localhost:8001")
TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
MAX_WAIT = 900  # 15 minutes


def test_models():
    """Check Ollama connectivity and model availability."""
    r = urllib.request.urlopen(f"{BASE}/api/models")
    data = json.loads(r.read())
    assert data["ollama_connected"], "Ollama not connected"
    print(f"  Text model: {data['required']['text']}")
    print(f"  Vision model: {data['required']['vision']}")
    return True


def test_languages():
    """Check translation languages endpoint."""
    r = urllib.request.urlopen(f"{BASE}/api/translate/languages")
    data = json.loads(r.read())
    count = len(data["languages"])
    assert count >= 20, f"Expected 20+ languages, got {count}"
    print(f"  {count} languages available")
    return True


def test_process():
    """Submit a video and verify clips are generated."""
    payload = json.dumps({"url": TEST_URL}).encode()
    req = urllib.request.Request(
        f"{BASE}/api/process",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    r = urllib.request.urlopen(req)
    job = json.loads(r.read())
    job_id = job["job_id"]
    print(f"  Job submitted: {job_id}")

    start = time.time()
    while time.time() - start < MAX_WAIT:
        time.sleep(5)
        r = urllib.request.urlopen(f"{BASE}/api/status/{job_id}")
        status = json.loads(r.read())
        st = status["status"]
        elapsed = int(time.time() - start)

        if st == "completed":
            result = status.get("result", {})
            clips = result.get("clips", [])
            print(f"  Completed in {elapsed}s with {len(clips)} clips")
            for i, clip in enumerate(clips):
                dur = clip.get("end", 0) - clip.get("start", 0)
                print(f"    Clip {i+1}: {dur:.0f}s - {clip.get('video_title_for_youtube_short', '')[:60]}")
            assert len(clips) >= 1, "Expected at least 1 clip"
            return True

        if st == "failed":
            logs = status.get("logs", [])
            print(f"  FAILED at {elapsed}s")
            for log in logs[-5:]:
                print(f"    > {log[:120]}")
            return False

    print(f"  Timeout after {MAX_WAIT}s")
    return False


def main():
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*60}")
    print(f"OpenShorts Pipeline Test - {ts}")
    print(f"{'='*60}")

    results = {}
    for name, fn in [("models", test_models), ("languages", test_languages), ("process", test_process)]:
        print(f"\n[TEST] {name}")
        try:
            results[name] = fn()
        except Exception as e:
            print(f"  EXCEPTION: {e}")
            results[name] = False

    print(f"\n{'='*60}")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"Results: {passed}/{total} passed")
    for name, ok in results.items():
        print(f"  {'PASS' if ok else 'FAIL'} {name}")
    print(f"{'='*60}\n")

    return 0 if all(results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
