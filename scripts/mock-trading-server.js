/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const trackedSymbols = [
  {
    symbol: 'ETH/USDT',
    basePrice: 3250,
    volatility: 45,
    baseLiquidity: 50000,
  },
  {
    symbol: 'BTC/USDT',
    basePrice: 68000,
    volatility: 250,
    baseLiquidity: 125000,
  },
];

const state = {
  opportunities: [],
  quotes: [],
  trades: seedTrades(),
  markPrices: new Map(),
};

function seedTrades() {
  const now = Date.now();
  return [
    {
      id: randomUUID(),
      symbol: 'ETH/USDT',
      side: 'buy',
      baseAmount: 0.08,
      price: 3125.42,
      feeUsd: 0.25,
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      venue: 'gemini',
    },
    {
      id: randomUUID(),
      symbol: 'ETH/USDT',
      side: 'sell',
      baseAmount: 0.03,
      price: 3278.11,
      feeUsd: 0.11,
      timestamp: new Date(now - 1000 * 60 * 60).toISOString(),
      venue: 'okx',
    },
    {
      id: randomUUID(),
      symbol: 'BTC/USDT',
      side: 'buy',
      baseAmount: 0.004,
      price: 67420.57,
      feeUsd: 0.38,
      timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
      venue: 'coinbase',
    },
    {
      id: randomUUID(),
      symbol: 'BTC/USDT',
      side: 'sell',
      baseAmount: 0.0025,
      price: 68210.19,
      feeUsd: 0.21,
      timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
      venue: 'binance',
    },
  ];
}

function recordOpportunity(opportunity) {
  state.opportunities.push(opportunity);
  if (state.opportunities.length > 200) {
    state.opportunities.splice(0, state.opportunities.length - 200);
  }
  state.markPrices.set(opportunity.symbol, opportunity.markPrice);
}

function getLatestMarkPrice(symbol) {
  return state.markPrices.get(symbol) ?? trackedSymbols.find((item) => item.symbol === symbol)?.basePrice ?? 0;
}

function generateOpportunity({ symbol, basePrice, volatility, baseLiquidity }) {
  const now = Date.now();
  const noise = Math.sin(now / 1000 / 120) * volatility * 0.25;
  const randomShock = (Math.random() - 0.5) * volatility;
  const markPrice = Number((basePrice + noise + randomShock).toFixed(2));
  const spread = 0.5 + Math.random();
  const bidPrice = Number((markPrice - spread).toFixed(2));
  const askPrice = Number((markPrice + spread).toFixed(2));
  const liquidityUsd = Number((baseLiquidity + Math.random() * baseLiquidity * 0.35).toFixed(2));
  const basisPoints = Number((((askPrice - bidPrice) / markPrice) * 10000).toFixed(2));

  return {
    id: randomUUID(),
    symbol,
    markPrice,
    bidPrice,
    askPrice,
    spreadBps: basisPoints,
    notionalUsd: liquidityUsd,
    source: 'mock:scanner',
    createdAt: new Date(now).toISOString(),
  };
}

function scheduleOpportunities() {
  for (const symbolConfig of trackedSymbols) {
    const opportunity = generateOpportunity(symbolConfig);
    recordOpportunity(opportunity);
  }
  setTimeout(scheduleOpportunities, 4000 + Math.random() * 1500);
}

scheduleOpportunities();

function addQuote(quote) {
  state.quotes.push(quote);
  if (state.quotes.length > 1000) {
    state.quotes.splice(0, state.quotes.length - 1000);
  }
}

function createQuote({ symbol, notionalUsd, maxSlippagePct, feePct }) {
  const markPrice = getLatestMarkPrice(symbol);
  if (!markPrice) {
    throw Object.assign(new Error(`No market data for ${symbol}`), { statusCode: 404 });
  }

  const baseAmount = Number((notionalUsd / markPrice).toFixed(6));
  const expiresAt = new Date(Date.now() + 1000 * 60).toISOString();
  const id = randomUUID();
  const quote = {
    id,
    symbol,
    notionalUsd: Number(notionalUsd.toFixed(2)),
    baseAmount,
    markPrice,
    maxSlippagePct: Number(maxSlippagePct.toFixed(6)),
    feePct: Number(feePct.toFixed(6)),
    createdAt: new Date().toISOString(),
    expiresAt,
    status: 'open',
  };
  addQuote(quote);
  return quote;
}

function parseNumber(value, name) {
  if (value === null) {
    throw Object.assign(new Error(`Missing required parameter: ${name}`), { statusCode: 400 });
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw Object.assign(new Error(`Invalid number for parameter: ${name}`), { statusCode: 400 });
  }
  return parsed;
}

