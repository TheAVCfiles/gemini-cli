# Dance Mirror Initiative — Execution Packet

This document consolidates a ready-to-run delivery packet for the dance mirror product initiative.
It groups work into a fully-specified GitHub issue board, a hiring brief for the senior engineer
needed to ship it, and a native iPad/AR "pro" roadmap for premium development. The material is
structured so it can be pasted directly into GitHub Issues, Jira, recruiting collateral, or
contractor briefs without additional rewriting.

## 1. GitHub Issue Board — Epics and Tickets

The issue plan enumerates eight epics (plus the setup epic) with sixty scoped tickets. Each ticket
includes a short description, clear acceptance criteria, an hourly estimate, and suggested labels.
The intent is to drop these directly into a GitHub project so that sprint planning can begin
immediately.

### Epic 0 — Project Setup & Infrastructure (5 tickets)

- **0.1 Project kickoff & repo + board**  
  *Desc:* Create GitHub repo(s), branch strategy (main/dev/feature), basic README, CODEOWNERS, and
  project board (epics → stories). Setup CI skeleton.  
  *Acceptance:* Repo exists, README describes stack, project board contains epics.  
  *Estimate:* 4h · *Labels:* infra, docs
- **0.2 Dev environment & local scripts**  
  *Desc:* Create Docker/local dev scripts (start frontend, mock pose data server), ESLint/Prettier,
  Husky precommit.  
  *Acceptance:* `npm run dev` starts frontend and mock backend, linter runs on commit.  
  *Estimate:* 8h · *Labels:* infra, dev-experience
- **0.3 Authentication & basic user model (dev)**  
  *Desc:* Wire Supabase/Firebase dev project, create user table spec, test auth flow
  (email/password).  
  *Acceptance:* Dev auth works and returns user id; test user created.  
  *Estimate:* 6h · *Labels:* backend, auth
- **0.4 S3 bucket + CDN for artifacts**  
  *Desc:* Provision S3 (or GCS), CloudFront/Cloudflare, set lifecycle rules (gzip), CORS,
  dev/staging/prod buckets.  
  *Acceptance:* Upload/download OK and publicly reachable URLs for static artifacts.  
  *Estimate:* 6h · *Labels:* infra, storage
- **0.5 Monitoring & logging baseline**  
  *Desc:* Setup basic Sentry (frontend), CloudWatch or Google logging, and simple metrics dashboard
  (errors/latency).  
  *Acceptance:* Errors log to Sentry and a simple dashboard is available.  
  *Estimate:* 6h · *Labels:* infra, observability

### Epic 1 — Camera & Pose Capture (8 tickets)

1. **1.1 Camera capture & compatibility scaffolding** — 8h · frontend  
   Implement `getUserMedia` wrapper with iPad Safari quirks, facingMode, resolution switcher, and UX
   permission flow. Acceptance: camera starts, handles permission denial, toggles front/rear,
   supports 640×480/1280×720.
2. **1.2 Integrate MoveNet TF.js (client)** — 12h · frontend, ml  
   Add TF.js MoveNet SinglePose Lightning model, test on desktop & iPad. Acceptance: pose estimates
   at ~20–30fps on iPad; keypoints JSON available.
3. **1.3 Integrate MediaPipe Pose/landmarker (optional)** — 12h · frontend, ml  
   Add MediaPipe option and toggle; evaluate perf vs MoveNet. Acceptance: MediaPipe runs with
   acceptable performance and returns landmarks.
4. **1.4 Keypoint smoothing library** — 8h · frontend, ml  
   Implement EWMA smoothing + missing-keypoint interpolation with UI toggle.
5. **1.5 Mirror UX / flipHorizontal** — 4h · frontend, ux  
   Mirror camera and skeleton so the user sees a mirrored experience. Acceptance: mirror mode toggles
   and skeleton overlays correctly.
6. **1.6 Frame serialization & buffer** — 6h · frontend, backend  
   Implement frame buffer, serialize keypoint frames into compact JSON, add metadata (model, fps).
7. **1.7 Device motion fusion (optional)** — 8h · frontend, ml  
   Hook `DeviceMotion`/IMU data, timestamp-align with pose frames. Acceptance: IMU data recorded and
   time-synced with poses.
