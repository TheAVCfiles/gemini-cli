// Decrypt-The-Girl/astro-trader-pro.jsx
import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import { Info, Moon, Pause, Play, Sun, TrendingUp } from "https://esm.sh/lucide-react@0.453.0?bundle";
import { jsx, jsxs } from "https://esm.sh/react@18.3.1?dev/jsx-runtime";
var DAY_MS = 24 * 60 * 60 * 1e3;
var TICK_MS = 100;
var ASSET_BIRTH_CHARTS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    color: "#F7931A",
    birthDate: "2009-01-03T18:15:05Z",
    birthChart: {
      sun: { sign: "Capricorn", degree: 13, house: 10 },
      moon: { sign: "Cancer", degree: 28, house: 4 },
      ascendant: { sign: "Libra", degree: 5 },
      ruling_planet: "Saturn"
    },
    currentPrice: 100,
    priceHistory: []
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    color: "#627EEA",
    birthDate: "2015-07-30T15:26:13Z",
    birthChart: {
      sun: { sign: "Leo", degree: 7, house: 5 },
      moon: { sign: "Aquarius", degree: 15, house: 11 },
      ascendant: { sign: "Sagittarius", degree: 22 },
      ruling_planet: "Sun"
    },
    currentPrice: 100,
    priceHistory: []
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    color: "#C2A633",
    birthDate: "2013-12-06T00:00:00Z",
    birthChart: {
      sun: { sign: "Sagittarius", degree: 14, house: 9 },
      moon: { sign: "Gemini", degree: 3, house: 3 },
      ascendant: { sign: "Aries", degree: 18 },
      ruling_planet: "Jupiter"
    },
    currentPrice: 100,
    priceHistory: []
  },
  {
    symbol: "SPX",
    name: "S&P 500",
    color: "#00A3E0",
    birthDate: "1957-03-04T09:30:00Z",
    birthChart: {
      sun: { sign: "Pisces", degree: 13, house: 12 },
      moon: { sign: "Taurus", degree: 8, house: 2 },
      ascendant: { sign: "Gemini", degree: 10 },
      ruling_planet: "Neptune"
    },
    currentPrice: 100,
    priceHistory: []
  },
  {
    symbol: "GOLD",
    name: "Gold",
    color: "#FFD700",
    birthDate: "1975-12-31T00:00:00Z",
    birthChart: {
      sun: { sign: "Capricorn", degree: 9, house: 10 },
      moon: { sign: "Scorpio", degree: 22, house: 8 },
      ascendant: { sign: "Virgo", degree: 15 },
      ruling_planet: "Saturn"
    },
    currentPrice: 100,
    priceHistory: []
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    color: "#E82127",
    birthDate: "2010-06-29T09:30:00Z",
    birthChart: {
      sun: { sign: "Cancer", degree: 7, house: 4 },
      moon: { sign: "Aries", degree: 19, house: 1 },
      ascendant: { sign: "Leo", degree: 12 },
      ruling_planet: "Moon"
    },
    currentPrice: 100,
    priceHistory: []
  }
];
var calculateMoonPhase = (timestamp) => {
  const lunarCycle = 29.53059 * DAY_MS;
  const knownNewMoon = (/* @__PURE__ */ new Date("2000-01-06T18:14:00Z")).getTime();
  const phase = (timestamp - knownNewMoon) % lunarCycle / lunarCycle;
  return phase < 0 ? phase + 1 : phase;
};
var getMoonPhaseName = (phase) => {
  if (phase < 0.03 || phase > 0.97) return "New Moon \u{1F311}";
  if (phase < 0.22) return "Waxing Crescent \u{1F312}";
  if (phase < 0.28) return "First Quarter \u{1F313}";
  if (phase < 0.47) return "Waxing Gibbous \u{1F314}";
  if (phase < 0.53) return "Full Moon \u{1F315}";
  if (phase < 0.72) return "Waning Gibbous \u{1F316}";
  if (phase < 0.78) return "Last Quarter \u{1F317}";
  return "Waning Crescent \u{1F318}";
};
var calculateTransits = (asset, currentDate) => {
  const aspects = [];
  const signals = { buy: [], sell: [] };
  const daysSinceBirth = (currentDate - new Date(asset.birthDate).getTime()) / DAY_MS;
  const sunTransit = daysSinceBirth % 365 / 365 * 360;
  const moonTransit = daysSinceBirth % 29.53 / 29.53 * 360;
  const sunToNatalSun = Math.abs(sunTransit - asset.birthChart.sun.degree);
  const moonToNatalSun = Math.abs(moonTransit - asset.birthChart.sun.degree);
  if (Math.abs(sunToNatalSun) < 8) {
    aspects.push({
      type: "Sun Conjunct Natal Sun",
      orb: sunToNatalSun.toFixed(1),
      strength: "STRONG",
      interpretation: "Solar return - major cycle completion/beginning"
    });
    signals.buy.push({
      reason: "Sun Return - Annual cycle restart",
      strength: 0.9,
      timing: "Enter on dips within 3 days"
    });
  }
  const trineOrbs = [Math.abs(sunToNatalSun - 120), Math.abs(sunToNatalSun - 240)];
  const isTrine = trineOrbs.some((orb) => orb < 8);
  if (isTrine) {
    aspects.push({
      type: "Sun Trine Natal Sun",
      orb: Math.min(...trineOrbs).toFixed(1),
      strength: "MODERATE",
      interpretation: "Harmonious energy flow - upward momentum"
    });
    signals.buy.push({
      reason: "Trine Aspect - Smooth sailing",
      strength: 0.7,
      timing: "Good for accumulation"
    });
  }
  const squareOrbs = [Math.abs(sunToNatalSun - 90), Math.abs(sunToNatalSun - 270)];
  const isSquare = squareOrbs.some((orb) => orb < 8);
  if (isSquare) {
    aspects.push({
      type: "Sun Square Natal Sun",
      orb: Math.min(...squareOrbs).toFixed(1),
      strength: "STRONG",
      interpretation: "Tension and challenges - high volatility period"
    });
    signals.sell.push({
      reason: "Square Aspect - Turbulence ahead",
      strength: 0.6,
      timing: "Take profits or wait for stabilization"
    });
  }
  const oppositionOrb = Math.abs(sunToNatalSun - 180);
  if (oppositionOrb < 8) {
    aspects.push({
      type: "Sun Opposition Natal Sun",
      orb: oppositionOrb.toFixed(1),
      strength: "STRONG",
      interpretation: "Maximum tension - trend reversal likely"
    });
    signals.sell.push({
      reason: "Opposition - Reversal imminent",
      strength: 0.85,
      timing: "Exit positions, wait for new direction"
    });
  }
  if (Math.abs(moonToNatalSun) < 5) {
    signals.buy.push({
      reason: "Moon Conjunct Natal Sun - Emotional peak",
      strength: 0.5,
      timing: "Short-term (24-48hr) buy window"
    });
  }
  const phase = calculateMoonPhase(currentDate);
  if (phase < 0.1 || phase > 0.9) {
    signals.buy.push({
      reason: "New Moon - Fresh cycle beginning",
      strength: 0.6,
      timing: "Plant seeds for next 2 weeks"
    });
  } else if (phase > 0.45 && phase < 0.55) {
    signals.sell.push({
      reason: "Full Moon - Emotional climax",
      strength: 0.6,
      timing: "Lock in gains, high volatility"
    });
  }
  return { aspects, signals };
};
var generatePriceData = (asset, aspects, moonPhase) => {
  const basePrice = asset.currentPrice || 100;
  let volatility = 5;
  if (aspects.some((a) => a.type.includes("Square") || a.type.includes("Opposition"))) {
    volatility = 15;
  }
  if (moonPhase > 0.45 && moonPhase < 0.55) {
    volatility *= 1.5;
  }
  let bias = 0;
  if (aspects.some((a) => a.type.includes("Trine") || a.type.includes("Sextile"))) {
    bias = 2;
  }
  if (aspects.some((a) => a.type.includes("Square"))) {
    bias = -1;
  }
  return basePrice + (Math.random() - 0.5 + bias * 0.1) * volatility;
};
var AstroTraderPro = () => {
  const [assets, setAssets] = useState(ASSET_BIRTH_CHARTS);
  const [selectedSymbol, setSelectedSymbol] = useState(ASSET_BIRTH_CHARTS[0].symbol);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [moonPhase, setMoonPhase] = useState(0);
  const [transitAspects, setTransitAspects] = useState([]);
  const [buySignals, setBuySignals] = useState([]);
  const [sellSignals, setSellSignals] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const selectedAsset = useMemo(
    () => {
      var _a;
      return (_a = assets.find((asset) => asset.symbol === selectedSymbol)) != null ? _a : assets[0];
    },
    [assets, selectedSymbol]
  );
  useEffect(() => {
    setAssets(
      (prev) => prev.map((asset) => ({
        ...asset,
        priceHistory: asset.priceHistory.length ? asset.priceHistory : [{ time: currentTime, price: asset.currentPrice || 100 }]
      }))
    );
  }, []);
  useEffect(() => {
    if (!selectedAsset) return;
    const phase = calculateMoonPhase(currentTime);
    setMoonPhase(phase);
    const { aspects, signals } = calculateTransits(selectedAsset, currentTime);
    setTransitAspects(aspects);
    setBuySignals(signals.buy);
    setSellSignals(signals.sell);
  }, [currentTime, selectedAsset]);
  useEffect(() => {
    if (!isPlaying) return void 0;
    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const nextTime = prevTime + DAY_MS;
        const nextPhase = calculateMoonPhase(nextTime);
        setAssets(
          (prevAssets) => prevAssets.map((asset) => {
            const { aspects } = calculateTransits(asset, nextTime);
            const newPrice = generatePriceData(asset, aspects, nextPhase);
            return {
              ...asset,
              currentPrice: newPrice,
              priceHistory: [
                ...asset.priceHistory.slice(-100),
                { time: nextTime, price: newPrice }
              ]
            };
          })
        );
        setMoonPhase(nextPhase);
        return nextTime;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [isPlaying]);
  const handleSelectAsset = (asset) => {
    setSelectedSymbol(asset.symbol);
    setCurrentTime((prev) => prev);
  };
  if (!selectedAsset) return null;
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent", children: "AstroTrader Pro" }),
      /* @__PURE__ */ jsx("p", { className: "text-purple-300", children: "Birth Chart Overlays + Real-Time Market Signals" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsPlaying((prev) => !prev),
            className: "flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:scale-105 transition-transform",
            children: [
              isPlaying ? /* @__PURE__ */ jsx(Pause, { size: 20 }) : /* @__PURE__ */ jsx(Play, { size: 20 }),
              isPlaying ? "Pause" : "Start Simulation"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowTutorial((prev) => !prev),
            className: "flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Info, { size: 20 }),
              "How to Read"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-purple-900/50 rounded-lg", children: [
          /* @__PURE__ */ jsx(Moon, { className: "w-5 h-5 text-yellow-300" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: getMoonPhaseName(moonPhase) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-purple-300", children: new Date(currentTime).toLocaleDateString() })
      ] })
    ] }) }),
    showTutorial && /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-blue-900/80 to-purple-900/80 backdrop-blur-lg rounded-xl p-6 border border-blue-500/50 mb-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-4", children: "\u{1F4DA} How to Read Astro-Trading Signals" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-yellow-400 mb-3", children: "\u{1F52E} Understanding Aspects" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Conjunction (0\xB0):" }),
              " New cycles begin. Major turning points.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "Often bullish" }),
              " for annual solar returns."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Trine (120\xB0):" }),
              " Harmony and flow.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "Buy signal" }),
              " - smooth upward movement expected."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Square (90\xB0):" }),
              " Tension and challenge.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-yellow-400", children: "Volatility warning" }),
              " - expect wild swings."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Opposition (180\xB0):" }),
              " Maximum tension.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "Reversal point" }),
              " - trend likely to flip."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-yellow-400 mb-3", children: "\u{1F319} Moon Phase Trading" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "New Moon \u{1F311}:" }),
              " Plant seeds.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "Buy zone" }),
              " - Start accumulating for the waxing phase."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Waxing \u{1F312}\u{1F313}\u{1F314}:" }),
              " Growth phase.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "Hold & accumulate" }),
              " - Prices tend to rise."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Full Moon \u{1F315}:" }),
              " Emotional peak.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "Sell zone" }),
              " - Take profits, high volatility."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Waning \u{1F316}\u{1F317}\u{1F318}:" }),
              " Release phase.",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-yellow-400", children: "Caution" }),
              " - Prices often decline or consolidate."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-yellow-400 mb-3", children: "\u{1F4CA} Birth Chart Overlays" }),
          /* @__PURE__ */ jsx("p", { className: "mb-2", children: "Each asset has a birth chart based on its IPO/launch date:" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Natal Sun:" }),
              " Core identity and trajectory"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Natal Moon:" }),
              " Emotional/volatility patterns"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Ascendant:" }),
              " How the market perceives it"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Transits:" }),
              " Current planetary positions create aspects to natal positions"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-yellow-400 mb-3", children: "\u26A1 Signal Strength Guide" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "0.9+:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "VERY STRONG" }),
              " - Major opportunity"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "0.7-0.9:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "STRONG" }),
              " - Good entry/exit"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "0.5-0.7:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-yellow-400", children: "MODERATE" }),
              " - Confirm with other signals"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Less than 0.5:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "WEAK" }),
              " - Minor influence"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-purple-300 italic", children: "Combine multiple signals for best results!" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto pb-2", children: assets.map((asset) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleSelectAsset(asset),
            className: `px-4 py-2 rounded-lg whitespace-nowrap transition-all ${selectedAsset.symbol === asset.symbol ? "bg-purple-600 scale-105" : "bg-gray-700 hover:bg-gray-600"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold", children: asset.symbol }),
              /* @__PURE__ */ jsx("div", { className: "text-xs", children: asset.name })
            ]
          },
          asset.symbol
        )) }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", style: { color: selectedAsset.color }, children: selectedAsset.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
                "Born: ",
                new Date(selectedAsset.birthDate).toLocaleDateString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold", children: [
                "$",
                selectedAsset.currentPrice.toFixed(2)
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-400", children: "Current Price" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative h-64 bg-gray-900/50 rounded-lg p-4", children: [
            /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 800 200", className: "w-full h-full", children: [
              [0, 50, 100, 150, 200].map((y) => /* @__PURE__ */ jsx("line", { x1: "0", y1: y, x2: "800", y2: y, stroke: "#333", strokeWidth: "1" }, y)),
              selectedAsset.priceHistory.length > 1 && /* @__PURE__ */ jsx(
                "polyline",
                {
                  points: selectedAsset.priceHistory.map((p, i) => {
                    const x = i / selectedAsset.priceHistory.length * 800;
                    const y = 200 - (p.price - 80) / 40 * 200;
                    return `${x},${y}`;
                  }).join(" "),
                  fill: "none",
                  stroke: selectedAsset.color,
                  strokeWidth: "3"
                }
              ),
              selectedAsset.priceHistory.map((p, i) => {
                if (i % 20 === 0 && buySignals.length > 0) {
                  const x = i / selectedAsset.priceHistory.length * 800;
                  const y = 200 - (p.price - 80) / 40 * 200;
                  return /* @__PURE__ */ jsxs("g", { children: [
                    /* @__PURE__ */ jsx("circle", { cx: x, cy: y, r: "5", fill: "#10b981" }),
                    /* @__PURE__ */ jsx("text", { x, y: y - 10, fill: "#10b981", fontSize: "12", textAnchor: "middle", children: "\u25B2" })
                  ] }, `buy-${i}`);
                }
                if (i % 15 === 0 && sellSignals.length > 0) {
                  const x = i / selectedAsset.priceHistory.length * 800;
                  const y = 200 - (p.price - 80) / 40 * 200;
                  return /* @__PURE__ */ jsxs("g", { children: [
                    /* @__PURE__ */ jsx("circle", { cx: x, cy: y, r: "5", fill: "#ef4444" }),
                    /* @__PURE__ */ jsx("text", { x, y: y + 15, fill: "#ef4444", fontSize: "12", textAnchor: "middle", children: "\u25BC" })
                  ] }, `sell-${i}`);
                }
                return null;
              })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute bottom-2 left-2 flex gap-4 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-green-400", children: "\u25B2" }),
                " Buy Signals"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "\u25BC" }),
                " Sell Signals"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold mb-4", children: "Natal Chart @ Launch" }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 300 300", className: "w-full", children: [
              /* @__PURE__ */ jsx("circle", { cx: "150", cy: "150", r: "140", fill: "none", stroke: "#4c1d95", strokeWidth: "2" }),
              /* @__PURE__ */ jsx("circle", { cx: "150", cy: "150", r: "100", fill: "none", stroke: "#6d28d9", strokeWidth: "1" }),
              /* @__PURE__ */ jsx("circle", { cx: "150", cy: "150", r: "60", fill: "none", stroke: "#8b5cf6", strokeWidth: "1" }),
              [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const rad = deg * Math.PI / 180;
                return /* @__PURE__ */ jsx(
                  "line",
                  {
                    x1: "150",
                    y1: "150",
                    x2: 150 + Math.cos(rad) * 140,
                    y2: 150 + Math.sin(rad) * 140,
                    stroke: "#7c3aed",
                    strokeWidth: "1",
                    opacity: "0.3"
                  },
                  deg
                );
              }),
              /* @__PURE__ */ jsx("circle", { cx: "150", cy: "30", r: "12", fill: "#FFD700", opacity: "0.9" }),
              /* @__PURE__ */ jsx("text", { x: "150", y: "35", fontSize: "16", fill: "white", textAnchor: "middle", children: "\u2609" }),
              /* @__PURE__ */ jsx("circle", { cx: "250", cy: "150", r: "10", fill: "#C0C0C0", opacity: "0.9" }),
              /* @__PURE__ */ jsx("text", { x: "250", y: "155", fontSize: "14", fill: "white", textAnchor: "middle", children: "\u263D" }),
              /* @__PURE__ */ jsx("circle", { cx: "290", cy: "150", r: "8", fill: "#FF69B4", opacity: "0.9" }),
              /* @__PURE__ */ jsx("text", { x: "290", y: "155", fontSize: "12", fill: "white", textAnchor: "middle", children: "AC" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-purple-900/30 rounded-lg", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx(Sun, { className: "w-5 h-5 text-yellow-400" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Sun" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
                  selectedAsset.birthChart.sun.sign,
                  " ",
                  selectedAsset.birthChart.sun.degree,
                  "\xB0",
                  " ",
                  /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                    " \u2022 House ",
                    selectedAsset.birthChart.sun.house
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-purple-900/30 rounded-lg", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx(Moon, { className: "w-5 h-5 text-gray-300" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Moon" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
                  selectedAsset.birthChart.moon.sign,
                  " ",
                  selectedAsset.birthChart.moon.degree,
                  "\xB0",
                  " ",
                  /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                    " \u2022 House ",
                    selectedAsset.birthChart.moon.house
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-purple-900/30 rounded-lg", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-pink-400" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Ascendant" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
                  selectedAsset.birthChart.ascendant.sign,
                  " ",
                  selectedAsset.birthChart.ascendant.degree,
                  "\xB0"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-purple-900/30 rounded-lg", children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold mb-1", children: "Chart Ruler" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-purple-300", children: selectedAsset.birthChart.ruling_planet })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-purple-950/50 rounded-xl border border-purple-600 p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-3 flex items-center gap-2", children: "\u26A1 Active Transits" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-64 overflow-y-auto", children: transitAspects.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 italic", children: "No major aspects forming..." }) : transitAspects.map((aspect, i) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `p-3 rounded-lg border-l-4 ${aspect.strength === "STRONG" ? "border-yellow-500 bg-yellow-900/20" : "border-purple-500 bg-purple-900/20"}`,
              children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm mb-1", children: aspect.type }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-300 mb-1", children: [
                  "Orb: ",
                  aspect.orb,
                  "\xB0"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-purple-200", children: aspect.interpretation })
              ]
            },
            aspect.type + i
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-green-950/50 rounded-xl border border-green-600 p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-3 flex items-center gap-2", children: "\u{1F4C8} Buy Signals" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-64 overflow-y-auto", children: buySignals.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 italic", children: "No buy signals active..." }) : buySignals.map((signal, i) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-3 bg-green-900/20 rounded-lg border-l-4 border-green-500",
              children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm mb-1", children: signal.reason }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-300", children: "Strength:" }),
                  /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "bg-green-500 h-2 rounded-full",
                      style: { width: `${signal.strength * 100}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold", children: [
                    (signal.strength * 100).toFixed(0),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-green-200 italic", children: signal.timing })
              ]
            },
            signal.reason + i
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-red-950/50 rounded-xl border border-red-600 p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-3 flex items-center gap-2", children: "\u{1F4C9} Sell Signals" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-64 overflow-y-auto", children: sellSignals.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 italic", children: "No sell signals active..." }) : sellSignals.map((signal, i) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-3 bg-red-900/20 rounded-lg border-l-4 border-red-500",
              children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm mb-1", children: signal.reason }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-300", children: "Strength:" }),
                  /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "bg-red-500 h-2 rounded-full",
                      style: { width: `${signal.strength * 100}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold", children: [
                    (signal.strength * 100).toFixed(0),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-red-200 italic", children: signal.timing })
              ]
            },
            signal.reason + i
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-blue-950/50 rounded-xl border border-blue-600 p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-3", children: "\u{1F31F} Today's Cosmic Weather" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Moon Phase:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: getMoonPhaseName(moonPhase) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Phase %:" }),
              /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                (moonPhase * 100).toFixed(1),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Active Aspects:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: transitAspects.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Market Sentiment:" }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `font-semibold ${buySignals.length > sellSignals.length ? "text-green-400" : sellSignals.length > buySignals.length ? "text-red-400" : "text-yellow-400"}`,
                  children: buySignals.length > sellSignals.length ? "Bullish" : sellSignals.length > buySignals.length ? "Bearish" : "Neutral"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-900/50 rounded-xl border border-gray-600 p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold mb-2 text-gray-400", children: "\u26A0\uFE0F Disclaimer" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "This is a satirical simulation for entertainment purposes only. Astrology is not a valid method for making investment decisions. Always conduct proper research and consult with licensed financial advisors before making any investment decisions." })
        ] })
      ] })
    ] })
  ] }) });
};
var container = document.getElementById("root");
createRoot(container).render(/* @__PURE__ */ jsx(AstroTraderPro, {}));
