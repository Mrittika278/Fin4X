from __future__ import annotations

import io
import unittest
from datetime import datetime, timezone
import pypdf
from starlette.testclient import TestClient

try:
    from .main import app
    from .report_generator import generate_research_report_pdf, collect_market_data
except ImportError:
    from main import app
    from report_generator import generate_research_report_pdf, collect_market_data


class TestResearchReportPDF(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_pdf_endpoint_post_success(self):
        """Test POST /api/reports/research-summary returns valid 2-page PDF."""
        response = self.client.post(
            "/api/reports/research-summary",
            json={"preferred_asset": "bitcoin", "preferred_strategy": "ema", "lookback_period": "2y"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        
        # Verify Content-Disposition filename
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        expected_filename = f'attachment; filename="QuantX_Research_Report_{date_str}.pdf"'
        self.assertEqual(response.headers["content-disposition"], expected_filename)
        
        # Verify PDF structure and exact 2 pages
        pdf_bytes = response.content
        self.assertTrue(len(pdf_bytes) > 20000, "PDF document size is smaller than expected")
        
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        self.assertEqual(len(reader.pages), 2, "The PDF report must contain EXACTLY two pages")

        # Verify Page 1 text contents
        p1_text = reader.pages[0].extract_text()
        self.assertIn("QuantX Market Intelligence Report", p1_text)
        self.assertIn("Market Snapshot & Statistical Profiles", p1_text)
        self.assertIn("Normalized Asset Price Performance", p1_text)
        self.assertIn("Gold", p1_text)
        self.assertIn("Bitcoin", p1_text)
        self.assertIn("NVIDIA", p1_text)
        self.assertIn("Page 1 of 2", p1_text)

        # Verify Page 2 text contents
        p2_text = reader.pages[1].extract_text()
        self.assertIn("Portfolio & Strategy Analysis", p2_text)
        self.assertIn("Current Portfolio Execution Snapshot", p2_text)
        self.assertIn("Algorithmic Strategy Backtest & Model Matrix", p2_text)
        self.assertIn("Automated Stress Intelligence", p2_text)
        self.assertIn("Executive Key Findings & Decision Brief", p2_text)
        self.assertIn("Page 2 of 2", p2_text)

    def test_pdf_endpoint_get_success(self):
        """Test GET /api/reports/research-summary endpoint works with query parameters."""
        response = self.client.get("/api/reports/research-summary?asset=gold&strategy=sma&period=1y")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        
        reader = pypdf.PdfReader(io.BytesIO(response.content))
        self.assertEqual(len(reader.pages), 2, "GET endpoint must also produce exactly two pages")
        p2_text = reader.pages[1].extract_text()
        self.assertIn("Gold", p2_text)

    def test_invalid_parameters_rejected(self):
        """Test invalid asset or strategy returns 400 Bad Request."""
        res_bad_asset = self.client.post(
            "/api/reports/research-summary",
            json={"preferred_asset": "fake_coin"},
        )
        self.assertEqual(res_bad_asset.status_code, 422)

        res_bad_strat = self.client.post(
            "/api/reports/research-summary",
            json={"preferred_strategy": "invalid_algo"},
        )
        self.assertEqual(res_bad_strat.status_code, 422)

    def test_empty_portfolio_fallback_still_two_pages(self):
        """Verify report handles empty portfolio without crashing and preserves 2-page constraint."""
        import asyncio
        empty_port = {"cash": 100000.0, "initial_cash": 100000.0, "positions": {}}
        pdf_bytes = asyncio.run(
            generate_research_report_pdf(
                paper_account=empty_port,
                preferred_asset="nvidia",
                preferred_strategy="momentum",
            )
        )
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        self.assertEqual(len(reader.pages), 2, "Empty portfolio must still yield exactly 2 pages")
        p2_text = reader.pages[1].extract_text()
        self.assertIn("Portfolio & Strategy Analysis", p2_text)
        self.assertIn("$100,000.00", p2_text)


if __name__ == "__main__":
    unittest.main()
