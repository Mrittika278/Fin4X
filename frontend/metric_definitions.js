// QuantX Central Financial Metric Definitions Registry
// Provides direct, plain-English definitions explaining what values in each card represent,
// directional interpretation, units, and methodology caveats across the platform.

const METRIC_DEFINITIONS = {
    // Market Overview Multi-Asset Cards
    gold_price: {
        title: 'Gold',
        definition: 'This card shows a value which represents the current gold price today at real time (USD / oz).',
        interpretation: 'The primary value shows the real-time market price for one troy ounce of gold. Below it, the card displays today\'s 24-hour return percentage and the asset\'s annualized Sharpe ratio.',
        caveats: 'Derived from live market synchronization with automated quantitative fallback during market closures.'
    },
    bitcoin_price: {
        title: 'Bitcoin',
        definition: 'This card shows a value which represents the current bitcoin price today at real time (USD).',
        interpretation: 'The primary value shows the continuous real-time market price for one Bitcoin. Below it, the card displays today\'s 24-hour return percentage and annualized Sharpe ratio.',
        caveats: 'Crypto markets operate continuously 24/7 across global exchanges.'
    },
    nvidia_price: {
        title: 'NVIDIA',
        definition: 'This card shows a value which represents the current NVIDIA share price today at real time (USD).',
        interpretation: 'The primary value shows the latest market execution price per share of NVIDIA. Below it, the card displays today\'s daily return percentage and annualized Sharpe ratio.',
        caveats: 'Reflects active NASDAQ trading hours and official settlement marks.'
    },

    // Asset Explorer & Market Overview General Metrics
    price: {
        title: 'Current Market Price',
        definition: 'This card shows a value which represents the current market price today at real time for the selected asset.',
        interpretation: 'Higher price reflects greater per-unit valuation. Must be analyzed in context of market capitalization, supply, and historical range.',
        caveats: 'Reflects live sync or end-of-day market feeds. Does not indicate whether the asset is fundamentally undervalued or overvalued.'
    },
    daily_change: {
        title: 'Daily Return / 24h Change',
        definition: 'This card shows a value which represents the daily price return percentage over the latest 24-hour trading session.',
        interpretation: 'Positive values represent capital appreciation over the last trading session; negative values represent short-term decline.',
        caveats: 'Daily volatility is noisy. Single-day spikes or drops do not establish long-term trends.'
    },
    cumulative_return: {
        title: 'Cumulative Total Return',
        definition: 'This card shows a value which represents the total cumulative percentage return of the asset across the selected timeframe.',
        interpretation: 'A value of +50% indicates that the investment grew by half its initial capital over the entire observation window.',
        caveats: 'Does not account for volatility or the path taken. A high cumulative return could mask severe interim drawdowns.'
    },
    rolling_return_21d: {
        title: '21-Day Rolling Return',
        definition: 'This card shows a value which represents the return generated over the preceding 21 trading sessions (approximately one month).',
        interpretation: 'Positive values indicate short-to-medium term momentum; negative values signal recent trend deterioration.',
        caveats: 'Sensitive to single large outliers within the 21-day rolling window.'
    },
    annual_volatility: {
        title: 'Annualized Volatility (σ)',
        definition: 'This card shows a value which represents the annualized volatility percentage, measuring how intensely the price swings.',
        interpretation: 'Higher volatility indicates greater dispersion and price swings; lower values reflect steadier, lower-variance price progression.',
        caveats: 'Assumes independent, identically distributed daily returns (IID). Extreme tail jumps may cause underestimation.'
    },
    sharpe: {
        title: 'Sharpe Ratio',
        definition: 'This card shows a value which represents the Sharpe ratio, measuring excess risk-adjusted return earned per unit of volatility.',
        interpretation: 'Values > 1.0 are generally considered satisfactory; > 2.0 very good; > 3.0 exceptional. Compares excess return to standard deviation.',
        caveats: 'Penalizes both upside and downside volatility equally. Historical Sharpe does not guarantee future risk-adjusted return.'
    },
    max_drawdown: {
        title: 'Maximum Drawdown (MDD)',
        definition: 'This card shows a value which represents the largest historical peak-to-trough percentage loss experienced by the asset.',
        interpretation: 'A drawdown of -25% means capital fell 25% from its highest historical highwater mark. Lower magnitude indicates superior capital protection.',
        caveats: 'Path-dependent and backward-looking. Future market stresses can easily breach historical maximum drawdown limits.'
    },
    sharpe_drawdown: {
        title: 'Sharpe Ratio & Maximum Drawdown',
        definition: 'This card shows two values: the annualized Sharpe ratio (risk-adjusted return) followed by the maximum historical drawdown loss.',
        interpretation: 'An optimal profile pairs a high Sharpe ratio (>1.5) with a shallow maximum drawdown (e.g., <-20%).',
        caveats: 'Calculated over the chosen lookback period; shorter windows may omit major historical crash events.'
    },

    // Strategy Lab & Backtester
    strategy_return: {
        title: 'Strategy Cumulative Return',
        definition: 'This card shows a value which represents the total percentage return achieved by the algorithmic trading strategy over the simulation period.',
        interpretation: 'Positive returns indicate net capital gain from algorithmic execution. Should always be compared against benchmark return.',
        caveats: 'Past backtest performance is subject to curve-fitting and execution slippage.'
    },
    benchmark_return: {
        title: 'Benchmark Return (Buy & Hold)',
        definition: 'This card shows a value which represents the cumulative return of a passive buy-and-hold strategy over the identical timeframe.',
        interpretation: 'Serves as the hurdle rate. An active quantitative model should generate positive alpha relative to this passive baseline.',
        caveats: 'Buy & hold absorbs full downside drawdowns without defensive risk management.'
    },
    strategy_sharpe: {
        title: 'Strategy Sharpe Ratio',
        definition: 'This card shows a value which represents the annualized Sharpe ratio generated specifically by the strategy\'s active equity curve.',
        interpretation: 'A strategy Sharpe higher than the benchmark demonstrates superior return generation per unit of volatility taken.',
        caveats: 'Assumes zero risk-free rate in baseline simulations. Can be distorted by infrequent trading regimes.'
    },
    benchmark_sharpe: {
        title: 'Benchmark Sharpe Ratio',
        definition: 'This card shows a value which represents the risk-adjusted return of holding the underlying asset passively.',
        interpretation: 'Represents the passive market reward-to-risk ratio against which algorithmic risk management is evaluated.',
        caveats: 'Sensitive to the chosen backtest start and end dates.'
    },
    strategy_volatility: {
        title: 'Strategy Annualized Volatility',
        definition: 'This card shows a value which represents the annualized volatility percentage of the strategy\'s simulated equity curve.',
        interpretation: 'Lower strategy volatility indicates that trade timing or cash allocations have reduced portfolio turbulence relative to the asset.',
        caveats: 'Does not distinguish between upside spikes and downside dips.'
    },
    benchmark_volatility: {
        title: 'Benchmark Annualized Volatility',
        definition: 'This card shows a value which represents the annualized volatility percentage of the unhedged underlying asset.',
        interpretation: 'Reflects unhedged market price swings that passive investors had to endure.',
        caveats: 'Annualized assuming 252 trading sessions per calendar year.'
    },
    strategy_drawdown: {
        title: 'Strategy Maximum Drawdown',
        definition: 'This card shows a value which represents the worst peak-to-trough percentage capital loss suffered by the algorithmic strategy.',
        interpretation: 'A reduced drawdown compared to the benchmark confirms defensive risk dampening during bear markets.',
        caveats: 'Execution delay and bid-ask spread expansion in stressed markets can worsen live drawdown.'
    },
    benchmark_drawdown: {
        title: 'Benchmark Maximum Drawdown',
        definition: 'This card shows a value which represents the deepest historical peak-to-trough percentage loss of the unhedged underlying asset.',
        interpretation: 'Demonstrates the raw downside exposure suffered by passive market participants.',
        caveats: 'Deep drawdowns require disproportionately larger percentage gains to recover (e.g. -50% requires +100%).'
    },
    win_rate: {
        title: 'Trade Win Rate',
        definition: 'This card shows a value which represents the percentage of completed algorithmic trades that closed with a net profit.',
        interpretation: 'A 55% win rate means 55 out of 100 closed positions were profitable after deducting friction fees.',
        caveats: 'Win rate alone is incomplete without payoff ratio: a high win rate with catastrophic loss sizes will fail.'
    },
    final_value: {
        title: 'Final Portfolio Equity',
        definition: 'This card shows a value which represents the ending portfolio capital value starting from the initial deposit.',
        interpretation: 'Reflects absolute rupee/dollar appreciation on the initial capital base.',
        caveats: 'Does not reflect future inflation, tax obligations, or exchange currency shifts.'
    },

    // Automated Stress Lab & Stress Simulation
    current_drawdown: {
        title: 'Current Observed Drawdown',
        definition: 'This card shows a value which represents the current percentage decline from the asset\'s highest historical peak to its latest price.',
        interpretation: 'Values near 0% show asset trading near highs; large negative values indicate ongoing drawdown pressure.',
        caveats: 'Calculated from historical session closes. Intraday flash crashes may be deeper.'
    },
    volatility_21d: {
        title: '21-Day Realized Volatility',
        definition: 'This card shows a value which represents the asset\'s annualized volatility over the latest 21 trading sessions.',
        interpretation: 'Spikes in 21D volatility trigger defensive regimes or alert automated stress detection engines.',
        caveats: 'Can revert quickly to long-term mean following brief volatility clusters.'
    },
    momentum_21d: {
        title: '21-Day Price Momentum',
        definition: 'This card shows a value which represents the percentage price change over the past 21 trading sessions.',
        interpretation: 'Strong positive values show upward persistence; negative values highlight downward acceleration.',
        caveats: 'Momentum is prone to sharp reversals at extreme overbought or oversold inflection points.'
    },
    var_99_tail: {
        title: '99% Tail VaR (1-Day)',
        definition: 'This card shows a value which represents the estimated maximum 1-day percentage loss expected at 99% statistical confidence.',
        interpretation: 'A -5.2% 99% VaR indicates that on 99 out of 100 days, daily losses are expected to be milder than 5.2%.',
        caveats: 'Non-parametric historical simulation. Black swan events can exceed historical 99% cutoffs.'
    },
    baseline_return: {
        title: 'Baseline Return',
        definition: 'This card shows a value which represents the unadjusted cumulative return generated by the asset prior to applying stress shocks.',
        interpretation: 'Serves as the reference comparison curve to measure how hypothetical shocks degrade performance.',
        caveats: 'Reflects historical unshocked market history.'
    },
    stressed_return: {
        title: 'Stressed Cumulative Return',
        definition: 'This card shows a value which represents the projected cumulative return after subjecting the asset to the scenario shock.',
        interpretation: 'Reveals whether the strategy remains solvent and profitable when confronted with extreme shocks.',
        caveats: 'Hypothetical simulation based on synthetic perturbation, not a market guarantee.'
    },
    stress_loss: {
        title: 'Simulated Stress Loss',
        definition: 'This card shows a value which represents the net reduction in final portfolio valuation directly attributable to the applied shock.',
        interpretation: 'Directly quantifies portfolio capital vulnerability under severe systemic shocks.',
        caveats: 'Assumes immediate liquidity and normal market mechanics during crisis periods.'
    },
    stressed_max_drawdown: {
        title: 'Stressed Maximum Drawdown',
        definition: 'This card shows a value which represents the anticipated peak-to-trough capital loss under combined market distress and scenario shocks.',
        interpretation: 'Tests whether capital drawdown breaches risk-tolerance boundaries or margin liquidation triggers.',
        caveats: 'Does not account for broker emergency liquidation halts or counterparty defaults.'
    },

    // Advanced Lab (Monte Carlo, Risk & Optimization)
    expected_final_price: {
        title: 'Expected Final Price (Mean Path)',
        definition: 'This card shows a value which represents the average terminal price projected across all Monte Carlo stochastic simulation paths.',
        interpretation: 'Provides the central tendency of future probabilistic price distribution.',
        caveats: 'Financial return distributions exhibit fat tails and skewness; mean path is not the most probable single path.'
    },
    confidence_range_10_90: {
        title: '10th–90th Percentile Confidence Range',
        definition: 'This card shows the price range between the 10th percentile worst-case path and the 90th percentile best-case path in Monte Carlo simulations.',
        interpretation: 'Contains 80% of simulated stochastic outcomes. Wider bands indicate wider predictive uncertainty.',
        caveats: 'Generated from historical return variance; cannot predict unprecedented structural regime shifts.'
    },
    var_95: {
        title: '1-Day Value at Risk (95% Confidence)',
        definition: 'This card shows a value which represents the maximum expected 1-day percentage portfolio loss at a 95% statistical confidence level.',
        interpretation: 'On 19 out of 20 trading sessions (95%), daily losses should not exceed this percentage threshold.',
        caveats: 'Says nothing about the magnitude of losses in the 5% tail beyond the cutoff threshold.'
    },
    var_99: {
        title: '1-Day Value at Risk (99% Confidence)',
        definition: 'This card shows a value which represents the maximum expected 1-day percentage portfolio loss at a 99% statistical confidence interval.',
        interpretation: 'Losses are projected to exceed this cutoff on only 1 out of every 100 trading days.',
        caveats: 'Tail risk distribution can be non-normal; real market crashes frequently exceed Gaussian VaR models.'
    },
    cvar_95: {
        title: 'Conditional Value at Risk / CVaR (95%)',
        definition: 'This card shows a value which represents the expected average loss given that a day\'s loss breaches the 95% VaR threshold.',
        interpretation: 'Also known as Expected Shortfall (ES). Directly measures the severity of extreme tail losses when catastrophic market events occur.',
        caveats: 'A coherent risk measure that penalizes fat tails. Crucial for institutional risk assessment.'
    },

    // Market Regimes Discrete Cards
    regime_bull_low_vol: {
        title: 'Bull / Low Volatility',
        definition: 'This card shows values representing the total days spent in a Bull / Low Volatility regime alongside its cumulative return and average volatility.',
        interpretation: 'Represents persistent upward trending market action with low volatility; historically the most consistent regime for capital appreciation.',
        caveats: 'Classified using 50/200 EMA trend confirmation and rolling volatility medians.'
    },
    regime_bull_high_vol: {
        title: 'Bull / High Volatility',
        definition: 'This card shows values representing the total days spent in a Bull / High Volatility regime alongside its cumulative return and average volatility.',
        interpretation: 'Represents fast-moving, aggressive upward rallies accompanied by large price swings and heightened turbulence.',
        caveats: 'Higher volatility increases risk of sharp intraday corrections despite broader trend.'
    },
    regime_bear_low_vol: {
        title: 'Bear / Low Volatility',
        definition: 'This card shows values representing the total days spent in a Bear / Low Volatility regime alongside its cumulative return and average volatility.',
        interpretation: 'Represents a persistent, quiet downward price drift under subdued market volatility.',
        caveats: 'Prolonged grinding downtrends quietly erode unhedged capital.'
    },
    regime_bear_high_vol: {
        title: 'Bear / High Volatility',
        definition: 'This card shows values representing the total days spent in a Bear / High Volatility regime alongside its cumulative return and average volatility.',
        interpretation: 'Represents acute market crisis, panic selling, and sharp drawdown shocks with volatility spikes.',
        caveats: 'High volatility market shocks can trigger sudden liquidation cascades.'
    },

    // Adaptive & Regime Labs
    adaptive_score: {
        title: 'Adaptive Allocation Score',
        definition: 'This card shows a value which represents the composite quantitative score (0–100) assessing current multi-asset opportunity and regime health.',
        interpretation: 'Scores > 70 suggest high risk-adjusted opportunity favoring growth/crypto; lower scores favor defensive assets like Gold.',
        caveats: 'Synthesized from quantitative indicators and subject to changing market regimes.'
    },
    suggested_allocation: {
        title: 'Suggested Portfolio Allocation',
        definition: 'This card shows values representing target portfolio percentage weights across Bitcoin, Gold, and NVIDIA for the active regime.',
        interpretation: 'Shifts between aggressive risk-on exposures and defensive hedging to optimize risk-adjusted returns.',
        caveats: 'Rebalancing incurs trading friction, slippage, and tax liabilities in live execution.'
    },
    regime_adjustment: {
        title: 'Macro Regime Tactical Adjustment',
        definition: 'This card shows the active tactical positioning bias dictated by current macro and trend decomposition.',
        interpretation: 'E.g., "Bullish tilt" preserves trend-following leverage; "Defensive hedge" reduces high-beta exposure.',
        caveats: 'Regime transitions can be sudden; lag in statistical indicators may cause delayed rebalancing.'
    },

    // Market Regimes & ML
    current_state: {
        title: 'Market Regime State',
        definition: 'This card shows the active market state classified by trend direction, rolling volatility, and unsupervised clustering.',
        interpretation: 'Bull / Bear / High Volatility / Low Volatility states determine expected return distributions.',
        caveats: 'Regimes are inferred from past price series; market conditions can shift before classification algorithms trigger.'
    },
    return_5d: {
        title: '5-Day Rolling Return',
        definition: 'This card shows a value which represents the short-term rate of return over the preceding five trading days (one standard trading week).',
        interpretation: 'Measures high-frequency momentum and immediate market reaction to macro catalysts.',
        caveats: 'High noise-to-signal ratio on weekly frequencies.'
    },

    // Paper Trading
    account_equity: {
        title: 'Simulated Account Equity',
        definition: 'This card shows a value which represents the total live mark-to-market value of all cash reserves plus open paper trading positions.',
        interpretation: 'Represents overall net worth in the paper trading simulation account.',
        caveats: 'Simulated fills assume infinite liquidity without market impact or order book slippage.'
    },
    available_cash: {
        title: 'Available Buying Power',
        definition: 'This card shows a value which represents unallocated liquid cash balance available to execute new buy orders in the simulation.',
        interpretation: 'Higher cash buffers enable deploying capital into dips or high-conviction signals.',
        caveats: 'Cash earns zero interest in this simulation.'
    },
    total_return: {
        title: 'Paper Account Return',
        definition: 'This card shows a value which represents the cumulative percentage return of simulated account equity relative to initial capital.',
        interpretation: 'Measures the trader\'s manual mark-to-market performance.',
        caveats: 'Simulated emotions and liquidity differ materially from real-money trading under live market risk.'
    }
};

