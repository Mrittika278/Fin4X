from __future__ import annotations

import unittest
from starlette.testclient import TestClient

try:
    from .main import app
except ImportError:
    from main import app


class TestStressWorkflows(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_automated_stress_detection_bitcoin(self):
        response = self.client.get("/api/stress/automated/bitcoin")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["asset"], "bitcoin")
        self.assertIn("detected_scenario", data)
        self.assertIn(data["detected_scenario"], ["market_crash", "volatility_spike", "liquidity_shock", "recovery"])
        self.assertIn("recommended_shock", data)
        self.assertTrue(0.01 <= data["recommended_shock"] <= 0.80)
        self.assertIn("classification_reasoning", data)
        self.assertTrue(len(data["classification_reasoning"]) > 10)
        self.assertIn("metrics_observed", data)
        self.assertIn("simulation", data)
        self.assertIn("metrics", data["simulation"])
        self.assertIn("curve", data["simulation"])
        self.assertTrue(len(data["simulation"]["curve"]) > 10)
        self.assertIn("news_evidence", data)
        self.assertIsInstance(data["news_evidence"], list)

    def test_automated_stress_detection_gold_and_nvidia(self):
        for asset in ["gold", "nvidia"]:
            response = self.client.get(f"/api/stress/automated/{asset}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["asset"], asset)
            self.assertIn("scenario_label", data)
            self.assertIn("data_freshness", data)

    def test_automated_stress_invalid_asset(self):
        response = self.client.get("/api/stress/automated/invalid_coin")
        self.assertEqual(response.status_code, 404)

    def test_manual_stress_test_workflow_independent(self):
        # Strategy Lab manual workflow: custom scenario and shock
        response = self.client.get("/api/stress/gold?scenario=liquidity_shock&shock=0.35")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["asset"], "gold")
        self.assertEqual(data["scenario"], "liquidity_shock")
        self.assertAlmostEqual(data["shock"], 0.35, places=2)
        self.assertIn("metrics", data)
        self.assertIn("curve", data)


if __name__ == "__main__":
    unittest.main()
