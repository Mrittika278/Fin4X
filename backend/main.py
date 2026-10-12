from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import httpx

try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv())
except ImportError:
    pass

try:
    from .backtester import run_backtest
    from .engine import ASSETS, asset_payload, calculate_indicators, fetch_prices, serialize_series, summary, get_cache_stats, clear_cache

    from .assistant_config import GROQ_API_KEY, GROQ_MODEL
    from .news import (
        get_market_news,
        MissingSerpApiKeyError,
        SerpApiAuthError,
        SerpApiRateLimitError,
        SerpApiTimeoutError,
        SerpApiUpstreamError,
        SUPPORTED_ASSETS,
    )
    from .stress_intelligence import detect_market_stress
    from .report_generator import generate_research_report_pdf
except ImportError:  # pragma: no cover - supports running as a script from backend/
    from backtester import run_backtest
    from engine import ASSETS, asset_payload, calculate_indicators, fetch_prices, serialize_series, summary, get_cache_stats, clear_cache

    from assistant_config import GROQ_API_KEY, GROQ_MODEL
    from news import (
        get_market_news,
        MissingSerpApiKeyError,
        SerpApiAuthError,
        SerpApiRateLimitError,
        SerpApiTimeoutError,
        SerpApiUpstreamError,
        SUPPORTED_ASSETS,
    )
    from stress_intelligence import detect_market_stress
    from report_generator import generate_research_report_pdf

app = FastAPI(title="QuantX Intelligence API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.endswith((".html", ".css", ".js")):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


class BacktestRequest(BaseModel):
    asset: str = "gold"
    period: str = Field("2y", pattern="^(1y|2y|5y)$")
    initial_capital: float = Field(10000, gt=0)
    position_size: float = Field(1.0, gt=0, le=1)
    transaction_cost: float = Field(0.001, ge=0, le=0.1)
    strategy: str = Field("ema", pattern="^(ema|sma|momentum|mean_reversion)$")
    fast_window: int = Field(50, ge=5, le=50)
    slow_window: int = Field(200, ge=30, le=200)


class ResearchReportRequest(BaseModel):
    preferred_asset: str = Field("bitcoin", pattern="^(gold|bitcoin|nvidia)$")
    preferred_strategy: str = Field("ema", pattern="^(ema|sma|momentum|mean_reversion)$")
    lookback_period: str = Field("2y", pattern="^(1y|2y|5y)$")


class AssistantRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=12)


def get_data(asset: str, period: str = "2y"):
    try:
        raw, live = fetch_prices(asset, period)
        return calculate_indicators(raw), live
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "QuantX Intelligence API"}


@app.get("/api/diagnostics/cache")
def diagnostics_cache():
    return {
        "status": "ok",
        "cache_stats": get_cache_stats(),
        "ttl_seconds": 300.0,
    }



@app.post("/api/assistant")
async def assistant(request: AssistantRequest):
    active_key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
    active_model = os.getenv("GROQ_MODEL") or GROQ_MODEL
    if not active_key or active_key == "PASTE_YOUR_GROQ_API_KEY_HERE":
        raise HTTPException(status_code=503, detail="Add your Groq API key in backend/assistant_config.py or .env")
    messages = [{
        "role": "system",
        "content": "You are Fin4X Quant Research Assistant. Give concise, practical explanations about financial indicators, asset behaviour, correlations, market regimes, and historical backtests. Never present historical results as guaranteed future returns."
    }]
    messages.extend({"role": item["role"], "content": item["content"]} for item in request.history if item.get("role") in {"user", "assistant"} and item.get("content"))
    messages.append({"role": "user", "content": request.message})
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {active_key}", "Content-Type": "application/json"}, json={"model": active_model, "messages": messages, "temperature": 0.2, "max_tokens": 800})
        if response.is_error:
            try:
                provider_error = response.json().get("error", {}).get("message", "Groq assistant request failed")
            except ValueError:
                provider_error = "Groq assistant request failed"
            raise HTTPException(status_code=502, detail=f"Groq: {provider_error}")
        payload = response.json()
        message_data = payload["choices"][0]["message"]
        content = message_data.get("content") or message_data.get("reasoning") or "No response generated."
        return {"answer": content, "model": active_model}
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Unable to reach Groq assistant") from error


