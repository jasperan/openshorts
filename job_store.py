import json
import os
import threading
from collections.abc import Iterator, MutableMapping
from typing import Any


class PersistentJobStore(MutableMapping[str, dict[str, Any]]):
    """Thread-safe JSON-backed store for video processing jobs."""

    def __init__(self, path: str):
        self.path = path
        self._lock = threading.RLock()
        self._jobs: dict[str, dict[str, Any]] = {}
        self._load()
        self._mark_interrupted_jobs()

    def _load(self) -> None:
        if not os.path.exists(self.path):
            return
        try:
            with open(self.path) as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError):
            return

        if isinstance(data, dict):
            self._jobs = {
                str(job_id): job
                for job_id, job in data.items()
                if isinstance(job, dict)
            }

    def _mark_interrupted_jobs(self) -> None:
        interrupted = False
        for job in self._jobs.values():
            if job.get("status") in {"queued", "processing"}:
                job["status"] = "failed"
                logs = job.setdefault("logs", [])
                if not isinstance(logs, list):
                    logs = []
                    job["logs"] = logs
                logs.append("Job was interrupted before the server restarted.")
                interrupted = True
        if interrupted:
            self.save()

    def _write_locked(self) -> None:
        os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
        tmp_path = f"{self.path}.tmp"
        with open(tmp_path, "w") as f:
            json.dump(self._jobs, f, indent=2, sort_keys=True)
        os.replace(tmp_path, self.path)

    def save(self) -> None:
        with self._lock:
            self._write_locked()

    def update_fields(self, job_id: str, **fields: Any) -> None:
        with self._lock:
            if job_id not in self._jobs:
                return
            self._jobs[job_id].update(fields)
            self._write_locked()

    def append_log(self, job_id: str, message: str) -> bool:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return False
            logs = job.setdefault("logs", [])
            if not isinstance(logs, list):
                logs = []
                job["logs"] = logs
            logs.append(message)
            self._write_locked()
            return True

    def update_clip_video_url(self, job_id: str, clip_index: int, video_url: str) -> bool:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return False
            result = job.get("result")
            if not isinstance(result, dict):
                return False
            clips = result.get("clips")
            if not isinstance(clips, list) or clip_index < 0 or clip_index >= len(clips):
                return False
            clip = clips[clip_index]
            if not isinstance(clip, dict):
                return False
            clip["video_url"] = video_url
            self._write_locked()
            return True

    def __getitem__(self, key: str) -> dict[str, Any]:
        with self._lock:
            return self._jobs[key]

    def __setitem__(self, key: str, value: dict[str, Any]) -> None:
        with self._lock:
            self._jobs[key] = value
            self._write_locked()

    def __delitem__(self, key: str) -> None:
        with self._lock:
            del self._jobs[key]
            self._write_locked()

    def __iter__(self) -> Iterator[str]:
        with self._lock:
            return iter(list(self._jobs))

    def __len__(self) -> int:
        with self._lock:
            return len(self._jobs)
