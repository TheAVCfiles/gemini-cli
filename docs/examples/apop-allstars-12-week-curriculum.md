# APop Allstars — 12-Week Curriculum (Dancer Edition)

This example captures the staging calendar for the APop Allstars dance cohort as a Mermaid Gantt chart. Paste the snippet below into any Mermaid-enabled markdown renderer (such as the Gemini CLI markdown viewer, GitHub, or Mermaid Live Editor) to explore dependencies, timings, and milestones for the program.

```mermaid
gantt
    title APop Allstars — 12-Week Curriculum (Dancer Edition)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d
    excludes    weekends

    section Physical Development
    Rhythm Sync Lab (tempo, 8-counts)       :active,    p1, 2025-10-20, 2w
    Idol Energy (isolation, stage presence) :           p2, after p1,   3w
    Choreo Cipher (phrase notation)         :           p3, after p2,   3w

    section Emotional Development
    Emotion in Motion (label→movement)      :active,    e1, 2025-10-20, 2w
    Empathy Games (mirror/lead/follow)      :           e2, after e1,   3w
    Calm-Down Choreo (breath→beat)          :           e3, after e2,   3w

    section Cognitive & Technical Layer
    Kinetic Cipher Logs (emoji notation)    :           c1, 2025-11-03, 4w
    Sentient Cents (practice tokens)        :           c2, after c1,   3w

    section Creative & Cultural Literacy
    KR greetings & teamwork rituals         :           k1, 2025-10-27, 3w
    Symbolism & Costume Color Theory        :           k2, after k1,   3w

    section Gamified Learning
    Streaks & badges                        :           g1, 2025-10-27, 8w
    Leader Moments (token redemption)       :           g2, after g1,   1w

    section Performance & Community
    Parent mini-workshop: Decode the Dance  :milestone, m1, 2026-01-12, 1d
    Showcase: “APop Allstars — Bloom Mode”  :milestone, m2, 2026-01-30, 1d
```
