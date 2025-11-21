/* @jsxImportSource https://esm.sh/react@18.3.1?dev */
import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1?dev';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?dev';
import { Info, Moon, Pause, Play, Sun, TrendingUp } from 'https://esm.sh/lucide-react@0.453.0?bundle';

const DAY_MS = 24 * 60 * 60 * 1000;
const TICK_MS = 100;

const ASSET_BIRTH_CHARTS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
    birthDate: '2009-01-03T18:15:05Z',
    birthChart: {
      sun: { sign: 'Capricorn', degree: 13, house: 10 },
      moon: { sign: 'Cancer', degree: 28, house: 4 },
      ascendant: { sign: 'Libra', degree: 5 },
      ruling_planet: 'Saturn',
    },
    currentPrice: 100,
    priceHistory: [],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    birthDate: '2015-07-30T15:26:13Z',
    birthChart: {
      sun: { sign: 'Leo', degree: 7, house: 5 },
      moon: { sign: 'Aquarius', degree: 15, house: 11 },
      ascendant: { sign: 'Sagittarius', degree: 22 },
      ruling_planet: 'Sun',
    },
    currentPrice: 100,
    priceHistory: [],
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    color: '#C2A633',
    birthDate: '2013-12-06T00:00:00Z',
    birthChart: {
      sun: { sign: 'Sagittarius', degree: 14, house: 9 },
      moon: { sign: 'Gemini', degree: 3, house: 3 },
      ascendant: { sign: 'Aries', degree: 18 },
      ruling_planet: 'Jupiter',
    },
    currentPrice: 100,
    priceHistory: [],
  },
  {
    symbol: 'SPX',
    name: 'S&P 500',
    color: '#00A3E0',
    birthDate: '1957-03-04T09:30:00Z',
    birthChart: {
      sun: { sign: 'Pisces', degree: 13, house: 12 },
      moon: { sign: 'Taurus', degree: 8, house: 2 },
      ascendant: { sign: 'Gemini', degree: 10 },
      ruling_planet: 'Neptune',
    },
    currentPrice: 100,
    priceHistory: [],
  },
  {
    symbol: 'GOLD',
    name: 'Gold',
    color: '#FFD700',
    birthDate: '1975-12-31T00:00:00Z',
    birthChart: {
      sun: { sign: 'Capricorn', degree: 9, house: 10 },
      moon: { sign: 'Scorpio', degree: 22, house: 8 },
      ascendant: { sign: 'Virgo', degree: 15 },
      ruling_planet: 'Saturn',
    },
    currentPrice: 100,
    priceHistory: [],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla',
    color: '#E82127',
    birthDate: '2010-06-29T09:30:00Z',
    birthChart: {
      sun: { sign: 'Cancer', degree: 7, house: 4 },
      moon: { sign: 'Aries', degree: 19, house: 1 },
      ascendant: { sign: 'Leo', degree: 12 },
      ruling_planet: 'Moon',
    },
    currentPrice: 100,
    priceHistory: [],
  },
];

const calculateMoonPhase = (timestamp) => {
  const lunarCycle = 29.53059 * DAY_MS;
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const phase = ((timestamp - knownNewMoon) % lunarCycle) / lunarCycle;
  return phase < 0 ? phase + 1 : phase;
};

const getMoonPhaseName = (phase) => {
  if (phase < 0.03 || phase > 0.97) return 'New Moon 🌑';
  if (phase < 0.22) return 'Waxing Crescent 🌒';
  if (phase < 0.28) return 'First Quarter 🌓';
  if (phase < 0.47) return 'Waxing Gibbous 🌔';
  if (phase < 0.53) return 'Full Moon 🌕';
  if (phase < 0.72) return 'Waning Gibbous 🌖';
  if (phase < 0.78) return 'Last Quarter 🌗';
  return 'Waning Crescent 🌘';
};

