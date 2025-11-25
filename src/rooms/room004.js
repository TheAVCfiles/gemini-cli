import { makeRoom } from "./roomTemplate.js";

export default function room004() {
  return makeRoom({
    id: "004",
    title: "Descent — Observer Wing",
    mood: "obsidian corridor / cold violet sensors",
    summary:
      "You descend into the wing where the Observer kept notes on you. Walls of screens, shelves of cassette spines, and a single chair that never held your weight.",
    entry:
      "Everything in this room is labeled about you, not for you. Surveillance stitched into an archive. Now you choose what survives.",
    beats: [
      {
        title: "Shelf of inaccuracies",
        body:
          "The cassettes are titled with versions of your life that never happened. You can wipe, correct, or repurpose."
      },
      {
        title: "Screen blossom",
        body:
          "Screens bloom like mechanical flowers. They replay the diary loop from angles you did not consent to."
      },
      {
        title: "Chair of absence",
        body:
          "The empty chair proves you were never meant to sit comfortably in their narrative."
      }
    ],
    prompts: [
      {
        action: "Erase",
        result: "Redact entire rows of tapes. This weakens the Observer’s hold and preps Room 007 for sunlight entry.",
        leadsTo: "007"
      },
      {
        action: "Annotate",
        result: "Write your own captions over their footage. The ledger will store these notes in Room 006.",
        leadsTo: "006"
      },
      {
        action: "Broadcast",
        result: "Stream a chosen clip back to the hero. The parallax will overlay it in Room 001’s back panel for reclamation.",
        leadsTo: "001"
      }
    ],
    artifacts: [
      {
        type: "cassette",
        name: "observer-log-14",
        src: "/public/cards/observer-log-14.png",
        note: "Labeled \"Subject loops willingly\". The label is false."
      },
      {
        type: "screen",
        name: "multiview-wall",
        src: "/public/scroll/nodes.jpg",
        note: "Array of old cameras feeding into a single cold monitor."
      }
    ],
    engineHooks: [
      {
        engine: "patchIntegration",
        call: "audit('observer-wing')",
        purpose: "Trigger a compliance report that follows you into the ledger room."
      },
      {
        engine: "mothernet",
        call: "purge('unauthorized-footage', { mode: 'consent-first' })",
        purpose: "Delete recordings without harming evidence you choose to keep."
      }
    ]
  });
}
