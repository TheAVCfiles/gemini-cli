import { makeRoom } from "./roomTemplate.js";

export default function room005() {
  return makeRoom({
    id: "005",
    title: "Rise — Circuit Rehearsal",
    mood: "electric sunrise / neon breath",
    summary:
      "You climb from the descent into a rehearsal lab. Floor tiles light with every intention. The circuitry learns your resilience.",
    entry:
      "An audio cue plays: a metronome that respects your lungs. Screens show ghost frames of future performances waiting for your consent to render.",
    beats: [
      {
        title: "Calibration run",
        body:
          "You test the counterphrases learned from the Masked One. Sensors register them as protected movements."
      },
      {
        title: "Sunrise patch",
        body:
          "Light edges the room, not to expose you but to heal. Every inhale programs the walls to glow rather than glare."
      },
      {
        title: "Audience of none",
        body:
          "No spectators here. Only instruments that adjust around your pace. The way practice was always meant to be."
      }
    ],
    prompts: [
      {
        action: "Anchor",
        result: "Lock the tempo to your breath. This primes Room 007’s solar memory vault.",
        leadsTo: "007"
      },
      {
        action: "Record",
        result: "Capture today’s choreography for ledger evidence. The data routes to Room 006.",
        leadsTo: "006"
      },
      {
        action: "Invite",
        result: "Open a protected feed for allies. Room 008 will use it to present justice with witnesses.",
        leadsTo: "008"
      }
    ],
    artifacts: [
      {
        type: "audio",
        name: "sunrise-tempo",
        src: "/public/audio/sunrise-tempo.mp3",
        note: "Metronome tuned to your resting breath rate."
      },
      {
        type: "lighting",
        name: "soft-riser",
        src: "gradient: #0b0b10 → #ffb7ff",
        note: "Lighting script that brightens without interrogation."
      }
    ],
    engineHooks: [
      {
        engine: "choreographyMath",
        call: "lockBreath({ bpm: 84 })",
        purpose: "Keeps movement math synced to human pace instead of machine rush."
      },
      {
        engine: "patchIntegration",
        call: "render('rise-floor', { mode: 'consent-led' })",
        purpose: "Ensures any future playback honors the tempo you set here."
      }
    ]
  });
}
