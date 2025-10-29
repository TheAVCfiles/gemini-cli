# Mirror Mode MVP Blueprint

This document distills the Mirror Mode concept into an execution-ready MVP plan, datastore contracts, and a pose-similarity reference implementation suitable for a MoveNet/TF.js prototype. It is written to support a lean full-stack team delivering a web/iPad experience where teachers record routines that students mirror and score against.

## 1. Eight-Week MVP Plan

### Team Composition (Lean Stack)
- **Product Owner / Creative Lead** – Allison (vision, routine design, QA loops)
- **Full-stack Engineer (React + TF.js)** – 1 FTE (primary implementer)
- **ML / Computer Vision Engineer** – 0.5 FTE (80 contractor hours)
- **Designer / UX** – 0.25 FTE (≈60 hours)
- **DevOps / Infrastructure** – 0.1 FTE (≈20 hours)
- **QA / Beta testers** – in-house cohort of students/instructors

> A single senior full-stack engineer with applied ML experience can ship the stack solo with a longer timeline.

### Week-by-Week Deliverables

| Week | Focus | Key Deliverables | Acceptance Criteria |
|------|-------|------------------|---------------------|
| **0** | Kickoff & Architecture | Finalized specs, wireframes, infra accounts (Supabase/Firebase, AWS S3 + CloudFront, Vercel), project board | Design sign-off, infrastructure reachable |
| **1** | Camera + Pose Capture | `getUserMedia` camera pipeline, MoveNet/MediaPipe integration, mirrored skeleton overlay, exponential smoothing | 30 FPS on iPad Safari/Chrome, structured skeleton JSON stream |
| **2** | Teacher Reference Capture | Teacher recording UI storing video + skeleton JSON to S3, normalized skeleton derivation, lesson metadata CRUD | Lessons replayable from stored assets |
| **3** | Offline Scoring & Replay | DTW-based comparison script, replay UI with teacher overlay and frame score timeline | Accurate asynchronous scoring reports |
| **4** | Real-time Mirror Scoring | Sliding-window DTW, per-joint heatmaps, latency smoothing, missing keypoint handling | Perceived latency < 200 ms with stable scores |
| **5** | Accounts & Monetization | Supabase/Firebase auth, lesson catalog, Stripe payment, basic leaderboards/badges | Purchase-to-unlock flow verified |
| **6** | Live Sessions | WebRTC/Liveblocks channel for teacher-student live view, low-latency skeleton sharing | End-to-end latency < 500 ms |
| **7** | QA, Performance, Privacy | iPad performance profiling, privacy toggles (skeleton-only default), encryption review | Handles 20 concurrent users, opt-in raw video storage |
| **8** | Beta Launch & Analytics | Production deploy, onboarding, analytics dashboards (retention, sessions, revenue), marketing site | First beta users live, telemetry flowing |

### Acceptance Targets
- Teachers can record, upload, and manage lessons with skeleton JSON.
- Students mirror a lesson with live skeleton overlay and scoring.
- Replay delivers downloadable scorecards.
- Auth + payment flows function end-to-end.
- Privacy defaults to skeleton-only storage with explicit video opt-in.

### Cost Envelope (Lean Build)
- Development: 320 h @ $100/h ≈ **$32k**
- ML contractor: 80 h @ $120/h ≈ **$9.6k**
- Design/QA/DevOps: **$6k–$8k**
- Cloud (first 3 months): **$100–$600/month**
- **Total MVP**: **$48k–$55k** (native iPad AR add-on +4–8 weeks, +$30k–$60k)

## 2. Data Schema

### Skeleton Recording JSON
Store one compressed JSON file per recording at `s3://.../skeletons/{lesson_id}/{recording_id}.json`.

```json
{
  "meta": {
    "recording_id": "uuid-v4",
    "lesson_id": "uuid-v4",
    "user_id": "uuid-v4",
    "device": "iPad Pro (12.9) Safari",
    "model": "movenet_singlepose_lightning",
    "width": 1280,
    "height": 720,
    "fps": 30,
    "created_at": "2025-10-28T17:22:10Z",
    "coordinate_space": "px",
    "normalized": false
  },
  "frames": [
    {
      "t": 0,
      "frame_index": 0,
      "keypoints": [
        {"i": 0, "name": "nose", "x": 640.2, "y": 210.4, "z": 0.0, "score": 0.93},
        {"i": 1, "name": "left_eye", "x": 620.5, "y": 200.5, "z": 0.0, "score": 0.88}
      ],
      "derived": {
        "center_x": 640.0,
        "center_y": 360.0,
        "torso_length": 220.3
      }
    }
  ]
}
```

