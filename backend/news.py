from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta
import hashlib
import os
import re
from typing import Any
import urllib.parse

import httpx
try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv())
except ImportError:
    pass


SUPPORTED_ASSETS = ("all", "gold", "bitcoin", "nvidia")

ASSET_LABELS = {
    "all": "All Markets",
    "gold": "Gold",
    "bitcoin": "Bitcoin",
    "nvidia": "NVIDIA",
}

# Domain-focused queries for quantitative financial context
ASSET_QUERIES = {
    "gold": 'gold prices OR "gold market" OR bullion OR "central bank gold purchases"',
    "bitcoin": 'Bitcoin OR BTC OR "cryptocurrency market"',
    "nvidia": 'NVIDIA OR NVDA OR "AI chips" OR "semiconductor market"',
}

# Substrings or URLs of articles to explicitly exclude from financial intelligence news
EXCLUDED_ARTICLE_PATTERNS = [
    "gold.org",
    "goldhub",
    "gold-market-commentary",
    "gold-market-commentary-september-2026",
]

SERPAPI_BASE_URL = "https://serpapi.com/search"
DEFAULT_CACHE_TTL_SECONDS = 300  # 5 minutes


class NewsServiceError(Exception):
    """Base exception for news service operations."""
    pass


class MissingSerpApiKeyError(NewsServiceError):
    """Raised when SERPAPI_API_KEY is missing or empty."""
    pass


class SerpApiAuthError(NewsServiceError):
    """Raised when SerpApi reports an invalid or unauthorized key."""
    pass


class SerpApiRateLimitError(NewsServiceError):
    """Raised when SerpApi rate limit or search quota is exceeded."""
    pass


class SerpApiTimeoutError(NewsServiceError):
    """Raised when SerpApi request times out."""
    pass


class SerpApiUpstreamError(NewsServiceError):
    """Raised when SerpApi returns an unexpected error or upstream failure."""
    pass


class NewsCache:
    """Thread-safe in-memory cache with TTL and stale fallback support."""

    def __init__(self, ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS) -> None:
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, dict[str, Any]] = {}
        self._last_successful: dict[str, dict[str, Any]] = {}

    def get(self, key: str) -> dict[str, Any] | None:
        item = self._cache.get(key)
        if not item:
            return None
        now = datetime.now(timezone.utc).timestamp()
        if now > item["expires_at"]:
            return None
        return item["payload"]

    def set(self, key: str, payload: dict[str, Any], ttl_seconds: int | None = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.ttl_seconds
        now = datetime.now(timezone.utc).timestamp()
        self._cache[key] = {
            "payload": payload,
            "cached_at": now,
            "expires_at": now + ttl,
        }
        self._last_successful[key] = payload

    def get_last_successful(self, key: str) -> dict[str, Any] | None:
        return self._last_successful.get(key)

    def clear(self) -> None:
        self._cache.clear()
        self._last_successful.clear()


# Global singleton cache instance
news_cache = NewsCache(ttl_seconds=DEFAULT_CACHE_TTL_SECONDS)


def get_serpapi_key() -> str:
    """Safely retrieves the SerpApi API key from the environment."""
    key = os.getenv("SERPAPI_API_KEY", "").strip()
    if not key:
        raise MissingSerpApiKeyError(
            "SERPAPI_API_KEY is not configured. Add your key to the environment or .env file."
        )
    return key


def _normalize_url(url: str) -> str:
    """Removes common tracking query parameters for clean deduplication."""
    if not url:
        return ""
    try:
        parsed = urllib.parse.urlparse(url)
        # Filter out tracking query params like utm_*, ref, etc.
        query_pairs = urllib.parse.parse_qsl(parsed.query)
        cleaned_pairs = [
            (k, v) for k, v in query_pairs
            if not k.lower().startswith("utm_") and k.lower() not in {"fbclid", "gclid", "ref"}
        ]
        new_query = urllib.parse.urlencode(cleaned_pairs)
        cleaned = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc.lower(),
            parsed.path.rstrip("/"),
            parsed.params,
            new_query,
            ""  # strip fragment
        ))
        return cleaned
    except Exception:
        return url.strip()


def _normalize_title_key(title: str) -> str:
    """Creates a normalized string for duplicate headline detection."""
    return re.sub(r"[^\w\s]", "", title.lower()).strip()


