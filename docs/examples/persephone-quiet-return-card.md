# Persephone’s Quiet Return Ritual Card

This example captures the vertical ritual card shared in the brief. Save the
adjacent `persephone-quiet-return-card.html` file and open it in a browser to see
an isolated rendering with the typography, palette, and layout intact.

## Features

- Responsive card layout tailored for ritual drops or seasonal prompts
- Glyph-forward header for iconography or astrological symbols
- Ordered ritual checklist paired with a media block for audio or motion clips
- Dual call-to-action buttons for performing the ritual or minting a proof of action

## How to reuse it

1. Update the `<img>` source inside the `.media` container so it points to a real
   thumbnail or remove the element for audio-only rituals.
2. Replace the card title, subtitle, and ordered steps with your own copy while
   keeping the overall structure.
3. If you want to embed the card inside a larger layout, move the `<style>` block
   into your site-wide stylesheet and scope the class names as needed.

To experiment quickly, run a static server from `docs/examples`:

```bash
npx serve .
```

Then open `http://localhost:3000/persephone-quiet-return-card.html` to preview
and iterate on the design.
