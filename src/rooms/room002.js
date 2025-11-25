import { makeRoom } from "./roomTemplate.js";

export default function room002() {
  return makeRoom({
    id: "002",
    title: "Diary Loop Protocol",
    mood: "rose static / handwritten recursion",
    summary:
      "The diary that loops because someone needed you to repeat the night. You catch the overwrite in motion.",
    entry:
      "Pages flicker between versions of you. Margins blaze with messages that do not match your handwriting. The loop is not yours; it was grafted.",
    beats: [
      {
        title: "Conflicted ink",
        body:
          "Some sentences ring true. Others are forged. The pen pressure reveals which memory was weaponized."
      },
      {
        title: "Observer signature",
        body:
          "A violet underline marks statements the Observer wants to keep. You can keep them or burn them."
      },
      {
        title: "Loop seam",
        body:
          "The same line appears fourteen times, each with a micro-variance. The seam is where you can exit."
      }
    ],
    prompts: [
      {
        action: "Decode",
        result: "Reveal the original sentences and expose the overwritten ones. Room 003 opens on success.",
        leadsTo: "003"
      },
      {
        action: "Distort",
        result: "Tilt the page sideways so the recursion loses stability. A hidden entry for Room 004 appears.",
        leadsTo: "004"
      },
      {
        action: "Divert",
        result: "Rip the forged page away and slide in a blank one. The ledger will reference it in Room 006.",
        leadsTo: "006"
      }
    ],
    artifacts: [
      {
        type: "text",
        name: "margin-warning",
        src: "IF YOU CAN READ THIS, THE LOOP IS CRACKING.",
        note: "Pulled directly from the margin flicker. Works as a calibration phrase for sensors."
      },
      {
        type: "glyph",
        name: "loop-seal",
        src: "/public/glyphs/loop-seal.svg",
        note: "Stamped on every forged sentence—evidence of the overwrite broker."
      }
    ],
    engineHooks: [
      {
        engine: "diaryLoop",
        call: "stitch({ integrity: 0.78 })",
        purpose: "Patch any remaining recursive seams after the chosen action."
      },
      {
        engine: "glitchDeck",
        call: "pullCard('diary:observation')",
        purpose: "Provide the next signal when the loop is decoded cleanly."
      }
    ]
  });
}