@app.get("/api/news")
async def news(
    asset: str = "all",
    limit: int = 15,
    refresh: bool = False,
):
    if asset not in SUPPORTED_ASSETS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid asset filter '{asset}'. Allowed values: {', '.join(SUPPORTED_ASSETS)}"
        )
    if limit < 1 or limit > 50:
        raise HTTPException(
            status_code=400,
            detail="The 'limit' parameter must be between 1 and 50."
        )

    try:
        return await get_market_news(asset=asset, limit=limit, refresh=refresh)
    except MissingSerpApiKeyError as error:
        raise HTTPException(
            status_code=503,
            detail="SERPAPI_API_KEY is not configured. Please add your SerpApi key in .env or environment variables."
        ) from error
    except SerpApiAuthError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Authentication error with SerpApi: {str(error)}"
        ) from error
    except SerpApiRateLimitError as error:
        raise HTTPException(
            status_code=429,
            detail=f"SerpApi rate limit or quota exceeded: {str(error)}"
        ) from error
    except SerpApiTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="Timeout waiting for Google News response from SerpApi."
        ) from error
    except SerpApiUpstreamError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Error retrieving news from SerpApi: {str(error)}"
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error retrieving market news: {str(error)}"
        ) from error


@app.get("/api/assets")
def assets(period: str = "2y"):
    import concurrent.futures

    def _get_card(key: str):
        payload = asset_payload(key, period)
        return {
            "asset": key,
            "label": payload["label"],
            "ticker": payload["ticker"],
            "color": payload["color"],
            "source": payload["source"],
            "live": payload["live"],
            "summary": payload["summary"],
            "series": payload["series"]
        }

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(ASSETS)) as executor:
        futures = [executor.submit(_get_card, key) for key in ASSETS]
        results = [f.result() for f in futures]

    return {"assets": results}


@app.get("/api/assets/{asset}")
def asset(asset: str, period: str = "2y"):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset_payload(asset, period)


@app.post("/api/backtest")
def backtest(request: BacktestRequest):
    if request.asset not in ASSETS:
        raise HTTPException(status_code=400, detail="Asset not found")
    data, live = get_data(request.asset, request.period)
    response = run_backtest(data, request.initial_capital, request.position_size, request.transaction_cost, strategy=request.strategy, fast_window=request.fast_window, slow_window=request.slow_window)
    response["asset"] = request.asset
    response["source"] = "Yahoo Finance" if live else "QuantX simulated fallback"
    return response


@app.get("/api/correlation")
def correlation(window: int = 60):
    window = max(20, min(int(window), 252))
    streams = {}
    live = True
    for key in ASSETS:
        data, is_live = get_data(key)
        streams[key] = data["Return"]
        live = live and is_live
    frame = __import__("pandas").DataFrame(streams).dropna()
    labels = [ASSETS[key]["label"] for key in ASSETS]
    pair_columns = {}
    for left_index, left in enumerate(ASSETS):
        for right in list(ASSETS)[left_index + 1:]:
            pair_columns[f"{ASSETS[left]['label']} / {ASSETS[right]['label']}"] = frame[left].rolling(window).corr(frame[right])
    rolling = __import__("pandas").DataFrame(pair_columns).dropna().tail(520)
    return {
        "assets": list(ASSETS.keys()),
        "labels": labels,
        "matrix": frame.corr().round(3).values.tolist(),
        "rolling_window": window,
        "rolling_labels": [index.strftime("%Y-%m-%d") for index in rolling.index],
        "rolling_series": {key: values.round(3).tolist() for key, values in rolling.items()},
        "source": "Yahoo Finance" if live else "QuantX simulated fallback",
    }


