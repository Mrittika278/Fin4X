// Comprehensive Question Bank for QuantX Adaptive Knowledge Self-Assessment
// Covers Path A (Investor Foundations) and Path B (Quantitative Finance)

const ASSESSMENT_QUESTIONS = [
  // ==========================================
  // PATH A: INVESTOR FOUNDATIONS (10 Topics)
  // ==========================================

  // Topic 1: Stock market fundamentals
  {
    id: 'f-smf-01',
    path: 'foundations',
    topic: 'Stock market fundamentals',
    difficulty: 'beginner',
    text: 'What does purchasing a single share of stock in a public company represent?',
    options: [
      'A guaranteed fixed annual interest payment from the government',
      'Fractional ownership in the corporation and a claim on its assets/earnings',
      'A personal loan made to the CEO of the business',
      'A certificate that guarantees the stock price cannot decline'
    ],
    correctAnswer: 1,
    explanation: 'A share of stock represents equity—fractional ownership of the issuing company with proportional entitlement to residual profits and voting rights.'
  },
  {
    id: 'f-smf-02',
    path: 'foundations',
    topic: 'Stock market fundamentals',
    difficulty: 'intermediate',
    text: 'What is market capitalization and how is it calculated?',
    options: [
      'Annual corporate revenue divided by gross profits',
      'Total outstanding shares multiplied by the current market price per share',
      'The book value of all physical inventory held in warehouses',
      'The total debt liabilities owed to corporate bondholders'
    ],
    correctAnswer: 1,
    explanation: 'Market capitalization equals total shares outstanding multiplied by the current share price, measuring aggregate public equity value.'
  },
  {
    id: 'f-smf-03',
    path: 'foundations',
    topic: 'Stock market fundamentals',
    difficulty: 'advanced',
    text: 'In corporate capital structure, what is the hierarchy of claims during corporate liquidation?',
    options: [
      'Common equity holders are paid first, followed by senior bondholders',
      'Preferred equity holders receive priority over secured debt lenders',
      'Senior secured creditors are paid before subordinated debt, preferred equity, and common equity',
      'All security holders receive equal pro-rata distributions regardless of instrument'
    ],
    correctAnswer: 2,
    explanation: 'Absolute priority requires senior secured bondholders to be made whole before junior debt, preferred equity, and lastly residual common equity.'
  },

  // Topic 2: Stocks, exchanges and market indices
  {
    id: 'f-semi-01',
    path: 'foundations',
    topic: 'Stocks, exchanges and market indices',
    difficulty: 'beginner',
    text: 'What is the primary purpose of a stock market index like the S&P 500?',
    options: [
      'To set federal income tax brackets for brokerage firms',
      'To track the collective performance of a defined basket of representative stocks',
      'To mandate the exact price at which stocks must be traded',
      'To insure retail investors against negative quarterly returns'
    ],
    correctAnswer: 1,
    explanation: 'A market index measures the statistical performance of a representative basket of securities to benchmark market movements.'
  },
  {
    id: 'f-semi-02',
    path: 'foundations',
    topic: 'Stocks, exchanges and market indices',
    difficulty: 'intermediate',
    text: 'How does a market-cap weighted index differ from a price-weighted index?',
    options: [
      'A market-cap weighted index weights companies by total market value, whereas price-weighted indices weight purely by nominal share price',
      'Market-cap weighted indices only rebalance once every 10 years',
      'Price-weighted indices give the largest weight to companies with the most shares outstanding',
      'There is mathematically no difference between the two weighting methodologies'
    ],
    correctAnswer: 0,
    explanation: 'In market-cap weighting (e.g., S&P 500), index weight corresponds to total equity value; in price-weighting (e.g., Dow Jones), a higher nominal share price commands more weight regardless of company size.'
  },
  {
    id: 'f-semi-03',
    path: 'foundations',
    topic: 'Stocks, exchanges and market indices',
    difficulty: 'advanced',
    text: 'When an index provider executes a quarterly index reconstitution (adding and dropping constituents), what typically happens to affected stocks due to passive ETF tracking?',
    options: [
      'Passive index funds never alter their holdings when index constituents change',
      'Newly added stocks frequently experience buy pressure and volume surges as passive funds rebalance to mirror the index',
      'Dropped stocks are legally prevented from trading for thirty days',
      'Index reconstitution only affects privately traded sovereign bonds'
    ],
    correctAnswer: 1,
    explanation: 'Because index funds and ETFs are mandated to track benchmark weights, constituent additions trigger automated buy inflows while removals trigger selling.'
  },

  // Topic 3: Market orders, limit orders and liquidity
  {
    id: 'f-mold-01',
    path: 'foundations',
    topic: 'Market orders, limit orders and liquidity',
    difficulty: 'beginner',
    text: 'What is the key difference between a Market Order and a Limit Order?',
    options: [
      'Market orders execute immediately at the best available price; limit orders only execute at a specified price or better',
      'Market orders are only valid on weekends; limit orders execute during weekdays',
      'Limit orders are guaranteed to execute immediately regardless of market conditions',
      'Market orders never incur brokerage commissions or slippage'
    ],
    correctAnswer: 0,
    explanation: 'A market order prioritizes speed of execution over price certainty, whereas a limit order guarantees execution price boundary but risks non-execution.'
  },
  {
    id: 'f-mold-02',
    path: 'foundations',
    topic: 'Market orders, limit orders and liquidity',
    difficulty: 'intermediate',
    text: 'What does a wide Bid-Ask spread generally signify in a traded asset?',
    options: [
      'Extremely high trading liquidity and rapid order matching',
      'Lower liquidity, wider market-maker risk premium, and higher transaction friction for traders',
      'That the asset cannot legally be sold until next month',
      'Zero volatility and guaranteed risk-free profit'
    ],
    correctAnswer: 1,
    explanation: 'The bid-ask spread reflects market liquidity. Wide spreads occur when trading volume is thin or uncertainty is high, increasing entry/exit friction.'
  },
  {
    id: 'f-mold-03',
    path: 'foundations',
    topic: 'Market orders, limit orders and liquidity',
    difficulty: 'advanced',
    text: 'What is "slippage" in high-volume order execution?',
    options: [
      'A physical error on the floor exchange telecommunications hardware',
      'The difference between the expected transaction price and the actual average executed price due to finite market depth',
      'The payment of tax dividends on international dividend-paying equities',
      'The cancellation of a limit order prior to trading hours'
    ],
    correctAnswer: 1,
    explanation: 'Slippage occurs when an order walks through multiple levels of the order book because available volume at the inside quote is smaller than the order size.'
  },

  // Topic 4: Percentage returns and compounding
  {
    id: 'f-prc-01',
    path: 'foundations',
    topic: 'Percentage returns and compounding',
    difficulty: 'beginner',
    text: 'If an investment of $1,000 increases to $1,200 after one year, what is the annual percentage return?',
    options: [
      '+10%',
      '+15%',
      '+20%',
      '+25%'
    ],
    correctAnswer: 2,
    explanation: 'Return = (Ending Value - Starting Value) / Starting Value = ($1,200 - $1,000) / $1,000 = +20%.'
  },
  {
    id: 'f-prc-02',
    path: 'foundations',
    topic: 'Percentage returns and compounding',
    difficulty: 'intermediate',
    text: 'An investor gains +50% in Year 1, then loses -50% in Year 2 on a $10,000 starting portfolio. What is their final balance?',
    options: [
      '$10,000 (breakeven)',
      '$7,500 (a net 25% loss)',
      '$5,000 (a net 50% loss)',
      '$12,500 (a net 25% gain)'
    ],
    correctAnswer: 1,
    explanation: 'Year 1: $10,000 × 1.50 = $15,000. Year 2: $15,000 × (1 - 0.50) = $7,500. Compounding percentage swings on unequal bases produces an overall negative drag.'
  },
  {
    id: 'f-prc-03',
    path: 'foundations',
    topic: 'Percentage returns and compounding',
    difficulty: 'advanced',
    text: 'What return is mathematically required to fully recover from an investment drawdown of -75%?',
    options: [
      '+75%',
      '+150%',
      '+200%',
      '+300%'
    ],
    correctAnswer: 3,
    explanation: 'If a portfolio falls from $100 to $25 (-75%), it must gain $75 on its new $25 capital base: 75 / 25 = +300% to return to breakeven.'
  },

  // Topic 5: Risk, return and volatility
  {
    id: 'f-rrv-01',
    path: 'foundations',
    topic: 'Risk, return and volatility',
    difficulty: 'beginner',
    text: 'In finance, how is asset "volatility" conventionally defined?',
    options: [
      'The guaranteed daily cash dividends paid to account holders',
      'The degree of price fluctuation or dispersion of returns around an average over time',
      'The duration of time before a government bond matures',
      'The total number of employees working at the company'
    ],
    correctAnswer: 1,
    explanation: 'Volatility measures the speed and magnitude of price oscillations over a historical or projected window.'
  },
  {
    id: 'f-rrv-02',
    path: 'foundations',
    topic: 'Risk, return and volatility',
    difficulty: 'intermediate',
    text: 'Why does higher expected return in efficient financial markets generally require accepting higher risk?',
    options: [
      'Regulators mandate that safe assets are legally forced to lose money',
      'Capital providers demand higher compensation (risk premium) to induce them to hold volatile or uncertain assets',
      'Higher returns are merely administrative fees collected by bank trustees',
      'Low-risk assets have mathematically negative long-term gross cashflows'
    ],
    correctAnswer: 1,
    explanation: 'In competitive capital markets, risk premiums exist because rational investors require higher expected yield to bear variance and downside possibilities.'
  },
  {
    id: 'f-rrv-03',
    path: 'foundations',
    topic: 'Risk, return and volatility',
    difficulty: 'advanced',
    text: 'Why is standard deviation alone sometimes criticized as an incomplete measure of total investment risk?',
    options: [
      'Standard deviation cannot be computed on digital spreadsheets',
      'It penalizes upside gains equally with downside drops and assumes symmetric, bell-shaped normal distributions without accounting for fat tails',
      'It only applies to fixed-income commercial real estate securities',
      'It is always strictly identical to beta'
    ],
    correctAnswer: 1,
    explanation: 'Standard deviation treats positive volatility identical to negative drawdowns and underestimates extreme tail risks when returns exhibit skewness and kurtosis.'
  },

  // Topic 6: Diversification and correlation
  {
    id: 'f-dc-01',
    path: 'foundations',
    topic: 'Diversification and correlation',
    difficulty: 'beginner',
    text: 'What is the fundamental goal of portfolio diversification?',
    options: [
      'To guarantee that every holding generates positive returns every month',
      'To reduce unsystematic (company-specific) risk by holding multiple uncorrelated assets',
      'To maximize the total transaction fees paid to brokers',
      'To concentrate all available funds into the single fastest-growing stock'
    ],
    correctAnswer: 1,
    explanation: 'Diversification spreads exposure across uncorrelated securities so idiosyncratic shocks in one company do not devastate the overall portfolio.'
  },
  {
    id: 'f-dc-02',
    path: 'foundations',
    topic: 'Diversification and correlation',
    difficulty: 'intermediate',
    text: 'If two assets in a portfolio have a correlation coefficient of -1.0, how do their prices behave relative to each other?',
    options: [
      'They move in perfectly identical lockstep in the same direction',
      'They have no statistical relationship whatever',
      'They move in perfectly opposite directions relative to their means',
      'One asset is legally forbidden from trading when the other is open'
    ],
    correctAnswer: 2,
    explanation: 'A correlation of -1.0 denotes perfect inverse movement, offering maximum theoretical hedging against directional fluctuations.'
  },
  {
    id: 'f-dc-03',
    path: 'foundations',
    topic: 'Diversification and correlation',
    difficulty: 'advanced',
    text: 'What happens to correlation between risky assets during systemic liquidity market crashes (such as March 2020)?',
    options: [
      'Correlations between distinct risk assets often spike sharply toward +1.0 as investors indiscriminately sell assets for cash',
      'Correlations drop permanently to zero across all asset classes',
      'Equity correlations turn strongly negative against real estate and corporate debt',
      'Correlations become mathematically undefined'
    ],
    correctAnswer: 0,
    explanation: 'During acute liquidity panics, correlations spike toward 1.0 because market participants liquidate across diverse asset classes simultaneously to raise cash.'
  },

  // Topic 7: Drawdown and capital preservation
  {
    id: 'f-dcp-01',
    path: 'foundations',
    topic: 'Drawdown and capital preservation',
    difficulty: 'beginner',
    text: 'What does "Maximum Drawdown" measure for a portfolio?',
    options: [
      'The maximum cash dividend ever paid out in a single calendar quarter',
      'The largest peak-to-trough cumulative percentage decline experienced before a new high is achieved',
      'The highest annualized return achieved over any consecutive 3-year period',
      'The total number of losing trades recorded over the lifespan of the account'
    ],
    correctAnswer: 1,
    explanation: 'Maximum Drawdown quantifies downside depth: the largest percentage loss from a historical high-water mark down to the subsequent low.'
  },
  {
    id: 'f-dcp-02',
    path: 'foundations',
    topic: 'Drawdown and capital preservation',
    difficulty: 'intermediate',
    text: 'Why is capital preservation during severe bear markets mathematically critical for compounding wealth?',
    options: [
      'Because deep percentage losses require disproportionately larger percentage gains just to return to the starting level',
      'Because the IRS revokes investment accounts that fall below 50% equity',
      'Because cash assets become completely illiquid during drawdowns',
      'Because compounding resets to zero whenever an asset drops 5%'
    ],
    correctAnswer: 0,
    explanation: 'Asymmetry of returns means a 50% loss requires a 100% gain to recover, while an 80% loss requires a 400% gain, making severe drawdowns devastating to long-term compounding.'
  },
  {
    id: 'f-dcp-03',
    path: 'foundations',
    topic: 'Drawdown and capital preservation',
    difficulty: 'advanced',
    text: 'What is the role of an asset allocation "High-Water Mark"?',
    options: [
      'It represents the minimum cash balance required by the Federal Reserve',
      'It is the highest historical portfolio value, used as the benchmark against which drawdowns and performance fees are evaluated',
      'It determines the strike price of index call options',
      'It is the total sum of tax obligations paid to date'
    ],
    correctAnswer: 1,
    explanation: 'The high-water mark tracks the historical peak value of an equity curve; drawdowns measure the distance below this reference level.'
  },

  // Topic 8: Investment time horizons and behavioral biases
  {
    id: 'f-ith-01',
    path: 'foundations',
    topic: 'Investment time horizons and behavioral biases',
    difficulty: 'beginner',
    text: 'What is "Loss Aversion" in behavioral finance?',
    options: [
      'The deliberate tax-loss harvesting strategy used by wealth managers',
      'The psychological phenomenon where the emotional pain of losing $1,000 is felt roughly twice as intensely as the pleasure of gaining $1,000',
      'An inability of algorithmic order routers to handle negative balances',
      'A regulatory statute capping daily market drops'
    ],
    correctAnswer: 1,
    explanation: 'Pioneered by Kahneman and Tversky, loss aversion describes how individuals feel the subjective distress of financial loss significantly more than an equivalent gain.'
  },
  {
    id: 'f-ith-02',
    path: 'foundations',
    topic: 'Investment time horizons and behavioral biases',
    difficulty: 'intermediate',
    text: 'How does an investor\'s time horizon influence appropriate asset allocation?',
    options: [
      'Longer horizons allow greater allocation to volatile growth assets because there is more time to recover from cyclical market drawdowns',
      'Shorter horizons should always hold the most speculative high-volatility assets',
      'Time horizon has no theoretical or practical relevance to risk tolerance',
      'Investors with 30-year horizons should hold 100% in overnight cash'
    ],
    correctAnswer: 0,
    explanation: 'Extended time horizons permit absorbing intermediate volatility and cyclical drawdowns without forcing premature liquidation at market bottoms.'
  },
  {
    id: 'f-ith-03',
    path: 'foundations',
    topic: 'Investment time horizons and behavioral biases',
    difficulty: 'advanced',
    text: 'What is "Recency Bias" and how does it commonly damage retail investor portfolios?',
    options: [
      'Relying solely on financial publications published before the year 1990',
      'Overweighting recent events, prompting buying at market peaks following rallies and panic-selling at bottoms following corrections',
      'Failing to record trade executions within 24 hours',
      'The tendency to hold only newly listed IPO securities'
    ],
    correctAnswer: 1,
    explanation: 'Recency bias leads investors to extrapolate recent market trends indefinitely into the future, causing pro-cyclical errors like chasing bubbles and dumping bottoms.'
  },

  // Topic 9: Reading financial charts and market information
  {
    id: 'f-rfc-01',
    path: 'foundations',
    topic: 'Reading financial charts and market information',
    difficulty: 'beginner',
    text: 'In a standard candlestick chart, what does a green (or white) candlestick typically convey for that time interval?',
    options: [
      'The closing price was higher than the opening price',
      'The market was halted during the entire trading session',
      'Trading volume was equal to zero',
      'The stock paid an unannounced cash dividend'
    ],
    correctAnswer: 0,
    explanation: 'A green/bullish candle indicates positive price progress during the period: Close > Open.'
  },
  {
    id: 'f-rfc-02',
    path: 'foundations',
    topic: 'Reading financial charts and market information',
    difficulty: 'intermediate',
    text: 'What information do the thin vertical lines ("wicks" or "shadows") above and below a candlestick body convey?',
    options: [
      'The historical corporate tax rates for the fiscal quarter',
      'The highest and lowest prices reached during that time period',
      'The total number of institutional hedge funds holding the asset',
      'The bid-ask spread of the preceding month'
    ],
    correctAnswer: 1,
    explanation: 'The upper wick tip shows the highest traded price of the period; the lower wick tip shows the lowest traded price.'
  },
  {
    id: 'f-rfc-03',
    path: 'foundations',
    topic: 'Reading financial charts and market information',
    difficulty: 'advanced',
    text: 'When reviewing a multi-decade asset price chart, why is a logarithmic price scale preferred over an arithmetic scale?',
    options: [
      'A logarithmic scale hides market crashes so the asset appears safer',
      'A logarithmic scale represents equal percentage changes as equal vertical distances, preventing early percentage growth from looking flat',
      'Logarithmic charts eliminate the need for volume tracking',
      'Arithmetic scales cannot accommodate negative interest rates'
    ],
    correctAnswer: 1,
    explanation: 'A log scale ensures a move from $10 to $20 (+100%) occupies the same visual height as a move from $1,000 to $2,000 (+100%), properly reflecting proportional returns.'
  },

  // Topic 10: Understanding uncertainty and limitations of historical performance
  {
    id: 'f-uul-01',
    path: 'foundations',
    topic: 'Understanding uncertainty and the limitations of historical performance',
    difficulty: 'beginner',
    text: 'Why does every financial regulatory prospectus contain the disclaimer: "Past performance is no guarantee of future results"?',
    options: [
      'To prevent retail investors from opening brokerage accounts',
      'Because market regimes, macroeconomic conditions, and company fundamentals shift dynamically over time',
      'Because historical price charts are legally classified as copyrighted fiction',
      'To eliminate taxes on capital gains'
    ],
    correctAnswer: 1,
    explanation: 'Historical market trends occur under specific economic, monetary, and competitive conditions that may not recur in future regimes.'
  },
  {
    id: 'f-uul-02',
    path: 'foundations',
    topic: 'Understanding uncertainty and the limitations of historical performance',
    difficulty: 'intermediate',
    text: 'What is "Survivorship Bias" when evaluating historical fund or stock performance databases?',
    options: [
      'The tendency of surviving companies to pay lower corporate salaries',
      'The systematic distortion caused by excluding companies or funds that failed and dissolved, making historical average returns appear deceptively high',
      'A biological bias observed in algorithmic market makers',
      'The legal requirement to retain trading records for seven years'
    ],
    correctAnswer: 1,
    explanation: 'Survivorship bias occurs when failed assets drop out of the dataset; measuring only surviving entities artificially inflates historical returns and underestimates failure frequency.'
  },
  {
    id: 'f-uul-03',
    path: 'foundations',
    topic: 'Understanding uncertainty and the limitations of historical performance',
    difficulty: 'advanced',
    text: 'What is a "Black Swan" event as formulated in quantitative financial risk theory?',
    options: [
      'A predictable quarterly drop occurring every December due to holiday tax planning',
      'A rare, extreme-impact outlier event that lies outside normal statistical expectations and is retrospectively rationalized',
      'An arbitrage trading loop that yields guaranteed riskless returns',
      'A regulatory fine imposed by the central bank'
    ],
    correctAnswer: 1,
    explanation: 'Popularized by Nassim Taleb, a Black Swan is an unexpected outlier beyond typical probabilistic modeling that carries severe consequences and challenges Gaussian risk models.'
  },


  // ==========================================
  // PATH B: QUANTITATIVE FINANCE (12 Topics)
  // ==========================================

  // Topic 1: Financial market data and OHLCV
  {
    id: 'q-ohlc-01',
    path: 'quant',
    topic: 'Financial market data and OHLCV',
    difficulty: 'beginner',
    text: 'In standard financial time series datasets, what does the abbreviation "OHLCV" stand for?',
    options: [
      'Option Hedge Limit Calculation Valuation',
      'Open, High, Low, Close, Volume',
      'Operating High Leverage Capital Volatility',
      'Order Handling Liquidity Clearing Verification'
    ],
    correctAnswer: 1,
    explanation: 'OHLCV represents the standard bar aggregation: Open price, High price, Low price, Close price, and total trading Volume over the interval.'
  },
  {
    id: 'q-ohlc-02',
    path: 'quant',
    topic: 'Financial market data and OHLCV',
    difficulty: 'intermediate',
    text: 'Why do quantitative researchers use "Adjusted Close" prices rather than unadjusted raw close prices when backtesting multi-year strategies?',
    options: [
      'Adjusted Close rounds all prices to the nearest whole dollar for speed',
      'Adjusted Close accounts for stock splits, dividends, and corporate spin-offs to prevent artificial gaps in return calculations',
      'Adjusted Close removes overnight trading sessions completely',
      'Raw close prices are illegal to use in statistical software'
    ],
    correctAnswer: 1,
    explanation: 'Corporate actions like 2-for-1 splits or cash dividend payouts create discontinuous price drops that would distort return calculations unless adjusted backward.'
  },
  {
    id: 'q-ohlc-03',
    path: 'quant',
    topic: 'Financial market data and OHLCV',
    difficulty: 'advanced',
    text: 'What is "point-in-time" financial data, and why is it essential for unbiased quantitative backtesting?',
    options: [
      'Data recorded strictly at 12:00:00 PM UTC',
      'Historical data that reflects exactly what was known at that specific historical timestamp, excluding subsequent revisions or restatements',
      'Prices captured only when bid and ask quantities are identical',
      'Data sampled purely from tick-level high frequency execution logs'
    ],
    correctAnswer: 1,
    explanation: 'Point-in-time databases preserve the exact data state as of historical query time, preventing look-ahead bias from future corporate earnings revisions or restated financials.'
  },

  // Topic 2: Percentage returns and log returns
  {
    id: 'q-prlr-01',
    path: 'quant',
    topic: 'Percentage returns and log returns',
    difficulty: 'beginner',
    text: 'If the price of an asset moves from P0 = $100 to P1 = $105, what is its simple arithmetic return R?',
    options: [
      '+0.05 (+5%)',
      '+0.50 (+50%)',
      '+1.05 (+105%)',
      '-0.05 (-5%)'
    ],
    correctAnswer: 0,
    explanation: 'Simple return = (P1 - P0) / P0 = (105 - 100) / 100 = +0.05 (+5%).'
  },
  {
    id: 'q-prlr-02',
    path: 'quant',
    topic: 'Percentage returns and log returns',
    difficulty: 'intermediate',
    text: 'What is the mathematical advantage of using logarithmic returns (r = ln(Pt / Pt-1)) over simple returns in multi-period quantitative modeling?',
    options: [
      'Log returns are always strictly positive numbers',
      'Log returns are time-additive across consecutive periods: r(0,T) = sum(r_t)',
      'Log returns eliminate transaction costs and slippage',
      'Log returns are identical to gross dividends'
    ],
    correctAnswer: 1,
    explanation: 'Continuous compound/log returns are additive across time: ln(P2/P0) = ln(P2/P1) + ln(P1/P0), which greatly simplifies econometric calculations.'
  },
  {
    id: 'q-prlr-03',
    path: 'quant',
    topic: 'Percentage returns and log returns',
    difficulty: 'advanced',
    text: 'Why are simple returns preferred over log returns when aggregating performance across assets in a cross-sectional portfolio at time t?',
    options: [
      'Portfolio simple return is linear: Rp = sum(w_i * R_i), whereas the log return of a portfolio is not the linear weighted sum of asset log returns',
      'Log returns cannot be computed when assets have weights below 10%',
      'Simple returns prevent rounding errors in Python floating point operations',
      'Portfolio log returns cannot be plotted on a linear chart'
    ],
    correctAnswer: 0,
    explanation: 'Cross-sectional aggregation is linear in simple returns: Rp = sum(w_i * R_i). Taking the weighted sum of log returns does not equal the log return of the portfolio.'
  },

  // Topic 3: Mean, variance and standard deviation
  {
    id: 'q-mvsd-01',
    path: 'quant',
    topic: 'Mean, variance and standard deviation',
    difficulty: 'beginner',
    text: 'What does standard deviation measure in a sample of daily asset returns?',
    options: [
      'The median cash price of the asset over the year',
      'The dispersion or spread of individual returns around their sample mean',
      'The number of days the stock traded above its 200-day moving average',
      'The total cumulative dollar dividend distributed'
    ],
    correctAnswer: 1,
    explanation: 'Sample standard deviation is the square root of variance, quantifying how widely daily returns deviate from the average return.'
  },
  {
    id: 'q-mvsd-02',
    path: 'quant',
    topic: 'Mean, variance and standard deviation',
    difficulty: 'intermediate',
    text: 'Assuming 252 trading days per year, how is daily return standard deviation (sigma_daily) annualized under the assumption of independent and identically distributed (i.i.d.) returns?',
    options: [
      'sigma_annual = sigma_daily * 252',
      'sigma_annual = sigma_daily * sqrt(252)',
      'sigma_annual = sigma_daily / sqrt(252)',
      'sigma_annual = (sigma_daily)^2 * 252'
    ],
    correctAnswer: 1,
    explanation: 'Because variance scales linearly with time (sigma_annual^2 = 252 * sigma_daily^2), standard deviation scales with the square root of time: sigma_annual = sigma_daily * sqrt(252).'
  },
  {
    id: 'q-mvsd-03',
    path: 'quant',
    topic: 'Mean, variance and standard deviation',
    difficulty: 'advanced',
    text: 'Why does sample variance of financial asset returns tend to underestimate true tail risk during periods of volatility clustering (ARCH effect)?',
    options: [
      'Standard variance calculations assume constant unconditional variance and serial independence, failing to capture conditional heteroskedasticity and fat tails',
      'Variance is always mathematically zero for equities',
      'Sample variance requires at least 1,000,000 observations to produce an output',
      'Because squaring negative returns converts them to zero in NumPy'
    ],
    correctAnswer: 0,
    explanation: 'Financial returns exhibit volatility clustering (high volatility days follow high volatility days). Unconditional variance ignores this time-varying conditional volatility.'
  },

  // Topic 4: Probability and basic statistics
  {
    id: 'q-pbs-01',
    path: 'quant',
    topic: 'Probability and basic statistics',
    difficulty: 'beginner',
    text: 'What does a probability of 0.05 (5%) signify when calculating a Value at Risk (VaR) 95% confidence threshold?',
    options: [
      'The asset will lose money on exactly 5 days each calendar year',
      'There is a 5% probability that losses will exceed the specified VaR threshold over the target horizon',
      'The investor is guaranteed a 95% profit on 5% of their capital',
      'Transaction costs are 5% of portfolio net asset value'
    ],
    correctAnswer: 1,
    explanation: 'A 95% 1-day VaR indicates that on 95% of trading days losses will stay within the limit; on the remaining 5% tail, losses will exceed it.'
  },
  {
    id: 'q-pbs-02',
    path: 'quant',
    topic: 'Probability and basic statistics',
    difficulty: 'intermediate',
    text: 'What is "kurtosis" in financial statistics, and what does excess kurtosis (> 0) indicate about an asset\'s return distribution?',
    options: [
      'It measures skewness towards positive gains only',
      'It measures tail heaviness relative to a normal distribution; excess kurtosis indicates "fat tails" with higher probability of extreme events',
      'It denotes the speed of order execution on electronic exchanges',
      'It indicates that asset returns follow a perfectly uniform distribution'
    ],
    correctAnswer: 1,
    explanation: 'Leptokurtic distributions (excess kurtosis > 0) feature fatter tails and a sharper central peak than a Gaussian distribution, reflecting frequent extreme market shocks.'
  },
  {
    id: 'q-pbs-03',
    path: 'quant',
    topic: 'Probability and basic statistics',
    difficulty: 'advanced',
    text: 'When fitting historical returns, why is the Student\'s t-distribution frequently favored over the Gaussian normal distribution?',
    options: [
      'Student\'s t has degrees of freedom parameter that allows modeling heavy tails observed empirically in financial returns',
      'Student\'s t distribution guarantees positive returns on every backtest',
      'Gaussian distribution calculations require supercomputers',
      'Student\'s t distribution ignores all negative returns'
    ],
    correctAnswer: 0,
    explanation: 'The Student\'s t-distribution has polynomial (fat) tails calibrated via degrees-of-freedom nu, matching empirical market kurtosis far better than exponential Gaussian tails.'
  },

  // Topic 5: Moving averages and technical indicators
  {
    id: 'q-mati-01',
    path: 'quant',
    topic: 'Moving averages and technical indicators',
    difficulty: 'beginner',
    text: 'How does an Exponential Moving Average (EMA) differ from a Simple Moving Average (SMA)?',
    options: [
      'An EMA assigns exponentially higher weighting to the most recent price data points, reacting faster to trend changes',
      'An SMA ignores all historical closing prices',
      'An EMA is calculated purely using trade volume rather than price',
      'There is no mathematical difference between EMA and SMA'
    ],
    correctAnswer: 0,
    explanation: 'An SMA weights all window periods equally; an EMA applies an exponential weighting multiplier alpha = 2 / (N + 1), giving greater prominence to recent prices.'
  },
  {
    id: 'q-mati-02',
    path: 'quant',
    topic: 'Moving averages and technical indicators',
    difficulty: 'intermediate',
    text: 'What is the classic "Golden Cross" indicator signal in quantitative technical analysis?',
    options: [
      'When the 200-day moving average crosses below the asset\'s dividend yield',
      'When a shorter-term moving average (e.g. 50 EMA) crosses above a longer-term moving average (e.g. 200 EMA)',
      'When daily trading volume falls below the monthly median',
      'When an asset\'s RSI rises above 99.0'
    ],
    correctAnswer: 1,
    explanation: 'A Golden Cross occurs when a fast trend indicator (e.g., 50-day MA) crosses above a slow baseline (e.g., 200-day MA), signaling a potential upward momentum regime.'
  },
  {
    id: 'q-mati-03',
    path: 'quant',
    topic: 'Moving averages and technical indicators',
    difficulty: 'advanced',
    text: 'Why do moving-average crossover strategies suffer severe capital erosion during sideways, mean-reverting (choppy) market regimes?',
    options: [
      'Whipsaw effect: lagging moving averages produce late buy signals at tops and late sell signals at bottoms, accumulating repeated round-trip transaction costs',
      'Moving averages cannot be evaluated in sideways markets',
      'Because brokerages double margin interest during consolidation',
      'Moving averages produce division by zero when volatility declines'
    ],
    correctAnswer: 0,
    explanation: 'Trend-following filters lag price action. In non-trending choppy markets, they generate false breakout signals ("whipsaws"), repeatedly buying highs and selling lows.'
  },

  // Topic 6: Correlation and diversification
  {
    id: 'q-cd-01',
    path: 'quant',
    topic: 'Correlation and diversification',
    difficulty: 'beginner',
    text: 'What range of values can the Pearson correlation coefficient between two assets take?',
    options: [
      '0.0 to 100.0',
      '-1.0 to +1.0',
      '-infinity to +infinity',
      '0.0 to +1.0 only'
    ],
    correctAnswer: 1,
    explanation: 'Pearson correlation rho is bounded strictly between -1.0 (perfect inverse linear correlation) and +1.0 (perfect positive linear correlation).'
  },
  {
    id: 'q-cd-02',
    path: 'quant',
    topic: 'Correlation and diversification',
    difficulty: 'intermediate',
    text: 'In Markowitz Modern Portfolio Theory, why is a portfolio of two imperfectly correlated assets (rho < 1.0) capable of achieving higher risk-adjusted return?',
    options: [
      'Diversification benefit: portfolio variance is less than the weighted average of individual asset variances due to the covariance term 2*w1*w2*Cov(1,2)',
      'Because negative correlations increase individual asset dividend yields',
      'Portfolio theory legally exempts multi-asset funds from corporate income taxes',
      'Two assets combined always double the Sharpe ratio'
    ],
    correctAnswer: 0,
    explanation: 'When rho < 1, the portfolio variance sigma_p^2 = w1^2*s1^2 + w2^2*s2^2 + 2*w1*w2*Cov12 is less than the weighted sum of individual standard deviations, reducing volatility without sacrificing expected return.'
  },
  {
    id: 'q-cd-03',
    path: 'quant',
    topic: 'Correlation and diversification',
    difficulty: 'advanced',
    text: 'What condition must a financial asset covariance matrix satisfy to be mathematically valid for portfolio optimization?',
    options: [
      'It must be symmetric and positive semi-definite (all eigenvalues lambda_i >= 0)',
      'All elements along the diagonal must be negative',
      'The determinant of the matrix must equal exactly -1.0',
      'It must contain only integers'
    ],
    correctAnswer: 0,
    explanation: 'A covariance matrix must be symmetric and positive semi-definite so that portfolio variance w^T * Sigma * w >= 0 for all arbitrary weight vectors w.'
  },

  // Topic 7: Strategy signals and entry/exit rules
  {
    id: 'q-sser-01',
    path: 'quant',
    topic: 'Strategy signals and entry/exit rules',
    difficulty: 'beginner',
    text: 'In algorithmic trading, what is the role of a "trading signal"?',
    options: [
      'An encrypted network ping sent to internet service providers',
      'A quantitative rule output (e.g. +1 for Long, 0 for Cash, -1 for Short) dictating desired market exposure',
      'A legal notification sent to shareholders before dividends',
      'A message that halts all exchange operations'
    ],
    correctAnswer: 1,
    explanation: 'Signals translate market data and mathematical indicators into structured exposure directives (+1, 0, -1).'
  },
  {
    id: 'q-sser-02',
    path: 'quant',
    topic: 'Strategy signals and entry/exit rules',
    difficulty: 'intermediate',
    text: 'Why do quantitative strategy implementations strictly apply `signal.shift(1)` to historical signal arrays before calculating strategy returns?',
    options: [
      'To prevent look-ahead bias by ensuring a trade signal generated on day t is executed on day t+1, rather than earning day t\'s return before the signal was generated',
      'To reduce the total number of trades by half',
      'To bypass exchange fee calculations',
      'Because Python indices start at 0 instead of 1'
    ],
    correctAnswer: 0,
    explanation: 'Shifting signals forward by 1 period is the critical look-ahead protection: a decision made at close t can only trade and earn returns at t+1.'
  },
  {
    id: 'q-sser-03',
    path: 'quant',
    topic: 'Strategy signals and entry/exit rules',
    difficulty: 'advanced',
    text: 'In quantitative mean-reversion strategies, how is a Bollinger Band or Z-score entry threshold calibrated?',
    options: [
      'Z = (Price - Rolling_SMA) / Rolling_Std; buy when Z < -threshold (oversold) and exit/short when Z > +threshold',
      'Z = Price * Rolling_Std; buy when Z exceeds the all-time high',
      'Z = Volume / Dividend_Yield; buy when Z equals zero',
      'Z is set randomly at every market open'
    ],
    correctAnswer: 0,
    explanation: 'Z-score measures standardized deviations from a rolling mean. Entry occurs when price dislocates beyond a statistical threshold (e.g., -2 sigma) anticipating mean-reversion.'
  },

  // Topic 8: Backtesting and benchmark comparisons
  {
    id: 'q-bbc-01',
    path: 'quant',
    topic: 'Backtesting and benchmark comparisons',
    difficulty: 'beginner',
    text: 'What is the primary purpose of comparing a strategy\'s backtest against a "Buy & Hold" benchmark of the underlying asset?',
    options: [
      'To ensure both strategies pay the same tax rate',
      'To determine whether the quantitative strategy adds alpha (excess risk-adjusted value) beyond simply holding the asset passively',
      'To guarantee that the strategy will never experience drawdowns',
      'To comply with browser graphic rendering limits'
    ],
    correctAnswer: 1,
    explanation: 'A benchmark establishes baseline opportunity cost. If a complex strategy underperforms buy-and-hold on total or risk-adjusted return, it fails to justify its complexity and execution costs.'
  },
  {
    id: 'q-bbc-02',
    path: 'quant',
    topic: 'Backtesting and benchmark comparisons',
    difficulty: 'intermediate',
    text: 'How is the annualized Sharpe Ratio computed for a strategy return series?',
    options: [
      'Sharpe = (Annualized Return - Risk_Free_Rate) / Annualized Volatility',
      'Sharpe = Cumulative Return * Total Trades',
      'Sharpe = Max Drawdown / Beta',
      'Sharpe = Gross Revenue / Transaction Costs'
    ],
    correctAnswer: 0,
    explanation: 'The Sharpe ratio measures excess return per unit of total risk (standard deviation): (R_p - R_f) / sigma_p.'
  },
  {
    id: 'q-bbc-03',
    path: 'quant',
    topic: 'Backtesting and benchmark comparisons',
    difficulty: 'advanced',
    text: 'Why is Sortino Ratio frequently considered superior to Sharpe Ratio for evaluating asymmetric strategies (e.g. trend-following with long gamma)?',
    options: [
      'Sortino replaces total standard deviation with downside deviation (semi-variance), ignoring upside volatility that benefits the investor',
      'Sortino ratio cannot produce negative numbers',
      'Sortino ratio is immune to transaction costs',
      'Sortino ratio assumes zero risk-free interest rates'
    ],
    correctAnswer: 0,
    explanation: 'The Sortino ratio isolates downside semi-variance. Large positive windfall jumps increase Sharpe\'s denominator (penalizing it), whereas Sortino rightly welcomes upside volatility.'
  },

  // Topic 9: Transaction costs, look-ahead bias and overfitting
  {
    id: 'q-tclo-01',
    path: 'quant',
    topic: 'Transaction costs, look-ahead bias and overfitting',
    difficulty: 'beginner',
    text: 'What happens to a high-frequency or high-turnover strategy\'s backtest if transaction fees and bid-ask slippage are omitted?',
    options: [
      'Backtest results will appear unrealistically profitable because friction costs that erode capital in live trading are ignored',
      'The strategy will automatically trade fewer shares',
      'Returns will be artificially reduced',
      'There is no impact because execution in modern markets is completely free'
    ],
    correctAnswer: 0,
    explanation: 'Transaction costs and slippage compound with turnover. Omitting them turns heavily unprofitable live strategies into deceptively glowing backtest curves.'
  },
  {
    id: 'q-tclo-02',
    path: 'quant',
    topic: 'Transaction costs, look-ahead bias and overfitting',
    difficulty: 'intermediate',
    text: 'What is "Look-Ahead Bias" (data leakage) in quantitative research?',
    options: [
      'Using an asset from another country in the portfolio',
      'Inadvertently incorporating future information that would have been unknowable at the simulated point of trade execution',
      'Calculating strategy signals only in the morning',
      'Reviewing past annual reports before buying'
    ],
    correctAnswer: 1,
    explanation: 'Look-ahead bias leaks future prices or indicators into past decision points, fabricating impossible predictive power in backtest simulations.'
  },
  {
    id: 'q-tclo-03',
    path: 'quant',
    topic: 'Transaction costs, look-ahead bias and overfitting',
    difficulty: 'advanced',
    text: 'What is the danger of optimizing 15 strategy parameters across historical data until the Sharpe ratio reaches 3.5 (overfitting / p-hacking)?',
    options: [
      'The parameters fit idiosyncratic historical market noise rather than persistent structural signal, leading to catastrophic live out-of-sample failure',
      'The strategy algorithm will exceed memory bounds in Python',
      'The exchange will ban the trader for having too high a Sharpe ratio',
      'It guarantees permanent live alpha for the next 20 years'
    ],
    correctAnswer: 0,
    explanation: 'Overfitting occurs when excessive degrees of freedom curve-fit random historical noise. In live trading, noise does not repeat and the strategy breaks down.'
  },

  // Topic 10: Market regimes and regime changes
  {
    id: 'q-mrmc-01',
    path: 'quant',
    topic: 'Market regimes and regime changes',
    difficulty: 'beginner',
    text: 'In quantitative macro modeling, what is a "Market Regime"?',
    options: [
      'A formal government decree prohibiting short sales',
      'A sustained macroeconomic or statistical state characterized by distinct return, volatility, and correlation distributions',
      'The physical location of an offshore server room',
      'The specific broker used to route orders'
    ],
    correctAnswer: 1,
    explanation: 'A market regime is a persistent statistical climate (e.g. Bull/Low Volatility vs. Bear/High Volatility) where financial dynamics behave distinctly.'
  },
  {
    id: 'q-mrmc-02',
    path: 'quant',
    topic: 'Market regimes and regime changes',
    difficulty: 'intermediate',
    text: 'How can unsupervised machine learning (such as KMeans or Gaussian Mixture Models) be applied to financial market regimes?',
    options: [
      'To cluster historical trading days into distinct statistical regimes based on return and volatility features without needing manual labels',
      'To legally authenticate corporate financial filings',
      'To execute high-frequency order book spoofing',
      'To guarantee positive returns regardless of market conditions'
    ],
    correctAnswer: 0,
    explanation: 'Clustering algorithms group historical days into distinct clusters based on feature dimensions like 21-day volatility and 5-day return momentum.'
  },
  {
    id: 'q-mrmc-03',
    path: 'quant',
    topic: 'Market regimes and regime changes',
    difficulty: 'advanced',
    text: 'Why do static portfolio weights optimized during an expansionary bull regime often experience extreme stress during a regime transition to high volatility?',
    options: [
      'Correlation breakdowns: asset diversification assumed from calm periods often collapses, while asset variances expand non-linearly',
      'Because market regimes change only once every 100 years',
      'The assets automatically convert into cash at the exchange level',
      'Trading stops completely across all global exchanges'
    ],
    correctAnswer: 0,
    explanation: 'Assets that appear uncorrelated in low-volatility regimes often become highly correlated during stress, causing static risk models to severely underestimate joint drawdown.'
  },

  // Topic 11: Drawdown, volatility and stress testing
  {
    id: 'q-dvst-01',
    path: 'quant',
    topic: 'Drawdown, volatility and stress testing',
    difficulty: 'beginner',
    text: 'What is the objective of "Stress Testing" a quantitative trading strategy?',
    options: [
      'To identify the fastest network cable for server connections',
      'To evaluate how portfolio equity and risk metrics survive severe historical crises or synthetic extreme shocks',
      'To force the strategy to trade 10,000 times per minute',
      'To delete all historical losing days from the record'
    ],
    correctAnswer: 1,
    explanation: 'Stress testing subjects strategies to tail-risk shocks (e.g., 2008 Lehman collapse, 2020 COVID shock) to verify solvency and capital resilience under adverse conditions.'
  },
  {
    id: 'q-dvst-02',
    path: 'quant',
    topic: 'Drawdown, volatility and stress testing',
    difficulty: 'intermediate',
    text: 'How does Monte Carlo simulation differ from standard historical backtesting?',
    options: [
      'Historical backtesting evaluates one single path of history; Monte Carlo simulates hundreds or thousands of randomized paths to model distribution of potential outcomes',
      'Monte Carlo requires trading only European casinos',
      'Historical backtests are non-deterministic, whereas Monte Carlo uses no randomness',
      'Monte Carlo models only fixed income bonds'
    ],
    correctAnswer: 0,
    explanation: 'Historical backtests demonstrate how an algorithm would have navigated the single realized path of history; Monte Carlo samples distributions to observe terminal wealth dispersions.'
  },
  {
    id: 'q-dvst-03',
    path: 'quant',
    topic: 'Drawdown, volatility and stress testing',
    difficulty: 'advanced',
    text: 'What is Conditional Value at Risk (CVaR / Expected Shortfall) and why is it preferred over standard VaR in Basel III / Solvency II regulatory stress testing?',
    options: [
      'CVaR measures the average expected loss conditional on the loss exceeding the VaR cutoff, capturing tail risk beyond the threshold',
      'CVaR is always equal to the risk-free rate',
      'CVaR only measures upside windfalls',
      'CVaR ignores extreme events completely'
    ],
    correctAnswer: 0,
    explanation: 'VaR only indicates the threshold boundary of the worst 5% of days; CVaR calculates the average magnitude of losses within that tail, providing a sub-additive coherent risk measure.'
  },

  // Topic 12: Robustness and out-of-sample evaluation
  {
    id: 'q-rooe-01',
    path: 'quant',
    topic: 'Robustness and out-of-sample evaluation',
    difficulty: 'beginner',
    text: 'What is the distinction between "In-Sample" (IS) and "Out-of-Sample" (OOS) data in quantitative strategy development?',
    options: [
      'IS data is used to formulate, fit, and tune the strategy; OOS data is pristine data withheld until validation to evaluate live generalizability',
      'IS data comes from international exchanges; OOS data comes from domestic markets',
      'OOS data is synthetic data generated by video game engines',
      'IS data is only accessible to hedge fund managers'
    ],
    correctAnswer: 0,
    explanation: 'Separating train/in-sample data from test/out-of-sample validation data is the gold standard for testing whether a strategy possesses genuine predictive power.'
  },
  {
    id: 'q-rooe-02',
    path: 'quant',
    topic: 'Robustness and out-of-sample evaluation',
    difficulty: 'intermediate',
    text: 'What is "Walk-Forward Analysis" in quantitative validation?',
    options: [
      'Testing an algorithm by stepping through time in sequential rolling windows: optimizing parameters on historical training slices and testing forward on out-of-sample slices',
      'Physically testing algorithm hardware while walking',
      'A method that only works on trending commodities',
      'Permanently fixing moving average parameters on the entire 50-year dataset'
    ],
    correctAnswer: 0,
    explanation: 'Walk-forward analysis trains on window [0, t], tests on [t, t+k], then rolls the window forward, realistically mimicking real-world ongoing periodic re-optimization.'
  },
  {
    id: 'q-rooe-03',
    path: 'quant',
    topic: 'Robustness and out-of-sample evaluation',
    difficulty: 'advanced',
    text: 'When testing a parameter grid (e.g. fast moving average span from 10 to 50), what does a "parameter plateau" indicate about strategy robustness compared to an isolated spike?',
    options: [
      'A broad plateau of positive returns across neighboring parameter values indicates a robust structural anomaly; an isolated sharp spike indicates overfitted noise',
      'An isolated spike is superior because it maximizes historical profit',
      'Plateaus signify mathematical errors in indicator calculation',
      'Parameter sensitivity has no connection to out-of-sample live performance'
    ],
    correctAnswer: 0,
    explanation: 'Robust strategies occupy broad parameter plateaus where small parameter shifts (e.g. 20 vs 21 EMA) do not cause performance collapse. Isolated spikes reflect overfitted noise.'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ASSESSMENT_QUESTIONS };
}