function calculatePnlForSymbol(symbol) {
  const trades = state.trades.filter((trade) => trade.symbol === symbol).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (trades.length === 0) {
    const markPrice = getLatestMarkPrice(symbol);
    return {
      symbol,
      position: 0,
      basisPrice: 0,
      markPrice,
      realizedPnl: 0,
      unrealizedPnl: 0,
      feesPaid: 0,
      totalPnl: 0,
      markValue: 0,
    };
  }

  let position = 0;
  let averageCost = 0;
  let realizedPnl = 0;
  let feesPaid = 0;

  for (const trade of trades) {
    const { side, baseAmount, price, feeUsd } = trade;
    if (side === 'buy') {
      const newNotional = position * averageCost + baseAmount * price;
      position += baseAmount;
      averageCost = position === 0 ? 0 : newNotional / position;
    } else if (side === 'sell') {
      const amountToClose = Math.min(baseAmount, position);
      realizedPnl += (price - averageCost) * amountToClose;
      position -= baseAmount;
      if (position <= 1e-8) {
        position = 0;
        averageCost = 0;
      }
    }
    if (Number.isFinite(feeUsd ?? NaN)) {
      feesPaid += feeUsd;
    }
  }

  const markPrice = getLatestMarkPrice(symbol);
  const unrealizedPnl = position * (markPrice - averageCost);
  const markValue = position * markPrice;
  const totalPnl = realizedPnl + unrealizedPnl - feesPaid;

  return {
    symbol,
    position: Number(position.toFixed(6)),
    basisPrice: Number(averageCost.toFixed(2)),
    markPrice,
    realizedPnl: Number(realizedPnl.toFixed(2)),
    unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
    feesPaid: Number(feesPaid.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    markValue: Number(markValue.toFixed(2)),
  };
}

function calculatePortfolioPnl() {
  const summaries = trackedSymbols.map(({ symbol }) => calculatePnlForSymbol(symbol));
  const aggregate = summaries.reduce(
    (acc, item) => {
      acc.position += item.position;
      acc.realizedPnl += item.realizedPnl;
      acc.unrealizedPnl += item.unrealizedPnl;
      acc.feesPaid += item.feesPaid;
      acc.markValue += item.markValue;
      acc.totalPnl += item.totalPnl;
      return acc;
    },
    { position: 0, realizedPnl: 0, unrealizedPnl: 0, feesPaid: 0, markValue: 0, totalPnl: 0 },
  );

  return {
    summary: {
      position: Number(aggregate.position.toFixed(6)),
      realizedPnl: Number(aggregate.realizedPnl.toFixed(2)),
      unrealizedPnl: Number(aggregate.unrealizedPnl.toFixed(2)),
      feesPaid: Number(aggregate.feesPaid.toFixed(2)),
      totalPnl: Number(aggregate.totalPnl.toFixed(2)),
      markValue: Number(aggregate.markValue.toFixed(2)),
    },
    bySymbol: summaries,
  };
}

function respondJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function handleHealth(_req, res) {
  respondJson(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    quotes: state.quotes.length,
    trades: state.trades.length,
    opportunities: state.opportunities.length,
  });
}

function handleOpps(url, res) {
  const symbolFilter = url.searchParams.get('symbol');
  const items = symbolFilter
    ? state.opportunities.filter((item) => item.symbol === symbolFilter)
    : state.opportunities;
  respondJson(res, 200, {
    opportunities: items.slice(-50).reverse(),
  });
}

function handleQuote(url, res) {
  try {
    const symbol = url.searchParams.get('symbol') ?? 'ETH/USDT';
    const notionalUsd = parseNumber(url.searchParams.get('notional_usd'), 'notional_usd');
    const maxSlippagePct = parseNumber(url.searchParams.get('max_slippage_pct'), 'max_slippage_pct');
    const feePct = parseNumber(url.searchParams.get('fee_pct'), 'fee_pct');
    const quote = createQuote({ symbol, notionalUsd, maxSlippagePct, feePct });
    respondJson(res, 201, { quote });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    respondJson(res, statusCode, {
      error: error.message ?? 'Unknown error',
    });
  }
}

function handleTrades(_url, res) {
  const trades = [...state.trades].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  respondJson(res, 200, { trades });
}

function handlePnl(_url, res) {
  const payload = calculatePortfolioPnl();
  respondJson(res, 200, payload);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    respondJson(res, 400, { error: 'Invalid request' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const { pathname } = url;

  if (req.method === 'GET' && pathname === '/health') {
    handleHealth(req, res);
    return;
  }
  if (req.method === 'GET' && pathname === '/opps') {
    handleOpps(url, res);
    return;
  }
  if (req.method === 'POST' && pathname === '/quote') {
    handleQuote(url, res);
    return;
  }
  if (req.method === 'GET' && pathname === '/trades') {
    handleTrades(url, res);
    return;
  }
  if (req.method === 'GET' && pathname === '/pnl') {
    handlePnl(url, res);
    return;
  }

  respondJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock trading server listening on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down mock trading server');
  server.close(() => process.exit(0));
});