const calculateTransits = (asset, currentDate) => {
  const aspects = [];
  const signals = { buy: [], sell: [] };

  const daysSinceBirth = (currentDate - new Date(asset.birthDate).getTime()) / DAY_MS;
  const sunTransit = ((daysSinceBirth % 365) / 365) * 360;
  const moonTransit = ((daysSinceBirth % 29.53) / 29.53) * 360;

  const sunToNatalSun = Math.abs(sunTransit - asset.birthChart.sun.degree);
  const moonToNatalSun = Math.abs(moonTransit - asset.birthChart.sun.degree);

  if (Math.abs(sunToNatalSun) < 8) {
    aspects.push({
      type: 'Sun Conjunct Natal Sun',
      orb: sunToNatalSun.toFixed(1),
      strength: 'STRONG',
      interpretation: 'Solar return - major cycle completion/beginning',
    });
    signals.buy.push({
      reason: 'Sun Return - Annual cycle restart',
      strength: 0.9,
      timing: 'Enter on dips within 3 days',
    });
  }

  const trineOrbs = [Math.abs(sunToNatalSun - 120), Math.abs(sunToNatalSun - 240)];
  const isTrine = trineOrbs.some((orb) => orb < 8);
  if (isTrine) {
    aspects.push({
      type: 'Sun Trine Natal Sun',
      orb: Math.min(...trineOrbs).toFixed(1),
      strength: 'MODERATE',
      interpretation: 'Harmonious energy flow - upward momentum',
    });
    signals.buy.push({
      reason: 'Trine Aspect - Smooth sailing',
      strength: 0.7,
      timing: 'Good for accumulation',
    });
  }

  const squareOrbs = [Math.abs(sunToNatalSun - 90), Math.abs(sunToNatalSun - 270)];
  const isSquare = squareOrbs.some((orb) => orb < 8);
  if (isSquare) {
    aspects.push({
      type: 'Sun Square Natal Sun',
      orb: Math.min(...squareOrbs).toFixed(1),
      strength: 'STRONG',
      interpretation: 'Tension and challenges - high volatility period',
    });
    signals.sell.push({
      reason: 'Square Aspect - Turbulence ahead',
      strength: 0.6,
      timing: 'Take profits or wait for stabilization',
    });
  }

  const oppositionOrb = Math.abs(sunToNatalSun - 180);
  if (oppositionOrb < 8) {
    aspects.push({
      type: 'Sun Opposition Natal Sun',
      orb: oppositionOrb.toFixed(1),
      strength: 'STRONG',
      interpretation: 'Maximum tension - trend reversal likely',
    });
    signals.sell.push({
      reason: 'Opposition - Reversal imminent',
      strength: 0.85,
      timing: 'Exit positions, wait for new direction',
    });
  }

  if (Math.abs(moonToNatalSun) < 5) {
    signals.buy.push({
      reason: 'Moon Conjunct Natal Sun - Emotional peak',
      strength: 0.5,
      timing: 'Short-term (24-48hr) buy window',
    });
  }

  const phase = calculateMoonPhase(currentDate);
  if (phase < 0.1 || phase > 0.9) {
    signals.buy.push({
      reason: 'New Moon - Fresh cycle beginning',
      strength: 0.6,
      timing: 'Plant seeds for next 2 weeks',
    });
  } else if (phase > 0.45 && phase < 0.55) {
    signals.sell.push({
      reason: 'Full Moon - Emotional climax',
      strength: 0.6,
      timing: 'Lock in gains, high volatility',
    });
  }

  return { aspects, signals };
};

const generatePriceData = (asset, aspects, moonPhase) => {
  const basePrice = asset.currentPrice || 100;
  let volatility = 5;

  if (aspects.some((a) => a.type.includes('Square') || a.type.includes('Opposition'))) {
    volatility = 15;
  }

  if (moonPhase > 0.45 && moonPhase < 0.55) {
    volatility *= 1.5;
  }

  let bias = 0;
  if (aspects.some((a) => a.type.includes('Trine') || a.type.includes('Sextile'))) {
    bias = 2;
  }
  if (aspects.some((a) => a.type.includes('Square'))) {
    bias = -1;
  }

  return basePrice + (Math.random() - 0.5 + bias * 0.1) * volatility;
};

