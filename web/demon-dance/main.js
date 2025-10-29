import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@18.3.1?dev';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?dev';
import {
  Play,
  Pause,
  Star,
  Zap,
  Award,
  ShoppingBag,
  Check,
  Sparkles,
} from 'https://esm.sh/lucide-react@0.356.0?bundle';

// --- GAME CONFIGURATION ---
const ACTIONS = {
  SPIN: { name: 'Spin', emoji: '🔄', color: 'bg-fuchsia-600', ring: 'ring-fuchsia-400/50', icon: '🌀' },
  STRIKE: { name: 'Strike', emoji: '👊', color: 'bg-red-600', ring: 'ring-red-400/50', icon: '⚔️' },
  JUMP: { name: 'Jump', emoji: '⬆️', color: 'bg-cyan-600', ring: 'ring-cyan-400/50', icon: '⚡' },
  POSE: { name: 'Pose', emoji: '💅', color: 'bg-indigo-600', ring: 'ring-indigo-400/50', icon: '⭐' },
};

const DANCE_MOVES = [
  { name: 'Demon Portal Spin', action: ACTIONS.SPIN, description: 'A fluid, gravity-defying swirl.', power: 'SPEED' },
  { name: 'Spirit Sword Strike', action: ACTIONS.STRIKE, description: 'A sharp slice to banish shadows.', power: 'POWER' },
  { name: 'Shadow Step Slide', action: ACTIONS.POSE, description: 'A stylish, quick transition.', power: 'STEALTH' },
  { name: 'Energy Wave Jump', action: ACTIONS.JUMP, description: 'Leap high to launch energy.', power: 'ENERGY' },
  { name: 'Heart Shield Pop', action: ACTIONS.POSE, description: 'Pop and lock with attitude.', power: 'SHIELD' },
  { name: 'Thunder Kick Combo', action: ACTIONS.STRIKE, description: 'Powerful triple-kick sequence.', power: 'STRIKE' },
  { name: 'Mystic Hip Roll', action: ACTIONS.SPIN, description: 'Roll those hips in a magic circle.', power: 'MAGIC' },
  { name: 'Victory Star Pose', action: ACTIONS.JUMP, description: 'End with a dazzling, high stance.', power: 'CHARM' },
];

const SHOP_ITEMS = [
  { id: 1, name: 'Neon Cybersuit', emoji: '👚', cost: 150, type: 'outfit', color: 'text-cyan-400' },
  { id: 2, name: 'Celestial Wings', emoji: '🕊️', cost: 220, type: 'accessory', color: 'text-purple-300' },
  { id: 3, name: 'Rave Cat Headphones', emoji: '🎧', cost: 120, type: 'accessory', color: 'text-lime-400' },
  { id: 4, name: 'Vampire Sneakers', emoji: '👟', cost: 180, type: 'shoes', color: 'text-red-400' },
  { id: 5, name: 'Glitter Bomb Lipstick', emoji: '💄', cost: 90, type: 'accessory', color: 'text-pink-400' },
  { id: 6, name: 'Holographic Skirt', emoji: '👗', cost: 160, type: 'outfit', color: 'text-yellow-400' },
  { id: 7, name: 'K-Pop Ring Light', emoji: '💡', cost: 80, type: 'accessory', color: 'text-white' },
  { id: 8, name: 'Aura Booster Drink', emoji: '🍹', cost: 50, type: 'food', color: 'text-orange-400' },
];

