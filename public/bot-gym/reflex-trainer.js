import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'https://esm.sh/react@18.3.1?dev';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?dev';

const MOVE_TIME_MS = 1800;
const MOVES = ['TAP', 'PRESS', 'BOOST', 'STRIKE'];
const SUCCESS_MESSAGES = [
  'Clean hit! Keep it rolling.',
  'Sharp timing — bot is impressed.',
  'Locked in. Stay on tempo.',
  'Reaction dialed. Next rep!',
];

const choose = (items) => items[Math.floor(Math.random() * items.length)];

const formatTime = (ms) => `${(ms / 1000).toFixed(2)}s`;

function ReflexTrainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState('Paused...');
  const [currentMove, setCurrentMove] = useState('');
  const [moveStartTime, setMoveStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOVE_TIME_MS);
  const [stopReason, setStopReason] = useState(null);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const startNextMove = useCallback(
    (force = false) => {
      if (!force && !isPlayingRef.current) {
        return;
      }
      const next = choose(MOVES);
      setStopReason(null);
      setCurrentMove(next);
      setMoveStartTime(Date.now());
      setTimeLeft(MOVE_TIME_MS);
    },
    [],
  );

  const handleMoveResult = useCallback(
    (isHit) => {
      if (!isHit) {
        setStopReason('miss');
        setFeedback('MISS!');
        setIsPlaying(false);
        setMoveStartTime(0);
        setCurrentMove('');
        setTimeLeft(MOVE_TIME_MS);
        return;
      }

      setScore((previous) => {
        const nextScore = previous + 1;
        setBestScore((currentBest) => Math.max(currentBest, nextScore));
        return nextScore;
      });
      setFeedback(choose(SUCCESS_MESSAGES));
      startNextMove();
    },
    [startNextMove],
  );

  const handleTap = useCallback(() => {
    if (!isPlaying || moveStartTime === 0) {
      return;
    }
    const elapsed = Date.now() - moveStartTime;
    handleMoveResult(elapsed <= MOVE_TIME_MS);
  }, [handleMoveResult, isPlaying, moveStartTime]);

  const previousIsPlayingRef = useRef(isPlaying);
  useEffect(() => {
    const wasPlaying = previousIsPlayingRef.current;
    if (isPlaying && !wasPlaying) {
      setScore(0);
      setFeedback('');
      startNextMove(true);
    } else if (!isPlaying && wasPlaying) {
      setMoveStartTime(0);
      setCurrentMove('');
      if (stopReason === 'pause') {
        setFeedback('Paused...');
      }
    }
    previousIsPlayingRef.current = isPlaying;
  }, [isPlaying, startNextMove, stopReason]);

  useEffect(() => {
    if (!isPlaying || moveStartTime === 0) {
      return;
    }
    const timeout = window.setTimeout(() => {
      handleMoveResult(false);
    }, MOVE_TIME_MS);
    return () => window.clearTimeout(timeout);
  }, [handleMoveResult, isPlaying, moveStartTime]);

  useEffect(() => {
    if (!isPlaying || moveStartTime === 0) {
      setTimeLeft(MOVE_TIME_MS);
      return;
    }

    let frameId = 0;
    const update = () => {
      const elapsed = Date.now() - moveStartTime;
      const remaining = Math.max(0, MOVE_TIME_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining > 0) {
        frameId = window.requestAnimationFrame(update);
      }
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, moveStartTime]);

  const handleStartStopClick = useCallback(() => {
    setIsPlaying((previous) => {
      const next = !previous;
      setStopReason(next ? null : 'pause');
      if (!next) {
        setTimeLeft(MOVE_TIME_MS);
      }
      return next;
    });
  }, []);

  const progress = useMemo(() => {
    if (!isPlaying || moveStartTime === 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((timeLeft / MOVE_TIME_MS) * 100)));
  }, [isPlaying, moveStartTime, timeLeft]);

  const h = React.createElement;

  return h(
    'section',
    { className: 'reflex-trainer', 'aria-live': 'polite' },
    h(
      'header',
      { className: 'reflex-header' },
      h(
        'div',
        null,
        h('h2', null, 'Reaction Tempo Trainer'),
        h('p', null, 'Tap before the beat drops to keep your bot in rhythm.'),
      ),
      h(
        'div',
        { className: 'reflex-metrics' },
        h(
          'div',
          null,
          h('span', null, 'Current streak'),
          h('strong', null, score),
        ),
        h(
          'div',
          null,
          h('span', null, 'Best streak'),
          h('strong', null, bestScore),
        ),
      ),
    ),
    h(
      'div',
      { className: 'reflex-card' },
      h(
        'div',
        { className: 'reflex-status' },
        h(
          'div',
          { className: 'reflex-cue' },
          h('span', { className: 'reflex-label' }, 'Cue'),
          h('strong', null, isPlaying ? currentMove || 'Get ready' : 'Paused'),
        ),
        h(
          'div',
          {
            className: `reflex-feedback ${feedback ? 'visible' : ''}`,
          },
          feedback || 'Stay sharp.',
        ),
      ),
      h(
        'div',
        {
          className: 'reflex-progress',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': progress,
        },
        h('span', { style: { width: `${progress}%` } }),
      ),
      h(
        'p',
        { className: 'reflex-countdown' },
        isPlaying ? `Time left: ${formatTime(timeLeft)}` : 'Tap start to begin a run.',
      ),
      h(
        'div',
        { className: 'reflex-actions' },
        h(
          'button',
          {
            type: 'button',
            className: 'reflex-button primary',
            onClick: handleStartStopClick,
          },
          isPlaying ? 'Pause' : 'Start run',
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'reflex-button secondary',
            onClick: handleTap,
            disabled: !isPlaying || moveStartTime === 0,
          },
          'Hit the cue',
        ),
      ),
    ),
  );
}

const container = document.getElementById('reflex-trainer-root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(ReflexTrainer));
}
