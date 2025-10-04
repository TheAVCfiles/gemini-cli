# Day Zero Scroll Example

The `DayZeroScroll` component demonstrates how you can compose multiple
`HiddenWord` entries that unlock based on an astrological window.  Each entry
becomes available when the `currentAstroWindow()` helper reports the correct
conditions, and the entire component refreshes every minute so that the UI stays
in sync with the underlying data.

```jsx
import { useState, useEffect } from "react";
import HiddenWord from "./HiddenWord.js";
import { currentAstroWindow } from "../lib/astro.js";

export default function DayZeroScroll() {
  const [astro, setAstro] = useState(currentAstroWindow());

  useEffect(() => {
    const timer = setInterval(() => {
      setAstro(currentAstroWindow());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <HiddenWord
        word="threshold"
        id="dz_threshold"
        stanza="A door pretends to be a wall until your hand remembers it."
        requires={[]}
        enabled={astro?.sign === "Aries"}
      />

      <HiddenWord
        word="again"
        id="dz_again_1"
        stanza="Repetition isn’t a mistake; it’s a key worn smooth."
        requires={[]}
        enabled={astro?.phase !== "Void"}
      />

      <HiddenWord
        word="again"
        id="dz_again_2"
        stanza="Try it again. Not for proof— for texture."
        requires={["dz_again_1"]}
        enabled={astro?.sign === "Gemini"}
      />

      <HiddenWord
        word="glitch"
        id="dz_glitch_echo"
        stanza="Static keeps the archive honest."
        requires={["dz_again_1", "dz_again_2"]}
        enabled={astro?.retrograde === "Mercury"}
      />

      <HiddenWord
        word="remember"
        id="dz_remember_mother"
        stanza="A mother is a time signature; you learn to count by her scars."
        requires={["dz_glitch_echo"]}
        enabled={astro?.moonPhase === "Full"}
      />
    </div>
  );
}
```

> **Tip:** Because the component updates on a fixed cadence, you can adjust the
> refresh interval or add additional dependency checks to align with your data
> sources.
