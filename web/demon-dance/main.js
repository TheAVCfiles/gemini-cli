import { Fragment, jsx, jsxs } from "https://esm.sh/react@18.3.1?dev/jsx-runtime";
import React, { useState, useEffect, useCallback } from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import {
  Play,
  Pause,
  Star,
  Zap,
  Award,
  ShoppingBag,
  Check,
  Sparkles
} from "https://esm.sh/lucide-react@0.356.0?bundle";
const ACTIONS = {
  SPIN: { name: "Spin", emoji: "\u{1F504}", color: "bg-fuchsia-600", ring: "ring-fuchsia-400/50", icon: "\u{1F300}" },
  STRIKE: { name: "Strike", emoji: "\u{1F44A}", color: "bg-red-600", ring: "ring-red-400/50", icon: "\u2694\uFE0F" },
  JUMP: { name: "Jump", emoji: "\u2B06\uFE0F", color: "bg-cyan-600", ring: "ring-cyan-400/50", icon: "\u26A1" },
  POSE: { name: "Pose", emoji: "\u{1F485}", color: "bg-indigo-600", ring: "ring-indigo-400/50", icon: "\u2B50" }
};
const DANCE_MOVES = [
  { name: "Demon Portal Spin", action: ACTIONS.SPIN, description: "A fluid, gravity-defying swirl.", power: "SPEED" },
  { name: "Spirit Sword Strike", action: ACTIONS.STRIKE, description: "A sharp slice to banish shadows.", power: "POWER" },
  { name: "Shadow Step Slide", action: ACTIONS.POSE, description: "A stylish, quick transition.", power: "STEALTH" },
  { name: "Energy Wave Jump", action: ACTIONS.JUMP, description: "Leap high to launch energy.", power: "ENERGY" },
  { name: "Heart Shield Pop", action: ACTIONS.POSE, description: "Pop and lock with attitude.", power: "SHIELD" },
  { name: "Thunder Kick Combo", action: ACTIONS.STRIKE, description: "Powerful triple-kick sequence.", power: "STRIKE" },
  { name: "Mystic Hip Roll", action: ACTIONS.SPIN, description: "Roll those hips in a magic circle.", power: "MAGIC" },
  { name: "Victory Star Pose", action: ACTIONS.JUMP, description: "End with a dazzling, high stance.", power: "CHARM" }
];
const SHOP_ITEMS = [
  { id: 1, name: "Neon Cybersuit", emoji: "\u{1F45A}", cost: 150, type: "outfit", color: "text-cyan-400" },
  { id: 2, name: "Celestial Wings", emoji: "\u{1F54A}\uFE0F", cost: 220, type: "accessory", color: "text-purple-300" },
  { id: 3, name: "Rave Cat Headphones", emoji: "\u{1F3A7}", cost: 120, type: "accessory", color: "text-lime-400" },
  { id: 4, name: "Vampire Sneakers", emoji: "\u{1F45F}", cost: 180, type: "shoes", color: "text-red-400" },
  { id: 5, name: "Glitter Bomb Lipstick", emoji: "\u{1F484}", cost: 90, type: "accessory", color: "text-pink-400" },
  { id: 6, name: "Holographic Skirt", emoji: "\u{1F457}", cost: 160, type: "outfit", color: "text-yellow-400" },
  { id: 7, name: "K-Pop Ring Light", emoji: "\u{1F4A1}", cost: 80, type: "accessory", color: "text-white" },
  { id: 8, name: "Aura Booster Drink", emoji: "\u{1F379}", cost: 50, type: "food", color: "text-orange-400" }
];
const MOVE_TIME_MS = 2500;
const STORAGE_KEY = "demon_dance_state_v1";
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
  const [feedback, setFeedback] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data?.score === "number") setScore(data.score);
      if (typeof data?.coins === "number") setCoins(data.coins);
      if (typeof data?.level === "number") setLevel(data.level);
      if (Array.isArray(data?.inventory)) setInventory(data.inventory);
      if (data?.equippedItem) setEquippedItem(data.equippedItem);
    } catch {
    }
  }, []);
  useEffect(() => {
    const payload = { score, coins, level, inventory, equippedItem };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
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
        setFeedback((prev) => prev === "MISS!" ? "MISS!" : prev);
      }
      setTimeout(() => {
        setFeedback("");
        if (isPlaying) {
          startNextMove();
        }
      }, 500);
    },
    [isPlaying, startNextMove]
  );
  useEffect(() => {
    if (!isPlaying || moveStartTime === 0) {
      return void 0;
    }
    let rafId;
    const tick = () => {
      setNow(Date.now());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, moveStartTime]);
  useEffect(() => {
    if (!isPlaying || moveStartTime === 0) {
      return void 0;
    }
    const id = setTimeout(() => {
      setFeedback("MISS!");
      handleMoveResult(false);
    }, MOVE_TIME_MS);
    return () => clearTimeout(id);
  }, [isPlaying, moveStartTime, handleMoveResult]);
  useEffect(() => {
    if (score >= level * 500) {
      setLevel((prev) => prev + 1);
    }
  }, [score, level]);
  const handleStartStopClick = useCallback(() => {
    setIsPlaying((prev) => {
      const newState = !prev;
      if (newState) {
        setFeedback("");
        startNextMove();
      } else {
        setMoveStartTime(0);
        setFeedback("Paused...");
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
        setFeedback("WRONG!");
        handleMoveResult(false);
        return;
      }
      const delta = MOVE_TIME_MS - timeElapsed;
      const absDelta = Math.abs(delta);
      let feedbackText = "GOOD!";
      let scoreIncrease = 10;
      if (absDelta <= 250) {
        feedbackText = "PERFECT!";
        scoreIncrease = 50;
      } else if (absDelta <= 500) {
        feedbackText = "GREAT!";
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
      if (e.code === "Space") {
        e.preventDefault();
        handleStartStopClick();
        return;
      }
      if (!isPlaying || moveStartTime === 0 || feedback) {
        return;
      }
      switch (e.key) {
        case "ArrowUp":
          handleUserAction(ACTIONS.JUMP);
          break;
        case "ArrowLeft":
          handleUserAction(ACTIONS.SPIN);
          break;
        case "ArrowRight":
          handleUserAction(ACTIONS.POSE);
          break;
        case "ArrowDown":
          handleUserAction(ACTIONS.STRIKE);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", keyToAction);
    return () => window.removeEventListener("keydown", keyToAction);
  }, [isPlaying, moveStartTime, feedback, handleUserAction, handleStartStopClick]);
  const currentMove = DANCE_MOVES[currentMoveIndex];
  const timeRemaining = moveStartTime > 0 ? Math.max(0, MOVE_TIME_MS - (now - moveStartTime)) : MOVE_TIME_MS;
  const progressPercent = timeRemaining / MOVE_TIME_MS * 100;
  const feedbackStyle = (fb) => {
    switch (fb) {
      case "PERFECT!":
        return "text-4xl text-cyan-300 tracking-widest drop-shadow-[0_0_15px_rgba(52,211,235,1)]";
      case "GREAT!":
        return "text-3xl text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,1)]";
      case "GOOD!":
        return "text-2xl text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,1)]";
      case "WRONG!":
      case "MISS!":
        return "text-4xl text-red-500 tracking-widest drop-shadow-[0_0_20px_rgba(239,68,68,1)]";
      default:
        return "text-2xl text-white";
    }
  };
  const ActionButton = ({ action }) => /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => handleUserAction(action),
      disabled: !isPlaying || moveStartTime === 0 || feedback,
      className: `flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg font-black text-sm sm:text-lg text-white transition-all duration-100 transform active:scale-95 border-2 border-transparent ${action.color} ${isPlaying && moveStartTime > 0 ? `shadow-xl shadow-black/80 hover:scale-[1.05] border-fuchsia-400/50 ring-2 ${action.ring}` : "opacity-50 cursor-not-allowed"}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl sm:text-4xl mb-1 drop-shadow-md", children: action.emoji }),
        action.name.toUpperCase()
      ]
    }
  );
  const ShopItemCard = ({ item }) => {
    const isInInventory = inventory.some((i) => i.id === item.id);
    const isEquipped = equippedItem?.id === item.id;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: `bg-black/40 rounded-xl p-4 text-center backdrop-blur flex flex-col items-center justify-between h-full transition hover:bg-black/60 border-2 border-transparent ${isEquipped ? "border-cyan-400 shadow-[0_0_15px_rgba(52,211,235,0.7)]" : "border-gray-700"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: `text-4xl sm:text-5xl mb-2 ${item.color} drop-shadow-lg`, children: item.emoji }),
            /* @__PURE__ */ jsx("h3", { className: "font-extrabold mb-2 text-sm sm:text-base text-gray-100", children: item.name })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full mt-3", children: isInInventory ? /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => equipItem(item),
              className: `w-full py-2 rounded-lg font-bold text-sm transition-all duration-150 shadow-md ${isEquipped ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/50" : "bg-fuchsia-500 hover:bg-fuchsia-600 text-white"}`,
              children: isEquipped ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Check, { size: 16, className: "inline mr-1" }),
                " EQUIPPED"
              ] }) : "EQUIP"
            }
          ) : /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => buyItem(item),
              disabled: coins < item.cost,
              className: `w-full py-2 rounded-lg font-bold text-sm transition-all duration-150 shadow-md ${coins >= item.cost ? "bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-900/50 text-white" : "bg-gray-700 cursor-not-allowed opacity-70 text-gray-400"}`,
              children: coins >= item.cost ? `Buy \u{1F4B0} ${item.cost}` : `\u{1F4B0} ${item.cost} (LOCKED)`
            }
          ) })
        ]
      }
    );
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "min-h-screen bg-black text-white p-4 sm:p-6 font-['Inter']",
      style: { backgroundImage: "radial-gradient(at 50% 100%, #150030 0%, #000000 70%)" },
      children: [
        /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto mb-6", children: /* @__PURE__ */ jsx("div", { className: "bg-black/70 rounded-xl p-3 backdrop-blur border-2 border-gray-700 shadow-2xl shadow-fuchsia-900/30", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-around items-center flex-wrap text-sm sm:text-base gap-2 tracking-wide", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
            /* @__PURE__ */ jsx(Zap, { className: "text-cyan-400 w-5 h-5 drop-shadow-[0_0_5px_cyan]" }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-cyan-200", children: [
              "LEVEL ",
              level
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
            /* @__PURE__ */ jsx(Star, { className: "text-yellow-400 w-5 h-5 drop-shadow-[0_0_5px_yellow]" }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-yellow-300", children: [
              "SCORE: ",
              score
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
            /* @__PURE__ */ jsx(Award, { className: "text-red-400 w-5 h-5 drop-shadow-[0_0_5px_red]" }),
            /* @__PURE__ */ jsxs(
              "span",
              {
                className: `font-black tracking-widest ${combo > 0 ? "text-red-500 drop-shadow-[0_0_8px_red]" : "text-gray-400"}`,
                children: [
                  "COMBO: ",
                  combo,
                  "x"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xl sm:text-2xl text-yellow-500", children: "\u{1F4B0}" }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-yellow-300", children: [
              coins,
              " CREDITS"
            ] })
          ] })
        ] }) }) }),
        !showShop ? /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,0,100,0.5)] border-4 border-fuchsia-500", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl sm:text-4xl font-black text-center mb-6 text-fuchsia-300 tracking-widest drop-shadow-[0_0_10px_rgba(255,0,100,0.8)]", children: "// CORE STAGE //" }),
            /* @__PURE__ */ jsx("div", { className: "text-center mb-4 min-h-[40px]", children: equippedItem && /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center bg-black/60 p-2 rounded-full border border-cyan-400 shadow-lg shadow-cyan-900/50", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-cyan-300 mr-1 animate-spin", style: { animationDuration: "2s" } }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-300 mr-2", children: "STATUS EFFECT:" }),
              /* @__PURE__ */ jsxs(
                "span",
                {
                  className: `text-xl font-bold tracking-wider ${equippedItem.color}`,
                  title: equippedItem.name,
                  children: [
                    equippedItem.emoji,
                    " ",
                    equippedItem.name
                  ]
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "bg-black/70 rounded-2xl p-6 sm:p-8 mb-6 min-h-[250px] flex flex-col justify-center items-center relative overflow-hidden border-2 border-gray-700 shadow-inner shadow-fuchsia-900/50", children: [
              isPlaying && moveStartTime > 0 && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute top-0 left-0 h-2 bg-gradient-to-r from-red-600 to-yellow-400",
                  style: { width: `${progressPercent}%`, transition: "width 0.1s linear" }
                }
              ),
              feedback && /* @__PURE__ */ jsx(
                "div",
                {
                  className: `absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10 font-black transition-opacity duration-300 ${feedbackStyle(
                    feedback
                  )}`,
                  children: feedback
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "text-6xl sm:text-8xl mb-4 text-cyan-400 drop-shadow-[0_0_10px_cyan] animate-pulse", children: currentMove.action.icon }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl sm:text-3xl font-black mb-2 text-center text-red-400 tracking-widest drop-shadow-[0_0_5px_red]", children: currentMove.name }),
              /* @__PURE__ */ jsx("p", { className: "text-base sm:text-lg text-center mb-4 text-gray-300 italic", children: currentMove.description }),
              /* @__PURE__ */ jsx("div", { className: "bg-fuchsia-800 px-4 py-2 rounded-full shadow-lg shadow-fuchsia-900/50 border border-fuchsia-400", children: /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm sm:text-lg text-white", children: [
                "ACTION: ",
                currentMove.action.name.toUpperCase()
              ] }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2 sm:gap-4 mb-6", children: Object.values(ACTIONS).map((action) => /* @__PURE__ */ jsx(ActionButton, { action }, action.name)) }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-4 mb-6", children: /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleStartStopClick,
                className: "bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl flex items-center gap-3 shadow-lime-900/50 shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-150 border-2 border-lime-300",
                style: { textShadow: "0 0 5px #a7f3d0" },
                children: [
                  isPlaying ? /* @__PURE__ */ jsx(Pause, { size: 28 }) : /* @__PURE__ */ jsx(Play, { size: 28 }),
                  isPlaying ? "PAUSE BATTLE" : "START RHYTHM!"
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-base sm:text-lg text-gray-400", children: isPlaying ? combo > 15 ? /* @__PURE__ */ jsx("span", { className: "text-yellow-400 drop-shadow-[0_0_8px_yellow] font-bold", children: "UNSTOPPABLE! PUSH THE LIMITS!" }) : combo > 5 ? /* @__PURE__ */ jsx("span", { className: "text-red-400 font-bold", children: "RISING HEAT! MAINTAIN THE CHAIN!" }) : "FIGHT! Match the move action before the bar runs out." : "PRESS START to enter the Demon Dance Zone." }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Keys: \u2190 Spin, \u2193 Strike, \u2191 Jump, \u2192 Pose, Space = Start/Pause" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-center mt-6", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowShop(true),
              className: "bg-black/80 hover:bg-black/90 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl flex items-center gap-3 shadow-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.7)] transform hover:scale-[1.02] active:scale-95 transition mx-auto border-2 border-fuchsia-500 text-fuchsia-300",
              children: [
                /* @__PURE__ */ jsx(ShoppingBag, { size: 24, className: "drop-shadow-[0_0_5px_rgba(217,70,239,1)]" }),
                "VISIT THE GLAM SHOP"
              ]
            }
          ) })
        ] }) : /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(52,211,235,0.5)] border-4 border-cyan-500", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl sm:text-4xl font-black text-center mb-6 text-cyan-300 tracking-widest drop-shadow-[0_0_10px_rgba(52,211,235,0.8)]", children: "// GLAM SHOP & INVENTORY //" }),
          /* @__PURE__ */ jsx("p", { className: "text-center text-gray-400 mb-6", children: "Acquire covetable, high-status gear to enhance your aesthetic and show your dedication." }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6", children: SHOP_ITEMS.map((item) => /* @__PURE__ */ jsx(ShopItemCard, { item }, item.id)) }),
          /* @__PURE__ */ jsx("div", { className: "text-center mt-6", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowShop(false),
              className: "bg-black/80 hover:bg-black/90 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-lg sm:text-xl shadow-cyan-500/50 shadow-[0_0_20px_rgba(52,211,235,0.7)] transform hover:scale-[1.02] active:scale-95 transition mx-auto border-2 border-cyan-500 text-cyan-300",
              children: "RETURN TO STAGE"
            }
          ) })
        ] }) })
      ]
    }
  );
};
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsx(App, {}));
