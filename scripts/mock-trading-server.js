import http from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const LEDGER_QUOTES_PATH = path.join(DATA_DIR, 'ledger_quotes.jsonl');
const DEFAULT_PORT = Number(process.env['PORT'] || 8080);
const QUOTE_HAIRCUT = 0.001; // 10 bps
const EXECUTION_HAIRCUT = 0.0025; // 25 bps
const MAX_NOTIONAL_USD = 250_000;

const opportunities = [
  {
    symbol: 'ETH/USDT',
    venue: 'GeminiPro',
    bid: 3498.12,
    ask: 3498.92,
    liquidityUsd: 500_000,
  },
  {
    symbol: 'BTC/USDT',
    venue: 'GeminiPro',
    bid: 98750.4,
    ask: 98752.1,
    liquidityUsd: 800_000,
  },
  {
    symbol: 'SOL/USDT',
    venue: 'GeminiPro',
    bid: 178.23,
    ask: 178.42,
    liquidityUsd: 250_000,
  },
];

const state = {
  killswitch: false,
  quotes: [],
  trades: [],
  realizedPnl: 0,
  positions: new Map(),
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function respondJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(`${JSON.stringify(payload)}\n`);
}

function getOpportunity(symbol) {
  return opportunities.find((opportunity) => opportunity.symbol === symbol);
}

function getMarkPrice(symbol) {
  const opportunity = getOpportunity(symbol);
  if (!opportunity) {
    return undefined;
  }
  return (opportunity.bid + opportunity.ask) / 2;
}

async function appendLedgerQuote(quote) {
  try {
    await ensureDataDir();
    const line = `${JSON.stringify(quote)}\n`;
    await fs.appendFile(LEDGER_QUOTES_PATH, line, 'utf8');
  } catch (error) {
    console.warn('[mock-trading-server] Failed to append ledger quote:', error);
  }
}

function calculateHaircutPrice(opportunity, side, haircut) {
  if (side === 'sell') {
    return opportunity.bid * (1 - haircut);
  }
  return opportunity.ask * (1 + haircut);
}

function parseNotional(searchParams) {
  const raw = searchParams.get('notional_usd');
  if (!raw) {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

function parseSide(searchParams, fallback = 'buy') {
  const raw = searchParams.get('side');
  if (!raw) {
    return fallback;
  }
  const normalized = raw.toLowerCase();
  if (normalized === 'buy' || normalized === 'sell') {
    return normalized;
  }
  return fallback;
}

function applyTradeToPositions(symbol, quantity, price) {
  const existing = state.positions.get(symbol) || { quantity: 0, avgPrice: 0 };
  let remainingQty = quantity;
  let realized = 0;
  let quantityAfter = existing.quantity;
  let avgPriceAfter = existing.avgPrice;

  if (
    existing.quantity === 0 ||
    Math.sign(existing.quantity) === Math.sign(quantity)
  ) {
    quantityAfter = existing.quantity + quantity;
    const totalNotional =
      existing.avgPrice * existing.quantity + price * quantity;
    avgPriceAfter = quantityAfter === 0 ? 0 : totalNotional / quantityAfter;
    state.positions.set(symbol, {
      quantity: quantityAfter,
      avgPrice: avgPriceAfter,
    });
    return realized;
  }

  let remainingPosition = existing.quantity;
  let avgPrice = existing.avgPrice;

  while (
    remainingQty !== 0 &&
    Math.sign(remainingPosition) === -Math.sign(remainingQty)
  ) {
    const closable = Math.min(
      Math.abs(remainingPosition),
      Math.abs(remainingQty),
    );
    if (remainingPosition > 0) {
      realized += closable * (price - avgPrice);
      remainingPosition -= closable;
      remainingQty += closable;
    } else {
      realized += closable * (avgPrice - price);
      remainingPosition += closable;
      remainingQty -= closable;
    }
  }

  if (remainingPosition === 0 && remainingQty === 0) {
    state.positions.delete(symbol);
    return realized;
  }

  if (remainingPosition === 0) {
    state.positions.set(symbol, { quantity: remainingQty, avgPrice: price });
    return realized;
  }

  if (remainingQty === 0) {
    state.positions.set(symbol, { quantity: remainingPosition, avgPrice });
    return realized;
  }

  const totalNotional = remainingPosition * avgPrice + remainingQty * price;
  const netQuantity = remainingPosition + remainingQty;
  const newAvgPrice = totalNotional / netQuantity;
  state.positions.set(symbol, { quantity: netQuantity, avgPrice: newAvgPrice });
  return realized;
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', reject);
  });
}

function getPositionsSnapshot() {
  return Array.from(state.positions.entries()).map(([symbol, position]) => ({
    symbol,
    quantity: position.quantity,
    avgPrice: position.avgPrice,
  }));
}