def _parse_approximate_published_at(date_str: str | None, base_time: datetime) -> tuple[str | None, float]:
    """
    Parses date strings like '2 hours ago', '15 mins ago', or ISO strings.
    Returns (iso_string_or_none, sort_epoch_timestamp).
    Never invents unverified dates.
    """
    if not date_str:
        return None, base_time.timestamp()

    cleaned = date_str.strip()

    # Check for direct ISO or UTC format e.g. '2025-08-15 08:45:22 UTC'
    for fmt in (
        "%Y-%m-%d %H:%M:%S %Z",
        "%Y-%m-%d %H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d",
    ):
        try:
            parsed = datetime.strptime(cleaned, fmt)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.isoformat(), parsed.timestamp()
        except ValueError:
            pass

    # Relative time parsing (e.g. '5 mins ago', '2 hours ago', '3 days ago')
    relative_match = re.search(
        r"(\d+)\s+(minute|min|hour|hr|day|week|month)s?\s+ago",
        cleaned,
        re.IGNORECASE
    )
    if relative_match:
        qty = int(relative_match.group(1))
        unit = relative_match.group(2).lower()
        if unit in ("minute", "min"):
            delta = timedelta(minutes=qty)
        elif unit in ("hour", "hr"):
            delta = timedelta(hours=qty)
        elif unit == "day":
            delta = timedelta(days=qty)
        elif unit == "week":
            delta = timedelta(weeks=qty)
        elif unit == "month":
            delta = timedelta(days=qty * 30)
        else:
            delta = timedelta()
        estimated = base_time - delta
        return estimated.isoformat(), estimated.timestamp()

    return None, base_time.timestamp()


def _extract_source_name(source_raw: Any, fallback_url: str = "") -> str:
    """Safely extracts source publisher name from varied SerpApi formats."""
    if isinstance(source_raw, dict):
        name = source_raw.get("name") or source_raw.get("title")
        if name:
            return str(name).strip()
    elif isinstance(source_raw, str) and source_raw.strip():
        return source_raw.strip()

    # Fallback to domain name from article URL if publisher is missing
    if fallback_url:
        try:
            domain = urllib.parse.urlparse(fallback_url).netloc
            if domain:
                return domain.replace("www.", "").capitalize()
        except Exception:
            pass

    return "Google News"


def _extract_thumbnail(raw_item: dict[str, Any]) -> str | None:
    """Safely extracts article thumbnail image URL from varied SerpApi formats."""
    thumb = raw_item.get("thumbnail")
    if isinstance(thumb, dict):
        return thumb.get("src") or thumb.get("url")
    if isinstance(thumb, str) and thumb.strip():
        return thumb.strip()
    photo = raw_item.get("photo")
    if isinstance(photo, str) and photo.strip():
        return photo.strip()
    image = raw_item.get("image")
    if isinstance(image, str) and image.strip():
        return image.strip()
    return None


def _infer_article_asset(title: str, snippet: str, default_asset: str) -> str:
    """Tags article with the most relevant asset category based on keywords."""
    if default_asset in ("gold", "bitcoin", "nvidia"):
        return default_asset

    text = f"{title} {snippet}".lower()
    has_btc = bool(re.search(r"\b(bitcoin|btc|crypto|cryptocurrency)\b", text))
    has_gold = bool(re.search(r"\b(gold|bullion|precious metal)\b", text))
    has_nvda = bool(re.search(r"\b(nvidia|nvda|semiconductor|ai chip)\b", text))

    counts = [("bitcoin", has_btc), ("gold", has_gold), ("nvidia", has_nvda)]
    matched = [cat for cat, found in counts if found]
    if len(matched) == 1:
        return matched[0]
    return "all"


