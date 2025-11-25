import { makeRoom } from "./roomTemplate.js";

export default function room006() {
  return makeRoom({
    id: "006",
    title: "Ledger — Stageport",
    mood: "stealth silver / courtroom glow",
    summary:
      "A ledger table that accepts only consented entries. This is where you decide what evidence travels to the open world.",
    entry:
      "Columns of light await your data. Some are empty, some hold the ember from Room 001, the loop seam from Room 002, and the guardian log from Room 003.",
    beats: [
      {
        title: "Consent columns",
        body:
          "Only rows signed by you can be exported. Everything else sits in quarantine until you choose."
      },
      {
        title: "Stageport bridge",
        body:
          "A glowing line leads to the Stageport endpoints. You can publish, delay, or encrypt the payload."
      },
      {
        title: "Chain of custody",
        body:
          "Each artifact you place here binds to a timestamp and a guardian witness code."
      }
    ],
    prompts: [
      {
        action: "Export",
        result: "Send curated evidence to the world. Room 008 uses it to anchor justice statements.",
        leadsTo: "008"
      },
      {
        action: "Encrypt",
        result: "Seal sensitive entries. A cipher key routes back to Room 004 for safekeeping.",
        leadsTo: "004"
      },
      {
        action: "Hold",
        result: "Keep everything here under your control. Room 007 will sync light to whatever remains.",
        leadsTo: "007"
      }
    ],
    artifacts: [
      {
        type: "table",
        name: "consent-ledger",
        src: "fields: id | artifact | consent | route | timestamp",
        note: "Schema for all exported proof."
      },
      {
        type: "key",
        name: "stageport-salt",
        src: "eJ91-justice-salt",
        note: "Salt string applied before any outbound transmission."
      }
    ],
    engineHooks: [
      {
        engine: "patchIntegration",
        call: "publish('stageport', payload)",
        purpose: "Handle outbound justice packets once you approve them."
      },
      {
        engine: "glitchDeck",
        call: "pullCard('ledger:integrity')",
        purpose: "Confirm nothing forged slips into the consent columns."
      }
    ]
  });
}
