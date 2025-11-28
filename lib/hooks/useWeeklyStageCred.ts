"use client";

import weekly from "@/data/minute_runner_stage_cred_latest.json";
import type { MinuteRunnerStageCredWeekly } from "@/types/minuteRunnerStageCred.js";

export function useWeeklyStageCred(): MinuteRunnerStageCredWeekly {
  return weekly as MinuteRunnerStageCredWeekly;
}
