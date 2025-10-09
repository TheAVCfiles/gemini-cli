const EPSILON = 1e-9;

export type GrapevineSignal = {
  readonly values: readonly number[];
};

export type GrapevineTrend = 'upward' | 'downward' | 'flat';

export type GrapevinePastAnalysis = {
  readonly mean: number;
  readonly variance: number;
  readonly trend: GrapevineTrend;
};

export type GrapevinePresentAction = {
  readonly delta: number;
  readonly classification: 'spike' | 'dip' | 'steady';
};

export type GrapevineForecast = {
  readonly forecast: number;
  readonly confidence: number;
  readonly horizon: number;
};

export type GrapevineReport = {
  readonly behind: GrapevinePastAnalysis;
  readonly step: GrapevinePresentAction;
  readonly front: GrapevineForecast;
};

export function grapevine(signal: GrapevineSignal): GrapevineReport {
  if (signal.values.length === 0) {
    throw new Error('Grapevine signal must contain at least one value.');
  }

  const behind = analyzePast(signal);
  const step = actPresent(signal);
  const front = forecastFuture(signal);

  return integrate(behind, step, front);
}

function analyzePast(signal: GrapevineSignal): GrapevinePastAnalysis {
  const history = signal.values.slice(0, -1);
  if (history.length === 0) {
    const current = signal.values[signal.values.length - 1];
    return {
      mean: current,
      variance: 0,
      trend: 'flat',
    };
  }

  const mean = calculateMean(history);
  const variance = calculateVariance(history, mean);
  const trend = calculateTrend(history);

  return {
    mean,
    variance,
    trend,
  };
}

function actPresent(signal: GrapevineSignal): GrapevinePresentAction {
  const current = signal.values[signal.values.length - 1];
  const previous = signal.values.length > 1 ? signal.values[signal.values.length - 2] : undefined;
  const delta = previous === undefined ? 0 : current - previous;

  const window = signal.values.slice(-Math.min(signal.values.length, 5));
  const windowMean = calculateMean(window);
  const volatility = Math.sqrt(calculateVariance(window, windowMean));
  const tolerance = Math.max(volatility * 0.5, EPSILON);

  let classification: GrapevinePresentAction['classification'] = 'steady';
  if (delta > tolerance) {
    classification = 'spike';
  } else if (delta < -tolerance) {
    classification = 'dip';
  }

  return {
    delta,
    classification,
  };
}

function forecastFuture(signal: GrapevineSignal): GrapevineForecast {
  const current = signal.values[signal.values.length - 1];
  if (signal.values.length === 1) {
    return {
      forecast: current,
      confidence: 0,
      horizon: 1,
    };
  }

  const { slope, intercept } = linearRegression(signal.values);
  const nextIndex = signal.values.length;
  const forecast = intercept + slope * nextIndex;

  const residuals = calculateResiduals(signal.values, slope, intercept);
  const signalDeviation = Math.sqrt(calculateVariance(signal.values, calculateMean(signal.values)));
  const confidence = clamp(
    signalDeviation <= EPSILON ? 1 : 1 - residuals / (signalDeviation + EPSILON),
    0,
    1,
  );

  return {
    forecast,
    confidence,
    horizon: 1,
  };
}

function integrate(
  behind: GrapevinePastAnalysis,
  step: GrapevinePresentAction,
  front: GrapevineForecast,
): GrapevineReport {
  return {
    behind,
    step,
    front,
  };
}

function calculateMean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function calculateVariance(values: readonly number[], mean: number): number {
  if (values.length === 0) {
    return 0;
  }

  const squaredDiff = values.reduce((sum, value) => {
    const diff = value - mean;
    return sum + diff * diff;
  }, 0);

  return squaredDiff / values.length;
}

function calculateTrend(values: readonly number[]): GrapevineTrend {
  if (values.length < 2) {
    return 'flat';
  }

  const { slope } = linearRegression(values);
  if (Math.abs(slope) <= EPSILON) {
    return 'flat';
  }

  return slope > 0 ? 'upward' : 'downward';
}

function linearRegression(values: readonly number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }

  const xValues = values.map((_, index) => index);
  const meanX = calculateMean(xValues);
  const meanY = calculateMean(values);

  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < n; index += 1) {
    const xDiff = xValues[index] - meanX;
    const yDiff = values[index] - meanY;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

function calculateResiduals(values: readonly number[], slope: number, intercept: number): number {
  if (values.length === 0) {
    return 0;
  }

  const squaredResiduals = values.reduce((sum, value, index) => {
    const prediction = intercept + slope * index;
    const diff = value - prediction;
    return sum + diff * diff;
  }, 0);

  return Math.sqrt(squaredResiduals / values.length);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
