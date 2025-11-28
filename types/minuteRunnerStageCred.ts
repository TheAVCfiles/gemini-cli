export interface MarketLevel {
  label: string;
  level: number;
  bias: string;
  note?: string;
}

export interface MarketRegime {
  label: string; // "Cunning Mercy"
  profile: string; // "Defensive / Fade-Short"
  element_bias?: string; // "Air-Fire tilt"
  tau_ci?: number;
  perm_p?: number;
  structural_confirmed: boolean;
  notes?: string[];
}

export interface RiskBand {
  max_equity_risk: number; // e.g. 0.02
  scale_up_gate: boolean;
  advised_flavor: string; // "Scout only / No pyramiding"
  allowed_modes: string[]; // ["paper","micro","study"]
}

export interface PredictiveLevels {
  symbol: string; // "ETH"
  levels: MarketLevel[];
  summary: string;
}

export interface StageCoins {
  minted: number;
  delta?: number;
}

export interface StreetCred {
  pnl_pct: number; // e.g. -0.3
  hit_rate: number; // 0.52
  obeyed_plan: boolean;
  notes?: string;
  coins: StageCoins;
}

export interface ScreenCred {
  reels_posted: number;
  essays_or_logs: number;
  quality_pass_count: number;
  notes?: string;
  coins: StageCoins;
}

export interface StageCredEntry {
  best_routine_id: string;
  best_routine_score: number;
  grade: string; // "A-"
  judge_tag?: string;
  coins: StageCoins;
}

export interface StageCredBlock {
  street: StreetCred;
  screen: ScreenCred;
  stage: StageCredEntry;
}

export interface CoinSummary {
  street: number;
  screen: number;
  stage: number;
  total: number;
}

export interface MinuteRunnerStageCredWeekly {
  week_id: string; // "2025-W47"
  as_of: string; // ISO timestamp

  market_regime: MarketRegime;
  risk_band: RiskBand;
  predictive_levels: PredictiveLevels;

  stage_cred: StageCredBlock;

  coin_summary: CoinSummary;

  protocol_notes?: string[];
}