@app.get("/api/regimes/{asset}")
def regimes(asset: str):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    data, live = get_data(asset)
    data["trend"] = data["EMA50"] > data["EMA200"]
    data["vol_median"] = data["Volatility"].rolling(126, min_periods=20).median()
    data["regime"] = "Bull / Low Volatility"
    data.loc[~data["trend"], "regime"] = "Bear / Low Volatility"
    data.loc[data["trend"] & (data["Volatility"] > data["vol_median"]), "regime"] = "Bull / High Volatility"
    data.loc[(~data["trend"]) & (data["Volatility"] > data["vol_median"]), "regime"] = "Bear / High Volatility"
    regime_order = ["Bull / Low Volatility", "Bull / High Volatility", "Bear / Low Volatility", "Bear / High Volatility"]
    grouped = []
    groups = {name: group for name, group in data.groupby("regime", sort=False)}
    regime_colors = {"Bull / Low Volatility": "#42d392", "Bull / High Volatility": "#f5c451", "Bear / Low Volatility": "#7a8da6", "Bear / High Volatility": "#ff6b6b"}
    for name in regime_order:
        if name in groups:
            group = groups[name]
            grouped.append({"regime": name, "days": int(len(group)), "return": float((1 + group["Return"]).prod() - 1), "volatility": float(group["Volatility"].mean()), "color": regime_colors.get(name, "#93a4bc")})
    timeline = [{"date": index.strftime("%Y-%m-%d"), "regime": row["regime"], "trend": "Bull" if row["trend"] else "Bear", "volatility_state": "High Volatility" if row["Volatility"] > row["vol_median"] else "Low Volatility", "color": regime_colors.get(row["regime"], "#93a4bc")} for index, row in data.tail(520).iterrows()]
    current = timeline[-1] if timeline else {"regime": "Unknown", "color": "#93a4bc"}
    return {"asset": asset, "source": "Yahoo Finance" if live else "QuantX simulated fallback", "current": current, "regimes": grouped, "timeline": timeline, "series": serialize_series(data)}


@app.get("/api/regime-performance/{asset}")
def regime_performance(asset: str, regime: str = "bull"):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    regime_labels = {
        "bull": "Bull Market (Expansion)",
        "bear": "Bear Market (Contraction)",
        "high_vol": "High Volatility Shock",
        "low_vol": "Low Volatility Grind",
    }
    data, live = get_data(asset)
    data["trend"] = data["EMA50"] > data["EMA200"]
    data["vol_median"] = data["Volatility"].rolling(126, min_periods=20).median()
    data["regime"] = "Bull / Low Volatility"
    data.loc[~data["trend"], "regime"] = "Bear / Low Volatility"
    data.loc[data["trend"] & (data["Volatility"] > data["vol_median"]), "regime"] = "Bull / High Volatility"
    data.loc[(~data["trend"]) & (data["Volatility"] > data["vol_median"]), "regime"] = "Bear / High Volatility"
    regime = regime if regime in regime_labels else "bull"
    if regime == "bull":
        selected = data[data["trend"]].copy()
    elif regime == "bear":
        selected = data[~data["trend"]].copy()
    elif regime == "high_vol":
        selected = data[data["Volatility"] > data["vol_median"]].copy()
    else:
        selected = data[data["Volatility"] <= data["vol_median"]].copy()
    prices = data["Close"]
    strategies = {"SMA Crossover (20/50)": ("sma", 20, 50), "EMA Trend Following": ("ema", 20, 50), "Momentum Oscillator": ("momentum", 20, 50), "Mean Reversion": ("mean_reversion", 20, 50), "Buy & Hold (Benchmark)": ("hold", 1, 2)}
    comparison = []
    for name, (kind, fast_window, slow_window) in strategies.items():
        if kind == "ema":
            fast = prices.ewm(span=fast_window, adjust=False).mean()
            slow = prices.ewm(span=slow_window, adjust=False).mean()
            signal = (fast > slow).astype(float)
        elif kind == "sma":
            signal = (prices.rolling(fast_window, min_periods=1).mean() > prices.rolling(slow_window, min_periods=1).mean()).astype(float)
        elif kind == "momentum":
            signal = (prices.pct_change(fast_window) > 0).astype(float)
        elif kind == "mean_reversion":
            signal = (prices < prices.rolling(fast_window, min_periods=1).mean()).astype(float)
        else:
            signal = pd.Series(1.0, index=prices.index)
        returns = selected["Return"] if kind == "hold" else (signal.shift(1).reindex(selected.index).fillna(0) * selected["Return"])
        returns = returns.replace([np.inf, -np.inf], np.nan).dropna()
        compounded = float((1 + returns).prod() - 1) if len(returns) else 0.0
        volatility = float(returns.std()) if len(returns) > 1 else 0.0
        sharpe = float((returns.mean() / volatility) * np.sqrt(252)) if volatility else 0.0
        equity = (1 + returns).cumprod()
        drawdown = float((equity / equity.cummax() - 1).min()) if len(equity) else 0.0
        comparison.append({"strategy": name, "period_return": compounded, "sharpe": sharpe, "max_drawdown": drawdown, "trades": int(signal.diff().abs().reindex(selected.index).fillna(0).gt(0).sum())})
    return {"asset": asset, "regime": regime, "regime_label": regime_labels[regime], "source": "Yahoo Finance" if live else "QuantX simulated fallback", "strategies": comparison}