8. **1.8 Model switching + perf metrics** — 6h · frontend, infra  
   Add runtime performance metrics (fps, CPU) and model switching without reload.

### Epic 2 — Teacher Recording & Storage (7 tickets)

1. **2.1 Teacher record UX (video + skeleton)** — 10h · frontend, ux  
   Record/stop/pause UI, capture skeleton JSON + optional video, local preview. Acceptance:
   recordings preview successfully.
2. **2.2 Upload pipeline (skeleton → S3)** — 6h · backend  
   Upload compressed skeleton JSON to S3 and create DB record with progress UI.
3. **2.3 Video processing pipeline (opt-in)** — 8h · backend, infra  
   Upload MP4, run transcode job, optionally generate thumbnails.
4. **2.4 Normalize & precompute teacher normalized frames** — 8h · backend, ml  
   Serverless function computes normalized vector frames for scoring.
5. **2.5 Lesson meta & publishing flow** — 6h · frontend, backend  
   Metadata UI (title, tempo, difficulty, duration), publish/unpublish, versioning.
6. **2.6 Lesson preview & replay** — 6h · frontend  
   Replay teacher lesson with skeleton overlay, timeline scrub, and download.
7. **2.7 Consent & privacy UI for recordings** — 4h · legal, frontend  
   Consent checkbox for raw video storage and privacy settings per lesson.

### Epic 3 — Scoring Engine & Offline DTW (8 tickets)

1. **3.1 Vectorization & normalization library** — 8h · ml, backend  
   Convert frames to normalized vectors (center on hips, scale by torso).
2. **3.2 DTW implementation (serverless & client)** — 12h · ml  
   DTW with Sakoe-Chiba window in Node plus optimized WebWorker version; unit tests required.
3. **3.3 Mapping distance → 0–100 score** — 6h · ml  
   Heuristic function + calibration harness.
4. **3.4 Per-frame & per-joint scoring aggregation** — 8h · backend, ml  
   Produce per-frame scores and per-joint aggregates for heatmap; store summary JSON.
5. **3.5 Offline scoring job / replay scoring** — 8h · backend, infra  
   Serverless job computes scoring for uploads and persists results.
6. **3.6 Calibration tool UI** — 6h · frontend, ml  
   Admin page to compute normalization factor from expert performances.
7. **3.7 Unit tests & performance tests for scoring** — 8h · qa, ml  
   Add scoring test suite, measure compute time/memory, optimize for ≤300-frame sequences.
8. **3.8 Storage of raw metrics + versioning** — 4h · backend  
   Save raw DTW distances, normalized distances, model version for reprocessing.

### Epic 4 — Real-time Mirror Scoring & UI (8 tickets)

1. **4.1 Real-time sliding-window scoring worker** — 16h · frontend, ml  
   WebWorker scoring buffer delivering sub-200ms latency.
2. **4.2 UI overlay: score, streaks, and heatmap** — 12h · frontend, ux  
   Live overlay with per-joint heatmap and cues.
3. **4.3 Audio & tempo alignment** — 10h · ml, frontend  
   Tempo detection for teacher reference and alignment metric for student.
4. **4.4 Smoothing & responsiveness tuning (realtime)** — 8h · ml, frontend  
   Configure EWMA/Kalman parameters with UI toggles.
5. **4.5 Offline replay + annotated timeline** — 8h · frontend  
   Replay page with seekable timeline showing teacher/student skeletons and heatmap.
6. **4.6 Export session summary (PDF/JSON)** — 6h · backend, frontend  
   Export report containing overall score and breakdowns.
7. **4.7 Edge-case handling (missing keypoints)** — 6h · frontend, ml  
   Handle low-confidence joints gracefully with UI indicator.
8. **4.8 Accessibility & low-bandwidth modes** — 6h · ux, frontend  
   Toggleable low-fidelity mode for constrained devices.

### Epic 5 — Auth, Lessons, Payments & Badges (6 tickets)

1. **5.1 Full auth flow + profile** — 8h · backend  
   Email verification, password reset, profile editing, role management.
2. **5.2 Lessons marketplace & search** — 8h · frontend  
   Catalog UI with search/filter and lesson preview.
3. **5.3 Stripe integration + subscription & single purchase** — 12h · backend, payments  
   Payment flow with webhooks ensuring unlocks.