**Recommendations**
- Persist the pose-estimator name/version for reproducibility.
- Maintain both raw and normalized skeletons (torso-scale and hip-centered).
- Gzip large recordings and consider NDJSON/Protobuf when scaling.

### Score Event JSON

```json
{
  "score_id": "uuid-v4",
  "recording_id": "uuid-v4",
  "reference_recording_id": "uuid-v4",
  "user_id": "uuid-v4",
  "lesson_id": "uuid-v4",
  "timestamp": "2025-10-28T17:45:10Z",
  "duration_ms": 62000,
  "overall_score": 82.5,
  "per_frame": [
    {"t": 0, "frame_index": 0, "score": 86.0}
  ],
  "per_joint_scores": {
    "left_knee": 88.3,
    "right_knee": 75.1
  },
  "tempo_alignment": 0.92,
  "notes": "Student is slightly late on pliés at 00:34",
  "raw_metrics": {
    "dtw_distance": 12.32,
    "normalized_distance": 0.122
  }
}
```

### Postgres Tables (Supabase-Compatible)

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  title text NOT NULL,
  description text,
  duration_ms integer,
  tempo_bpm integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id),
  user_id uuid REFERENCES users(id),
  s3_path text NOT NULL,
  meta jsonb,
  privacy_level text DEFAULT 'SKELETON_ONLY',
  consent_raw_video boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES recordings(id),
  reference_recording_id uuid REFERENCES recordings(id),
  user_id uuid REFERENCES users(id),
  lesson_id uuid REFERENCES lessons(id),
  overall_score numeric(5,2),
  per_joint_scores jsonb,
  per_frame_summary jsonb,
  raw_metrics jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_scores_lesson_created ON scores (lesson_id, created_at DESC);
```

## 3. DTW + Pose Similarity Toolkit

### Processing Pipeline Overview
1. **Smoothing** – Exponential weighted moving average (EWMA) per coordinate to stabilize jitter.
2. **Normalization** – Hip-centered translation and torso-length scaling (optional shoulder-align rotation).
3. **Vectorization** – Flatten selected keypoints into `(x, y, z)` vectors with optional joint weights.
4. **Similarity Metric** – Euclidean distance across vectors.
5. **Dynamic Time Warping** – DTW with a Sakoe–Chiba band to absorb tempo differences.
6. **Score Mapping** – Convert DTW distance into a 0–100 score calibrated against expert baselines.
7. **Real-time View** – Compute sliding-window DTW or cosine similarity for live feedback, with offline DTW for detailed replay.

### TypeScript Implementation
Drop the following helpers into a TF.js web project. The utilities assume MoveNet-style keypoints (17 entries with `name`, `x`, `y`, optional `z`, and `score`).

```ts
// packages/core/src/utils/pose/dtw.ts

export interface Keypoint {
  i: number;
  name: string;
  x: number;
  y: number;
  z?: number;
  score?: number;
}

export interface PoseFrame {
  t: number;
  frame_index: number;
  keypoints: Keypoint[];
}

export type PoseVector = Float32Array;

export interface ScoreResult {
  dtwDistance: number;
  overallScore: number;
}

const DEFAULT_KEY_ORDER = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
];

export function ewmaSmooth(
  frames: PoseFrame[],
  alpha = 0.6
): PoseFrame[] {
  if (!frames.length) return frames;
  const smoothed: PoseFrame[] = frames.map((frame) => ({
    ...frame,
    keypoints: frame.keypoints.map((kp) => ({ ...kp }))
  }));

  for (let i = 1; i < smoothed.length; i++) {
    const prev = smoothed[i - 1];
    const cur = smoothed[i];
    for (let j = 0; j < cur.keypoints.length; j++) {
      const kp = cur.keypoints[j];
      const prevKp = prev.keypoints[j];
      kp.x = alpha * kp.x + (1 - alpha) * prevKp.x;
      kp.y = alpha * kp.y + (1 - alpha) * prevKp.y;
      if (kp.z !== undefined && prevKp.z !== undefined) {
        kp.z = alpha * kp.z + (1 - alpha) * prevKp.z;
      }
    }
  }

  return smoothed;
}

