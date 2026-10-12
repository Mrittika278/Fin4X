// QuantX Central Figure Caption & Visual Interpretation Guide Registry
// Generates standardized, expandable, accessible figure captions with dynamic parameter synchronization.

const FIGURE_GUIDES = {
    performance: {
        title: 'Multi-Asset Normalized Performance',
        what: 'Displays the relative growth trajectory of selected financial assets normalized to a common baseline of 100 at the start of the observation period.',
        how: 'The vertical Y-axis tracks percentage-normalized valuation growth; the horizontal X-axis marks calendar dates. Each line represents an asset (Gold in lavender, Bitcoin in orange, NVIDIA in turquoise).',
        interpretation: 'Lines rising higher demonstrate superior cumulative return over the selected period. Steep slopes indicate sharp momentum, while deep dips reflect drawdown periods.',
        parameters: (params) => `Observation Period: ${params.period || '2 years'}. Recalculating across different time horizons changes the starting base date and highlights short-term vs multi-year regime performance.`,
        limitations: 'Normalization conceals absolute dollar unit costs and assumes immediate simultaneous portfolio inception across all three assets without rebalancing.'
    },

    asset: {
        title: 'Price Action & Moving Average Trend Structure',
        what: 'Visualizes historical closing price bars along with key quantitative trend indicators: 50-day Simple Moving Average (SMA50), 50-day Exponential Moving Average (EMA50), and 200-day Exponential Moving Average (EMA200).',
        how: 'Blue line represents historical daily closing prices in INR. Amber line shows SMA50; purple line shows EMA50 (faster trend); teal line displays EMA200 (macro 200-day trend filter).',
        interpretation: 'Price holding above EMA200 indicates structural long-term bull market support. EMA50 crossing above SMA50/EMA200 signals golden cross momentum; trading below indicates bearish trend exhaustion.',
        parameters: (params) => `Asset: ${params.asset || 'Selected Asset'}, Lookback: ${params.period || '2 years'}. Adjusting asset universe switches historical price series; changing period adjusts the sample window for indicator calculations.`,
        limitations: 'Moving averages are lagging indicators derived from past prices. They do not forecast upcoming news, earnings shocks, or sudden liquidity events.'
    },

    correlationMatrix: {
        title: 'Cross-Asset Return Correlation Matrix',
        what: 'Displays pairwise Pearson correlation coefficients calculated from daily log returns across Gold, Bitcoin, and NVIDIA over the historical observation window.',
        how: 'Each matrix cell denotes correlation between the row and column asset. Values range strictly from -1.0 (perfect inverse relationship) to +1.0 (identical co-movement). Color intensity: dark blue indicates strong negative, light cream near zero, red indicates strong positive correlation.',
        interpretation: 'Low or negative correlation between assets indicates viable diversification potential, reducing total portfolio variance when held together.',
        parameters: (params) => `Calculated over the platform's multi-year historical dataset. Recalculating over stressed sub-periods often reveals correlation spikes during market panics.`,
        limitations: 'Correlation measures only linear dependency and does not prove causality. Historical low correlation does not guarantee that diversification will hold during severe liquidity shocks.'
    },

    rollingCorrelation: {
        title: '60-Trading-Day Rolling Correlation Dynamics',
        what: 'Tracks the time-varying, dynamic evolution of asset return correlation calculated over continuous rolling 60-day observation windows.',
        how: 'Horizontal X-axis tracks calendar timeline; vertical Y-axis spans from -1.0 to +1.0. Plotted lines display shifting correlation pairs (Gold vs Bitcoin, Bitcoin vs NVIDIA, Gold vs NVIDIA).',
        interpretation: 'Sharp upward surges toward +1.0 indicate periods of macroeconomic synchronicity (e.g. rate hike shocks or liquidity crunches); dips toward 0 or negative values highlight periods of asset independence.',
        parameters: () => 'Window size: 60 trading days (approx. 3 months). Shorter windows increase sensitivity to transient noise; longer windows smooth regime shifts.',
        limitations: 'Rolling correlations suffer from window-endpoint drop-off effects where a single historical shock leaves the calculation abruptly after 60 sessions.'
    },

    strategy: {
        title: 'Algorithmic Strategy Equity Curve vs Buy & Hold Benchmark',
        what: 'Visualizes the simulated capital growth of an algorithmic execution model compared against a passive Buy & Hold benchmark starting from initial investment capital.',
        how: 'Lavender line tracks active strategy portfolio valuation; orange line tracks the passive benchmark. Green dots denote algorithmic BUY order executions; red dots mark SELL signals.',
        interpretation: 'A strategy curve outperforming the benchmark while exhibiting shallower pullbacks proves positive risk-adjusted alpha generation. Periods where the curve is flat indicate the strategy held defensive cash.',
        parameters: (params) => `Strategy: ${params.strategy || 'EMA Trend'} on ${params.asset || 'Bitcoin'}. Fast Window: ${params.fast || 20}d, Slow Window: ${params.slow || 100}d, Capital: ₹${params.capital || '140,000'}, Friction: ${params.cost || '0.10%'}. Modifying windows changes trade frequency and whipsaw vulnerability.`,
        limitations: 'Backtests assume instant execution at session close with zero market impact. Past backtest profitability does not guarantee future live returns.'
    },

    strategyRisk: {
        title: 'Strategy Risk Decomposition (Return, Volatility & Drawdown)',
        what: 'Tri-factor risk diagnostic tracking daily strategy return volatility, rolling 21-day annualized volatility, and active underwater drawdown progression.',
        how: 'Green line plots daily % returns; yellow line tracks 21-day rolling volatility; red line illustrates the underwater drawdown curve from the historical high-water mark.',
        interpretation: 'Spikes in yellow volatility often precede red drawdown expansions. Resilient strategies recover quickly from drawdown troughs with controlled volatility clustering.',
        parameters: (params) => `Synchronized with active backtest parameters for ${params.asset || 'target asset'}.`,
        limitations: 'Underwater drawdown curves depend on past highwater marks and do not predict maximum possible future downside loss.'
    },

    regimeTimeline: {
        title: 'Historical Macro Regime State Transition Timeline',
        what: 'Chronological timeline mapping dates to their classified macro market climate based on trend persistence and realized return volatility.',
        how: 'Horizontal axis marks historical dates; colored square glyphs classify the dominant market regime (Bull Market, Bear Market, High Volatility Shock, Low Volatility Grind).',
        interpretation: 'Clustering of colored markers reveals persistent structural regimes, while rapid alternation between colors flags transitional or uncertain market environments.',
        parameters: (params) => `Target Asset: ${params.asset || 'Selected Asset'}. Classification rules evaluate 50-day price trend vs rolling 21-day volatility against historical statistical deciles.`,
        limitations: 'State transitions are classified post-close; live intraday shifts may experience brief detection lag.'
    },

    regimeChart: {
        title: 'Return Distribution Profile by Market Climate',
        what: 'Compares total or annualized return generation across each discrete market climate (Bull, Bear, High Volatility, Low Volatility).',
        how: 'Discrete colored vertical bars represent cumulative return achieved during all days spent inside that specific regime classification.',
        interpretation: 'Identifies which market climates generate the bulk of asset appreciation vs those responsible for capital destruction.',
        parameters: (params) => `Asset: ${params.asset || 'Selected Asset'}. Derived from full multi-year price history.`,
        limitations: 'The duration spent in each regime varies significantly; higher return in bull regimes reflects both higher daily returns and longer total residence time.'
    },

    stress: {
        title: 'Automated Stress Impact Projection (Baseline vs Stressed Path)',
        what: 'Projects portfolio capital trajectory under machine-detected adverse scenario shocks compared to unshocked baseline market history.',
        how: 'Green line displays normal historical asset progression; red dashed line projects the hypothetical stressed path under the detected shock magnitude.',
        interpretation: 'The divergence between the green baseline and red stressed curve quantifies portfolio capital impairment under acute crisis conditions.',
        parameters: (params) => `Target Asset: ${params.asset || 'Bitcoin'}. Detected Scenario: ${params.scenario || 'Market Crash'}, Shock Magnitude: ${params.shock || '20%'}. Selecting an asset recalculates volatility z-scores and recommended shock sizes in real time.`,
        limitations: 'Stress testing simulates synthetic price shocks and does not account for exchange circuit breakers, broker counterparty failure, or extreme order-book illiquidity.'
    },

    strategyStress: {
        title: 'Manual Stress Scenario Experimentation',
        what: 'Simulates custom hypothetical market shocks (Market Crash, Volatility Spike, Liquidity Shock, Shock & Recovery) on backtested portfolio equity.',
        how: 'Green line represents baseline backtested equity; red line depicts the stressed capital path after injecting the specified shock percentage.',
        interpretation: 'Enables stress testing strategy survival thresholds: tests whether stop-losses prevent account liquidation during extreme black swan events.',
        parameters: (params) => `Scenario: ${params.scenario || 'Market Crash'}, Shock: ${params.shock || '20%'}. Increasing shock magnitude stress-tests extreme tail risk thresholds.`,
        limitations: 'Assumes trading rules continue executing normally without broker intervention during simulated distress.'
    },

    advanced: {
        title: 'Monte Carlo Stochastic Price Path Simulation',
        what: 'Generates probabilistic future price distributions across multiple stochastic random-walk paths parameterized by historical drift and volatility.',
        how: 'Faint blue lines illustrate individual simulated random walk paths; shaded light blue region marks the 10th-to-90th percentile confidence band; gold line denotes the expected mean path.',
        interpretation: 'The spread between upper and lower bands visualizes expanding forecast uncertainty over longer horizons. 80% of simulated outcomes fall within the shaded ribbon.',
        parameters: (params) => `Asset: ${params.asset || 'Bitcoin'}, Horizon: ${params.horizon || 90} trading days, Simulation Paths: ${params.paths || 120}. Increasing horizon expands cone width; increasing paths improves statistical sampling density.`,
        limitations: 'Assumes historical geometric Brownian motion parameters remain stationary. Cannot forecast geopolitical shocks, structural regulatory changes, or corporate events.'
    },

    optimizer: {
        title: 'Optimal Portfolio Weight Allocation (Maximum Sharpe Ratio)',
        what: 'Displays the optimal asset allocation weights across Gold, Bitcoin, and NVIDIA computed using Modern Portfolio Theory (Markowitz Mean-Variance Optimization).',
        how: 'Pie chart illustrates percentage allocation to each asset that maximizes the portfolio Sharpe ratio given historical return, variance, and covariance.',
        interpretation: 'Assets with superior risk-adjusted profiles and favorable diversification correlation receive higher portfolio weights.',
        parameters: (params) => `Risk-free Rate: ${params.riskFree || '5.00%'}, Monte Carlo Iterations: ${params.iterations || 2000}. Higher risk-free rate penalizes lower-yielding defensive assets.`,
        limitations: 'Mean-variance optimization is famously sensitive to input assumptions; small estimation errors in expected return can yield extreme corner solutions.'
    },

    risk: {
        title: 'Daily Return Distribution & Value at Risk (VaR) Cutoffs',
        what: 'Visualizes historical daily return frequency distribution (histogram) with 95% and 99% parametric/historical Value at Risk cutoff boundaries.',
        how: 'Blue bars represent the histogram frequency of daily returns; orange vertical dashed line marks the 95% 1-day VaR cutoff; red vertical dashed line marks the 99% 1-day VaR cutoff.',
        interpretation: 'The area in the far-left tail past the dashed cutoffs represents extreme negative loss days. Days falling left of the 99% line occur with approximately 1% historical probability.',
        parameters: () => '1-day holding horizon, evaluated at 95% and 99% confidence intervals based on full historical return series.',
        limitations: 'VaR measures the boundary of typical losses, not the maximum possible loss. Fat-tailed non-Gaussian distributions can produce losses far beyond the 99% cutoff.'
    },

    adaptive: {
        title: 'Adaptive Macro Allocation Weights',
        what: 'Displays dynamic asset allocation recommendations synthesized from active macro regime, volatility clustering, and correlation dynamics.',
        how: 'Vertical bars show target weights for Gold (defensive anchor), Bitcoin (upside beta), and NVIDIA (growth equity).',
        interpretation: 'During bullish regimes, allocations lean toward Bitcoin and NVIDIA; during volatile or contraction regimes, Gold weight increases for capital protection.',
        parameters: () => 'Derived from real-time market regime decomposition across the multi-asset universe.',
        limitations: 'Tactical rebalancing recommendations do not factor in tax implications or specific investor risk tolerance.'
    },

    mlRegimes: {
        title: 'Unsupervised Machine Learning Regime Clustering (K-Means)',
        what: 'Visualizes market state clusters discovered through unsupervised K-Means algorithmic clustering on rolling return, volatility, and momentum features.',
        how: 'Scatter plot projects market observations onto return (X-axis) and volatility (Y-axis) feature dimensions. Colors group points into distinct cluster states (Defensive, Balanced, Risk-on).',
        interpretation: 'Clear separation between clusters indicates distinct market climates. Dense clusters highlight persistent stability, while dispersed outliers reflect market regime transitions.',
        parameters: (params) => `Target Asset: ${params.asset || 'Bitcoin'}. Features evaluated: 5-day rolling return, 21-day annualized volatility, and 21-day momentum.`,
        limitations: 'K-Means assumes spherical clusters and requires pre-specifying cluster counts (k=3); real macro regimes may have non-linear or continuous boundaries.'
    }
};

