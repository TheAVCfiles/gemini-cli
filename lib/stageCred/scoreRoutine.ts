export interface RoutineElement {
  id: string;
  bv: number; // base value
  dd: number; // difficulty delta
  goe: number; // grade of execution (-3 .. +3)
}

export interface RoutinePCS {
  skating_skills: number;
  transitions: number;
  performance: number;
  choreo: number;
  interpretation: number;
}

export interface RoutineInput {
  routine_id: string;
  elements: RoutineElement[];
  pcs: RoutinePCS;
}

export interface RoutineScore {
  routine_id: string;
  stage_score: number;
  grade: string;
  stage_coins: number;
  tech_total: number;
  pcs_total: number;
}

const GOE_STEP = 0.5;

const PCS_WEIGHTS: Record<keyof RoutinePCS, number> = {
  skating_skills: 1.0,
  transitions: 0.8,
  performance: 1.2,
  choreo: 1.0,
  interpretation: 1.2,
};

export function scoreRoutine(routine: RoutineInput): RoutineScore {
  const elements = routine.elements ?? [];
  const pcs = routine.pcs ?? ({} as RoutinePCS);

  let tech_total = 0;

  for (const el of elements) {
    const bv = Number(el.bv ?? 0);
    const dd = Number(el.dd ?? 0);
    const goe = Number(el.goe ?? 0);
    const base = bv + dd;
    const factor = 1 + goe * GOE_STEP;
    tech_total += base * factor;
  }

  let pcs_total = 0;
  (Object.keys(PCS_WEIGHTS) as (keyof RoutinePCS)[]).forEach((key) => {
    const w = PCS_WEIGHTS[key];
    const v = Number(pcs[key] ?? 0);
    pcs_total += v * w;
  });

  const stage_score = Number((tech_total + pcs_total).toFixed(1));

  let grade: string;
  if (stage_score >= 90) grade = "A";
  else if (stage_score >= 80) grade = "A-";
  else if (stage_score >= 70) grade = "B";
  else if (stage_score >= 60) grade = "C";
  else grade = "D";

  // 1 Stage Coin per 10 points (tweak if you want 4 instead of 8, etc.)
  const stage_coins = Math.floor(stage_score / 10);

  return {
    routine_id: routine.routine_id,
    stage_score,
    grade,
    stage_coins,
    tech_total: Number(tech_total.toFixed(2)),
    pcs_total: Number(pcs_total.toFixed(2)),
  };
}
