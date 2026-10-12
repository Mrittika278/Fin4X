// QuantX Adaptive Knowledge Assessment Engine
// Modular, deterministic, rule-based adaptive engine

const PATH_CONFIG = {
  foundations: {
    name: 'Investor Foundations',
    subtitle: 'Essential financial markets, investment principles & risk concepts',
    minQuestions: 15,
    maxQuestions: 22,
    topics: [
      'Stock market fundamentals',
      'Stocks, exchanges and market indices',
      'Market orders, limit orders and liquidity',
      'Percentage returns and compounding',
      'Risk, return and volatility',
      'Diversification and correlation',
      'Drawdown and capital preservation',
      'Investment time horizons and behavioral biases',
      'Reading financial charts and market information',
      'Understanding uncertainty and the limitations of historical performance'
    ]
  },
  quant: {
    name: 'Quantitative Finance',
    subtitle: 'Financial data analysis, quantitative strategies & statistical models',
    minQuestions: 16,
    maxQuestions: 24,
    topics: [
      'Financial market data and OHLCV',
      'Percentage returns and log returns',
      'Mean, variance and standard deviation',
      'Probability and basic statistics',
      'Moving averages and technical indicators',
      'Correlation and diversification',
      'Strategy signals and entry/exit rules',
      'Backtesting and benchmark comparisons',
      'Transaction costs, look-ahead bias and overfitting',
      'Market regimes and regime changes',
      'Drawdown, volatility and stress testing',
      'Robustness and out-of-sample evaluation'
    ]
  }
};

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

class AdaptiveAssessmentSession {
  constructor(pathKey, questionsBank, resourcesCatalog) {
    if (!PATH_CONFIG[pathKey]) {
      throw new Error(`Invalid assessment path: ${pathKey}`);
    }
    this.pathKey = pathKey;
    this.config = PATH_CONFIG[pathKey];
    this.allQuestions = questionsBank.filter(q => q.path === pathKey);
    this.resources = resourcesCatalog || [];

    // Session State (Frontend-Memory Only)
    this.answeredQuestions = []; // array of { question, selectedOption, isCorrect, timestamp }
    this.currentQuestion = null;
    this.isCompleted = false;
    this.topicProficiency = {}; // topic -> { correct: 0, total: 0, currentDifficulty: 'intermediate', history: [] }

    // Initialize topics
    this.config.topics.forEach(t => {
      this.topicProficiency[t] = {
        correct: 0,
        total: 0,
        currentDifficulty: 'intermediate',
        history: []
      };
    });

    // Select initial question
    this.currentQuestion = this.selectNextQuestion();
  }

  // Deterministic next question selection algorithm
  selectNextQuestion() {
    if (this.shouldStop()) {
      return null;
    }

    const answeredIds = new Set(this.answeredQuestions.map(a => a.question.id));
    const availablePool = this.allQuestions.filter(q => !answeredIds.has(q.id));

    if (availablePool.length === 0) {
      return null;
    }

    // 1. Topic prioritization:
    // Prioritize topics with fewest questions answered to guarantee comprehensive topic coverage
    const sortedTopics = [...this.config.topics].sort((a, b) => {
      const countA = this.topicProficiency[a].total;
      const countB = this.topicProficiency[b].total;
      return countA - countB;
    });

    for (const targetTopic of sortedTopics) {
      const topicState = this.topicProficiency[targetTopic];
      const targetDiff = topicState.currentDifficulty;

      // Find question for this topic matching current target difficulty
      let candidate = availablePool.find(q => q.topic === targetTopic && q.difficulty === targetDiff);

      // If exact difficulty already exhausted, pick adjacent difficulty
      if (!candidate) {
        candidate = availablePool.find(q => q.topic === targetTopic);
      }

      if (candidate) {
        return candidate;
      }
    }

    // Fallback if no topic match: return first unasked question
    return availablePool[0] || null;
  }

  // Stopping conditions
  shouldStop() {
    const totalAnswered = this.answeredQuestions.length;

    // Hard ceiling
    if (totalAnswered >= this.config.maxQuestions) {
      return true;
    }

    // Must reach minimum question count
    if (totalAnswered < this.config.minQuestions) {
      return false;
    }

    // Check if every topic has at least 1-2 questions answered
    const uncoveredTopics = this.config.topics.filter(t => this.topicProficiency[t].total === 0);
    if (uncoveredTopics.length > 0) {
      return false;
    }

    // If minimum reached and all topics covered, check convergence
    // If last 3 answers had stable difficulty across topics, can stop early
    return true;
  }