async function handleQuote(response, searchParams) {
  const symbol = searchParams.get('symbol');
  const notionalUsd = parseNotional(searchParams);
  if (!symbol || !notionalUsd) {
    return respondJson(response, 400, {
      error: 'Missing or invalid symbol/notional_usd parameters',
    });
  }

  const opportunity = getOpportunity(symbol);
  if (!opportunity) {
    return respondJson(response, 404, { error: `Unknown symbol ${symbol}` });
  }

  const side = parseSide(searchParams);
  const price = calculateHaircutPrice(opportunity, side, QUOTE_HAIRCUT);
  const quantity = notionalUsd / price;
  const quote = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    symbol,
    venue: opportunity.venue,
    side,
    price,
    quantity,
    notionalUsd: quantity * price,
    haircut: QUOTE_HAIRCUT,
  };

  state.quotes.push(quote);
  await appendLedgerQuote(quote);
  return respondJson(response, 200, quote);
}

async function handleExecute(response, searchParams) {
  const symbol = searchParams.get('symbol');
  const notionalUsd = parseNotional(searchParams);
  if (!symbol || !notionalUsd) {
    return respondJson(response, 400, {
      error: 'Missing or invalid symbol/notional_usd parameters',
    });
  }

  if (state.killswitch) {
    return respondJson(response, 423, {
      error: 'Killswitch engaged. Trading is disabled.',
    });
  }

  if (notionalUsd > MAX_NOTIONAL_USD) {
    return respondJson(response, 400, {
      error: `Notional exceeds max risk limit of ${MAX_NOTIONAL_USD} USD`,
    });
  }

  const opportunity = getOpportunity(symbol);
  if (!opportunity) {
    return respondJson(response, 404, { error: `Unknown symbol ${symbol}` });
  }

  const side = parseSide(searchParams);
  const price = calculateHaircutPrice(opportunity, side, EXECUTION_HAIRCUT);
  const quantity = notionalUsd / price;
  const signedQuantity = side === 'sell' ? -quantity : quantity;
  const trade = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    symbol,
    venue: opportunity.venue,
    side,
    price,
    quantity: signedQuantity,
    notionalUsd: quantity * price,
    haircut: EXECUTION_HAIRCUT,
  };

  const realizedDelta = applyTradeToPositions(symbol, signedQuantity, price);
  state.realizedPnl += realizedDelta;
  state.trades.push(trade);
  return respondJson(response, 200, {
    trade,
    realizedPnlDelta: realizedDelta,
    killswitch: state.killswitch,
  });
}

function handleHealth(response) {
  return respondJson(response, 200, {
    status: 'ok',
    serverTime: new Date().toISOString(),
  });
}

function handleOpps(response) {
  return respondJson(response, 200, opportunities);
}

function handleKillswitch(response, searchParams) {
  const nextState = searchParams.get('state');
  if (!nextState) {
    return respondJson(response, 200, {
      state: state.killswitch ? 'on' : 'off',
    });
  }
  if (nextState !== 'on' && nextState !== 'off') {
    return respondJson(response, 400, {
      error: 'Killswitch state must be "on" or "off"',
    });
  }
  state.killswitch = nextState === 'on';
  return respondJson(response, 200, { state: nextState });
}

function handleTrades(response) {
  return respondJson(response, 200, state.trades);
}

function handlePnl(response) {
  let unrealized = 0;
  for (const [symbol, position] of state.positions.entries()) {
    const mark = getMarkPrice(symbol);
    if (!mark) {
      continue;
    }
    if (position.quantity > 0) {
      unrealized += (mark - position.avgPrice) * position.quantity;
    } else if (position.quantity < 0) {
      unrealized += (position.avgPrice - mark) * Math.abs(position.quantity);
    }
  }

  return respondJson(response, 200, {
    realized: state.realizedPnl,
    unrealized,
    total: state.realizedPnl + unrealized,
    positions: getPositionsSnapshot(),
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://localhost');
  const { pathname, searchParams } = requestUrl;

  try {
    if (request.method === 'GET' && pathname === '/health') {
      return handleHealth(response);
    }
    if (request.method === 'GET' && pathname === '/opps') {
      return handleOpps(response);
    }
    if (request.method === 'POST' && pathname === '/quote') {
      await collectRequestBody(request);
      return handleQuote(response, searchParams);
    }
    if (request.method === 'POST' && pathname === '/execute') {
      await collectRequestBody(request);
      return handleExecute(response, searchParams);
    }
    if (pathname === '/killswitch') {
      await collectRequestBody(request);
      return handleKillswitch(response, searchParams);
    }
    if (request.method === 'GET' && pathname === '/trades') {
      return handleTrades(response);
    }
    if (request.method === 'GET' && pathname === '/pnl') {
      return handlePnl(response);
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('[mock-trading-server] Unhandled error:', error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(DEFAULT_PORT, () => {
  console.log(
    `[mock-trading-server] Listening on http://localhost:${DEFAULT_PORT} (killswitch=${
      state.killswitch ? 'on' : 'off'
    })`,
  );
});
