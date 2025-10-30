import React, { useCallback, useEffect, useRef, useState } from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';

const MOVES = [
  {
    id: 'pulse',
    title: 'Precision Pulse',
    description: 'Deliver a concise follow-up prompt that keeps the model locked on the core objective.',
    score: 120,
    coins: 3,
    window: 3600,
  },
  {
    id: 'pivot',
    title: 'Context Pivot',
    description: 'Reframe the conversation with a new constraint before the timer runs out.',
    score: 150,
    coins: 4,
    window: 4200,
  },
  {
    id: 'clarity',
    title: 'Clarity Sprint',
    description: 'Trim ambiguity by supplying a clarifying example that resets the model focus.',
    score: 180,
    coins: 5,
    window: 4500,
  },
  {
    id: 'drill',
    title: 'Drill Down',
    description: 'Ask for a numbered plan that narrows the exploration to actionable steps.',
    score: 200,
    coins: 6,
    window: 5000,
  },
];

const successMessages = ['Clean hit!', 'Combo climbing!', 'Great rhythm!', 'Perfect timing!'];

const missMessages = ['Reset and refocus.', 'Shake it off and try again.', 'Combo dropped—keep going!'];

const chooseMessage = (pool) => pool[Math.floor(Math.random() * pool.length)];

const formatMilliseconds = (ms) => (ms / 1000).toFixed(1);

function WorkoutTrainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMove, setCurrentMove] = useState(null);
  const [moveStartTime, setMoveStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [feedback, setFeedback] = useState('');
  const feedbackTimeoutRef = useRef(null);

  const startNextMove = useCallback(() => {
    const nextMove = MOVES[Math.floor(Math.random() * MOVES.length)];
    setCurrentMove(nextMove);
    setMoveStartTime(Date.now());
    setTimeLeft(nextMove.window);
    setFeedback(`Ready: ${nextMove.title}`);
  }, []);

  const handleMoveResult = useCallback(
    (success, scoreIncrease = 0, coinsGain = 0) => {
      setMoveStartTime(0);
      setTimeLeft(0);
      setCurrentMove(null);

      if (success) {
        setCombo((prevCombo) => {
          const newCombo = prevCombo + 1;
          setBestCombo((prevBest) => Math.max(prevBest, newCombo));
          setScore((prev) => prev + scoreIncrease + newCombo * 5);
          setCoins((prev) => {
            const comboBonusCoins = Math.floor(newCombo / 5) * 2;
            const baseSuccessCoins = 2;
            return prev + coinsGain + baseSuccessCoins + comboBonusCoins;
          });
          return newCombo;
        });
      } else {
        setCombo((prevCombo) => {
          setBestCombo((prevBest) => Math.max(prevBest, prevCombo));
          return 0;
        });
        setFeedback((prev) => (prev === 'MISS!' ? 'MISS!' : prev));
      }

      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback('');
        if (isPlaying) {
          startNextMove();
        }
      }, 500);
    },
    [isPlaying, startNextMove],
  );

  useEffect(() => {
    if (!isPlaying) {
      setCurrentMove(null);
      setMoveStartTime(0);
      setTimeLeft(0);
      return;
    }

    startNextMove();
  }, [isPlaying, startNextMove]);

  useEffect(() => {
    if (!isPlaying || !currentMove || moveStartTime === 0) {
      return undefined;
    }

    const missTimeout = setTimeout(() => {
      setFeedback('MISS!');
      handleMoveResult(false);
    }, currentMove.window);

    return () => clearTimeout(missTimeout);
  }, [isPlaying, currentMove, moveStartTime, handleMoveResult]);

  useEffect(() => {
    if (!isPlaying || !currentMove || moveStartTime === 0) {
      setTimeLeft(0);
      return undefined;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - moveStartTime;
      const remaining = Math.max(currentMove.window - elapsed, 0);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [isPlaying, currentMove, moveStartTime]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleStartWorkout = useCallback(() => {
    setScore(0);
    setCoins(0);
    setCombo(0);
    setBestCombo(0);
    setFeedback('Warm-up complete. Let\'s move!');
    setIsPlaying(true);
  }, []);

  const handleStopWorkout = useCallback(() => {
    setIsPlaying(false);
    setCombo((prevCombo) => {
      setBestCombo((prevBest) => Math.max(prevBest, prevCombo));
      return 0;
    });
    setFeedback('Workout paused. Ready when you are.');
  }, []);

  const handlePerfectHit = useCallback(() => {
    if (!isPlaying || !currentMove) return;
    setFeedback(chooseMessage(successMessages));
    handleMoveResult(true, currentMove.score, currentMove.coins);
  }, [isPlaying, currentMove, handleMoveResult]);

  const handleIntentionalMiss = useCallback(() => {
    if (!isPlaying) return;
    setFeedback(chooseMessage(missMessages));
    handleMoveResult(false);
  }, [isPlaying, handleMoveResult]);

  const timerLabel = timeLeft > 0 ? `${formatMilliseconds(timeLeft)}s window remaining` : 'Awaiting next move…';

  return (
    <div className="trainer-card">
      <div className="trainer-stats">
        <div className="trainer-stat">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="trainer-stat">
          <span>Combo</span>
          <strong>{combo}x</strong>
        </div>
        <div className="trainer-stat">
          <span>Best Combo</span>
          <strong>{bestCombo}x</strong>
        </div>
        <div className="trainer-stat">
          <span>Coins</span>
          <strong>{coins}</strong>
        </div>
      </div>

      <div className={`trainer-feedback${feedback ? (feedback === 'MISS!' ? ' miss' : ' hit') : ''}`}>
        {feedback}
      </div>

      <div className="trainer-timer">{isPlaying ? timerLabel : 'Press start to begin a training sprint.'}</div>

      <div className="trainer-controls">
        {isPlaying ? (
          <>
            <button type="button" onClick={handlePerfectHit} disabled={!currentMove}>
              Log perfect rep
            </button>
            <button type="button" className="secondary" onClick={handleIntentionalMiss}>
              Miss window
            </button>
            <button type="button" className="secondary" onClick={handleStopWorkout}>
              End session
            </button>
          </>
        ) : (
          <button type="button" onClick={handleStartWorkout}>
            Start workout
          </button>
        )}
      </div>

      <div className="trainer-move">
        {isPlaying ? (
          currentMove ? (
            <>
              <h3>{currentMove.title}</h3>
              <p>{currentMove.description}</p>
              <div className="move-meta">
                <span>Base score: +{currentMove.score}</span>
                <span>Coins: +{currentMove.coins}</span>
                <span>Window: {formatMilliseconds(currentMove.window)}s</span>
              </div>
            </>
          ) : (
            <p>Preparing the next rep… keep the momentum!</p>
          )
        ) : (
          <p>Preview moves by starting a session. Each rep stacks combo bonuses for extra points and coins.</p>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById('trainer-root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <WorkoutTrainer />
    </React.StrictMode>,
  );
}
