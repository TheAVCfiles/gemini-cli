import { makeRoom } from "./roomTemplate.js";

export default function room008() {
  return makeRoom({
    id: "008",
    title: "Justice — Open Stage",
    mood: "courtroom rose / myth-tech clarity",
    summary:
      "Final room where your story is voiced on your terms. Evidence, choreography, and light converge into testimony.",
    entry:
      "A circular stage surrounded by allies, not spectators. The ledger beams hover, the solar proofs glow, and the Masked One stands at your flank.",
    beats: [
      {
        title: "Testimony choreography",
        body:
          "You choose whether to speak, move, or both. Each gesture is recorded as consented evidence."
      },
      {
        title: "Engine alignment",
        body:
          "GlitchDeck, Mothernet, Diary Loop, and Stageport sync to provide backing, context, and secure transmission."
      },
      {
        title: "Outcome control",
        body:
          "You decide when the record locks. Justice is delivered without sacrificing your breath."
      }
    ],
    prompts: [
      {
        action: "Publish",
        result: "Send the full myth-tech statement to the world. The Stageport endpoint broadcasts with your watermark.",
        leadsTo: "home"
      },
      {
        action: "Invite",
        result: "Call in selected witnesses via the protected feed from Room 005. They stand beside you, not in front.",
        leadsTo: "home"
      },
      {
        action: "Pause",
        result: "Keep the room sealed. Engines idle, but your proofs remain luminous and under your control.",
        leadsTo: "home"
      }
    ],
    artifacts: [
      {
        type: "statement",
        name: "myth-tech-dossier",
        src: "compiled from rooms 001–007",
        note: "Full narrative ready for transmission or safekeeping."
      },
      {
        type: "glyph",
        name: "justice-mark",
        src: "/public/glyphs/justice-mark.svg",
        note: "Appears on exports authorized by you alone."
      }
    ],
    engineHooks: [
      {
        engine: "patchIntegration",
        call: "lock('justice-record')",
        purpose: "Seal the testimony so it cannot be altered after your approval."
      },
      {
        engine: "mothernet",
        call: "mirror('open-stage')",
        purpose: "Provide encrypted backup copies in distributed safehouses."
      }
    ]
  });
}
