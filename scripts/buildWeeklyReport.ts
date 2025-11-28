// Node/TS script: run with tsx or ts-node

import fs from "node:fs";
import path from "node:path";
import type { MinuteRunnerStageCredWeekly } from "../types/minuteRunnerStageCred.js";
import { scoreRoutine } from "../lib/stageCred/scoreRoutine.js";
import { screenCoins, streetCoins } from "../lib/stageCred/coins.js";
import type { RoutineInput } from "../lib/stageCred/scoreRoutine.js";

// You’d normally import this from your regime_ticker / daily_overlay
import regimeSnapshot from "../data/regime_snapshot.json" assert { type: "json" };
// And a routine JSON
import bestRoutine from "../data/best_routine.json" assert { type: "json" };
// And weekly trading metrics
import weeklyMetrics from "../data/weekly_metrics.json" assert { type: "json" };
// And screen metrics
import screenMetrics from "../data/screen_metrics.json" assert { type: "json" };

function buildWeekly(): MinuteRunnerStageCredWeekly {
  const now = new Date();
  const year = now.getUTCFullYear();

  // crude ISO week id
  const firstJan = new Date(Date.UTC(year, 0, 1));
  const weekNumber = Math.ceil(
    ((+now - +firstJan) / 86400000 + firstJan.getUTCDay() + 1) / 7
  );
  const week_id = `${year}-W${weekNumber}`;

  const stageResult = scoreRoutine(bestRoutine as RoutineInput);

  const streetCoinsMinted = streetCoins(
    weeklyMetrics.pnl_pct,
    weeklyMetrics.obeyed_plan
  );
  const screenCoinsMinted = screenCoins(screenMetrics.quality_pass_count);
  const stageCoinsMinted = stageResult.stage_coins;

  const report: MinuteRunnerStageCredWeekly = {
    week_id,
    as_of: now.toISOString(),

    market_regime: {
      label: regimeSnapshot.label,
      profile: regimeSnapshot.profile,
      element_bias: regimeSnapshot.element_bias,
      tau_ci: regimeSnapshot.tau_ci,
      perm_p: regimeSnapshot.perm_p,
      structural_confirmed: regimeSnapshot.structural_confirmed ?? true,
      notes: regimeSnapshot.notes ?? [],
    },

    risk_band: {
      max_equity_risk: regimeSnapshot.max_equity_risk ?? 0.02,
      scale_up_gate: regimeSnapshot.scale_up_gate ?? false,
      advised_flavor:
        regimeSnapshot.advised_flavor ?? "Scout only / No pyramiding",
      allowed_modes:
        regimeSnapshot.allowed_modes ?? ["paper", "micro", "study"],
    },

    predictive_levels: {
      symbol: regimeSnapshot.symbol ?? "ETH",
      levels: regimeSnapshot.levels ?? [],
      summary: regimeSnapshot.summary ?? "",
    },

    stage_cred: {
      street: {
        pnl_pct: weeklyMetrics.pnl_pct,
        hit_rate: weeklyMetrics.hit_rate,
        obeyed_plan: weeklyMetrics.obeyed_plan,
        notes: weeklyMetrics.notes ?? "",
        coins: {
          minted: streetCoinsMinted,
          delta: weeklyMetrics.coins_delta ?? 0,
        },
      },
      screen: {
        reels_posted: screenMetrics.reels_posted,
        essays_or_logs: screenMetrics.essays_or_logs,
        quality_pass_count: screenMetrics.quality_pass_count,
        notes: screenMetrics.notes ?? "",
        coins: {
          minted: screenCoinsMinted,
          delta: screenMetrics.coins_delta ?? 0,
        },
      },
      stage: {
        best_routine_id: stageResult.routine_id,
        best_routine_score: stageResult.stage_score,
        grade: stageResult.grade,
        judge_tag: "Controlled risk, expressive exits", // overwrite per week if desired
        coins: {
          minted: stageCoinsMinted,
          delta: 0,
        },
      },
    },

    coin_summary: {
      street: streetCoinsMinted,
      screen: screenCoinsMinted,
      stage: stageCoinsMinted,
      total: streetCoinsMinted + screenCoinsMinted + stageCoinsMinted,
    },

    protocol_notes: [
      "No size increase until two consecutive green weeks.",
      "Stage Gate: CLOSED for live trading; OPEN for paper/ritual reps only.",
    ],
  };

  return report;
}

function writeReport(report: MinuteRunnerStageCredWeekly) {
  const weeklyFile = path.join(
    process.cwd(),
    "data",
    `minute_runner_stage_cred_${report.week_id}.json`
  );
  const latestFile = path.join(
    process.cwd(),
    "data",
    "minute_runner_stage_cred_latest.json"
  );

  fs.mkdirSync(path.dirname(weeklyFile), { recursive: true });
  const serialized = JSON.stringify(report, null, 2);
  fs.writeFileSync(weeklyFile, serialized);
  fs.writeFileSync(latestFile, serialized);
  console.log("Wrote:", weeklyFile);
  console.log("Updated latest pointer:", latestFile);
}

function main() {
  const report = buildWeekly();
  writeReport(report);
}

main();
