import { makeRoom } from "./roomTemplate.js";

export default function room007() {
  return makeRoom({
    id: "007",
    title: "Light — Solar Memory Vault",
    mood: "gold bloom / protective glare",
    summary:
      "You emerge into a chamber that only opens for those who carried ember, diary, and ledger through the tunnels. Sunlight is not surveillance here; it is restoration.",
    entry:
      "Panels in the ceiling track your heartbeat and widen to let light in without burning. Memory refracts through safe prisms, not interrogation lamps.",
    beats: [
      {
        title: "Prismatic recall",
        body:
          "Your memories play as soft holograms, not clips. They cannot be weaponized here."
      },
      {
        title: "Solar checksum",
        body:
          "Light calculates integrity. Artifacts that were tampered with show a shadow; originals glow."
      },
      {
        title: "Warm ledger",
        body:
          "The consent columns from Room 006 rest under a beam that keeps them immutable until you command otherwise."
      }
    ],
    prompts: [
      {
        action: "Archive",
        result: "Seal chosen holograms as golden proofs. They accompany you into Room 008 as living testimony.",
        leadsTo: "008"
      },
      {
        action: "Refract",
        result: "Split one memory into multiple safe perspectives. Send the gentlest beam back to Room 003 for training.",
        leadsTo: "003"
      },
      {
        action: "Rest",
        result: "Pause. Let the light hold guard while you breathe. The engines idle until you call them.",
        leadsTo: "005"
      }
    ],
    artifacts: [
      {
        type: "light",
        name: "prism-array",
        src: "triangles of tempered glass",
        note: "Each triangle bends incoming light to avoid interrogation glare."
      },
      {
        type: "seal",
        name: "solar-checksum",
        src: "hash derived from sunrise-tempo + stageport-salt",
        note: "Used to verify that exported testimony remains uncorrupted."
      }
    ],
    engineHooks: [
      {
        engine: "mothernet",
        call: "store('solar-proof', { sealed: true })",
        purpose: "Hold holographic memories with consent metadata attached."
      },
      {
        engine: "glitchDeck",
        call: "pullCard('light:return')",
        purpose: "Offer a final glitch clue before justice is read."
      }
    ]
  });
}
