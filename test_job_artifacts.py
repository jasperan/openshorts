import json
import os
import tempfile
import unittest

from job_artifacts import (
    JobArtifactError,
    load_job_artifact_snapshot,
    relocate_root_job_artifacts,
)


class JobArtifactTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.output_root = self.tmp.name
        self.job_id = "job-123"
        self.output_dir = os.path.join(self.output_root, self.job_id)
        os.makedirs(self.output_dir, exist_ok=True)

    def tearDown(self):
        self.tmp.cleanup()

    def write_metadata(self, directory, base_name="job-123_video"):
        path = os.path.join(directory, f"{base_name}_metadata.json")
        with open(path, "w") as f:
            json.dump(
                {
                    "shorts": [
                        {"start": 0, "end": 10, "title": "first"},
                        {"start": 11, "end": 20, "title": "second"},
                    ],
                    "cost_analysis": {"total": 1.25},
                },
                f,
            )
        return path

    def test_ready_snapshot_includes_only_finished_clips(self):
        self.write_metadata(self.output_dir)
        with open(os.path.join(self.output_dir, "job-123_video_clip_1.mp4"), "wb") as f:
            f.write(b"ready")

        snapshot = load_job_artifact_snapshot(
            self.job_id,
            self.output_dir,
            ready_only=True,
            allow_partial=True,
        )

        self.assertIsNotNone(snapshot)
        self.assertEqual(len(snapshot.clips), 1)
        self.assertEqual(snapshot.clips[0]["video_url"], "/videos/job-123/job-123_video_clip_1.mp4")
        self.assertEqual(snapshot.cost_analysis, {"total": 1.25})

    def test_final_snapshot_adds_urls_for_all_clips(self):
        self.write_metadata(self.output_dir)

        snapshot = load_job_artifact_snapshot(
            self.job_id,
            self.output_dir,
            ready_only=False,
            allow_partial=False,
        )

        self.assertIsNotNone(snapshot)
        self.assertEqual(
            [clip["video_url"] for clip in snapshot.clips],
            [
                "/videos/job-123/job-123_video_clip_1.mp4",
                "/videos/job-123/job-123_video_clip_2.mp4",
            ],
        )

    def test_partial_corrupt_metadata_is_ignored_but_final_metadata_fails(self):
        with open(os.path.join(self.output_dir, "job-123_video_metadata.json"), "w") as f:
            f.write("{")

        partial = load_job_artifact_snapshot(
            self.job_id,
            self.output_dir,
            ready_only=True,
            allow_partial=True,
        )

        self.assertIsNone(partial)
        with self.assertRaises(JobArtifactError):
            load_job_artifact_snapshot(
                self.job_id,
                self.output_dir,
                ready_only=False,
                allow_partial=False,
            )

    def test_relocates_root_artifacts_into_job_folder(self):
        self.write_metadata(self.output_root)
        with open(os.path.join(self.output_root, "job-123_video_clip_1.mp4"), "wb") as f:
            f.write(b"ready")

        moved = relocate_root_job_artifacts(self.job_id, self.output_dir, self.output_root)
        snapshot = load_job_artifact_snapshot(
            self.job_id,
            self.output_dir,
            ready_only=False,
            allow_partial=False,
        )

        self.assertTrue(moved)
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, "job-123_video_metadata.json")))
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, "job-123_video_clip_1.mp4")))
        self.assertIsNotNone(snapshot)
        self.assertEqual(len(snapshot.clips), 2)


if __name__ == "__main__":
    unittest.main()
