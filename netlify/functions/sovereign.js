const opportunities = [
  {
    id: 'opp-eth-bkr',
    symbol: 'ETH/USDT',
    venue: 'BKRX',
    side: 'sell',
    notionalUsd: 125_000,
    basisPoints: 18,
    expectedFill: 2456.72,
    expiresAt: () => futureTimestamp(90),
  },
  {
    id: 'opp-eth-ftx',
    symbol: 'ETH/USDT',
    venue: 'FTX-R',
    side: 'buy',
    notionalUsd: 80_000,
    basisPoints: 11,
    expectedFill: 2459.1,
    expiresAt: () => futureTimestamp(60),
  },
  {
    id: 'opp-btc-deribit',
    symbol: 'BTC/USDT',
    venue: 'Deribit',
    side: 'sell',
    notionalUsd: 210_000,
    basisPoints: 22,
    expectedFill: 63_410.5,
    expiresAt: () => futureTimestamp(120),
  },
];

const markPrices = {
  'ETH/USDT': 2461.32,
  'BTC/USDT': 63_780.44,
  'SOL/USDT': 188.05,
};

const state = {
  killswitch: false,
  quotes: [],
  trades: [],
};

let quoteSequence = 0;
let tradeSequence = 0;

function nextQuoteId() {
  quoteSequence += 1;
  return `quote-${quoteSequence.toString().padStart(4, '0')}`;
}

function nextTradeId() {
  tradeSequence += 1;
  return `trade-${tradeSequence.toString().padStart(4, '0')}`;
}

function futureTimestamp(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

function parseNotional(raw) {
  if (raw === undefined || raw === null || raw === '') {
    throw new Error('Missing notional_usd parameter.');
  }
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Provide a positive notional_usd amount.');
  }
  return value;
}

function getMark(symbol) {
  const mark = markPrices[symbol];
  if (!mark) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }
  return mark;
}

function buildQuote(symbol, notionalUsd) {
  const mark = getMark(symbol);
  const slippageBps = 8;
  const slippageFactor = 1 + slippageBps / 10_000;
  const price = Number((mark * slippageFactor).toFixed(2));
  const quantity = Number((notionalUsd / price).toFixed(6));

  const record = {
    id: nextQuoteId(),
    symbol,
    notionalUsd,
    price,
    quantity,
    generatedAt: new Date().toISOString(),
    basisPoints: slippageBps,
  };

  state.quotes.push(record);
  return record;
}

function runRiskChecks(symbol, notionalUsd) {
  const maxNotional = symbol.startsWith('BTC') ? 500_000 : 250_000;
  if (notionalUsd > maxNotional) {
    throw new Error(
      `Notional ${notionalUsd} exceeds limit ${maxNotional} for ${symbol}.`,
    );
  }
}

function applyHaircut(notionalUsd) {
  const haircut = 0.03;
  return Number((notionalUsd * (1 - haircut)).toFixed(2));
}

function recordTrade({ symbol, notionalUsd, price, quantity, dryRun }) {
  const executedNotionalUsd = applyHaircut(notionalUsd);
  const trade = {
    id: nextTradeId(),
    symbol,
    requestedNotionalUsd: notionalUsd,
    executedNotionalUsd,
    price,
    requestedQuantity: quantity,
    executedQuantity: Number((executedNotionalUsd / price).toFixed(6)),
    dryRun,
    killswitchActive: state.killswitch,
    timestamp: new Date().toISOString(),
  };
  state.trades.push(trade);
  return trade;
}

function computePnl() {
  let markToMarket = 0;
  let exposure = 0;
  for (const trade of state.trades) {
    if (trade.dryRun) continue;
    const mark = getMark(trade.symbol);
    const pnl = (mark - trade.price) * trade.executedQuantity;
    markToMarket += pnl;
    exposure += trade.executedNotionalUsd;
  }
  return { markToMarket, exposure };
}

function normalisePath(path) {
  if (!path) return '/';
  const withoutFunction = path.replace(
    /\/?\.netlify\/functions\/sovereign/,
    '',
  );
  if (!withoutFunction || withoutFunction === '/') {
    return '/';
  }
  return withoutFunction.startsWith('/')
    ? withoutFunction
    : `/${withoutFunction}`;
}

export async function handler(event) {
  const path = normalisePath(event.path);
  const method = event.httpMethod;
  try {
    if (path === '/health' && method === 'GET') {
      return jsonResponse(200, {
        status: state.killswitch ? 'paused' : 'online',
        killswitch: state.killswitch,
        opportunities: opportunities.length,
        quotes: state.quotes.length,
        trades: state.trades.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (path === '/opps' && method === 'GET') {
      return jsonResponse(
        200,
        opportunities.map((opp) => ({
          ...opp,
          expiresAt: opp.expiresAt(),
        })),
      );
    }

    if (path === '/quote' && method === 'POST') {
      const params = event.queryStringParameters || {};
      const { symbol, notional_usd: rawNotional } = params;
      if (!symbol) {
        throw new Error('Missing symbol parameter.');
      }
      const notionalUsd = parseNotional(rawNotional);
      runRiskChecks(symbol, notionalUsd);
      const quote = buildQuote(symbol, notionalUsd);
      return jsonResponse(200, quote);
    }

    if (path === '/execute' && method === 'POST') {
      if (state.killswitch) {
        return jsonResponse(423, {
          message: 'Execution paused by killswitch.',
        });
      }
      const params = event.queryStringParameters || {};
      const {
        symbol,
        notional_usd: rawNotional,
        dry_run: dryRunParam,
      } = params;
      if (!symbol) {
        throw new Error('Missing symbol parameter.');
      }
      const notionalUsd = parseNotional(rawNotional);
      runRiskChecks(symbol, notionalUsd);
      const quote = buildQuote(symbol, notionalUsd);
      const dryRun = dryRunParam !== 'false';
      const trade = recordTrade({
        symbol,
        notionalUsd,
        price: quote.price,
        quantity: quote.quantity,
        dryRun,
      });
      return jsonResponse(200, {
        message: dryRun ? 'Dry-run execution complete.' : 'Execution recorded.',
        trade,
      });
    }

    if (path === '/killswitch' && method === 'POST') {
      const desired = (event.queryStringParameters || {}).state;
      if (!desired || !['on', 'off'].includes(desired)) {
        throw new Error('Provide state=on or state=off.');
      }
      state.killswitch = desired === 'on';
      return jsonResponse(200, { killswitch: state.killswitch });
    }

    if (path === '/killswitch' && method === 'GET') {
      return jsonResponse(200, { killswitch: state.killswitch });
    }

    if (path === '/trades' && method === 'GET') {
      return jsonResponse(200, state.trades);
    }

    if (path === '/pnl' && method === 'GET') {
      const { markToMarket, exposure } = computePnl();
      return jsonResponse(200, {
        realized: 0,
        markToMarket,
        exposure,
        trades: state.trades.length,
        killswitch: state.killswitch,
        timestamp: new Date().toISOString(),
      });
    }

    return jsonResponse(404, {
      message: `No route for ${method} ${path}`,
    });
  } catch (error) {
    return jsonResponse(400, {
      message: error.message || 'Request failed.',
    });
  }
}