@app.get("/api/stress/{asset}")
def stress_test(asset: str, scenario: str = "market_crash", shock: float = 0.2):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    data, live = get_data(asset)
    shock = max(0.01, min(float(shock), 0.8))
    returns = data["Return"].tail(520).copy()
    stressed = returns.copy()
    if scenario == "volatility_spike":
        stressed = stressed * (1 + shock * 2.5)
    elif scenario == "liquidity_shock":
        stressed.iloc[-1] -= shock
        stressed.iloc[-2:] -= shock * 0.35
    elif scenario == "recovery":
        stressed.iloc[-1] -= shock
        recovery_days = min(30, len(stressed))
        stressed.iloc[-recovery_days:] += shock / recovery_days
    else:
        stressed.iloc[-1] -= shock
        stressed.iloc[-2:] -= shock * 0.25
    base_equity = (1 + returns).cumprod()
    stressed_equity = (1 + stressed).cumprod()
    base_drawdown = base_equity / base_equity.cummax() - 1
    stressed_drawdown = stressed_equity / stressed_equity.cummax() - 1
    curve = [{"date": index.strftime("%Y-%m-%d"), "baseline": round(float(base_equity.loc[index]), 4), "stressed": round(float(stressed_equity.loc[index]), 4)} for index in returns.index]
    return {
        "asset": asset,
        "scenario": scenario,
        "shock": shock,
        "source": "Yahoo Finance" if live else "QuantX simulated fallback",
        "metrics": {
            "baseline_return": float(base_equity.iloc[-1] - 1),
            "stressed_return": float(stressed_equity.iloc[-1] - 1),
            "baseline_drawdown": float(base_drawdown.min()),
            "stressed_drawdown": float(stressed_drawdown.min()),
            "stress_loss": float(stressed_equity.iloc[-1] / base_equity.iloc[-1] - 1),
        },
        "curve": curve,
    }


@app.get("/api/stress/automated/{asset}")
async def automated_stress_test(asset: str):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    try:
        return await detect_market_stress(asset)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to detect market stress: {str(exc)}")


@app.get("/api/advanced/forecast/{asset}")
def advanced_forecast(asset: str, horizon: int = 90, paths: int = 120):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    data, live = get_data(asset)
    horizon = max(10, min(int(horizon), 365))
    paths = max(20, min(int(paths), 300))
    returns = data["Return"].replace([np.inf, -np.inf], np.nan).dropna().tail(520)
    if len(returns) < 30:
        raise HTTPException(status_code=422, detail="Not enough price history for Monte Carlo forecast")
    seed = sum(ord(character) for character in asset) + horizon + paths
    rng = np.random.default_rng(seed)
    drift = float(returns.mean())
    volatility = float(returns.std())
    sampled_returns = rng.normal(drift, volatility, size=(paths, horizon))
    starting_price = float(data["Close"].iloc[-1])
    simulated_prices = starting_price * np.exp(np.cumsum(sampled_returns, axis=1))
    expected_path = np.concatenate([[starting_price], np.median(simulated_prices, axis=0)])
    lower_band = np.concatenate([[starting_price], np.percentile(simulated_prices, 10, axis=0)])
    upper_band = np.concatenate([[starting_price], np.percentile(simulated_prices, 90, axis=0)])
    labels = list(range(horizon + 1))
    return {
        "asset": asset,
        "label": ASSETS[asset]["label"],
        "source": "Yahoo Finance" if live else "QuantX simulated fallback",
        "live": live,
        "starting_price": starting_price,
        "horizon": horizon,
        "paths": paths,
        "annualized_volatility": float(volatility * np.sqrt(252)),
        "expected_final_price": float(expected_path[-1]),
        "lower_final_price": float(lower_band[-1]),
        "upper_final_price": float(upper_band[-1]),
        "labels": labels,
        "simulations": simulated_prices.round(2).tolist(),
        "expected_path": expected_path.round(2).tolist(),
        "lower_band": lower_band.round(2).tolist(),
        "upper_band": upper_band.round(2).tolist(),
    }


