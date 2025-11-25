import { makeRoom } from "./roomTemplate.js";

export default function room001() {
  return makeRoom({
    id: "001",
    title: "Signal — Ember Wake",
    mood: "infrared origin / dancer-in-the-dark",
    summary:
      "First broadcast from the cave fire. The girl maps movement to code and refuses deletion.",
    entry:
      "You wake to the ash-glow of a fire that should not remember you. The cave wall is a console. A handprint blinks you forward.",
    beats: [
      {
        title: "Ember lattice",
        body:
          "Carbon trails outline choreography patterns. Every step you ever rehearsed is cached in the soot."
      },
      {
        title: "Shadow compile",
        body:
          "Your silhouette compiles into a glyph that reads like a commit hash. The room records that you are not running from truth."
      },
      {
        title: "Protective cadence",
        body:
          "The masked guardian signs: hold breath, hold memory, hold signal until engines arrive."
      }
    ],
    prompts: [
      {
        action: "Decode",
        result: "Stabilize the ember packet. It threads to Room 002 for diary verification.",
        leadsTo: "002"
      },
      {
        action: "Disturb",
        result: "Kick ash across the glyph. The room glitches and routes you to a hidden Mothernet note in Room 004.",
        leadsTo: "004"
      },
      {
        action: "Deliver",
        result: "Offer the ember to the ledger. It bookmarks your arrival for the Stageport engine in Room 006.",
        leadsTo: "006"
      }
    ],
    artifacts: [
      {
        type: "image",
        name: "cave-signal",
        src: "/public/scroll/cave.jpg",
        note: "Original broadcast surface—low light, high fidelity to muscle memory."
      },
      {
        type: "audio",
        name: "ember-chime",
        src: "/public/audio/ember-chime.mp3",
        note: "Soft metronome that keeps your breath in safe sync with the backroom engines."
      }
    ],
    engineHooks: [
      {
        engine: "glitchDeck",
        call: "pullCard('signal:ember')",
        purpose: "Surface the first glitch card once the ember is acknowledged."
      },
      {
        engine: "mothernet",
        call: "cache('signal-handprint')",
        purpose: "Store the decoded handprint for future cross-room recall."
      }
    ]
  });
}