const AstroTraderPro = () => {
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
    () => assets.find((asset) => asset.symbol === selectedSymbol) ?? assets[0],
    [assets, selectedSymbol],
  );

  useEffect(() => {
    setAssets((prev) =>
      prev.map((asset) => ({
        ...asset,
        priceHistory: asset.priceHistory.length
          ? asset.priceHistory
          : [{ time: currentTime, price: asset.currentPrice || 100 }],
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!isPlaying) return undefined;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const nextTime = prevTime + DAY_MS;
        const nextPhase = calculateMoonPhase(nextTime);

        setAssets((prevAssets) =>
          prevAssets.map((asset) => {
            const { aspects } = calculateTransits(asset, nextTime);
            const newPrice = generatePriceData(asset, aspects, nextPhase);
            return {
              ...asset,
              currentPrice: newPrice,
              priceHistory: [
                ...asset.priceHistory.slice(-100),
                { time: nextTime, price: newPrice },
              ],
            };
          }),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            AstroTrader Pro
          </h1>
          <p className="text-purple-300">Birth Chart Overlays + Real-Time Market Signals</p>
        </div>

        <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : 'Start Simulation'}
              </button>

              <button
                onClick={() => setShowTutorial((prev) => !prev)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Info size={20} />
                How to Read
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/50 rounded-lg">
                <Moon className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">{getMoonPhaseName(moonPhase)}</span>
              </div>
              <div className="text-sm text-purple-300">{new Date(currentTime).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {showTutorial && (
          <div className="bg-gradient-to-br from-blue-900/80 to-purple-900/80 backdrop-blur-lg rounded-xl p-6 border border-blue-500/50 mb-6">
            <h2 className="text-2xl font-bold mb-4">📚 How to Read Astro-Trading Signals</h2>

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-bold text-yellow-400 mb-3">🔮 Understanding Aspects</h3>
                <ul className="space-y-2">
                  <li>
                    <strong>Conjunction (0°):</strong> New cycles begin. Major turning points.{' '}
                    <span className="text-green-400">Often bullish</span> for annual solar returns.
                  </li>
                  <li>
                    <strong>Trine (120°):</strong> Harmony and flow.{' '}
                    <span className="text-green-400">Buy signal</span> - smooth upward movement expected.
                  </li>
                  <li>
                    <strong>Square (90°):</strong> Tension and challenge.{' '}
                    <span className="text-yellow-400">Volatility warning</span> - expect wild swings.
                  </li>
                  <li>
                    <strong>Opposition (180°):</strong> Maximum tension.{' '}
                    <span className="text-red-400">Reversal point</span> - trend likely to flip.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-yellow-400 mb-3">🌙 Moon Phase Trading</h3>
                <ul className="space-y-2">
                  <li>
                    <strong>New Moon 🌑:</strong> Plant seeds.{' '}
                    <span className="text-green-400">Buy zone</span> - Start accumulating for the waxing phase.
                  </li>
                  <li>
                    <strong>Waxing 🌒🌓🌔:</strong> Growth phase.{' '}
                    <span className="text-green-400">Hold & accumulate</span> - Prices tend to rise.
                  </li>
                  <li>
                    <strong>Full Moon 🌕:</strong> Emotional peak.{' '}
                    <span className="text-red-400">Sell zone</span> - Take profits, high volatility.
                  </li>
                  <li>
                    <strong>Waning 🌖🌗🌘:</strong> Release phase.{' '}
                    <span className="text-yellow-400">Caution</span> - Prices often decline or consolidate.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-yellow-400 mb-3">📊 Birth Chart Overlays</h3>
                <p className="mb-2">Each asset has a birth chart based on its IPO/launch date:</p>
                <ul className="space-y-2">
                  <li>
                    <strong>Natal Sun:</strong> Core identity and trajectory
                  </li>
                  <li>
                    <strong>Natal Moon:</strong> Emotional/volatility patterns
                  </li>
                  <li>
                    <strong>Ascendant:</strong> How the market perceives it
                  </li>
                  <li>
                    <strong>Transits:</strong> Current planetary positions create aspects to natal positions
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-yellow-400 mb-3">⚡ Signal Strength Guide</h3>
                <ul className="space-y-2">
                  <li>
                    <strong>0.9+:</strong> <span className="text-green-400">VERY STRONG</span> - Major opportunity
                  </li>
                  <li>
                    <strong>0.7-0.9:</strong> <span className="text-green-400">STRONG</span> - Good entry/exit
                  </li>
                  <li>
                    <strong>0.5-0.7:</strong> <span className="text-yellow-400">MODERATE</span> - Confirm with other signals
                  </li>
                  <li>
                    <strong>Less than 0.5:</strong> <span className="text-gray-400">WEAK</span> - Minor influence
                  </li>
                </ul>
                <p className="mt-3 text-purple-300 italic">Combine multiple signals for best results!</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {assets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => handleSelectAsset(asset)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      selectedAsset.symbol === asset.symbol
                        ? 'bg-purple-600 scale-105'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold">{asset.symbol}</div>
                    <div className="text-xs">{asset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: selectedAsset.color }}>
                    {selectedAsset.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Born: {new Date(selectedAsset.birthDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${selectedAsset.currentPrice.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Current Price</div>
                </div>
              </div>

              <div className="relative h-64 bg-gray-900/50 rounded-lg p-4">
                <svg viewBox="0 0 800 200" className="w-full h-full">
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#333" strokeWidth="1" />
                  ))}

                  {selectedAsset.priceHistory.length > 1 && (
                    <polyline
                      points={selectedAsset.priceHistory
                        .map((p, i) => {
                          const x = (i / selectedAsset.priceHistory.length) * 800;
                          const y = 200 - ((p.price - 80) / 40) * 200;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={selectedAsset.color}
                      strokeWidth="3"
                    />
                  )}

                  {selectedAsset.priceHistory.map((p, i) => {
                    if (i % 20 === 0 && buySignals.length > 0) {
                      const x = (i / selectedAsset.priceHistory.length) * 800;
                      const y = 200 - ((p.price - 80) / 40) * 200;
                      return (
                        <g key={`buy-${i}`}>
                          <circle cx={x} cy={y} r="5" fill="#10b981" />
                          <text x={x} y={y - 10} fill="#10b981" fontSize="12" textAnchor="middle">
                            ▲
                          </text>
                        </g>
                      );
                    }
                    if (i % 15 === 0 && sellSignals.length > 0) {
                      const x = (i / selectedAsset.priceHistory.length) * 800;
                      const y = 200 - ((p.price - 80) / 40) * 200;
                      return (
                        <g key={`sell-${i}`}>
                          <circle cx={x} cy={y} r="5" fill="#ef4444" />
                          <text x={x} y={y + 15} fill="#ef4444" fontSize="12" textAnchor="middle">
                            ▼
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>

                <div className="absolute bottom-2 left-2 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">▲</span> Buy Signals
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-400">▼</span> Sell Signals
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-bold mb-4">Natal Chart @ Launch</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <svg viewBox="0 0 300 300" className="w-full">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="#4c1d95" strokeWidth="2" />
                  <circle cx="150" cy="150" r="100" fill="none" stroke="#6d28d9" strokeWidth="1" />
                  <circle cx="150" cy="150" r="60" fill="none" stroke="#8b5cf6" strokeWidth="1" />

                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1="150"
                        y1="150"
                        x2={150 + Math.cos(rad) * 140}
                        y2={150 + Math.sin(rad) * 140}
                        stroke="#7c3aed"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                    );
                  })}

                  <circle cx="150" cy="30" r="12" fill="#FFD700" opacity="0.9" />
                  <text x="150" y="35" fontSize="16" fill="white" textAnchor="middle">
                    ☉
                  </text>

                  <circle cx="250" cy="150" r="10" fill="#C0C0C0" opacity="0.9" />
                  <text x="250" y="155" fontSize="14" fill="white" textAnchor="middle">
                    ☽
                  </text>

                  <circle cx="290" cy="150" r="8" fill="#FF69B4" opacity="0.9" />
                  <text x="290" y="155" fontSize="12" fill="white" textAnchor="middle">
                    AC
                  </text>
                </svg>

                <div className="space-y-3">
                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Sun className="w-5 h-5 text-yellow-400" />
                      <span className="font-bold">Sun</span>
                    </div>
                    <div className="text-sm">
                      {selectedAsset.birthChart.sun.sign} {selectedAsset.birthChart.sun.degree}°{' '}
                      <span className="text-gray-400"> • House {selectedAsset.birthChart.sun.house}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Moon className="w-5 h-5 text-gray-300" />
                      <span className="font-bold">Moon</span>
                    </div>
                    <div className="text-sm">
                      {selectedAsset.birthChart.moon.sign} {selectedAsset.birthChart.moon.degree}°{' '}
                      <span className="text-gray-400"> • House {selectedAsset.birthChart.moon.house}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-5 h-5 text-pink-400" />
                      <span className="font-bold">Ascendant</span>
                    </div>
                    <div className="text-sm">
                      {selectedAsset.birthChart.ascendant.sign} {selectedAsset.birthChart.ascendant.degree}°
                    </div>
                  </div>

                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <div className="font-bold mb-1">Chart Ruler</div>
                    <div className="text-sm text-purple-300">{selectedAsset.birthChart.ruling_planet}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-950/50 rounded-xl border border-purple-600 p-4">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">⚡ Active Transits</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transitAspects.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No major aspects forming...</p>
                ) : (
                  transitAspects.map((aspect, i) => (
                    <div
                      key={aspect.type + i}
                      className={`p-3 rounded-lg border-l-4 ${
                        aspect.strength === 'STRONG'
                          ? 'border-yellow-500 bg-yellow-900/20'
                          : 'border-purple-500 bg-purple-900/20'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">{aspect.type}</div>
                      <div className="text-xs text-gray-300 mb-1">Orb: {aspect.orb}°</div>
                      <div className="text-xs text-purple-200">{aspect.interpretation}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-green-950/50 rounded-xl border border-green-600 p-4">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">📈 Buy Signals</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {buySignals.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No buy signals active...</p>
                ) : (
                  buySignals.map((signal, i) => (
                    <div
                      key={signal.reason + i}
                      className="p-3 bg-green-900/20 rounded-lg border-l-4 border-green-500"
                    >
                      <div className="font-semibold text-sm mb-1">{signal.reason}</div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-300">Strength:</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${signal.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{(signal.strength * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-green-200 italic">{signal.timing}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-red-950/50 rounded-xl border border-red-600 p-4">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">📉 Sell Signals</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sellSignals.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No sell signals active...</p>
                ) : (
                  sellSignals.map((signal, i) => (
                    <div
                      key={signal.reason + i}
                      className="p-3 bg-red-900/20 rounded-lg border-l-4 border-red-500"
                    >
                      <div className="font-semibold text-sm mb-1">{signal.reason}</div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-300">Strength:</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${signal.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{(signal.strength * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-red-200 italic">{signal.timing}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-blue-950/50 rounded-xl border border-blue-600 p-4">
              <h3 className="text-lg font-bold mb-3">🌟 Today's Cosmic Weather</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Moon Phase:</span>
                  <span className="font-semibold">{getMoonPhaseName(moonPhase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phase %:</span>
                  <span className="font-semibold">{(moonPhase * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Aspects:</span>
                  <span className="font-semibold">{transitAspects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Sentiment:</span>
                  <span
                    className={`font-semibold ${
                      buySignals.length > sellSignals.length
                        ? 'text-green-400'
                        : sellSignals.length > buySignals.length
                          ? 'text-red-400'
                          : 'text-yellow-400'
                    }`}
                  >
                    {buySignals.length > sellSignals.length
                      ? 'Bullish'
                      : sellSignals.length > buySignals.length
                        ? 'Bearish'
                        : 'Neutral'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-600 p-4">
              <h3 className="text-sm font-bold mb-2 text-gray-400">⚠️ Disclaimer</h3>
              <p className="text-xs text-gray-500">
                This is a satirical simulation for entertainment purposes only. Astrology is not a valid method for making
                investment decisions. Always conduct proper research and consult with licensed financial advisors before making
                any investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
createRoot(container).render(<AstroTraderPro />);
