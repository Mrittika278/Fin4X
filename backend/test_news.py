from __future__ import annotations

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import unittest
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone
import httpx
from starlette.testclient import TestClient

try:
    from backend.main import app
    from backend.news import (
        news_cache,
        normalize_article,
        deduplicate_articles,
        get_market_news,
        search_asset_news,
        MissingSerpApiKeyError,
        SerpApiRateLimitError,
        SerpApiTimeoutError,
        SerpApiUpstreamError,
    )
except ImportError:
    from main import app
    from news import (
        news_cache,
        normalize_article,
        deduplicate_articles,
        get_market_news,
        search_asset_news,
        MissingSerpApiKeyError,
        SerpApiRateLimitError,
        SerpApiTimeoutError,
        SerpApiUpstreamError,
    )

SAMPLE_SERPAPI_RESPONSE = {
    "search_metadata": {"status": "Success"},
    "news_results": [
        {
            "position": 1,
            "title": "Gold hits fresh record high on safe-haven bullion demand",
            "link": "https://example.com/gold-record-high?utm_source=twitter&utm_medium=social",
            "source": {"name": "Reuters", "icon": "https://example.com/reuters.ico"},
            "date": "2 hours ago",
            "published_at": "2026-10-09 12:00:00 UTC",
            "snippet": "Gold prices surged to a new record amidst central bank gold purchases.",
            "thumbnail": "https://example.com/images/gold.jpg"
        },
        {
            "position": 2,
            "title": "Bitcoin consolidates above key support level in crypto market",
            "link": "https://example.com/bitcoin-support",
            "source": "CoinDesk",
            "date": "4 hours ago",
            "published_at": "2026-10-09 10:00:00 UTC",
            "snippet": "BTC price movement shows low volatility as traders await macro data.",
            "thumbnail": {"src": "https://example.com/images/btc.png"}
        },
        {
            "position": 3,
            "title": "NVIDIA unveils next-gen AI semiconductor chips",
            "link": "https://example.com/nvidia-chips",
            "source": {"title": "Bloomberg"},
            "date": "1 day ago",
            "snippet": "NVDA data center revenue continues upward momentum.",
            "photo": "https://example.com/images/nvda.jpg"
        }
    ]
}