4. **5.4 Badges & achievement system** — 6h · frontend, backend  
   Badge engine for milestones and streaks with UI.
5. **5.5 Permissions & lesson ownership** — 6h · backend  
   Ownership rules, edit permissions, share links.
6. **5.6 Billing admin & refunds UI** — 6h · ops  
   Admin page for refunds and subscription management.

### Epic 6 — Live Sessions & Teacher Observability (6 tickets)

1. **6.1 WebRTC skeleton + video streaming** — 16h · realtime, frontend  
   WebRTC streaming with data channel for skeleton frames; <500ms latency goal.
2. **6.2 Teacher cueing & yellow/red flags** — 8h · realtime, ux  
   Teacher can send quick cues displayed to student.
3. **6.3 Session recording & logs** — 8h · backend  
   Optional recording of skeletons and cues for replay.
4. **6.4 Low-latency mode + connection fallback** — 8h · realtime, infra  
   SFU or P2P fallback with reconnect/degraded modes.
5. **6.5 Scheduling & calendar integration** — 6h · frontend  
   Scheduling UI with iCal links and notifications.
6. **6.6 Session analytics (teacher view)** — 6h · frontend, analytics  
   Post-session summary with average score and issues.

### Epic 7 — QA, Privacy, Performance & Beta (6 tickets)

1. **7.1 End-to-end QA plan & automated tests** — 12h · qa  
   Test matrix plus Cypress/Playwright smoke tests.
2. **7.2 Performance tuning on iPad** — 12h · perf  
   Profile CPU/GPU, optimize canvas/WebWorker usage for 30fps.
3. **7.3 Privacy & legal review** — 8h · legal  
   Document privacy defaults, consent flow, data retention.
4. **7.4 Security review & pen-test checklist** — 8h · security  
   Audit auth flows, S3 access, encryption at rest.
5. **7.5 Beta onboarding flow & support** — 8h · ux, support  
   Onboarding wizard, help docs, in-app feedback channel.
6. **7.6 Scalability smoke test** — 8h · infra, perf  
   Simulate 50 concurrent users, capture metrics and remediation plan.

### Epic 8 — Analytics, Marketing & Ops (6 tickets)

1. **8.1 Event schema & analytics pipeline** — 8h · analytics  
   Define analytics events and stream into BigQuery/Segment.
2. **8.2 Leaderboards & teacher leaderboard** — 8h · frontend, backend  
   Implement opt-in leaderboards for students and teachers.
3. **8.3 Marketing landing page & SEO** — 8h · marketing  
   Launch landing page with conversion tracking and webinar signup.
4. **8.4 Affiliate / studio partnership model** — 8h · business  
   Partner onboarding, coupon codes, revenue share tracking.
5. **8.5 Ops runbook & cost tracking** — 6h · ops  
   Write incident runbook, configure cost dashboards and alerts.
6. **8.6 Post-beta roadmap planning** — 6h · product  
   Consolidate beta feedback and prioritize next quarter features.

**Total estimate:** Approximately 600–700 development hours (8-week cadence with a 2–3 person team).

## 2. Hiring Brief — Senior Full-Stack/ML Engineer

**Role:** Senior Full-Stack Engineer (React · TypeScript · TF.js · Realtime)  
**Type:** Full-time preferred, open to 6–12 month contract  
**Seniority:** 5+ years full-stack, 2+ years production ML/CV

### Mission

Ship a fast, privacy-first dance mirror product with client-side pose capture, real-time scoring, and
an elegant teacher ↔ student experience. Ownership spans frontend architecture, the TF.js pose
pipeline, scoring engine integration, and product trade-offs.

### Must-have skills

- Production React with TypeScript and performance tuning expertise
- TF.js / browser ML experience (MoveNet, MediaPipe, CoreML conversions)
- Deep JavaScript performance knowledge (WebWorkers, canvas/WebGL)
- Backend/serverless proficiency (Node, AWS/GCP, Supabase/Firebase)
- WebRTC or real-time data channel implementation experience
- Systems thinking: latency, observability, profiling, and reliability

### Nice-to-have skills

- iOS/ARKit experience (Swift, ARBodyTracking)
- Background in motion capture or biomechanics tooling
- Strong UX sensibilities for real-time feedback experiences

### Compensation guidance