const MOVE_TIME_MS = 2500;
const STORAGE_KEY = 'demon_dance_state_v1';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [showShop, setShowShop] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [equippedItem, setEquippedItem] = useState(null);
  const [moveStartTime, setMoveStartTime] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [now, setNow] = useState(Date.now());

  // --- PERSISTENCE (load) ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data?.score === 'number') setScore(data.score);
      if (typeof data?.coins === 'number') setCoins(data.coins);
      if (typeof data?.level === 'number') setLevel(data.level);
      if (Array.isArray(data?.inventory)) setInventory(data.inventory);
      if (data?.equippedItem) setEquippedItem(data.equippedItem);
    } catch {
      // ignore malformed storage
    }
  }, []);

  // --- PERSISTENCE (save) ---
  useEffect(() => {
    const payload = { score, coins, level, inventory, equippedItem };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage might be disabled
    }
  }, [score, coins, level, inventory, equippedItem]);

  const startNextMove = useCallback(() => {
    const newMoveIndex = Math.floor(Math.random() * DANCE_MOVES.length);
    setCurrentMoveIndex(newMoveIndex);
    setMoveStartTime(Date.now());
  }, []);

  const handleMoveResult = useCallback(
    (success, scoreIncrease = 0, coinsGain = 0) => {
      setMoveStartTime(0);
      if (success) {
        setCombo((prevCombo) => {
          const newCombo = prevCombo + 1;
          setScore((prev) => prev + scoreIncrease + newCombo * 5);
          setCoins((prev) => {
            const comboBonusCoins = Math.floor(newCombo / 5) * 2;
            const baseSuccessCoins = 2;
            return prev + coinsGain + baseSuccessCoins + comboBonusCoins;
          });
          return newCombo;
        });
      } else {
        setCombo(0);
        setFeedback((prev) => (prev === 'MISS!' ? 'MISS!' : prev));
      }

      setTimeout(() => {
        setFeedback('');
        if (isPlaying) {
          startNextMove();
        }
      }, 500);
    },
    [isPlaying, startNextMove]
  );

  // Smooth progress ticker
  useEffect(() => {
    if (!isPlaying || moveStartTime === 0) {
      return undefined;
    }
    let rafId;
    const tick = () => {
      setNow(Date.now());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, moveStartTime]);

  // QTE Timeout
  useEffect(() => {
    if (!isPlaying || moveStartTime === 0) {
      return undefined;
    }
    const id = setTimeout(() => {
      setFeedback('MISS!');
      handleMoveResult(false);
    }, MOVE_TIME_MS);
    return () => clearTimeout(id);
  }, [isPlaying, moveStartTime, handleMoveResult]);

  // Level Up
  useEffect(() => {
    if (score >= level * 500) {
      setLevel((prev) => prev + 1);
    }
  }, [score, level]);

  const handleStartStopClick = useCallback(() => {
    setIsPlaying((prev) => {
      const newState = !prev;
      if (newState) {
        setFeedback('');
        startNextMove();
      } else {
        setMoveStartTime(0);
        setFeedback('Paused...');
      }
      return newState;
    });
  }, [startNextMove]);

  const handleUserAction = useCallback(
    (actionPressed) => {
      if (!isPlaying || moveStartTime === 0 || feedback) {
        return;
      }

      const timeElapsed = Date.now() - moveStartTime;
      const requiredAction = DANCE_MOVES[currentMoveIndex].action;
      const isCorrect = actionPressed.name === requiredAction.name;

      if (!isCorrect) {
        setFeedback('WRONG!');
        handleMoveResult(false);
        return;
      }

      const delta = MOVE_TIME_MS - timeElapsed;
      const absDelta = Math.abs(delta);

      let feedbackText = 'GOOD!';
      let scoreIncrease = 10;

      if (absDelta <= 250) {
        feedbackText = 'PERFECT!';
        scoreIncrease = 50;
      } else if (absDelta <= 500) {
        feedbackText = 'GREAT!';
        scoreIncrease = 30;
      }

      setFeedback(feedbackText);
      handleMoveResult(true, scoreIncrease, 1);
    },
    [isPlaying, moveStartTime, feedback, currentMoveIndex, handleMoveResult]
  );

  const buyItem = useCallback(
    (item) => {
      if (coins >= item.cost && !inventory.some((i) => i.id === item.id)) {
        setCoins((prev) => prev - item.cost);
        setInventory((prev) => [...prev, item]);
        setEquippedItem(item);
      }
    },
    [coins, inventory]
  );

  const equipItem = useCallback((item) => {
    setEquippedItem(item);
  }, []);

  useEffect(() => {
    const keyToAction = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleStartStopClick();
        return;
      }
      if (!isPlaying || moveStartTime === 0 || feedback) {
        return;
      }
      switch (e.key) {
        case 'ArrowUp':
          handleUserAction(ACTIONS.JUMP);
          break;
        case 'ArrowLeft':
          handleUserAction(ACTIONS.SPIN);
          break;
        case 'ArrowRight':
          handleUserAction(ACTIONS.POSE);
          break;
        case 'ArrowDown':
          handleUserAction(ACTIONS.STRIKE);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', keyToAction);
    return () => window.removeEventListener('keydown', keyToAction);
  }, [isPlaying, moveStartTime, feedback, handleUserAction, handleStartStopClick]);

  const currentMove = DANCE_MOVES[currentMoveIndex];
  const timeRemaining =
    moveStartTime > 0 ? Math.max(0, MOVE_TIME_MS - (now - moveStartTime)) : MOVE_TIME_MS;
  const progressPercent = (timeRemaining / MOVE_TIME_MS) * 100;

  const feedbackStyle = (fb) => {
    switch (fb) {
      case 'PERFECT!':
        return 'text-4xl text-cyan-300 tracking-widest drop-shadow-[0_0_15px_rgba(52,211,235,1)]';
      case 'GREAT!':
        return 'text-3xl text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,1)]';
      case 'GOOD!':
        return 'text-2xl text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,1)]';
      case 'WRONG!':
      case 'MISS!':
        return 'text-4xl text-red-500 tracking-widest drop-shadow-[0_0_20px_rgba(239,68,68,1)]';
      default:
        return 'text-2xl text-white';
    }
  };

  const ActionButton = ({ action }) => (
    <button
      onClick={() => handleUserAction(action)}
      disabled={!isPlaying || moveStartTime === 0 || feedback}
      className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg font-black text-sm sm:text-lg text-white transition-all duration-100 transform active:scale-95 border-2 border-transparent ${action.color} ${
        isPlaying && moveStartTime > 0
          ? `shadow-xl shadow-black/80 hover:scale-[1.05] border-fuchsia-400/50 ring-2 ${action.ring}`
          : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="text-3xl sm:text-4xl mb-1 drop-shadow-md">{action.emoji}</div>
      {action.name.toUpperCase()}
    </button>
  );

  const ShopItemCard = ({ item }) => {
    const isInInventory = inventory.some((i) => i.id === item.id);
    const isEquipped = equippedItem?.id === item.id;
    return (
      <div
        className={`bg-black/40 rounded-xl p-4 text-center backdrop-blur flex flex-col items-center justify-between h-full transition hover:bg-black/60 border-2 border-transparent ${
          isEquipped ? 'border-cyan-400 shadow-[0_0_15px_rgba(52,211,235,0.7)]' : 'border-gray-700'
        }`}
      >
        <div>
          <div className={`text-4xl sm:text-5xl mb-2 ${item.color} drop-shadow-lg`}>{item.emoji}</div>
          <h3 className="font-extrabold mb-2 text-sm sm:text-base text-gray-100">{item.name}</h3>
        </div>

        <div className="w-full mt-3">
          {isInInventory ? (
            <button
              onClick={() => equipItem(item)}
              className={`w-full py-2 rounded-lg font-bold text-sm transition-all duration-150 shadow-md ${
                isEquipped
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50'
                  : 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white'
              }`}
            >
              {isEquipped ? (
                <>
                  <Check size={16} className="inline mr-1" /> EQUIPPED
                </>
              ) : (
                'EQUIP'
              )}
            </button>
          ) : (
            <button
              onClick={() => buyItem(item)}
              disabled={coins < item.cost}
              className={`w-full py-2 rounded-lg font-bold text-sm transition-all duration-150 shadow-md ${
                coins >= item.cost
                  ? 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-900/50 text-white'
                  : 'bg-gray-700 cursor-not-allowed opacity-70 text-gray-400'
              }`}
            >
              {coins >= item.cost ? `Buy 💰 ${item.cost}` : `💰 ${item.cost} (LOCKED)`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-black text-white p-4 sm:p-6 font-['Inter']"
      style={{ backgroundImage: 'radial-gradient(at 50% 100%, #150030 0%, #000000 70%)' }}
    >
      {/* Header Stats */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-black/70 rounded-xl p-3 backdrop-blur border-2 border-gray-700 shadow-2xl shadow-fuchsia-900/30">
          <div className="flex justify-around items-center flex-wrap text-sm sm:text-base gap-2 tracking-wide">
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap className="text-cyan-400 w-5 h-5 drop-shadow-[0_0_5px_cyan]" />
              <span className="font-bold text-cyan-200">LEVEL {level}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Star className="text-yellow-400 w-5 h-5 drop-shadow-[0_0_5px_yellow]" />
              <span className="font-bold text-yellow-300">SCORE: {score}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Award className="text-red-400 w-5 h-5 drop-shadow-[0_0_5px_red]" />
              <span className={`font-black tracking-widest ${
                combo > 0 ? 'text-red-500 drop-shadow-[0_0_8px_red]' : 'text-gray-400'
              }`}
              >
                COMBO: {combo}x
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="text-xl sm:text-2xl text-yellow-500">💰</div>
              <span className="font-bold text-yellow-300">{coins} CREDITS</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Game Area --- */}
      {!showShop ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,0,100,0.5)] border-4 border-fuchsia-500">
            <h1 className="text-2xl sm:text-4xl font-black text-center mb-6 text-fuchsia-300 tracking-widest drop-shadow-[0_0_10px_rgba(255,0,100,0.8)]">
              // CORE STAGE //
            </h1>

            {/* Equipped Item Display */}
            <div className="text-center mb-4 min-h-[40px]">
              {equippedItem && (
                <div className="inline-flex items-center bg-black/60 p-2 rounded-full border border-cyan-400 shadow-lg shadow-cyan-900/50">
                  <Sparkles className="w-4 h-4 text-cyan-300 mr-1 animate-spin" style={{ animationDuration: '2s' }} />
                  <span className="text-xs font-semibold text-gray-300 mr-2">STATUS EFFECT:</span>
                  <span
                    className={`text-xl font-bold tracking-wider ${equippedItem.color}`}
                    title={equippedItem.name}
                  >
                    {equippedItem.emoji} {equippedItem.name}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-black/70 rounded-2xl p-6 sm:p-8 mb-6 min-h-[250px] flex flex-col justify-center items-center relative overflow-hidden border-2 border-gray-700 shadow-inner shadow-fuchsia-900/50">
              {/* QTE Timer/Progress Bar */}
              {isPlaying && moveStartTime > 0 && (
                <div
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-red-600 to-yellow-400"
                  style={{ width: `${progressPercent}%`, transition: 'width 0.1s linear' }}
                />
              )}

              {/* Feedback Display */}
              {feedback && (
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10 font-black transition-opacity duration-300 ${feedbackStyle(
                    feedback
                  )}`}
                >
                  {feedback}
                </div>
              )}

              {/* Dance Move Display */}
              <div className="text-6xl sm:text-8xl mb-4 text-cyan-400 drop-shadow-[0_0_10px_cyan] animate-pulse">
                {currentMove.action.icon}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center text-red-400 tracking-widest drop-shadow-[0_0_5px_red]">
                {currentMove.name}
              </h2>
              <p className="text-base sm:text-lg text-center mb-4 text-gray-300 italic">
                {currentMove.description}
              </p>
              <div className="bg-fuchsia-800 px-4 py-2 rounded-full shadow-lg shadow-fuchsia-900/50 border border-fuchsia-400">
                <span className="font-bold text-sm sm:text-lg text-white">
                  ACTION: {currentMove.action.name.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
              {Object.values(ACTIONS).map((action) => (
                <ActionButton key={action.name} action={action} />
              ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={handleStartStopClick}
                className="bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl flex items-center gap-3 shadow-lime-900/50 shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-150 border-2 border-lime-300"
                style={{ textShadow: '0 0 5px #a7f3d0' }}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                {isPlaying ? 'PAUSE BATTLE' : 'START RHYTHM!'}
              </button>
            </div>

            {/* Encouragement */}
            <div className="text-center">
              <p className="text-base sm:text-lg text-gray-400">
                {isPlaying ? (
                  combo > 15 ? (
                    <span className="text-yellow-400 drop-shadow-[0_0_8px_yellow] font-bold">
                      UNSTOPPABLE! PUSH THE LIMITS!
                    </span>
                  ) : combo > 5 ? (
                    <span className="text-red-400 font-bold">RISING HEAT! MAINTAIN THE CHAIN!</span>
                  ) : (
                    'FIGHT! Match the move action before the bar runs out.'
                  )
                ) : (
                  'PRESS START to enter the Demon Dance Zone.'
                )}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Keys: ← Spin, ↓ Strike, ↑ Jump, → Pose, Space = Start/Pause
              </p>
            </div>
          </div>

          {/* Shop Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => setShowShop(true)}
              className="bg-black/80 hover:bg-black/90 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl flex items-center gap-3 shadow-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.7)] transform hover:scale-[1.02] active:scale-95 transition mx-auto border-2 border-fuchsia-500 text-fuchsia-300"
            >
              <ShoppingBag size={24} className="drop-shadow-[0_0_5px_rgba(217,70,239,1)]" />
              VISIT THE GLAM SHOP
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(52,211,235,0.5)] border-4 border-cyan-500">
            <h1 className="text-3xl sm:text-4xl font-black text-center mb-6 text-cyan-300 tracking-widest drop-shadow-[0_0_10px_rgba(52,211,235,0.8)]">
              // GLAM SHOP & INVENTORY //
            </h1>

            <p className="text-center text-gray-400 mb-6">
              Acquire covetable, high-status gear to enhance your aesthetic and show your dedication.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {SHOP_ITEMS.map((item) => (
                <ShopItemCard key={item.id} item={item} />
              ))}
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setShowShop(false)}
                className="bg-black/80 hover:bg-black/90 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl shadow-cyan-500/50 shadow-[0_0_20px_rgba(52,211,235,0.7)] transform hover:scale-[1.02] active:scale-95 transition mx-auto border-2 border-cyan-500 text-cyan-300"
              >
                RETURN TO STAGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