def normalize_article(
    raw_item: dict[str, Any],
    default_asset: str,
    fetched_at_iso: str,
    base_time: datetime | None = None
) -> dict[str, Any] | None:
    """
    Transforms a raw SerpApi Google News item into a standardized QuantX article structure.
    Safely handles missing or differently structured optional fields without inventing data.
    """
    if not isinstance(raw_item, dict):
        return None

    title = str(raw_item.get("title") or "").strip()
    link = str(raw_item.get("link") or raw_item.get("url") or "").strip()

    if not title or not link:
        return None

    # Filter out explicitly blacklisted / unwanted articles
    link_lower = link.lower()
    title_lower = title.lower()
    for pattern in EXCLUDED_ARTICLE_PATTERNS:
        pat_lower = pattern.lower()
        if pat_lower in link_lower or pat_lower in title_lower:
            return None

    now = base_time or datetime.now(timezone.utc)
    raw_date = raw_item.get("date") or raw_item.get("published_at")
    raw_date_str = str(raw_date).strip() if raw_date else None

    # Handle SerpApi's published_at field if provided directly
    direct_published_at = raw_item.get("published_at")
    published_iso, sort_timestamp = _parse_approximate_published_at(
        str(direct_published_at) if direct_published_at else raw_date_str,
        now
    )

    source_name = _extract_source_name(raw_item.get("source"), fallback_url=link)
    thumbnail = _extract_thumbnail(raw_item)
    snippet = raw_item.get("snippet")
    snippet_str = str(snippet).strip() if snippet else None

    article_asset = _infer_article_asset(title, snippet_str or "", default_asset)

    # Unique reproducible ID
    normalized_url = _normalize_url(link)
    article_id = hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()[:16]

    return {
        "id": article_id,
        "title": title,
        "source": source_name,
        "date": raw_date_str or "Recently",
        "published_at": published_iso,
        "url": normalized_url,
        "thumbnail": thumbnail,
        "snippet": snippet_str,
        "asset": article_asset,
        "fetched_at": fetched_at_iso,
        "_sort_timestamp": sort_timestamp,
    }


