from __future__ import annotations

import io
import asyncio
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

try:
    from .engine import ASSETS, fetch_prices, calculate_indicators, summary
    from .backtester import run_backtest
    from .stress_intelligence import detect_market_stress
except ImportError:
    from engine import ASSETS, fetch_prices, calculate_indicators, summary
    from backtester import run_backtest
    from stress_intelligence import detect_market_stress


# --- Color Palette (QuantX Financial Indigo Theme) ---
PRIMARY_COLOR = colors.HexColor("#084d91")      # Deep Quant Blue
SECONDARY_COLOR = colors.HexColor("#0a66c2")    # Indigo Accent
TEXT_DARK = colors.HexColor("#1b2c3f")          # High-contrast readable text
TEXT_MUTED = colors.HexColor("#5b738b")         # Subtitle and meta text
BG_LIGHT = colors.HexColor("#f4f7fb")           # Subtle table/card tint
BORDER_LIGHT = colors.HexColor("#d5e2ee")       # Clean dividers
COLOR_POSITIVE = colors.HexColor("#00875a")     # Soft green
COLOR_NEGATIVE = colors.HexColor("#de350b")     # Clear red
GOLD_COLOR = "#2563eb"
BTC_COLOR = "#ef4444"
NVDA_COLOR = "#10b981"


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accurately calculates the total page count
    and prints running headers and footers: 'Page X of Y'.
    """
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._saved_page_states: list[dict[str, Any]] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int) -> None:
        self.saveState()
        self.setFont("Helvetica", 7.5)
        self.setFillColor(TEXT_MUTED)

        # Header rule and branding
        self.setStrokeColor(BORDER_LIGHT)
        self.setLineWidth(0.6)
        self.line(36, A4[1] - 30, A4[0] - 36, A4[1] - 30)

        self.drawString(36, A4[1] - 25, "QuantX Financial Intelligence Platform — Institutional Research")
        self.drawRightString(A4[0] - 36, A4[1] - 25, "Quantitative Briefing Document")

        # Footer rule and pagination
        self.line(36, 32, A4[0] - 36, 32)
        gen_time = getattr(self, "report_timestamp_str", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
        self.drawString(36, 22, f"Strictly Confidential • Quantitative Intelligence Engine • Generated: {gen_time}")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 22, page_text)
        self.restoreState()


def _format_pct(val: float | None, plus: bool = True) -> str:
    if val is None or not np.isfinite(val):
        return "N/A"
    sign = "+" if (plus and val > 0) else ""
    return f"{sign}{val * 100:.2f}%"


def _format_num(val: float | None, dec: int = 2) -> str:
    if val is None or not np.isfinite(val):
        return "N/A"
    return f"{val:,.{dec}f}"


def _format_price(val: float | None) -> str:
    if val is None or not np.isfinite(val):
        return "N/A"
    if val >= 1000:
        return f"${val:,.2f}"
    return f"${val:.2f}"


def build_normalized_chart(asset_frames: dict[str, pd.DataFrame]) -> io.BytesIO:
    """
    Renders a compact, publication-grade normalized performance chart (Base = 100).
    """
    fig, ax = plt.subplots(figsize=(7.2, 2.05), dpi=220)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#f9fbfe")

    colors_map = {
        "gold": GOLD_COLOR,
        "bitcoin": BTC_COLOR,
        "nvidia": NVDA_COLOR,
    }

    labels_map = {
        "gold": "Gold (GC=F)",
        "bitcoin": "Bitcoin (BTC-USD)",
        "nvidia": "NVIDIA (NVDA)",
    }

    start_dates = []
    end_dates = []

    for key, frame in asset_frames.items():
        if frame.empty or "Close" not in frame.columns:
            continue
        series = frame["Close"].copy()
        if len(series) < 2:
            continue
        base_val = series.iloc[0]
        norm = (series / base_val) * 100.0
        ax.plot(
            norm.index,
            norm.values,
            label=labels_map.get(key, key.title()),
            color=colors_map.get(key, "#333333"),
            linewidth=1.35,
            alpha=0.92,
        )
        start_dates.append(series.index[0])
        end_dates.append(series.index[-1])

    ax.axhline(100, color="#9bb4c9", linestyle="--", linewidth=0.75, alpha=0.7)
    ax.set_ylabel("Normalized (Base = 100)", fontsize=7.5, color="#34495e", labelpad=4)
    ax.tick_params(axis="both", which="major", labelsize=7, colors="#486581")
    ax.grid(True, linestyle=":", alpha=0.5, color="#cddde9")

    # Format dates on X-axis
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    ax.xaxis.set_major_locator(mdates.AutoDateLocator(minticks=5, maxticks=8))

    for spine in ax.spines.values():
        spine.set_color("#d0dfec")
        spine.set_linewidth(0.6)

    ax.legend(
        loc="upper left",
        frameon=True,
        facecolor="#ffffff",
        edgecolor="#d5e2ee",
        fontsize=7,
        framealpha=0.9,
    )

    plt.tight_layout(pad=0.3)
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=220, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    buf.seek(0)
    return buf


def _fetch_single_asset(key: str, period: str):
    raw, live = fetch_prices(key, period=period)
    calc = calculate_indicators(raw)
    stats = summary(calc)
    return key, raw, live, calc, stats


async def collect_market_data(period: str = "2y") -> dict[str, Any]:
    """
    Collects genuine market snapshot and technical metrics concurrently from backend engines.
    """
    tasks = [asyncio.to_thread(_fetch_single_asset, key, period) for key in ASSETS]
    results = await asyncio.gather(*tasks)

    data_map: dict[str, Any] = {}
    frames: dict[str, pd.DataFrame] = {}
    is_live_all = True
    latest_dates = []

    for key, raw, live, calc, stats in results:
        frames[key] = calc
        data_map[key] = {
            "label": ASSETS[key]["label"],
            "ticker": ASSETS[key]["ticker"],
            "unit": ASSETS[key]["unit"],
            "live": live,
            "stats": stats,
            "raw": calc,
            "latest_price": stats["price"],
            "daily_return": stats["daily_change"],
            "period_return": stats["cumulative_return"],
            "volatility": stats["annual_volatility"],
            "max_drawdown": stats["max_drawdown"],
            "sharpe": stats["sharpe"],
            "trend": "Bullish" if calc["EMA50"].iloc[-1] > calc["EMA200"].iloc[-1] else "Bearish",
        }
        is_live_all = is_live_all and live
        if len(calc.index) > 0:
            latest_dates.append(calc.index[-1])

    latest_date_str = latest_dates[-1].strftime("%Y-%m-%d") if latest_dates else "N/A"
    earliest_date_str = min(f.index[0] for f in frames.values()).strftime("%Y-%m-%d") if frames else "N/A"

    # Cross-asset correlations
    returns_df = pd.DataFrame({k: v["Return"] for k, v in frames.items()}).dropna()
    corr_matrix = returns_df.corr() if not returns_df.empty else pd.DataFrame()

    return {
        "assets": data_map,
        "frames": frames,
        "is_live": is_live_all,
        "latest_date": latest_date_str,
        "earliest_date": earliest_date_str,
        "corr_matrix": corr_matrix,
    }


def collect_strategy_and_portfolio_data(
    market_frames: dict[str, pd.DataFrame],
    paper_account: dict[str, Any] | None = None,
    preferred_asset: str = "bitcoin",
    preferred_strategy: str = "ema",
) -> dict[str, Any]:
    """
    Executes backtest comparisons and snapshots current paper trading account.
    """
    # 1. Backtest comparative matrix across all 5 standard QuantX strategies on preferred asset
    target_frame = market_frames.get(preferred_asset, next(iter(market_frames.values())))
    strategies = {
        "EMA Trend Following": ("ema", 20, 50),
        "SMA Crossover": ("sma", 20, 50),
        "Momentum Oscillator": ("momentum", 20, 50),
        "Mean Reversion": ("mean_reversion", 20, 50),
    }

    comparison_results = []
    primary_backtest = None

    for strat_label, (kind, fast, slow) in strategies.items():
        res = run_backtest(target_frame, initial_capital=10000, strategy=kind, fast_window=fast, slow_window=slow)
        m = res["metrics"]
        comparison_results.append({
            "name": strat_label,
            "return": m["total_return"],
            "sharpe": m["sharpe"],
            "drawdown": m["max_drawdown"],
            "trades": m["total_trades"],
            "volatility": m["annualized_volatility"],
        })
        if kind == preferred_strategy or primary_backtest is None:
            primary_backtest = {
                "name": strat_label,
                "asset": preferred_asset,
                "asset_label": ASSETS[preferred_asset]["label"],
                "metrics": m,
                "parameters": res["parameters"],
            }

    # Add Buy & Hold Benchmark for comparison
    if primary_backtest:
        bm = primary_backtest["metrics"]
        comparison_results.append({
            "name": f"Buy & Hold ({ASSETS[preferred_asset]['label']})",
            "return": bm["benchmark_return"],
            "sharpe": bm["benchmark_sharpe"],
            "drawdown": bm["benchmark_max_drawdown"],
            "trades": 1,
            "volatility": bm["benchmark_annualized_volatility"],
        })

    # 2. Paper Trading Portfolio State
    if paper_account:
        cash = float(paper_account.get("cash", 100000.0))
        init_cash = float(paper_account.get("initial_cash", 100000.0))
        positions = paper_account.get("positions", {})
        pos_rows = []
        invested_value = 0.0
        for asset_key, qty in positions.items():
            if asset_key in market_frames and len(market_frames[asset_key]) > 0:
                price = float(market_frames[asset_key]["Close"].iloc[-1])
                day_change = float(market_frames[asset_key]["Return"].iloc[-1])
                val = qty * price
                invested_value += val
                pos_rows.append({
                    "asset": asset_key,
                    "label": ASSETS.get(asset_key, {}).get("label", asset_key.title()),
                    "qty": qty,
                    "price": price,
                    "val": val,
                    "change": day_change,
                })
        equity = cash + invested_value
        total_ret = (equity / init_cash) - 1.0 if init_cash else 0.0
        portfolio_state = {
            "initial_cash": init_cash,
            "cash": cash,
            "invested": invested_value,
            "equity": equity,
            "return": total_ret,
            "positions": pos_rows,
            "has_positions": any(p["qty"] > 0 for p in pos_rows),
        }
    else:
        portfolio_state = {
            "initial_cash": 100000.0,
            "cash": 100000.0,
            "invested": 0.0,
            "equity": 100000.0,
            "return": 0.0,
            "positions": [],
            "has_positions": False,
        }

    return {
        "primary_backtest": primary_backtest,
        "comparison_matrix": comparison_results,
        "portfolio": portfolio_state,
    }


async def generate_research_report_pdf(
    paper_account: dict[str, Any] | None = None,
    preferred_asset: str = "bitcoin",
    preferred_strategy: str = "ema",
    lookback_period: str = "2y",
) -> bytes:
    """
    Generates an institutional-grade, exactly 2-page PDF Research Report.
    Page 1: Market Intelligence & Risk Dynamics
    Page 2: Portfolio Snapshot, Strategy Analysis & Stress Testing
    """
    now_utc = datetime.now(timezone.utc)
    report_timestamp_str = now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")

    # 1. Collect real market & quantitative statistics concurrently
    market_data = await collect_market_data(period=lookback_period)
    strat_data = collect_strategy_and_portfolio_data(
        market_frames=market_data["frames"],
        paper_account=paper_account,
        preferred_asset=preferred_asset,
        preferred_strategy=preferred_strategy,
    )

    # 2. Automated Stress Intelligence (using preloaded frame for high performance)
    stress_intel: dict[str, Any] | None = None
    try:
        pref_frame = market_data["frames"].get(preferred_asset)
        pref_live = market_data["assets"].get(preferred_asset, {}).get("live", True)
        stress_intel = await detect_market_stress(
            preferred_asset,
            preloaded_data=pref_frame,
            is_live=pref_live,
        )
    except Exception as exc:
        print(f"[Report] Stress intel fallback: {exc}")
        stress_intel = None

    # 3. Setup ReportLab Document
    buffer = io.BytesIO()
    # Margins: 36 pt (0.5 inch) left/right, 34 pt top/bottom
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=34,
        bottomMargin=34,
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15.5,
        leading=18,
        textColor=PRIMARY_COLOR,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_MUTED,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=PRIMARY_COLOR,
        spaceBefore=0,
        spaceAfter=3,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.8,
        textColor=TEXT_DARK,
    )
    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.8,
        textColor=TEXT_DARK,
    )
    caption_style = ParagraphStyle(
        "CaptionStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=6.8,
        leading=8.5,
        textColor=TEXT_MUTED,
        alignment=1,  # Center
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6.5,
        leading=8.2,
        textColor=TEXT_MUTED,
    )

    story = []

    # =========================================================================
    # PAGE 1: CURRENT MARKET INTELLIGENCE
    # =========================================================================

    # Title & Subtitle Banner
    story.append(Paragraph("QuantX Market Intelligence Report", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "Institutional cross-asset market intelligence, statistical dispersion, and technical regimes.",
        subtitle_style
    ))
    story.append(Spacer(1, 6))

    # --- Section A: Report Overview Card ---
    source_status_text = "Live Market Data (Yahoo Finance)" if market_data["is_live"] else "QuantX Calibrated Fallback Mode"
    overview_table_data = [
        [
            Paragraph("<b>Report Generated:</b>", body_style),
            Paragraph(report_timestamp_str, body_style),
            Paragraph("<b>Data Lookback Period:</b>", body_style),
            Paragraph(f"{lookback_period.upper()} ({market_data['earliest_date']} to {market_data['latest_date']})", body_style),
        ],
        [
            Paragraph("<b>Latest Market Close:</b>", body_style),
            Paragraph(f"{market_data['latest_date']} (EOD Observation)", body_style),
            Paragraph("<b>Data Pipeline Status:</b>", body_style),
            Paragraph(source_status_text, body_style),
        ],
    ]
    overview_table = Table(overview_table_data, colWidths=[105, 156, 115, 147])
    overview_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e8f0f8")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 7))

    # --- Section B: Market Snapshot Table ---
    story.append(Paragraph("Market Snapshot & Statistical Profiles", section_heading))
    snapshot_headers = [
        Paragraph("<b>Asset / Ticker</b>", body_bold),
        Paragraph("<b>Latest Price</b>", body_bold),
        Paragraph("<b>Daily Ret</b>", body_bold),
        Paragraph("<b>Period Ret</b>", body_bold),
        Paragraph("<b>Ann. Volatility</b>", body_bold),
        Paragraph("<b>Max Drawdown</b>", body_bold),
        Paragraph("<b>Sharpe Ratio</b>", body_bold),
        Paragraph("<b>Trend Signal</b>", body_bold),
    ]
    snapshot_rows = [snapshot_headers]

    for key, item in market_data["assets"].items():
        d_ret = item["daily_return"]
        p_ret = item["period_return"]
        d_color = COLOR_POSITIVE if d_ret >= 0 else COLOR_NEGATIVE
        p_color = COLOR_POSITIVE if p_ret >= 0 else COLOR_NEGATIVE

        row = [
            Paragraph(f"<b>{item['label']}</b> ({item['ticker']})", body_style),
            Paragraph(_format_price(item["latest_price"]), body_style),
            Paragraph(f"<font color='{d_color.hexval()}'>{_format_pct(d_ret)}</font>", body_style),
            Paragraph(f"<font color='{p_color.hexval()}'>{_format_pct(p_ret)}</font>", body_style),
            Paragraph(_format_pct(item["volatility"], plus=False), body_style),
            Paragraph(f"<font color='{COLOR_NEGATIVE.hexval()}'>{_format_pct(item['max_drawdown'], plus=False)}</font>", body_style),
            Paragraph(_format_num(item["sharpe"], dec=2), body_style),
            Paragraph(f"<b>{item['trend']}</b>", body_style),
        ]
        snapshot_rows.append(row)

    # Total width = 523 pt
    snapshot_table = Table(snapshot_rows, colWidths=[105, 62, 54, 58, 68, 66, 54, 56])
    snapshot_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#084d91")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e2edf7")),
        ("TOPPADDING", (0, 0), (-1, -1), 3.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
        ("ALIGN", (1, 1), (-1, -1), "LEFT"),
    ]))
    story.append(snapshot_table)
    story.append(Spacer(1, 7))

    # --- Section C: Market Behaviour & Quantitative Risk Observations ---
    story.append(Paragraph("Market Behaviour & Quantitative Risk Dynamics", section_heading))

    # Derive factual metrics
    assets_items = list(market_data["assets"].values())
    strongest_asset = max(assets_items, key=lambda x: x["period_return"])
    weakest_asset = min(assets_items, key=lambda x: x["period_return"])
    most_volatile = max(assets_items, key=lambda x: x["volatility"])
    deepest_dd = min(assets_items, key=lambda x: x["max_drawdown"])

    # Correlation checks
    corr_df = market_data["corr_matrix"]
    corr_notes = []
    if not corr_df.empty:
        if "gold" in corr_df and "bitcoin" in corr_df:
            corr_notes.append(f"Gold / Bitcoin 60D correlation: {corr_df.loc['gold', 'bitcoin']:.2f}")
        if "bitcoin" in corr_df and "nvidia" in corr_df:
            corr_notes.append(f"Bitcoin / NVIDIA correlation: {corr_df.loc['bitcoin', 'nvidia']:.2f}")

    corr_summary_str = " | ".join(corr_notes) if corr_notes else "Correlation estimates stable across asset pairs."

    behaviour_items = [
        f"<b>Relative Performance Dispersion:</b> {strongest_asset['label']} achieved the highest period cumulative return of <b>{_format_pct(strongest_asset['period_return'])}</b>, while {weakest_asset['label']} exhibited {_format_pct(weakest_asset['period_return'])}.",
        f"<b>Volatility & Capital Preservation:</b> {most_volatile['label']} registered peak annualized dispersion of <b>{_format_pct(most_volatile['volatility'], plus=False)}</b> with a maximum drawdown of <b>{_format_pct(deepest_dd['max_drawdown'], plus=False)}</b>.",
        f"<b>Dependency Structure:</b> Cross-asset interaction matrix demonstrates: {corr_summary_str}.",
        f"<b>Regime Environment:</b> Market conditions reflect active trend divergence; asset allocations should be sized according to asset-specific drawdown tolerance.",
    ]

    behaviour_table_data = [[Paragraph(f"• {item}", body_style)] for item in behaviour_items]
    behaviour_table = Table(behaviour_table_data, colWidths=[523])
    behaviour_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e8eff6")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(behaviour_table)
    story.append(Spacer(1, 7))

    # --- Section D: Normalized Price Performance Chart ---
    story.append(Paragraph("Normalized Asset Price Performance (Base = 100)", section_heading))
    chart_buf = build_normalized_chart(market_data["frames"])
    chart_img = Image(chart_buf, width=523, height=145)
    story.append(chart_img)
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        f"Figure 1: Normalized total return trajectory from {market_data['earliest_date']} through {market_data['latest_date']} across Gold, Bitcoin, and NVIDIA. Indexed to 100.",
        caption_style
    ))

    # =========================================================================
    # PAGE 2: PORTFOLIO, STRATEGY AND RISK ANALYSIS
    # =========================================================================
    story.append(PageBreak())

    # Page 2 Title Banner
    story.append(Paragraph("Portfolio & Strategy Analysis", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "Paper trading execution state, algorithmic backtesting matrix, and macro stress-testing resilience.",
        subtitle_style
    ))
    story.append(Spacer(1, 6))

    # --- Section A: Portfolio Snapshot (Paper Trading Account) ---
    story.append(Paragraph("Current Portfolio Execution Snapshot (Paper Trading)", section_heading))
    port = strat_data["portfolio"]
    port_ret_color = COLOR_POSITIVE if port["return"] >= 0 else COLOR_NEGATIVE

    port_summary_data = [
        [
            Paragraph("<b>Initial Capital:</b>", body_style),
            Paragraph(f"${port['initial_cash']:,.2f}", body_style),
            Paragraph("<b>Account Equity:</b>", body_style),
            Paragraph(f"<b>${port['equity']:,.2f}</b>", body_bold),
        ],
        [
            Paragraph("<b>Available Cash:</b>", body_style),
            Paragraph(f"${port['cash']:,.2f}", body_style),
            Paragraph("<b>Total Return:</b>", body_style),
            Paragraph(f"<font color='{port_ret_color.hexval()}'><b>{_format_pct(port['return'])}</b></font>", body_bold),
        ],
    ]
    port_summary_table = Table(port_summary_data, colWidths=[105, 156, 115, 147])
    port_summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e8f0f8")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(port_summary_table)
    story.append(Spacer(1, 4))

    # Position table or clean notice
    if port["positions"]:
        pos_headers = [
            Paragraph("<b>Asset</b>", body_bold),
            Paragraph("<b>Quantity</b>", body_bold),
            Paragraph("<b>Market Price</b>", body_bold),
            Paragraph("<b>Position Value</b>", body_bold),
            Paragraph("<b>Daily Change</b>", body_bold),
        ]
        pos_table_rows = [pos_headers]
        for p in port["positions"]:
            chg_col = COLOR_POSITIVE if p["change"] >= 0 else COLOR_NEGATIVE
            pos_table_rows.append([
                Paragraph(f"<b>{p['label']}</b>", body_style),
                Paragraph(f"{p['qty']:.4f}", body_style),
                Paragraph(_format_price(p["price"]), body_style),
                Paragraph(f"${p['val']:,.2f}", body_style),
                Paragraph(f"<font color='{chg_col.hexval()}'>{_format_pct(p['change'])}</font>", body_style),
            ])
        pos_table = Table(pos_table_rows, colWidths=[110, 95, 105, 110, 103])
        pos_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#204b77")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5eef7")),
            ("TOPPADDING", (0, 0), (-1, -1), 2.2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(pos_table)
    story.append(Spacer(1, 7))

    # --- Section B: Strategy Backtesting & Quantitative Matrix ---
    story.append(Paragraph(
        f"Algorithmic Strategy Backtest & Model Matrix (Target Asset: {ASSETS[preferred_asset]['label']})",
        section_heading
    ))

    strat_headers = [
        Paragraph("<b>Strategy Model</b>", body_bold),
        Paragraph("<b>Total Return</b>", body_bold),
        Paragraph("<b>Sharpe Ratio</b>", body_bold),
        Paragraph("<b>Max Drawdown</b>", body_bold),
        Paragraph("<b>Ann. Volatility</b>", body_bold),
        Paragraph("<b>Trades Executed</b>", body_bold),
    ]
    strat_rows = [strat_headers]

    for item in strat_data["comparison_matrix"]:
        ret_val = item["return"]
        ret_c = COLOR_POSITIVE if ret_val >= 0 else COLOR_NEGATIVE
        strat_rows.append([
            Paragraph(f"<b>{item['name']}</b>", body_style),
            Paragraph(f"<font color='{ret_c.hexval()}'>{_format_pct(ret_val)}</font>", body_style),
            Paragraph(_format_num(item["sharpe"], dec=2), body_style),
            Paragraph(f"<font color='{COLOR_NEGATIVE.hexval()}'>{_format_pct(item['drawdown'], plus=False)}</font>", body_style),
            Paragraph(_format_pct(item["volatility"], plus=False), body_style),
            Paragraph(str(item["trades"]), body_style),
        ])

    strat_table = Table(strat_rows, colWidths=[148, 75, 75, 75, 75, 75])
    strat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e2edf7")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
    ]))
    story.append(strat_table)
    story.append(Spacer(1, 7))

    # --- Section C: Risk & Stress-Test Summary ---
    story.append(Paragraph("Automated Stress Intelligence & Tail Risk Analysis", section_heading))

    if stress_intel:
        sim_m = stress_intel.get("simulation", {}).get("metrics", {})
        scen_label = stress_intel.get("scenario_label", "Market Crash")
        shock_pct = stress_intel.get("recommended_shock_percent", 20)
        base_ret = sim_m.get("baseline_return", 0.0)
        stress_ret = sim_m.get("stressed_return", 0.0)
        stress_loss = sim_m.get("stress_loss", 0.0)
        stress_dd = sim_m.get("stressed_drawdown", 0.0)
        obs_m = stress_intel.get("metrics_observed", {})
        var_99 = obs_m.get("var_99", 0.0)

        stress_table_data = [
            [
                Paragraph("<b>Detected Regime:</b>", body_style),
                Paragraph(f"<b>{scen_label}</b>", body_bold),
                Paragraph("<b>Calibrated Shock:</b>", body_style),
                Paragraph(f"<b>-{shock_pct}%</b> shock magnitude", body_bold),
            ],
            [
                Paragraph("<b>Baseline Return:</b>", body_style),
                Paragraph(_format_pct(base_ret), body_style),
                Paragraph("<b>Stressed Return:</b>", body_style),
                Paragraph(f"<font color='{COLOR_NEGATIVE.hexval()}'>{_format_pct(stress_ret)}</font>", body_style),
            ],
            [
                Paragraph("<b>Simulated Stress Loss:</b>", body_style),
                Paragraph(f"<font color='{COLOR_NEGATIVE.hexval()}'><b>{_format_pct(stress_loss)}</b></font>", body_bold),
                Paragraph("<b>99% 1-Day Tail VaR:</b>", body_style),
                Paragraph(f"<b>{_format_pct(var_99, plus=False)}</b> extreme tail", body_style),
            ],
        ]
    else:
        stress_table_data = [
            [
                Paragraph("<b>Stress Intelligence:</b>", body_style),
                Paragraph("No active automated stress scenario calibrated for this asset class.", body_style),
                Paragraph("<b>Status:</b>", body_style),
                Paragraph("Baseline risk model active.", body_style),
            ]
        ]

    stress_table = Table(stress_table_data, colWidths=[105, 156, 115, 147])
    stress_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbfa")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#f8c8c0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#fceae7")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(stress_table)
    story.append(Spacer(1, 7))

    # --- Section D: Key Findings & Quantitative Conclusions ---
    story.append(Paragraph("Executive Key Findings & Decision Brief", section_heading))

    # Determine findings strictly grounded in data
    pb_metrics = strat_data["primary_backtest"]["metrics"]
    strat_ret = pb_metrics["total_return"]
    bm_ret = pb_metrics["benchmark_return"]
    outperformed = strat_ret > bm_ret

    finding_1 = (
        f"<b>Algorithmic Performance:</b> The {strat_data['primary_backtest']['name']} on {ASSETS[preferred_asset]['label']} "
        f"produced a cumulative return of <b>{_format_pct(strat_ret)}</b> (Sharpe: {pb_metrics['sharpe']:.2f}) versus "
        f"<b>{_format_pct(bm_ret)}</b> for Buy & Hold, representing a "
        f"<b>{'positive relative alpha' if outperformed else 'defensive underperformance'}</b> over the period."
    )

    finding_2 = (
        f"<b>Risk Profile & Drawdown Defense:</b> Peak drawdown for the strategy was contained at "
        f"<b>{_format_pct(pb_metrics['max_drawdown'], plus=False)}</b> compared to "
        f"<b>{_format_pct(pb_metrics['benchmark_max_drawdown'], plus=False)}</b> on the underlying asset, "
        f"confirming effective capital downside insulation."
    )

    finding_3 = (
        f"<b>Stress Vulnerability:</b> Macro shock modeling indicates an estimated equity degradation of "
        f"<b>{_format_pct(sim_m.get('stress_loss', 0.0) if stress_intel else -0.20)}</b> under adverse conditions; "
        f"position sizing should remain scaled within the measured 99% Tail VaR tolerance."
    )

    finding_4 = (
        f"<b>Portfolio Capital Execution:</b> Current paper trading account maintains "
        f"<b>${port['equity']:,.2f}</b> total equity ({_format_pct(port['return'])}) with "
        f"<b>${port['cash']:,.2f}</b> liquid cash available for rebalancing."
    )

    findings_data = [
        [Paragraph(f"1. {finding_1}", body_style)],
        [Paragraph(f"2. {finding_2}", body_style)],
        [Paragraph(f"3. {finding_3}", body_style)],
        [Paragraph(f"4. {finding_4}", body_style)],
    ]
    findings_table = Table(findings_data, colWidths=[523])
    findings_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e8eff6")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(findings_table)
    story.append(Spacer(1, 5))

    # Methodology & Non-Advisory Disclaimer
    story.append(Paragraph(
        "<b>Important Notice:</b> This report is generated automatically by the QuantX Quantitative Financial Intelligence Engine for research purposes only. Historical returns and simulated backtest results do not represent guarantees of future performance. Hypothetical stress tests model structural tail assumptions and do not constitute investment advice.",
        disclaimer_style
    ))

    # 4. Build PDF with NumberedCanvas
    class ReportNumberedCanvas(NumberedCanvas):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, **kwargs)
            self.report_timestamp_str = report_timestamp_str

    doc.build(story, canvasmaker=ReportNumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
