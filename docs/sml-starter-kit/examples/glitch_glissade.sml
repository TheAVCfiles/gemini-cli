# Minimal spell — console only
[Cast: Glitch.Glissade]
Domain: Movement
Phase: PREP -> JETÉ
Intent: Stabilize Structure / Confirm Glitch
Trigger:
    when tri_score > 4.5 and structure_ok = true
Effect:
    -> narrate("Structure confirmed. Preparing for potential Jeté.")
    -> cue_state("GlisséEngineFSM", to="PREP")
Tone: Quiet, Elastic
