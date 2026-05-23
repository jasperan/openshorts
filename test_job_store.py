import os
import tempfile
import unittest

from job_store import PersistentJobStore


class PersistentJobStoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store_path = os.path.join(self.tmp.name, "jobs.json")

    def tearDown(self):
        self.tmp.cleanup()

    def test_persists_job_lifecycle_updates(self):
        store = PersistentJobStore(self.store_path)
        store["job-1"] = {
            "status": "queued",
            "logs": ["queued"],
            "result": {"clips": [{"video_url": "/videos/job-1/original.mp4"}]},
        }

        store.update_fields("job-1", status="completed")
        store.append_log("job-1", "done")
        store.update_clip_video_url("job-1", 0, "/videos/job-1/final.mp4")

        reloaded = PersistentJobStore(self.store_path)

        self.assertEqual(reloaded["job-1"]["status"], "completed")
        self.assertEqual(reloaded["job-1"]["logs"], ["queued", "done"])
        self.assertEqual(
            reloaded["job-1"]["result"]["clips"][0]["video_url"],
            "/videos/job-1/final.mp4",
        )

    def test_loaded_inflight_jobs_are_marked_failed(self):
        store = PersistentJobStore(self.store_path)
        store["job-1"] = {"status": "processing", "logs": []}

        reloaded = PersistentJobStore(self.store_path)

        self.assertEqual(reloaded["job-1"]["status"], "failed")
        self.assertIn("interrupted", reloaded["job-1"]["logs"][-1])

    def test_delete_removes_job_from_disk(self):
        store = PersistentJobStore(self.store_path)
        store["job-1"] = {"status": "completed", "logs": []}

        del store["job-1"]

        self.assertNotIn("job-1", PersistentJobStore(self.store_path))

    def test_negative_clip_index_is_ignored(self):
        store = PersistentJobStore(self.store_path)
        store["job-1"] = {
            "status": "completed",
            "logs": [],
            "result": {"clips": [{"video_url": "original"}]},
        }

        updated = store.update_clip_video_url("job-1", -1, "wrong")

        self.assertFalse(updated)
        self.assertEqual(store["job-1"]["result"]["clips"][0]["video_url"], "original")


if __name__ == "__main__":
    unittest.main()
