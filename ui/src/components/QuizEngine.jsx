import React, { useState, useEffect } from 'react';

// Quiz database
const QUIZ_QUESTIONS = {
  'Technical Analysis': [
    {
      id: 1,
      question: 'What does RSI stand for and what does it measure?',
      options: [
        'Relative Strength Index - measures momentum',
        'Real Stock Indicator - measures volume',
        'Rate of Stock Increase - measures price change',
        'Random Stock Index - measures volatility'
      ],
      correct: 0,
      explanation: 'RSI (Relative Strength Index) is a momentum oscillator that measures the speed and magnitude of price changes to identify overbought or oversold conditions.',
      difficulty: 'Beginner',
      category: 'Indicators'
    },
    {
      id: 2,
      question: 'What is a bullish divergence in technical analysis?',
      options: [
        'Price making new highs while indicator makes new lows',
        'Price making new lows while indicator makes new highs',
        'Both price and indicator making new highs',
        'Both price and indicator making new lows'
      ],
      correct: 1,
      explanation: 'A bullish divergence occurs when price makes new lows but the indicator (like RSI) makes new highs, suggesting potential reversal.',
      difficulty: 'Intermediate',
      category: 'Patterns'
    }
  ],
  'Fundamental Analysis': [
    {
      id: 3,
      question: 'What does a P/E ratio of 15 typically indicate?',
      options: [
        'The stock is overvalued',
        'The stock is undervalued',
        'Investors are paying $15 for every $1 of earnings',
        'The company has $15 in earnings per share'
      ],
      correct: 2,
      explanation: 'A P/E ratio of 15 means investors are paying $15 for every $1 of company earnings.',
      difficulty: 'Beginner',
      category: 'Valuation'
    }
  ],
  'Risk Management': [
    {
      id: 4,
      question: 'What is the 2% rule in risk management?',
      options: [
        'Never risk more than 2% of your account on any single trade',
        'Always aim for 2% profit on every trade',
        'Use 2% of your capital for each trade',
        'Set stop loss at 2% below entry price'
      ],
      correct: 0,
      explanation: 'The 2% rule states you should never risk more than 2% of your trading account on any single trade.',
      difficulty: 'Beginner',
      category: 'Position Sizing'
    }
  ]
};

function QuizEngine() {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Technical Analysis');

  const startQuiz = (category) => {
    setSelectedCategory(category);
    setCurrentQuiz(QUIZ_QUESTIONS[category]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
  };

  const handleAnswerSelect = (value) => {
    setSelectedAnswer(parseInt(value));
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const question = currentQuiz[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    if (currentQuestion < currentQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed
      const finalScore = isCorrect ? score + 1 : score;
      const percentage = (finalScore / currentQuiz.length) * 100;
      
      setQuizHistory(prev => [...prev, {
        category: selectedCategory,
        score: finalScore,
        total: currentQuiz.length,
        percentage,
        date: new Date().toISOString()
      }]);
      
      alert(`Quiz completed! Score: ${finalScore}/${currentQuiz.length} (${percentage.toFixed(1)}%)`);
      setCurrentQuiz(null);
    }
  };

  if (currentQuiz) {
    const question = currentQuiz[currentQuestion];
    const progress = ((currentQuestion + 1) / currentQuiz.length) * 100;

    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
            Quiz: {selectedCategory}
          </h2>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            Question {currentQuestion + 1} of {currentQuiz.length}
          </p>
        </div>

        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
            {question.question}
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            {question.options.map((option, index) => (
              <label key={index} style={{
                display: 'block',
                padding: '12px',
                margin: '8px 0',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: selectedAnswer === index ? '#eff6ff' : '#ffffff',
                borderColor: selectedAnswer === index ? '#3b82f6' : '#d1d5db'
              }}>
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                {option}
              </label>
            ))}
          </div>

          {showExplanation && (
            <div style={{
              padding: '16px',
              backgroundColor: selectedAnswer === question.correct ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${selectedAnswer === question.correct ? '#22c55e' : '#ef4444'}`,
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <strong style={{ color: selectedAnswer === question.correct ? '#15803d' : '#dc2626' }}>
                {selectedAnswer === question.correct ? 'Correct!' : 'Incorrect'}
              </strong>
              <p style={{ margin: '8px 0 0 0', color: '#374151' }}>
                {question.explanation}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </button>
            
            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedAnswer === null ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedAnswer === null ? 'not-allowed' : 'pointer'
              }}
            >
              {currentQuestion < currentQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz selection screen
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 'bold' }}>
        Trading Quiz Engine
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(QUIZ_QUESTIONS).map(([category, questions]) => (
          <div
            key={category}
            onClick={() => startQuiz(category)}
            style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {category}
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
              {questions.length} questions
            </p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              Start Quiz
            </button>
          </div>
        ))}
      </div>

      {quizHistory.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Recent Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {quizHistory.slice(-4).map((quiz, index) => (
              <div key={index} style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {quiz.category}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  {new Date(quiz.date).toLocaleDateString()}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: quiz.percentage >= 70 ? '#15803d' : '#d97706'
                }}>
                  {quiz.percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizEngine;



