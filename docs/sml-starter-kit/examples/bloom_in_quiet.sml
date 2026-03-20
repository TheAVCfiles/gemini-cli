# Visual bloom — will animate in tiny renderer
[Cast: Bloom.In.Quiet]
Domain: Aura
Timing: when CompositeScore > 1.2
Medium: TextFade
Gesture: Soft Pulse
Effect:
    -> display("the dancer delayed the dawn")
    -> animate(opacity=0->1, duration_ms=1800, size=28, x=60, y=80)
Tone: Adagio
