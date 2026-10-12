from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd

try:
    import yfinance as yf
except Exception:
    yf = None


ASSETS = {
    "gold": {"label": "Gold", "ticker": "GC=F", "color": "#2563eb", "unit": "USD / oz"},
    "bitcoin": {"label": "Bitcoin", "ticker": "BTC-USD", "color": "#ef4444", "unit": "USD"},
    "nvidia": {"label": "NVIDIA", "ticker": "NVDA", "color": "#10b981", "unit": "USD"},
}


def _mock_prices(key: str, periods: int = 520) -> pd.DataFrame:
    seed = {"gold": 11, "bitcoin": 17, "nvidia": 27}.get(key, 37)
    rng = np.random.default_rng(seed)
    dates = pd.bdate_range(end=pd.Timestamp.today().normalize(), periods=periods)
    if len(dates) != periods:
        dates = pd.bdate_range(end=pd.Timestamp.today().normalize(), periods=periods + 1)[:periods]

    base = {"gold": 2150.0, "bitcoin": 42000.0, "nvidia": 430.0}.get(key, 100.0)
    beta = {"gold": 0.34, "bitcoin": 1.25, "nvidia": 1.06}.get(key, 0.7)
    drift = {"gold": 0.0005, "bitcoin": 0.0009, "nvidia": 0.0008}.get(key, 0.0004)
    vol = {"gold": 0.009, "bitcoin": 0.028, "nvidia": 0.020}.get(key, 0.015)

    t = np.arange(periods)
    market_cycle = (
        0.0022 * np.sin(t / 18.0)
        + 0.0018 * np.cos(t / 31.0)
        + rng.normal(0.0003, 0.007, periods)
    )
    common_factor = market_cycle * (0.9 + 0.15 * beta)
    idiosyncratic = rng.normal(drift, vol, periods)
    log_returns = common_factor + idiosyncratic * 0.7
    close = base * np.exp(np.cumsum(log_returns))

    frame = pd.DataFrame({"Close": close}, index=dates)
    frame["Open"] = frame["Close"] * (1 + rng.normal(0, 0.0035, periods))
    frame["High"] = frame[["Open", "Close"]].max(axis=1) * (1 + abs(rng.normal(0, 0.006, periods)))
    frame["Low"] = frame[["Open", "Close"]].min(axis=1) * (1 - abs(rng.normal(0, 0.006, periods)))
    frame["Volume"] = rng.integers(100000, 10000000, periods)
    return frame


def _normalize(frame: pd.DataFrame) -> pd.DataFrame:
    if isinstance(frame.columns, pd.MultiIndex):
        frame.columns = frame.columns.get_level_values(0)
    frame = frame.rename(columns={str(column): str(column).title() for column in frame.columns})
    if "Close" not in frame.columns:
        raise ValueError("Price response did not contain Close")
    frame.index = pd.to_datetime(frame.index).tz_localize(None)
    frame = frame[~frame.index.duplicated(keep="last")].sort_index()
    frame = frame.replace([np.inf, -np.inf], np.nan).dropna(subset=["Close"])
    return frame


import concurrent.futures
import time
import threading

# --- Thread-Safe Market Data & Indicator Cache with In-Flight Deduplication ---
_CACHE_LOCK = threading.Lock()
_IN_FLIGHT_LOCK = threading.Lock()
_IN_FLIGHT_EVENTS: dict[tuple[str, str], threading.Event] = {}
_PRICE_CACHE: dict[tuple[str, str], tuple[pd.DataFrame, bool, float]] = {}  # key -> (df.copy(), live, timestamp)
_CALC_CACHE: dict[tuple[str, str, float], tuple[pd.DataFrame, float]] = {}  # (key, period, rfr) -> (df.copy(), timestamp)

CACHE_TTL_PRICES = 300.0  # 5 minutes TTL for market price snapshots
CACHE_TTL_ANALYTICS = 300.0  # 5 minutes TTL for computed indicators

CACHE_STATS = {
    "price_hits": 0,
    "price_misses": 0,
    "dedup_waits": 0,
    "calc_hits": 0,
    "calc_misses": 0,
}


def get_cache_stats() -> dict[str, int]:
    with _CACHE_LOCK:
        return dict(CACHE_STATS)


def clear_cache():
    with _CACHE_LOCK:
        _PRICE_CACHE.clear()
        _CALC_CACHE.clear()
        for k in CACHE_STATS:
            CACHE_STATS[k] = 0