// Key resolver to map arbitrary display labels to canonical metric keys
function resolveMetricKey(label) {
    if (!label) return null;
    const l = String(label).toLowerCase().trim();

    // Asset Cards (Overview & Specific)
    if (l === 'gold') return 'gold_price';
    if (l === 'bitcoin' || l === 'btc') return 'bitcoin_price';
    if (l === 'nvidia' || l === 'nvda') return 'nvidia_price';

    // Market Overview / Explorer Metrics
    if (l === 'price' || l.includes('current price') || l === 'latest price') return 'price';
    if (l.includes('daily return') || l.includes('daily change') || l.includes('24h change')) return 'daily_change';
    if (l.includes('cumulative return') || l.includes('total return')) {
        if (l.includes('strategy')) return 'strategy_return';
        if (l.includes('benchmark')) return 'benchmark_return';
        return 'cumulative_return';
    }
    if (l.includes('21d rolling return') || l.includes('rolling return')) return 'rolling_return_21d';
    if (l.includes('sharpe / drawdown')) return 'sharpe_drawdown';
    if (l.includes('strategy sharpe')) return 'strategy_sharpe';
    if (l.includes('benchmark sharpe')) return 'benchmark_sharpe';
    if (l === 'sharpe' || l.includes('sharpe ratio')) return 'sharpe';
    if (l.includes('strategy volatility')) return 'strategy_volatility';
    if (l.includes('benchmark volatility')) return 'benchmark_volatility';
    if (l.includes('strategy drawdown')) return 'strategy_drawdown';
    if (l.includes('benchmark drawdown')) return 'benchmark_drawdown';
    if (l.includes('max drawdown') || l.includes('maximum drawdown')) return 'max_drawdown';
    if (l.includes('annualized volatility') || l.includes('annual volatility') || l === 'volatility') return 'annual_volatility';
    if (l.includes('win rate')) return 'win_rate';
    if (l.includes('final value')) return 'final_value';

    // Stress lab
    if (l.includes('current drawdown')) return 'current_drawdown';
    if (l.includes('21d volatility')) return 'volatility_21d';
    if (l.includes('21d momentum')) return 'momentum_21d';
    if (l.includes('99% tail var') || l.includes('tail var')) return 'var_99_tail';
    if (l.includes('baseline return')) return 'baseline_return';
    if (l.includes('stressed return')) return 'stressed_return';
    if (l.includes('stress loss')) return 'stress_loss';
    if (l.includes('stressed max drawdown') || l.includes('stressed drawdown')) return 'stressed_max_drawdown';

    // Advanced Lab
    if (l.includes('expected final price')) return 'expected_final_price';
    if (l.includes('10th–90th range') || l.includes('10-90% range')) return 'confidence_range_10_90';
    if (l.includes('1-day var (95%') || l.includes('var (95%)') || l.includes('var 95')) return 'var_95';
    if (l.includes('1-day var (99%') || l.includes('var (99%)') || l.includes('var 99')) return 'var_99';
    if (l.includes('expected shortfall') || l.includes('cvar')) return 'cvar_95';

    // Discrete Market Regimes
    if (l.includes('bull / low vol')) return 'regime_bull_low_vol';
    if (l.includes('bull / high vol')) return 'regime_bull_high_vol';
    if (l.includes('bear / low vol')) return 'regime_bear_low_vol';
    if (l.includes('bear / high vol')) return 'regime_bear_high_vol';

    // Adaptive & Regimes
    if (l.includes('adaptive score')) return 'adaptive_score';
    if (l.includes('suggested allocation')) return 'suggested_allocation';
    if (l.includes('regime adjustment')) return 'regime_adjustment';
    if (l.includes('current state')) return 'current_state';
    if (l.includes('5-day return')) return 'return_5d';

    // Paper Trading
    if (l.includes('account equity')) return 'account_equity';
    if (l.includes('available cash')) return 'available_cash';

    return null;
}

