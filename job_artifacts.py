import glob
import json
import os
import shutil
from dataclasses import dataclass
from typing import Any


class JobArtifactError(Exception):
    """Raised when finished job artifacts cannot be read."""


@dataclass(frozen=True)
class JobArtifactSnapshot:
    clips: list[dict[str, Any]]
    cost_analysis: Any

    def to_result(self) -> dict[str, Any]:
        return {"clips": self.clips, "cost_analysis": self.cost_analysis}


def relocate_root_job_artifacts(job_id: str, job_output_dir: str, output_root: str) -> bool:
    """
    Backward-compat rescue for outputs accidentally written into the output root.

    Moves the newest ``<job_id>_*_metadata.json`` and associated clip files into
    ``output/<job_id>/`` so the API can serve a single per-job artifact tree.
    """
    try:
        os.makedirs(job_output_dir, exist_ok=True)
        pattern = os.path.join(output_root, f"{job_id}_*_metadata.json")
        meta_candidates = sorted(glob.glob(pattern), key=lambda p: os.path.getmtime(p), reverse=True)
        if not meta_candidates:
            return False

        metadata_path = meta_candidates[0]
        base_name = os.path.basename(metadata_path).replace("_metadata.json", "")
        dest_metadata = os.path.join(job_output_dir, os.path.basename(metadata_path))
        if os.path.abspath(metadata_path) != os.path.abspath(dest_metadata):
            shutil.move(metadata_path, dest_metadata)

        for clip_path in glob.glob(os.path.join(output_root, f"{base_name}_clip_*.mp4")):
            dest_clip = os.path.join(job_output_dir, os.path.basename(clip_path))
            if os.path.abspath(clip_path) != os.path.abspath(dest_clip):
                shutil.move(clip_path, dest_clip)

        for clip_path in glob.glob(os.path.join(output_root, f"temp_{base_name}_clip_*.mp4")):
            dest_clip = os.path.join(job_output_dir, os.path.basename(clip_path))
            if os.path.abspath(clip_path) != os.path.abspath(dest_clip):
                shutil.move(clip_path, dest_clip)

        return True
    except Exception:
        return False


def load_job_artifact_snapshot(
    job_id: str,
    output_dir: str,
    *,
    ready_only: bool,
    allow_partial: bool,
) -> JobArtifactSnapshot | None:
    json_files = glob.glob(os.path.join(output_dir, "*_metadata.json"))
    if not json_files and not ready_only:
        output_root = os.path.dirname(output_dir)
        if relocate_root_job_artifacts(job_id, output_dir, output_root):
            json_files = glob.glob(os.path.join(output_dir, "*_metadata.json"))

    if not json_files:
        return None

    target_json = json_files[0]
    try:
        if os.path.getsize(target_json) == 0:
            return None
        with open(target_json) as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        if allow_partial:
            return None
        raise JobArtifactError(f"Could not read metadata for job {job_id}") from exc

    if not isinstance(data, dict):
        if allow_partial:
            return None
        raise JobArtifactError(f"Metadata for job {job_id} is not an object")

    base_name = os.path.basename(target_json).replace("_metadata.json", "")
    cost_analysis = data.get("cost_analysis")
    shorts = data.get("shorts", [])
    if not isinstance(shorts, list):
        if allow_partial:
            return None
        raise JobArtifactError(f"Metadata for job {job_id} has invalid shorts data")

    clips = []
    for index, clip in enumerate(shorts, start=1):
        if not isinstance(clip, dict):
            if allow_partial:
                return None
            raise JobArtifactError(f"Metadata for job {job_id} has invalid clip data")
        clip_filename = f"{base_name}_clip_{index}.mp4"
        clip_path = os.path.join(output_dir, clip_filename)
        if ready_only and (not os.path.exists(clip_path) or os.path.getsize(clip_path) <= 0):
            continue
        clip_data = dict(clip)
        clip_data["video_url"] = f"/videos/{job_id}/{clip_filename}"
        clips.append(clip_data)

    if ready_only and not clips:
        return None

    return JobArtifactSnapshot(clips=clips, cost_analysis=cost_analysis)