def fetch_prices(key: str, period: str = "2y") -> tuple[pd.DataFrame, bool]:
    if key not in ASSETS:
        raise ValueError(f"Unknown asset: {key}")

    cache_key = (key, str(period))
    now = time.time()

    # 1. Check existing fresh cache
    with _CACHE_LOCK:
        if cache_key in _PRICE_CACHE:
            cached_frame, live, cached_time = _PRICE_CACHE[cache_key]
            if now - cached_time < CACHE_TTL_PRICES:
                CACHE_STATS["price_hits"] += 1
                return cached_frame.copy(), live

    # 2. In-flight request deduplication (stampede prevention)
    wait_event = None
    is_initiator = False
    with _IN_FLIGHT_LOCK:
        if cache_key in _IN_FLIGHT_EVENTS:
            wait_event = _IN_FLIGHT_EVENTS[cache_key]
            CACHE_STATS["dedup_waits"] += 1
        else:
            is_initiator = True
            wait_event = threading.Event()
            _IN_FLIGHT_EVENTS[cache_key] = wait_event

    if not is_initiator:
        # Await leader fetch with tight timeout
        wait_event.wait(timeout=5.0)
        with _CACHE_LOCK:
            if cache_key in _PRICE_CACHE:
                cached_frame, live, _ = _PRICE_CACHE[cache_key]
                return cached_frame.copy(), live
        # Fallback if leader failed/timed out
        return _mock_prices(key), False

    # 3. Initiator fetches real data
    try:
        live = False
        frame = None
        if yf is not None:
            try:
                def _do_download():
                    return yf.download(
                        ASSETS[key]["ticker"],
                        period=period,
                        auto_adjust=True,
                        progress=False,
                        threads=False,
                    )
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    future = pool.submit(_do_download)
                    downloaded = future.result(timeout=4.0)
                if not downloaded.empty:
                    frame = _normalize(downloaded)
                    live = True
            except Exception:
                pass

        if frame is None:
            frame = _mock_prices(key)
            live = False

        with _CACHE_LOCK:
            CACHE_STATS["price_misses"] += 1
            # Bounded cache size check (prevent memory leak)
            if len(_PRICE_CACHE) > 100:
                oldest_key = min(_PRICE_CACHE.keys(), key=lambda k: _PRICE_CACHE[k][2])
                _PRICE_CACHE.pop(oldest_key, None)
            _PRICE_CACHE[cache_key] = (frame.copy(), live, time.time())

        return frame.copy(), live
    finally:
        with _IN_FLIGHT_LOCK:
            _IN_FLIGHT_EVENTS.pop(cache_key, None)
            wait_event.set()



def calculate_indicators(frame: pd.DataFrame, risk_free_rate: float = 0.045) -> pd.DataFrame:
    data = frame.copy()
    data["Return"] = data["Close"].pct_change().fillna(0)
    data["CumulativeReturn"] = (1 + data["Return"]).cumprod() - 1
    data["RollingReturn21"] = ((1 + data["Return"]).rolling(21, min_periods=5).apply(np.prod, raw=True) - 1).fillna(0)
    data["EMA50"] = data["Close"].ewm(span=50, adjust=False).mean()
    data["EMA200"] = data["Close"].ewm(span=200, adjust=False).mean()
    data["SMA50"] = data["Close"].rolling(50, min_periods=1).mean()
    data["Volatility"] = data["Return"].rolling(21, min_periods=5).std().fillna(0) * np.sqrt(252)
    data["RollingMax"] = data["Close"].cummax()
    data["Drawdown"] = data["Close"] / data["RollingMax"] - 1
    return data


def summary(data: pd.DataFrame, risk_free_rate: float = 0.045) -> dict[str, float]:
    returns = data["Return"].dropna()
    annual_return = float((1 + returns).prod() ** (252 / max(len(returns), 1)) - 1)
    annual_volatility = float(returns.std() * np.sqrt(252)) if len(returns) > 1 else 0.0
    daily_rf = (1 + risk_free_rate) ** (1 / 252) - 1
    sharpe = float(((returns - daily_rf).mean() / returns.std()) * np.sqrt(252)) if returns.std() else 0.0
    return {
        "price": float(data["Close"].iloc[-1]),
        "daily_change": float(data["Return"].iloc[-1]),
        "cumulative_return": float(data["CumulativeReturn"].iloc[-1]),
        "rolling_return_21d": float(data["RollingReturn21"].iloc[-1]),
        "annual_return": annual_return,
        "annual_volatility": annual_volatility,
        "sharpe": sharpe,
        "max_drawdown": float(data["Drawdown"].min()),
    }


def serialize_series(data: pd.DataFrame, limit: int = 520) -> list[dict[str, Any]]:
    data = data.tail(limit)
    rows = []
    for index, row in data.iterrows():
        rows.append({
            "date": index.strftime("%Y-%m-%d"),
            "close": round(float(row["Close"]), 4),
            "return": round(float(row.get("Return", 0)), 6),
            "cumulative_return": round(float(row.get("CumulativeReturn", 0)), 6),
            "rolling_return_21d": round(float(row.get("RollingReturn21", 0)), 6),
            "sma50": round(float(row.get("SMA50", row["Close"])), 4),
            "ema50": round(float(row.get("EMA50", row["Close"])), 4),
            "ema200": round(float(row.get("EMA200", row["Close"])), 4),
            "volatility": round(float(row.get("Volatility", 0)), 6),
            "drawdown": round(float(row.get("Drawdown", 0)), 6),
        })
    return rows


def asset_payload(key: str, period: str = "2y") -> dict[str, Any]:
    raw, live = fetch_prices(key, period)
    data = calculate_indicators(raw)
    return {
        "asset": key,
        "label": ASSETS[key]["label"],
        "ticker": ASSETS[key]["ticker"],
        "color": ASSETS[key]["color"],
        "unit": ASSETS[key]["unit"],
        "source": "Yahoo Finance" if live else "QuantX simulated fallback",
        "live": live,
        "summary": summary(data),
        "series": serialize_series(data),
    }
