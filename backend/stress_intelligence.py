from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import numpy as np
import pandas as pd

try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv())
except ImportError:
    pass

try:
    from .engine import ASSETS, fetch_prices, calculate_indicators
    from .news import get_market_news
except ImportError:
    from engine import ASSETS, fetch_prices, calculate_indicators
    from news import get_market_news


async def detect_market_stress(
    asset: str,
    preloaded_data: pd.DataFrame | None = None,
    is_live: bool = True,
) -> dict[str, Any]:
    if asset not in ASSETS:
        raise ValueError(f"Unknown asset: {asset}")

    if preloaded_data is not None:
        data = preloaded_data
        live = is_live
    else:
        raw_data, live = fetch_prices(asset, period="2y")
        data = calculate_indicators(raw_data)
    returns = data["Return"].tail(520).copy()

    # 1. Quantitative Risk Dimensions
    close = data["Close"].iloc[-1]
    current_drawdown = float(data["Drawdown"].iloc[-1])
    min_drawdown_63d = float(data["Drawdown"].tail(63).min())
    current_vol = float(data["Volatility"].iloc[-1])

    # Volatility Z-score over the trailing year
    vol_series = data["Volatility"].tail(252).dropna()
    vol_mean = float(vol_series.mean()) if len(vol_series) > 0 else current_vol
    vol_std = float(vol_series.std()) if len(vol_series) > 1 and vol_series.std() > 0 else 0.05
    vol_zscore = (current_vol - vol_mean) / vol_std if vol_std > 0 else 0.0

    # Return velocity & momentum
    momentum_21d = float(data["RollingReturn21"].iloc[-1])
    recent_5d_ret = float((data["Close"].iloc[-1] / data["Close"].iloc[-5] - 1)) if len(data) >= 5 else 0.0
    recent_3d_ret = float((data["Close"].iloc[-1] / data["Close"].iloc[-3] - 1)) if len(data) >= 3 else 0.0
    daily_std = float(returns.std()) if len(returns) > 1 else 0.015

    # 99% 1-day historical VaR
    var_99 = float(np.percentile(returns.dropna(), 1)) if len(returns) > 30 else -0.04

    # 2. Decision Logic for Scenario Classification
    scenario = "market_crash"
    reasoning_parts = []

    # Thresholds adjusted for asset volatility profiles
    is_high_beta = asset in ("bitcoin", "nvidia")
    dd_crash_thresh = -0.14 if is_high_beta else -0.06
    dd_rec_thresh = -0.10 if is_high_beta else -0.04

    if min_drawdown_63d < dd_rec_thresh and recent_5d_ret > 0.035 and current_vol < vol_mean:
        scenario = "recovery"
        reasoning_parts.append(
            f"{ASSETS[asset]['label']} is rebounding (+{recent_5d_ret*100:.1f}% over last 5 sessions) "
            f"following an earlier peak drawdown of {min_drawdown_63d*100:.1f}%, indicating an emerging recovery channel."
        )
    elif recent_3d_ret < -2.2 * daily_std * np.sqrt(3):
        scenario = "liquidity_shock"
        reasoning_parts.append(
            f"Sharp sudden dislocation: 3-day drop of {recent_3d_ret*100:.1f}% exceeds 2.2σ of typical daily dispersion, "
            f"signaling sudden liquidity withdrawal or gap-down risk."
        )
    elif vol_zscore > 1.30 or current_vol > (vol_mean * 1.35):
        scenario = "volatility_spike"
        reasoning_parts.append(
            f"High turbulence detected: 21-day annualized volatility ({current_vol*100:.1f}%) is {vol_zscore:.1f}σ above "
            f"its 1-year historical mean ({vol_mean*100:.1f}%), pointing to an unstable volatility regime."
        )
    elif current_drawdown < dd_crash_thresh or momentum_21d < -0.05:
        scenario = "market_crash"
        reasoning_parts.append(
            f"Persistent downside pressure: Current drawdown is at {current_drawdown*100:.1f}% with negative 21-day "
            f"momentum ({momentum_21d*100:.1f}%), indicating capital erosion under downward trend continuation."
        )
    else:
        # Balanced / moderate baseline: classify according to dominant risk component
        if vol_zscore > 0.5:
            scenario = "volatility_spike"
            reasoning_parts.append(
                f"Elevated macro volatility ({current_vol*100:.1f}% annualized, Z={vol_zscore:.2f}) indicates potential for rapid swing expansions."
            )
        else:
            scenario = "market_crash"
            reasoning_parts.append(
                f"Baseline risk modeling: Conservative downward shock applied to audit portfolio resilience under stress."
            )

    # 3. Calibrate Recommended Shock Magnitude
    if asset == "bitcoin":
        base_shock = max(0.20, min(0.60, abs(var_99) * 4.5 + max(0, vol_zscore) * 0.05))
    elif asset == "nvidia":
        base_shock = max(0.15, min(0.45, abs(var_99) * 4.0 + max(0, vol_zscore) * 0.04))
    else:  # gold
        base_shock = max(0.08, min(0.25, abs(var_99) * 3.5 + max(0, vol_zscore) * 0.03))

    recommended_shock = round(float(base_shock), 2)
    reasoning_parts.append(
        f"Calibrated shock magnitude to {recommended_shock*100:.0f}% based on 99% 1-day tail VaR ({abs(var_99)*100:.1f}%) "
        f"and trailing {ASSETS[asset]['label']} volatility dynamics."
    )
    classification_reasoning = " ".join(reasoning_parts)

    # 4. Execute Stress Simulation with Recommended Values
    stressed = returns.copy()
    if scenario == "volatility_spike":
        stressed = stressed * (1 + recommended_shock * 2.5)
    elif scenario == "liquidity_shock":
        stressed.iloc[-1] -= recommended_shock
        stressed.iloc[-2:] -= recommended_shock * 0.35
    elif scenario == "recovery":
        stressed.iloc[-1] -= recommended_shock
        recovery_days = min(30, len(stressed))
        stressed.iloc[-recovery_days:] += recommended_shock / recovery_days
    else:  # market_crash
        stressed.iloc[-1] -= recommended_shock
        stressed.iloc[-2:] -= recommended_shock * 0.25

    base_equity = (1 + returns).cumprod()
    stressed_equity = (1 + stressed).cumprod()
    base_drawdown = base_equity / base_equity.cummax() - 1
    stressed_drawdown = stressed_equity / stressed_equity.cummax() - 1

    curve = [
        {
            "date": index.strftime("%Y-%m-%d"),
            "baseline": round(float(base_equity.loc[index]), 4),
            "stressed": round(float(stressed_equity.loc[index]), 4),
        }
        for index in returns.index
    ]

    # 5. Fetch SerpApi Google News Evidence (Top 3 items)
    news_evidence = []
    try:
        news_payload = await get_market_news(asset=asset, limit=3, refresh=False)
        articles = news_payload.get("articles", [])[:3]
        for item in articles:
            news_evidence.append({
                "title": item.get("title", ""),
                "source": item.get("source", "Financial Press"),
                "date": item.get("date", "Recent"),
                "url": item.get("url", "#"),
                "snippet": item.get("snippet", ""),
                "thumbnail": item.get("thumbnail"),
            })
    except Exception as exc:
        print(f"[Stress Intelligence] News evidence fetch failed: {exc}")
        news_evidence = []

    scenario_labels = {
        "market_crash": "Market Crash",
        "volatility_spike": "Volatility Spike",
        "liquidity_shock": "Liquidity Shock",
        "recovery": "Shock and Recovery",
    }

    return {
        "asset": asset,
        "asset_label": ASSETS[asset]["label"],
        "detected_scenario": scenario,
        "scenario_label": scenario_labels.get(scenario, scenario.title()),
        "recommended_shock": recommended_shock,
        "recommended_shock_percent": int(round(recommended_shock * 100)),
        "classification_reasoning": classification_reasoning,
        "source": "Yahoo Finance" if live else "QuantX simulated fallback",
        "data_freshness": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "metrics_observed": {
            "current_price": round(close, 2),
            "current_drawdown": round(current_drawdown, 4),
            "min_drawdown_63d": round(min_drawdown_63d, 4),
            "annualized_volatility": round(current_vol, 4),
            "volatility_zscore": round(vol_zscore, 2),
            "momentum_21d": round(momentum_21d, 4),
            "var_99": round(var_99, 4),
        },
        "simulation": {
            "metrics": {
                "baseline_return": float(base_equity.iloc[-1] - 1),
                "stressed_return": float(stressed_equity.iloc[-1] - 1),
                "baseline_drawdown": float(base_drawdown.min()),
                "stressed_drawdown": float(stressed_drawdown.min()),
                "stress_loss": float(stressed_equity.iloc[-1] / base_equity.iloc[-1] - 1),
            },
            "curve": curve,
        },
        "news_evidence": news_evidence,
    }
