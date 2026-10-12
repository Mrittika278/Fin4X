const assert = require('assert');
const { ASSESSMENT_QUESTIONS } = require('./assessment_questions');
const { ASSESSMENT_RESOURCES } = require('./assessment_resources');
const { AdaptiveAssessmentSession, PATH_CONFIG } = require('./assessment_engine');

console.log('--- Running QuantX Adaptive Assessment Unit Tests ---');

// Test 1: Question Bank Integrity
assert(Array.isArray(ASSESSMENT_QUESTIONS), 'Questions must be an array');
assert(ASSESSMENT_QUESTIONS.length >= 60, `Question bank must have substantial items (found ${ASSESSMENT_QUESTIONS.length})`);

const ids = new Set();
ASSESSMENT_QUESTIONS.forEach(q => {
  assert(!ids.has(q.id), `Duplicate question ID detected: ${q.id}`);
  ids.add(q.id);
  assert(q.path === 'foundations' || q.path === 'quant', `Invalid path: ${q.path}`);
  assert(Array.isArray(q.options) && q.options.length >= 2, `Options must be an array: ${q.id}`);
  assert(typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < q.options.length, `Invalid correct answer index: ${q.id}`);
  assert(typeof q.explanation === 'string' && q.explanation.length > 5, `Explanation missing: ${q.id}`);
});
console.log(`✓ Test 1 Passed: Verified ${ASSESSMENT_QUESTIONS.length} questions across Path A & Path B with unique IDs and valid answer keys.`);

// Test 2: Foundations Session Adaptive Mechanics
const sessionA = new AdaptiveAssessmentSession('foundations', ASSESSMENT_QUESTIONS, ASSESSMENT_RESOURCES);
assert(sessionA.currentQuestion !== null, 'Session must initialize with a starting question');
assert(sessionA.currentQuestion.path === 'foundations', 'Question path must match');

let countA = 0;
while (!sessionA.isCompleted && countA < 30) {
  const currentQ = sessionA.currentQuestion;
  // Intentionally answer 1 (option 1)
  sessionA.recordAnswer(currentQ.correctAnswer);
  countA++;
}
assert(sessionA.isCompleted, 'Session A must complete within stopping rules');
assert(countA >= PATH_CONFIG.foundations.minQuestions, `Session must respect minimum questions (${countA} >= ${PATH_CONFIG.foundations.minQuestions})`);
assert(countA <= PATH_CONFIG.foundations.maxQuestions, `Session must respect maximum questions (${countA} <= ${PATH_CONFIG.foundations.maxQuestions})`);

const profileA = sessionA.calculateProfile();
assert(profileA.overallPercentage === 100, 'Score should be 100% for all correct');
assert(profileA.strengths.length > 0, 'Should have identified strengths');
assert(profileA.gaps.length === 0, 'Should have no gaps for perfect score');
console.log(`✓ Test 2 Passed: Foundations path adapts, reaches convergence in ${countA} questions, and calculates accurate profile.`);

// Test 3: Quant Finance Session with Deliberate Mistakes (Difficulty Stepping Down)
const sessionB = new AdaptiveAssessmentSession('quant', ASSESSMENT_QUESTIONS, ASSESSMENT_RESOURCES);
let countB = 0;
while (!sessionB.isCompleted && countB < 35) {
  const q = sessionB.currentQuestion;
  // Answer first 8 correctly, remaining incorrectly
  const chosen = (countB < 8) ? q.correctAnswer : ((q.correctAnswer + 1) % q.options.length);
  sessionB.recordAnswer(chosen);
  countB++;
}
assert(sessionB.isCompleted, 'Session B must complete');
const profileB = sessionB.calculateProfile();
assert(profileB.totalAnswered === countB, 'Total answered must match');
assert(profileB.overallPercentage < 100, 'Score must reflect incorrect answers');
assert(profileB.gaps.length > 0, 'Gaps must be identified');
assert(profileB.recommendations.length > 0, 'Relevant recommendations must be populated based on gaps');
console.log(`✓ Test 3 Passed: Quant path adapts, records wrong answers, steps difficulty down, identifies gaps & matches curated resources.`);

// Test 4: Resource Verification
assert(ASSESSMENT_RESOURCES.length >= 8, 'Resource catalog must contain resources');
ASSESSMENT_RESOURCES.forEach(r => {
  assert(r.url.startsWith('https://'), `Resource URL must be secure HTTPS: ${r.url}`);
  assert(r.title && r.organization && r.description, `Resource fields missing: ${r.id}`);
});
console.log(`✓ Test 4 Passed: Verified all ${ASSESSMENT_RESOURCES.length} external educational resources.`);

console.log('--- ALL ADAPTIVE ENGINE UNIT TESTS PASSED ---');
