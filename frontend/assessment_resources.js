// Curated, verified external educational resources catalog
const ASSESSMENT_RESOURCES = [
  {
    id: 'res-investopedia-returns',
    title: 'Rate of Return (RoR) & Compounding Guide',
    organization: 'Investopedia Education',
    topics: ['Percentage returns and compounding', 'Financial market data and OHLCV', 'Percentage returns and log returns'],
    level: 'Beginner',
    type: 'Educational Guide',
    description: 'Comprehensive explanation of simple returns, compounding over time, and arithmetic vs. logarithmic return calculation.',
    url: 'https://www.investopedia.com/terms/r/rateofreturn.asp',
    verifiedDate: '2026-03-15'
  },
  {
    id: 'res-sec-diversification',
    title: 'Beginner Investor Guide: Diversification & Asset Allocation',
    organization: 'U.S. Securities and Exchange Commission (Investor.gov)',
    topics: ['Diversification and correlation', 'Risk, return and volatility', 'Correlation and diversification'],
    level: 'Beginner',
    type: 'Official Regulatory Guide',
    description: 'Official SEC investor guidance on modern diversification principles, correlation risks, and portfolio balance.',
    url: 'https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset-allocation-diversification-and-rebalancing',
    verifiedDate: '2026-02-10'
  },
  {
    id: 'res-finra-orders',
    title: 'Order Types: Understanding Market, Limit, and Stop Orders',
    organization: 'FINRA (Financial Industry Regulatory Authority)',
    topics: ['Market orders, limit orders and liquidity', 'Stock market fundamentals'],
    level: 'Beginner',
    type: 'Official Regulatory Publication',
    description: 'FINRA market education covering the mechanics of order execution, slippage, and liquidity pools.',
    url: 'https://www.finra.org/investors/investing/investing-basics/order-types',
    verifiedDate: '2026-01-20'
  },
  {
    id: 'res-cboe-volatility',
    title: 'Understanding Market Volatility and Standard Deviation',
    organization: 'Chicago Board Options Exchange (CBOE)',
    topics: ['Risk, return and volatility', 'Mean, variance and standard deviation', 'Drawdown, volatility and stress testing'],
    level: 'Intermediate',
    type: 'Exchange Whitepaper',
    description: 'Educational reference on annualized standard deviation, volatility clustering, and downside variance.',
    url: 'https://www.cboe.com/education/research/volatility/',
    verifiedDate: '2026-03-01'
  },
  {
    id: 'res-cfainstitute-drawdown',
    title: 'Performance Measurement: Maximum Drawdown & Downside Risk',
    organization: 'CFA Institute Research & Policy Center',
    topics: ['Drawdown and capital preservation', 'Drawdown, volatility and stress testing'],
    level: 'Intermediate',
    type: 'Professional Standards Research',
    description: 'Analysis of peak-to-trough drawdowns, recovery duration, and geometric capital preservation mechanics.',
    url: 'https://www.cfainstitute.org/en/research',
    verifiedDate: '2026-02-28'
  },
  {
    id: 'res-mit-finance',
    title: 'Financial Data, Time Series & Quantitative Methods',
    organization: 'MIT OpenCourseWare (Finance Theory)',
    topics: ['Financial market data and OHLCV', 'Percentage returns and log returns', 'Probability and basic statistics'],
    level: 'Intermediate',
    type: 'University Lecture Notes',
    description: 'MIT course notes examining stationary log returns, statistical distributions in equity markets, and econometric foundations.',
    url: 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/',
    verifiedDate: '2026-01-15'
  },
  {
    id: 'res-aqr-backtesting',
    title: 'Pitfalls in Quantitative Backtesting: Overfitting & Bias',
    organization: 'AQR Capital Management / SSRN Research',
    topics: ['Transaction costs, look-ahead bias and overfitting', 'Backtesting and benchmark comparisons', 'Robustness and out-of-sample evaluation'],
    level: 'Advanced',
    type: 'Quantitative Research Paper',
    description: 'Quantitative practitioner review detailing data snooping, look-ahead leakage, transaction friction, and p-hacking.',
    url: 'https://www.aqr.com/Insights/Research/White-Papers',
    verifiedDate: '2026-03-12'
  },
  {
    id: 'res-nyu-regimes',
    title: 'Macro Market Regimes, Volatility States & Hidden Markov Modeling',
    organization: 'NYU Stern Financial Econometrics',
    topics: ['Market regimes and regime changes', 'Strategy signals and entry/exit rules'],
    level: 'Advanced',
    type: 'University Working Paper',
    description: 'Theoretical and empirical analysis of regime persistence, structural trend breaks, and state-dependent returns.',
    url: 'https://pages.stern.nyu.edu/~dbackus/',
    verifiedDate: '2026-02-18'
  },
  {
    id: 'res-nyse-indices',
    title: 'Index Methodology & Equities Architecture',
    organization: 'New York Stock Exchange (NYSE)',
    topics: ['Stocks, exchanges and market indices', 'Reading financial charts and market information'],
    level: 'Beginner',
    type: 'Exchange Educational Publication',
    description: 'Guide to capitalization weighting, index rebalancing, and reading order book market microstructure.',
    url: 'https://www.nyse.com/market-data',
    verifiedDate: '2026-02-05'
  },
  {
    id: 'res-bogleheads-horizon',
    title: 'Behavioral Finance, Time Horizon & Cognitive Biases',
    organization: 'Bogleheads & Financial Literacy Institute',
    topics: ['Investment time horizons and behavioral biases', 'Understanding uncertainty and the limitations of historical performance'],
    level: 'Beginner',
    type: 'Educational Monograph',
    description: 'Study of loss aversion, recency bias, and the historical reality of long-term sequence-of-returns risk.',
    url: 'https://www.bogleheads.org/wiki/Behavioral_biases',
    verifiedDate: '2026-03-01'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ASSESSMENT_RESOURCES };
}