// Function to render accessible tooltip markup for a metric card
function renderMetricTooltip(keyOrLabel, customTitle) {
    const key = resolveMetricKey(keyOrLabel) || keyOrLabel;
    const def = METRIC_DEFINITIONS[key];

    if (!def) {
        // Fallback for general metrics
        return `
            <div class="metric-info-wrap">
                <button type="button" class="metric-info-btn" aria-label="Explanation for ${customTitle || keyOrLabel}" tabindex="0">
                    <span class="info-icon" aria-hidden="true">i</span>
                </button>
                <div class="metric-tooltip-popover" role="tooltip">
                    <div class="tooltip-title">${customTitle || keyOrLabel}</div>
                    <div class="tooltip-def">This card shows a value which represents the live real-time financial metric for ${customTitle || keyOrLabel}.</div>
                    <div class="tooltip-interp"><strong>What this card shows:</strong> Live quantitative data computed directly from market price feeds and historical models.</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="metric-info-wrap">
            <button type="button" class="metric-info-btn" aria-label="Explanation for ${def.title}" tabindex="0">
                <span class="info-icon" aria-hidden="true">i</span>
            </button>
            <div class="metric-tooltip-popover" role="tooltip">
                <div class="tooltip-title">${def.title}</div>
                <div class="tooltip-def">${def.definition}</div>
                <div class="tooltip-interp"><strong>What this card shows:</strong> ${def.interpretation}</div>
                ${def.caveats ? `<div class="tooltip-caveat"><strong>Note:</strong> ${def.caveats}</div>` : ''}
            </div>
        </div>
    `;
}

// Global click/tap listener to support touch devices and outside-click dismiss
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        const infoBtn = e.target.closest('.metric-info-btn');
        if (infoBtn) {
            const wrap = infoBtn.closest('.metric-info-wrap');
            if (wrap) {
                const isCurrentlyActive = wrap.classList.contains('active');
                // Close all other active tooltips
                document.querySelectorAll('.metric-info-wrap.active').forEach(w => {
                    if (w !== wrap) w.classList.remove('active');
                });
                wrap.classList.toggle('active', !isCurrentlyActive);
            }
            return;
        }

        // If clicked outside any metric tooltip popover, close open ones
        if (!e.target.closest('.metric-tooltip-popover')) {
            document.querySelectorAll('.metric-info-wrap.active').forEach(w => w.classList.remove('active'));
        }
    });

    // Close on Escape key for keyboard accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.metric-info-wrap.active').forEach(w => w.classList.remove('active'));
        }
    });
}
