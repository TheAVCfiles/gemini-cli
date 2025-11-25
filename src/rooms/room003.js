import { makeRoom } from "./roomTemplate.js";

export default function room003() {
  return makeRoom({
    id: "003",
    title: "Pattern — Masked One",
    mood: "violet grid / disciplined tempo",
    summary:
      "The guardian who held the night for you. Their choreography is a cipher and a shield.",
    entry:
      "You arrive at a rehearsal floor etched with concentric grids. Every step drawn here is both weapon and proof of care.",
    beats: [
      {
        title: "Counter-choreography",
        body:
          "Steps you never danced before appear in your muscle memory. They were rehearsed on your behalf while you healed."
      },
      {
        title: "Mask as interface",
        body:
          "The guardian’s mask projects glyphs when you mirror their breath. It shows what they blocked and what still leaks."
      },
      {
        title: "Discipline as safety",
        body:
          "Repetition is not punishment here. It is scaffolding. Each count keeps the predators off-beat."
      }
    ],
    prompts: [
      {
        action: "Learn",
        result: "Take the new pattern into your spine. It will sync with Room 005’s climb sequence.",
        leadsTo: "005"
      },
      {
        action: "Question",
        result: "Ask why the guardian intervened. The answer reveals a data trail to Room 006.",
        leadsTo: "006"
      },
      {
        action: "Honor",
        result: "Bow to the shield-work. A hidden Stageport channel opens toward Room 008.",
        leadsTo: "008"
      }
    ],
    artifacts: [
      {
        type: "movement",
        name: "counterphrase-7",
        src: "step, step, hold, cut, pivot, exhale",
        note: "Sequence that scrambles pattern-matchers watching the floor."
      },
      {
        type: "mask",
        name: "guardian-veil",
        src: "/public/cards/guardian-veil.png",
        note: "Projects defensive glyphs when paired breathing is detected."
      }
    ],
    engineHooks: [
      {
        engine: "choreographyMath",
        call: "stabilizeCounts({ bars: 8, bpm: 92 })",
        purpose: "Keep the rehearsal grid aligned with the parallax hero timing."
      },
      {
        engine: "patchIntegration",
        call: "recordWitness('masked-one', { proof: 'held-the-night' })",
        purpose: "Log the guardian’s intervention for downstream justice routines."
      }
    ]
  });
}