export function normalizeAndVectorize(
  frame: PoseFrame,
  keyOrder: number[] = DEFAULT_KEY_ORDER
): PoseVector {
  const kp = frame.keypoints;
  const leftHip = kp.find((k) => k.name === "left_hip") ?? kp[11];
  const rightHip = kp.find((k) => k.name === "right_hip") ?? kp[12];
  const leftShoulder = kp.find((k) => k.name === "left_shoulder") ?? kp[5];
  const rightShoulder = kp.find((k) => k.name === "right_shoulder") ?? kp[6];

  const hipCenterX = ((leftHip?.x ?? 0) + (rightHip?.x ?? 0)) / 2;
  const hipCenterY = ((leftHip?.y ?? 0) + (rightHip?.y ?? 0)) / 2;
  const shoulderCenterX = ((leftShoulder?.x ?? 0) + (rightShoulder?.x ?? 0)) / 2;
  const shoulderCenterY = ((leftShoulder?.y ?? 0) + (rightShoulder?.y ?? 0)) / 2;

  const torsoLength = Math.hypot(
    shoulderCenterX - hipCenterX,
    shoulderCenterY - hipCenterY
  ) || 1;

  const vector = new Float32Array(keyOrder.length * 3);
  for (let i = 0; i < keyOrder.length; i++) {
    const index = keyOrder[i];
    const point = kp[index] ?? { x: 0, y: 0, z: 0 };
    const base = i * 3;
    vector[base] = (point.x - hipCenterX) / torsoLength;
    vector[base + 1] = (point.y - hipCenterY) / torsoLength;
    vector[base + 2] = (point.z ?? 0) / torsoLength;
  }

  return vector;
}

function euclideanDistance(
  a: PoseVector,
  b: PoseVector,
  weights?: Float32Array
): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    const weight = weights ? weights[i] : 1;
    sum += weight * diff * diff;
  }
  return Math.sqrt(sum);
}

export function dtwDistance(
  seqA: PoseVector[],
  seqB: PoseVector[],
  window = 45,
  weights?: Float32Array
): number {
  const n = seqA.length;
  const m = seqB.length;
  const w = Math.max(window, Math.abs(n - m));
  const INF = 1e12;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(INF)
  );
  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const jStart = Math.max(1, i - w);
    const jEnd = Math.min(m, i + w);
    for (let j = jStart; j <= jEnd; j++) {
      const cost = euclideanDistance(seqA[i - 1], seqB[j - 1], weights);
      const minPrev = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      dp[i][j] = cost + minPrev;
    }
  }

  return dp[n][m];
}

export function distanceToScore(
  dtwDistanceValue: number,
  normalizationFactor = 10
): number {
  const score = Math.max(0, 100 - (dtwDistanceValue / normalizationFactor) * 100);
  return Math.min(100, score);
}

export function scoreRecording(
  referenceFrames: PoseFrame[],
  studentFrames: PoseFrame[],
  keyOrder: number[] = DEFAULT_KEY_ORDER,
  options: {
    window?: number;
    weights?: Float32Array;
    normalizationFactor?: number;
  } = {}
): ScoreResult {
  const { window = 45, weights, normalizationFactor = 10 } = options;
  const referenceVectors = referenceFrames.map((frame) =>
    normalizeAndVectorize(frame, keyOrder)
  );
  const studentVectors = studentFrames.map((frame) =>
    normalizeAndVectorize(frame, keyOrder)
  );

  const distance = dtwDistance(studentVectors, referenceVectors, window, weights);
  return {
    dtwDistance: distance,
    overallScore: distanceToScore(distance, normalizationFactor)
  };
}
```

### Real-time Scoring Pattern
1. Maintain a rolling buffer of the latest `N` student frames (e.g., 120 frames ≈ 4 s).
2. Align the buffer against the teacher sequence around the expected timeline using constrained DTW or cosine similarity.
3. Update the live score using EWMA to avoid flicker (`score = α * new + (1 - α) * prev`).
4. Run the heavy DTW analysis off the UI thread (Web Worker) and store the full session for offline replay.

### Heatmaps & Per-Joint Scores
- Capture per-alignment per-joint distances and map them to score bands.
- Overlay joints with color ramps (green → yellow → red) to highlight alignment quality.
- Down-weight joints with low confidence scores to prevent false negatives.

## 4. Operational Checklist
- Default to skeleton-only storage; raw video requires explicit consent.
- Track instrumentation: FPS, dropped frames, keypoint confidence, user actions.
- Monitor funnel metrics (signups → lesson completion → payment → retention).
- Monetization hooks: paid lessons, subscriptions, teacher bundles, premium analytics powered by higher-fidelity capture (Rokoko/DeepMotion) as future upsell.

---

**Next Steps**
- Convert the week-by-week plan into GitHub epics/stories.
- Prepare a hiring brief for a senior full-stack + ML engineer.
- Prototype the TypeScript DTW module against 4–5 sample teacher/student captures to calibrate `normalizationFactor` and joint weights.