// Reusable Caption Renderer with collapsible details
function renderFigureCaption(figureKey, params = {}) {
    const guide = FIGURE_GUIDES[figureKey];
    if (!guide) return '';

    const paramText = typeof guide.parameters === 'function' ? guide.parameters(params) : guide.parameters;
    const captionId = `caption_${figureKey}_${Math.random().toString(36).substring(2, 7)}`;

    return `
        <div class="figure-caption-box" id="${captionId}">
            <div class="figure-caption-summary">
                <span class="caption-icon" aria-hidden="true">📊</span>
                <div class="caption-summary-body">
                    <strong>What this figure shows:</strong> ${guide.what}
                </div>
                <button type="button" class="caption-toggle-btn" aria-expanded="false" onclick="toggleFigureCaption('${captionId}')">
                    <span>How to interpret</span> <span class="toggle-arrow">▾</span>
                </button>
            </div>
            <div class="figure-caption-details" style="display:none;">
                <div class="caption-section">
                    <span class="caption-section-title">How to read it:</span>
                    <p class="caption-section-text">${guide.how}</p>
                </div>
                <div class="caption-section">
                    <span class="caption-section-title">Interpretation:</span>
                    <p class="caption-section-text">${guide.interpretation}</p>
                </div>
                ${paramText ? `
                <div class="caption-section">
                    <span class="caption-section-title">Parameter sensitivity:</span>
                    <p class="caption-section-text">${paramText}</p>
                </div>
                ` : ''}
                <div class="caption-section">
                    <span class="caption-section-title">Limitations:</span>
                    <p class="caption-section-text">${guide.limitations}</p>
                </div>
            </div>
        </div>
    `;
}

// Global toggle for figure captions
function toggleFigureCaption(captionId) {
    const box = document.getElementById(captionId);
    if (!box) return;
    const details = box.querySelector('.figure-caption-details');
    const btn = box.querySelector('.caption-toggle-btn');
    if (!details || !btn) return;

    const isExpanded = details.style.display !== 'none';
    if (isExpanded) {
        details.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('expanded');
    } else {
        details.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('expanded');
    }
}