- **US Full-time:** $140k–$200k base salary plus equity (region dependent)  
- **US Contract:** $90–$160 per hour for senior contractors; mid-senior blended options possible

### Interview plan

1. **Stage 0 — Screen (30m):** Background, availability, culture fit; quick questions on browser ML
   and realtime systems.  
2. **Stage 1 — Pairing / Live Coding (60m):** Build a React canvas component that draws skeletons,
   toggles smoothing, and handles mock pose JSON. Evaluates architecture, TypeScript, and rendering
   chops.  
3. **Stage 2 — System Design (60–90m):** Design “Mirror Mode” real-time system: pose capture,
   teacher reference, live scoring, replay, latency mitigation, observability, and privacy.  
4. **Stage 3 — Take-home (48–72h):** Deliver TF.js sample capturing frames, normalizing vectors, and
   computing similarity score between teacher/student sequences with README on performance choices.  
5. **Stage 4 — Culture & Product Fit (30m):** Discussion with product owner on collaboration and
   long-term ownership.

### Sample interview prompts

- *Performance question:* “How do you achieve a stable 30fps MoveNet pipeline on iPad Safari?”
  Expected coverage: WebWorkers, `requestAnimationFrame`, resolution management, WebGL backend,
  model variants, frame batching, render optimizations.
- *Alignment question:* “How would you align two motion sequences with tempo drift?”
  Expected coverage: DTW with Sakoe-Chiba window, normalization, per-joint weighting, streaming
  buffers.

### Screening exercise

Provide a short coding task converting raw keypoints into normalized torso-centered vectors (10–15
minutes). Score for correctness and brevity.

## 3. Native iPad/AR “Pro” Plan

### Why go native?

Choose the native iPad route for high-fidelity 3D spatial tracking, ultra-low latency, and premium
AR overlays—ideal for studio-grade experiences and monetizable pro plans.

### Recommended stack

- Swift + SwiftUI for UI
- ARKit with `ARBodyTrackingConfiguration`, RealityKit/SceneKit for avatar rendering
- Apple Vision + CoreML (converted MoveNet/MediaPipe) for parity with web models
- Metal for advanced rendering optimizations
- Shared backend (Supabase/Firebase, S3/CloudFront)
- Fastlane + TestFlight for CI/CD

### Feature highlights

- ARBodyTracking for 3D skeleton joint transforms (root-relative)  
- LiDAR enhancements for spatial continuity (LiDAR-capable iPad Pro)  
- TrueDepth integration for high-resolution upper-body tracking  
- Local CoreML inference for privacy and latency  
- High-fidelity recording of 3D skeletons, video, and world anchors  
- Pro analytics: 3D joint angles, spin detection, center-of-mass estimates

### Architecture notes

- Use ARKit body anchors as canonical 3D reference; sample at 60Hz and downsample for storage/DTW.  
- Store 3D skeletons per frame in compact binary (protobuf) or compressed JSON with parity exports
  to 2D vectors.  
- Maintain shared normalization pipeline to ensure compatibility with the web scorer.

### Timeline & team sizing

- Discovery & prototype: 2–3 weeks (ARKit spike + sample app)
- Core body tracking & recording: 4–6 weeks
- Real-time scoring & live teacher session: +4 weeks
- Polish, testing, TestFlight launch: +2–4 weeks
- **Total:** 3–4 months for a polished first release depending on team size

### Cost ranges

- Small team (1 iOS engineer + part-time backend/ML + designer): **$40k–$75k**
- Full-featured pro product (senior iOS + ML + designer + QA): **$80k–$150k**

### Risk profile & mitigations

- *Device fragmentation:* Target LiDAR-enabled iPad Pros for pro features; provide web fallback.  
- *Apple privacy requirements:* Store skeleton data primarily; require explicit consent for raw
  video capture.  
- *Performance constraints:* Benchmark early, leverage Metal and CoreML optimizations.  
- *App Store compliance:* Document privacy permissions and consent flows clearly.

## 4. Next Steps

- Provide preferred import format (CSV/JSON/Notion) to export the 60-ticket board.  
- Generate take-home prompt scaffolding and interview materials for the hiring process.  
- Expand the first two weeks of sprint tasks into day-by-day tickets if needed.

This packet gives a turnkey starting point to execute the dance mirror initiative—covering backlog,
team hiring, and the premium native path.