@app.get("/api/advanced/optimizer")
def advanced_optimizer(risk_free_rate: float = 0.05, iterations: int = 2000):
    streams = {}
    live = True
    for key in ASSETS:
        data, is_live = get_data(key)
        streams[key] = data["Return"]
        live = live and is_live
    returns = pd.DataFrame(streams).dropna().tail(520)
    annual_returns = returns.mean() * 252
    covariance = returns.cov() * 252
    rng = np.random.default_rng(42 + int(iterations))
    weights = rng.dirichlet(np.ones(len(ASSETS)), size=max(100, min(iterations, 10000)))
    expected = weights @ annual_returns.to_numpy()
    volatility = np.sqrt(np.einsum("ij,jk,ik->i", weights, covariance.to_numpy(), weights))
    sharpe = (expected - risk_free_rate) / np.where(volatility == 0, 1, volatility)
    best = int(np.argmax(sharpe))
    selected = weights[best]
    return {"source": "Yahoo Finance" if live else "QuantX simulated fallback", "assets": [ASSETS[key]["label"] for key in ASSETS], "weights": (selected * 100).round(2).tolist(), "expected_return": float(expected[best]), "volatility": float(volatility[best]), "sharpe": float(sharpe[best]), "risk_free_rate": risk_free_rate, "iterations": iterations}


@app.get("/api/advanced/risk")
def advanced_risk(confidence: float = 0.95, days: int = 1):
    streams = []
    live = True
    for key in ASSETS:
        data, is_live = get_data(key)
        streams.append(data["Return"])
        live = live and is_live
    returns = pd.concat(streams, axis=1).dropna().mean(axis=1).tail(520)
    confidence = max(0.9, min(float(confidence), 0.999))
    scaled = returns * np.sqrt(max(1, int(days)))
    cutoff = float(np.quantile(scaled, 1 - confidence))
    tail = scaled[scaled <= cutoff]
    cvar = float(tail.mean()) if len(tail) else cutoff
    cutoff_99 = float(np.quantile(scaled, 0.01))
    return {"source": "Yahoo Finance" if live else "QuantX simulated fallback", "confidence": confidence, "days": days, "var_95": float(np.quantile(scaled, 0.05)), "var_99": cutoff_99, "cvar": cvar, "distribution": scaled.round(6).tolist()}


PAPER_ACCOUNT = {"cash": 100000.0, "initial_cash": 100000.0, "positions": {key: 0.0 for key in ASSETS}, "trades": []}


def _live_quotes():
    quotes = {}
    live = True
    for key in ASSETS:
        data, is_live = get_data(key)
        quotes[key] = {"price": float(data["Close"].iloc[-1]), "change": float(data["Return"].iloc[-1])}
        live = live and is_live
    return quotes, live