  // Answer recording and adaptive state update
  recordAnswer(selectedOptionIndex) {
    if (!this.currentQuestion || this.isCompleted) {
      throw new Error('No active question in session');
    }

    const q = this.currentQuestion;
    const isCorrect = selectedOptionIndex === q.correctAnswer;
    const topicState = this.topicProficiency[q.topic];

    topicState.total += 1;
    if (isCorrect) {
      topicState.correct += 1;
    }
    topicState.history.push({ difficulty: q.difficulty, isCorrect });

    // Adapt next difficulty for this topic:
    // - Correct answer: step difficulty up if possible
    // - Incorrect answer: step difficulty down to diagnostic prerequisite level
    const diffIndex = DIFFICULTY_LEVELS.indexOf(q.difficulty);
    if (isCorrect) {
      if (diffIndex < DIFFICULTY_LEVELS.length - 1) {
        topicState.currentDifficulty = DIFFICULTY_LEVELS[diffIndex + 1];
      }
    } else {
      if (diffIndex > 0) {
        topicState.currentDifficulty = DIFFICULTY_LEVELS[diffIndex - 1];
      }
    }

    this.answeredQuestions.push({
      question: q,
      selectedOption: selectedOptionIndex,
      isCorrect,
      timestamp: Date.now()
    });

    // Check if assessment complete
    if (this.shouldStop()) {
      this.isCompleted = true;
      this.currentQuestion = null;
    } else {
      this.currentQuestion = this.selectNextQuestion();
      if (!this.currentQuestion) {
        this.isCompleted = true;
      }
    }

    return {
      isCompleted: this.isCompleted,
      nextQuestion: this.currentQuestion,
      totalAnswered: this.answeredQuestions.length
    };
  }

  // Calculate final score and knowledge profile
  calculateProfile() {
    const totalAnswered = this.answeredQuestions.length;
    if (totalAnswered === 0) {
      return null;
    }

    const totalCorrect = this.answeredQuestions.filter(a => a.isCorrect).length;
    const overallPercentage = Math.round((totalCorrect / totalAnswered) * 100);

    const topicResults = [];
    const strengths = [];
    const gaps = [];

    this.config.topics.forEach(topicName => {
      const state = this.topicProficiency[topicName];
      if (state.total === 0) {
        topicResults.push({
          topic: topicName,
          percentage: null,
          total: 0,
          correct: 0,
          band: 'Not enough evidence',
          bandClass: 'insufficient'
        });
      } else {
        const score = Math.round((state.correct / state.total) * 100);
        let band = '';
        let bandClass = '';

        if (score >= 80) {
          band = 'Strong performance on assessed concepts';
          bandClass = 'strong';
          strengths.push({ topic: topicName, score });
        } else if (score >= 60) {
          band = 'Competent understanding of assessed concepts';
          bandClass = 'competent';
        } else if (score >= 40) {
          band = 'Developing knowledge';
          bandClass = 'developing';
          gaps.push({ topic: topicName, score });
        } else {
          band = 'Foundation building';
          bandClass = 'foundation';
          gaps.push({ topic: topicName, score });
        }

        topicResults.push({
          topic: topicName,
          percentage: score,
          total: state.total,
          correct: state.correct,
          band,
          bandClass
        });
      }
    });

    // Curate relevant external recommendations prioritizing user's knowledge gaps
    const gapTopics = new Set(gaps.map(g => g.topic));
    const prioritizedResources = [];

    // First: resources matching identified knowledge gaps
    this.resources.forEach(res => {
      const matchesGap = res.topics.some(t => gapTopics.has(t));
      if (matchesGap) {
        prioritizedResources.push({
          ...res,
          reason: 'Addresses identified knowledge gap in ' + res.topics.filter(t => gapTopics.has(t)).join(', ')
        });
      }
    });

    // Second: general complementary resources if gaps are few
    if (prioritizedResources.length < 4) {
      this.resources.forEach(res => {
        if (!prioritizedResources.find(p => p.id === res.id)) {
          prioritizedResources.push({
            ...res,
            reason: 'Recommended for continuing education in ' + res.topics[0]
          });
        }
      });
    }

    return {
      pathKey: this.pathKey,
      pathName: this.config.name,
      totalAnswered,
      totalCorrect,
      overallPercentage,
      topicResults,
      strengths,
      gaps,
      recommendations: prioritizedResources.slice(0, 6),
      review: this.answeredQuestions.map((item, idx) => ({
        index: idx + 1,
        id: item.question.id,
        topic: item.question.topic,
        difficulty: item.question.difficulty,
        text: item.question.text,
        options: item.question.options,
        selectedOption: item.selectedOption,
        correctAnswer: item.question.correctAnswer,
        isCorrect: item.isCorrect,
        explanation: item.question.explanation
      }))
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdaptiveAssessmentSession, PATH_CONFIG };
}