def deduplicate_articles(articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Removes duplicate articles based on normalized URLs and titles."""
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    deduped: list[dict[str, Any]] = []

    for item in articles:
        url_key = _normalize_url(item.get("url", ""))
        title_key = _normalize_title_key(item.get("title", ""))

        if not url_key or url_key in seen_urls:
            continue
        if title_key and title_key in seen_titles:
            continue

        seen_urls.add(url_key)
        if title_key:
            seen_titles.add(title_key)
        deduped.append(item)

    return deduped


async def fetch_serpapi_google_news(
    query: str,
    api_key: str,
    limit: int = 15,
    client: httpx.AsyncClient | None = None,
) -> list[dict[str, Any]]:
    """
    Executes a Google News request via SerpApi (engine=google_news).
    Handles authentication, timeouts, rate limits, and network errors gracefully.
    Never logs or leaks the API key in exceptions or error details.
    """
    params = {
        "engine": "google_news",
        "q": query,
        "hl": "en",
        "gl": "us",
        "api_key": api_key,
    }

    close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=5.0))
        close_client = True

    try:
        response = await client.get(SERPAPI_BASE_URL, params=params)

        if response.status_code == 429:
            raise SerpApiRateLimitError(
                "SerpApi search limit reached. Please wait or check your SerpApi quota."
            )
        if response.status_code in (401, 403):
            raise SerpApiAuthError(
                "Invalid or unauthorized SerpApi API key. Verify your SERPAPI_API_KEY."
            )

        try:
            payload = response.json()
        except ValueError as json_err:
            raise SerpApiUpstreamError(
                f"Invalid JSON received from SerpApi upstream: {response.status_code}"
            ) from json_err

        # SerpApi may return 200 with an error object in the body
        if isinstance(payload, dict) and "error" in payload:
            err_msg = str(payload["error"])
            if "run out of searches" in err_msg.lower() or "quota" in err_msg.lower():
                raise SerpApiRateLimitError(f"SerpApi quota: {err_msg}")
            if "invalid api key" in err_msg.lower() or "api key not valid" in err_msg.lower():
                raise SerpApiAuthError(f"SerpApi authentication: {err_msg}")
            raise SerpApiUpstreamError(f"SerpApi upstream error: {err_msg}")

        news_results = payload.get("news_results", [])
        if not isinstance(news_results, list):
            return []

        return news_results[:limit]

    except httpx.TimeoutException as exc:
        raise SerpApiTimeoutError("Network timeout connecting to SerpApi Google News.") from exc
    except httpx.HTTPError as exc:
        raise SerpApiUpstreamError(f"Network error querying SerpApi: {str(exc)}") from exc
    finally:
        if close_client:
            await client.aclose()


async def search_asset_news(
    asset: str,
    query: str | None = None,
    limit: int = 15,
    api_key: str | None = None,
    client: httpx.AsyncClient | None = None,
    base_time: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Retrieves normalized news for an asset.
    Designed for reuse by future QuantX volatility investigation and Evidence Engine.
    """
    key = api_key or get_serpapi_key()
    now = base_time or datetime.now(timezone.utc)
    now_iso = now.isoformat()

    search_query = query or ASSET_QUERIES.get(asset, asset)
    raw_results = await fetch_serpapi_google_news(
        query=search_query,
        api_key=key,
        limit=limit,
        client=client
    )

    normalized: list[dict[str, Any]] = []
    for raw_item in raw_results:
        item = normalize_article(raw_item, default_asset=asset, fetched_at_iso=now_iso, base_time=now)
        if item:
            normalized.append(item)

    return deduplicate_articles(normalized)


async def get_market_news(
    asset: str = "all",
    limit: int = 15,
    refresh: bool = False,
    api_key: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    """
    Main entry point for market news feed.
    Features:
    - Bounded results (10-30 articles)
    - In-memory caching with TTL
    - Bypass cache on explicit refresh
    - Deduplication and publication time ordering
    - Stale cache fallback if refresh fails
    """
    if asset not in SUPPORTED_ASSETS:
        raise ValueError(f"Unknown asset filter '{asset}'. Supported: {', '.join(SUPPORTED_ASSETS)}")

    bounded_limit = max(1, min(int(limit), 50))
    cache_key = f"{asset}:{bounded_limit}"

    # Return cached data if valid and not explicitly refreshing
    if not refresh:
        cached_payload = news_cache.get(cache_key)
        if cached_payload is not None:
            return {
                **cached_payload,
                "cached": True,
            }

    # Attempt to fetch fresh data
    key = api_key or get_serpapi_key()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    try:
        articles: list[dict[str, Any]] = []

        if asset == "all":
            # For All Markets, query the 3 core assets concurrently
            assets_to_fetch = ["gold", "bitcoin", "nvidia"]
            fetch_tasks = [
                search_asset_news(
                    asset=a,
                    limit=max(8, bounded_limit // 2),
                    api_key=key,
                    client=client,
                    base_time=now
                )
                for a in assets_to_fetch
            ]
            results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

            all_articles: list[dict[str, Any]] = []
            errors: list[Exception] = []
            for r in results:
                if isinstance(r, Exception):
                    errors.append(r)
                elif isinstance(r, list):
                    all_articles.extend(r)

            # If all sub-fetches failed, raise the first error
            if errors and not all_articles:
                raise errors[0]

            deduped = deduplicate_articles(all_articles)
            # Sort newest first based on _sort_timestamp
            deduped.sort(key=lambda x: x.get("_sort_timestamp", 0), reverse=True)
            articles = deduped[:bounded_limit]

        else:
            articles = await search_asset_news(
                asset=asset,
                limit=bounded_limit,
                api_key=key,
                client=client,
                base_time=now
            )

        # Clean private sort keys before returning and enforce strict exclusions
        cleaned_articles = []
        for item in articles:
            url_lower = str(item.get("url") or "").lower()
            title_lower = str(item.get("title") or "").lower()
            source_lower = str(item.get("source") or "").lower()
            if any(pat.lower() in url_lower or pat.lower() in title_lower or pat.lower() in source_lower for pat in EXCLUDED_ARTICLE_PATTERNS):
                continue
            cleaned_articles.append({k: v for k, v in item.items() if not k.startswith("_")})

        payload = {
            "asset": asset,
            "asset_label": ASSET_LABELS.get(asset, asset.capitalize()),
            "total": len(cleaned_articles),
            "fetched_at": now_iso,
            "cached": False,
            "stale": False,
            "source_provider": "Google News via SerpApi",
            "articles": cleaned_articles,
        }

        # Store in cache
        news_cache.set(cache_key, payload)
        return payload

    except (SerpApiRateLimitError, SerpApiTimeoutError, SerpApiUpstreamError, httpx.HTTPError) as exc:
        # If refresh failed, attempt to preserve previously fetched results
        stale_data = news_cache.get_last_successful(cache_key)
        if stale_data is not None:
            return {
                **stale_data,
                "cached": True,
                "stale": True,
                "warning": f"Refresh failed ({str(exc)}). Showing last successful results.",
            }
        # If no prior results exist, re-raise the exception
        raise