@app.get("/api/advanced/ml-regimes")
def advanced_ml_regimes(asset: str = "bitcoin"):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    data, live = get_data(asset)
    frame = pd.DataFrame(index=data.index)
    frame["return"] = data["Return"].rolling(5).mean()
    frame["volatility"] = data["Return"].rolling(21).std() * np.sqrt(252)
    frame["momentum"] = data["Close"].pct_change(21)
    frame = frame.replace([np.inf, -np.inf], np.nan).dropna().tail(520)
    features = frame.to_numpy(dtype=float)
    center = features.mean(axis=0)
    scale = features.std(axis=0)
    scale[scale == 0] = 1
    normalized = (features - center) / scale
    centroids = np.array([normalized.min(axis=0), normalized.mean(axis=0), normalized.max(axis=0)])
    for _ in range(12):
        distances = ((normalized[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)
        labels = distances.argmin(axis=1)
        updated = np.array([normalized[labels == index].mean(axis=0) if np.any(labels == index) else centroids[index] for index in range(3)])
        if np.allclose(updated, centroids):
            break
        centroids = updated
    profiles = []
    for index in range(3):
        sample = frame.iloc[labels == index]
        profiles.append({"cluster": index, "days": int(len(sample)), "return": float(sample["return"].mean()) if len(sample) else 0.0, "volatility": float(sample["volatility"].mean()) if len(sample) else 0.0, "momentum": float(sample["momentum"].mean()) if len(sample) else 0.0})
    order = sorted(range(3), key=lambda index: profiles[index]["return"])
    names = ["Defensive", "Balanced", "Risk-on"]
    labels_by_cluster = {cluster: names[position] for position, cluster in enumerate(order)}
    observations = [{"date": date.strftime("%Y-%m-%d"), "return": float(row["return"]), "volatility": float(row["volatility"]), "momentum": float(row["momentum"]), "cluster": int(label)} for (date, row), label in zip(frame.iterrows(), labels)]
    timeline = [{"date": row["date"], "regime": labels_by_cluster[row["cluster"]], "cluster": row["cluster"]} for row in observations]
    latest = profiles[int(labels[-1])]
    return {"asset": asset, "label": ASSETS[asset]["label"], "source": "Yahoo Finance" if live else "QuantX simulated fallback", "model": "KMeans Market Regimes", "current": {"regime": labels_by_cluster[int(labels[-1])], "date": timeline[-1]["date"], "return": latest["return"], "volatility": latest["volatility"], "momentum": latest["momentum"]}, "profiles": [{**profile, "regime": labels_by_cluster[profile["cluster"]]} for profile in profiles], "timeline": timeline, "observations": observations}


@app.get("/api/advanced/paper")
def paper_portfolio():
    quotes, live = _live_quotes()
    market_value = sum(PAPER_ACCOUNT["positions"][key] * quote["price"] for key, quote in quotes.items())
    equity = PAPER_ACCOUNT["cash"] + market_value
    return {"source": "Yahoo Finance" if live else "QuantX simulated fallback", "cash": PAPER_ACCOUNT["cash"], "equity": equity, "return": equity / PAPER_ACCOUNT["initial_cash"] - 1, "positions": [{"asset": key, "label": ASSETS[key]["label"], "quantity": PAPER_ACCOUNT["positions"][key], "price": quote["price"], "value": PAPER_ACCOUNT["positions"][key] * quote["price"], "change": quote["change"]} for key, quote in quotes.items()], "trades": PAPER_ACCOUNT["trades"][-25:]}


@app.post("/api/advanced/paper/order")
def paper_order(asset: str, side: str, quantity: float):
    if asset not in ASSETS:
        raise HTTPException(status_code=404, detail="Asset not found")
    if side not in {"buy", "sell"} or quantity <= 0:
        raise HTTPException(status_code=400, detail="Use a positive quantity and buy or sell side")
    quotes, live = _live_quotes()
    price = quotes[asset]["price"]
    signed_quantity = quantity if side == "buy" else -quantity
    cost = signed_quantity * price
    if side == "buy" and cost > PAPER_ACCOUNT["cash"]:
        raise HTTPException(status_code=400, detail="Insufficient cash")
    if side == "sell" and quantity > PAPER_ACCOUNT["positions"][asset]:
        raise HTTPException(status_code=400, detail="Insufficient position")
    PAPER_ACCOUNT["cash"] -= cost
    PAPER_ACCOUNT["positions"][asset] += signed_quantity
    PAPER_ACCOUNT["trades"].append({"time": datetime.utcnow().isoformat(timespec="seconds") + "Z", "asset": asset, "side": side, "quantity": quantity, "price": price})
    portfolio = paper_portfolio()
    portfolio["executed"] = {"asset": asset, "side": side, "quantity": quantity, "price": price}
    portfolio["source"] = "Yahoo Finance" if live else "QuantX simulated fallback"
    return portfolio


# --- Two-Page PDF Research Report Endpoints ---
@app.post("/api/reports/research-summary")
async def generate_research_report_endpoint(request: ResearchReportRequest = ResearchReportRequest()):
    if request.preferred_asset not in ASSETS:
        raise HTTPException(status_code=400, detail=f"Asset not supported: {request.preferred_asset}")
    try:
        pdf_bytes = await generate_research_report_pdf(
            paper_account=PAPER_ACCOUNT,
            preferred_asset=request.preferred_asset,
            preferred_strategy=request.preferred_strategy,
            lookback_period=request.lookback_period,
        )
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        filename = f"QuantX_Research_Report_{date_str}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate research report: {str(exc)}")


@app.get("/api/reports/research-summary")
async def generate_research_report_get_endpoint(
    asset: str = "bitcoin",
    strategy: str = "ema",
    period: str = "2y",
):
    try:
        req = ResearchReportRequest(preferred_asset=asset, preferred_strategy=strategy, lookback_period=period)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid request parameters: {str(exc)}")
    return await generate_research_report_endpoint(req)


# --- Serve Frontend Static Files & UI ---
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