class TestMarketNews(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        news_cache.clear()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        news_cache.clear()

    # 1. Valid asset filters
    @patch("backend.news.fetch_serpapi_google_news")
    @patch.dict("os.environ", {"SERPAPI_API_KEY": "test_mock_key"})
    def test_valid_asset_filters(self, mock_fetch: AsyncMock) -> None:
        mock_fetch.return_value = SAMPLE_SERPAPI_RESPONSE["news_results"]

        for asset in ("gold", "bitcoin", "nvidia", "all"):
            news_cache.clear()
            response = self.client.get(f"/api/news?asset={asset}")
            self.assertEqual(response.status_code, 200, f"Failed for asset {asset}: {response.text}")
            data = response.json()
            self.assertEqual(data["asset"], asset)
            self.assertIn("articles", data)
            self.assertIn("total", data)
            self.assertIn("fetched_at", data)
            self.assertFalse(data["cached"])

    # 2. Invalid asset filters and limit boundaries
    def test_invalid_asset_filters(self) -> None:
        response = self.client.get("/api/news?asset=ethereum")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid asset filter", response.json()["detail"])

        # Test limit bounds
        resp_limit_low = self.client.get("/api/news?limit=0")
        self.assertEqual(resp_limit_low.status_code, 400)

        resp_limit_high = self.client.get("/api/news?limit=100")
        self.assertEqual(resp_limit_high.status_code, 400)

    # 3. Missing API key handling
    @patch.dict("os.environ", {"SERPAPI_API_KEY": ""}, clear=True)
    def test_missing_api_key(self) -> None:
        response = self.client.get("/api/news?asset=gold")
        self.assertEqual(response.status_code, 503)
        self.assertIn("SERPAPI_API_KEY is not configured", response.json()["detail"])

    # 4. Successful normalized news responses
    @patch("backend.news.fetch_serpapi_google_news")
    @patch.dict("os.environ", {"SERPAPI_API_KEY": "test_mock_key"})
    def test_successful_normalized_news_response(self, mock_fetch: AsyncMock) -> None:
        mock_fetch.return_value = SAMPLE_SERPAPI_RESPONSE["news_results"]

        response = self.client.get("/api/news?asset=gold&limit=3")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        articles = data["articles"]
        self.assertTrue(len(articles) > 0)

        first = articles[0]
        # Verify all required normalized fields
        required_fields = ["id", "title", "source", "date", "url", "thumbnail", "snippet", "asset", "fetched_at"]
        for field in required_fields:
            self.assertIn(field, first, f"Missing field {field}")

        self.assertEqual(first["title"], "Gold hits fresh record high on safe-haven bullion demand")
        self.assertEqual(first["source"], "Reuters")
        self.assertEqual(first["date"], "2 hours ago")
        self.assertIn("example.com/gold-record-high", first["url"])
        self.assertNotIn("utm_source", first["url"], "Tracking query parameter should be cleaned")
        self.assertEqual(first["thumbnail"], "https://example.com/images/gold.jpg")
        self.assertIn("Gold prices surged", first["snippet"])

    # 5. Missing optional article fields
    def test_missing_optional_article_fields(self) -> None:
        now_iso = datetime.now(timezone.utc).isoformat()

        # Item with bare minimum (no thumbnail, no snippet, no source dict, no date)
        minimal_item = {
            "title": "Minimal Market Update",
            "link": "https://example.com/minimal-update",
        }
        normalized = normalize_article(minimal_item, default_asset="gold", fetched_at_iso=now_iso)
        self.assertIsNotNone(normalized)
        self.assertEqual(normalized["title"], "Minimal Market Update")
        self.assertIsNone(normalized["thumbnail"])
        self.assertIsNone(normalized["snippet"])
        self.assertEqual(normalized["source"], "Example.com")  # Derived from domain
        self.assertEqual(normalized["date"], "Recently")

        # Invalid item missing title or link should safely return None
        self.assertIsNone(normalize_article({"snippet": "no title"}, default_asset="gold", fetched_at_iso=now_iso))
        self.assertIsNone(normalize_article({"title": "No link"}, default_asset="gold", fetched_at_iso=now_iso))

    # 6. Duplicate article removal
    def test_duplicate_article_removal(self) -> None:
        articles = [
            {"title": "Bitcoin surges past $60k", "url": "https://news.com/btc?utm_source=feed"},
            {"title": "Bitcoin surges past $60k", "url": "https://news.com/btc?utm_source=twitter"},  # duplicate by url & title
            {"title": "bitcoin surges past $60k!", "url": "https://other.com/btc"},  # duplicate normalized title
            {"title": "Gold maintains steady trend", "url": "https://news.com/gold"},
        ]
        deduped = deduplicate_articles(articles)
        self.assertEqual(len(deduped), 2)
        self.assertEqual(deduped[0]["title"], "Bitcoin surges past $60k")
        self.assertEqual(deduped[1]["title"], "Gold maintains steady trend")

    # 7. Cache behavior and refresh bypass
    @patch("backend.news.fetch_serpapi_google_news")
    @patch.dict("os.environ", {"SERPAPI_API_KEY": "test_mock_key"})
    def test_cache_behavior(self, mock_fetch: AsyncMock) -> None:
        mock_fetch.return_value = SAMPLE_SERPAPI_RESPONSE["news_results"]

        # First request should hit mock_fetch
        resp1 = self.client.get("/api/news?asset=gold")
        self.assertEqual(resp1.status_code, 200)
        self.assertFalse(resp1.json()["cached"])
        self.assertEqual(mock_fetch.call_count, 1)

        # Second request should use server cache (mock_fetch count remains 1)
        resp2 = self.client.get("/api/news?asset=gold")
        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(resp2.json()["cached"])
        self.assertEqual(mock_fetch.call_count, 1)

        # Request with refresh=true should bypass cache
        resp3 = self.client.get("/api/news?asset=gold&refresh=true")
        self.assertEqual(resp3.status_code, 200)
        self.assertFalse(resp3.json()["cached"])
        self.assertEqual(mock_fetch.call_count, 2)

    # 8. SerpApi rate limits and errors
    @patch("backend.news.fetch_serpapi_google_news")
    @patch.dict("os.environ", {"SERPAPI_API_KEY": "test_mock_key"})
    def test_serpapi_rate_limit_and_errors(self, mock_fetch: AsyncMock) -> None:
        # Rate limit simulation
        mock_fetch.side_effect = SerpApiRateLimitError("SerpApi search limit reached.")
        response = self.client.get("/api/news?asset=gold")
        self.assertEqual(response.status_code, 429)
        self.assertIn("rate limit or quota", response.json()["detail"].lower())

        # Upstream error simulation
        mock_fetch.side_effect = SerpApiUpstreamError("SerpApi upstream failure 500")
        response2 = self.client.get("/api/news?asset=gold")
        self.assertEqual(response2.status_code, 502)

    # 9. Network timeout handling
    @patch("backend.news.fetch_serpapi_google_news")
    @patch.dict("os.environ", {"SERPAPI_API_KEY": "test_mock_key"})
    def test_network_timeout(self, mock_fetch: AsyncMock) -> None:
        mock_fetch.side_effect = SerpApiTimeoutError("Timeout waiting for Google News")
        response = self.client.get("/api/news?asset=gold")
        self.assertEqual(response.status_code, 504)
        self.assertIn("Timeout", response.json()["detail"])

    # 10. Refresh failure preserves previous results
    @patch("backend.news.fetch_serpapi_google_news")
    @patch.dict("os.environ", {"SERPAPI_API_KEY": "test_mock_key"})
    def test_refresh_failure_preserves_previous_results(self, mock_fetch: AsyncMock) -> None:
        # Initial successful fetch
        mock_fetch.return_value = SAMPLE_SERPAPI_RESPONSE["news_results"]
        resp_initial = self.client.get("/api/news?asset=gold")
        self.assertEqual(resp_initial.status_code, 200)
        initial_titles = [a["title"] for a in resp_initial.json()["articles"]]

        # Upstream failure on refresh
        mock_fetch.side_effect = SerpApiTimeoutError("Timeout during refresh")
        resp_refresh = self.client.get("/api/news?asset=gold&refresh=true")

        self.assertEqual(resp_refresh.status_code, 200)
        data = resp_refresh.json()
        self.assertTrue(data["stale"])
        self.assertIn("warning", data)
        # Verify previous articles are preserved
        preserved_titles = [a["title"] for a in data["articles"]]
        self.assertEqual(preserved_titles, initial_titles)

    # 11. QuantX Evidence Engine search function standalone test
    @patch("backend.news.fetch_serpapi_google_news")
    async def test_future_evidence_search_function(self, mock_fetch: AsyncMock) -> None:
        mock_fetch.return_value = SAMPLE_SERPAPI_RESPONSE["news_results"]
        results = await search_asset_news(
            asset="bitcoin",
            query="Bitcoin volatility spike",
            api_key="mock_key",
            limit=5
        )
        self.assertIsInstance(results, list)
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]["asset"], "bitcoin")

    # 12. Regression test: existing endpoints remain functional
    def test_existing_quantx_endpoints(self) -> None:
        # Health check
        resp_health = self.client.get("/api/health")
        self.assertEqual(resp_health.status_code, 200)
        self.assertEqual(resp_health.json()["status"], "ok")

        # Assets endpoint
        resp_assets = self.client.get("/api/assets")
        self.assertEqual(resp_assets.status_code, 200)
        self.assertIn("assets", resp_assets.json())

        # Static frontend serving
        resp_index = self.client.get("/")
        self.assertEqual(resp_index.status_code, 200)
        self.assertIn("Fin4X", resp_index.text)
        self.assertIn("Market News", resp_index.text)


if __name__ == "__main__":
    unittest.main()

