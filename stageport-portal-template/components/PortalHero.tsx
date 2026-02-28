import Link from 'next/link';

type AudienceMode = 'dance' | 'pivot';

type PortalHeroProps = {
  mode?: AudienceMode;
  onModeChange?: (mode: AudienceMode) => void;
};

const heroCopy = {
  dance: {
    badge: 'BUILT FOR MOVERS · BY A MOVER',
    headline: 'Your movement is the product. We built the math to prove it.',
    subheadline:
      'Every rehearsal, every class, every performance generates data that disappears the moment it ends. StagePort captures it — transparent scoring, cryptographic proof, and tokens that turn your artistry into credentials, scholarships, and leverage.',
    context:
      'Designed by a career choreographer who got tired of vibes-only scoring. Built for the people who carry studios on their bodies.',
    cta1: 'See What Your Studio Generates',
    cta2: 'View Pricing',
  },
  pivot: {
    badge: 'KINETIC INTELLIGENCE · GOVERNANCE INFRASTRUCTURE',
    headline: "All the world's a stage. We built the operating system for what moves inside it.",
    subheadline:
      "Kinetic intelligence — the embodied labor of dancers, salespeople, operators, and physical workers — generates value that traditional systems can't measure. StagePort translates movement into algorithms, governance into infrastructure, and contribution into proof.",
    context:
      "Rockettes kicklines. Rockefeller's railways. Not so disconnected. The same kinetic principles that power elite performance power elite governance.",
    cta1: 'Explore the Framework',
    cta2: 'See Governance Pricing',
  },
};

export default function PortalHero({ mode = 'dance', onModeChange }: PortalHeroProps) {
  const active = heroCopy[mode];

  return (
    <section style={{ border: '1px solid hsl(var(--card-border))', borderRadius: 18, background: 'hsl(var(--card))', padding: 28 }}>
      <div style={{ display: 'inline-flex', border: '1px solid hsl(var(--border) / 0.3)', background: 'hsl(var(--card) / 0.5)', borderRadius: 999, padding: 4, marginBottom: 16 }}>
        <button
          data-testid="toggle-audience-dance"
          onClick={() => onModeChange?.('dance')}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '8px 14px',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            background: mode === 'dance' ? 'hsl(var(--primary) / 0.15)' : 'transparent',
            color: mode === 'dance' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            fontWeight: mode === 'dance' ? 600 : 500,
          }}
        >
          DANCE
        </button>
        <button
          data-testid="toggle-audience-pivot"
          onClick={() => onModeChange?.('pivot')}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '8px 14px',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            background: mode === 'pivot' ? 'hsl(var(--primary) / 0.15)' : 'transparent',
            color: mode === 'pivot' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            fontWeight: mode === 'pivot' ? 600 : 500,
          }}
        >
          PIVOT
        </button>
      </div>
      <p style={{ marginTop: 0, fontSize: 12, letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>{active.badge}</p>
      <h1 style={{ marginTop: 6 }}>{active.headline}</h1>
      <p style={{ lineHeight: 1.6 }}>{active.subheadline}</p>
      <p style={{ color: 'hsl(var(--muted-foreground))' }}>{active.context}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
        <Link href="/token-economy" style={{ textDecoration: 'none', borderRadius: 999, padding: '10px 16px', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13 }}>
          {active.cta1}
        </Link>
        <a href="#pricing" style={{ textDecoration: 'none', borderRadius: 999, padding: '10px 16px', border: '1px solid hsl(var(--border))', fontSize: 13 }}>
          {active.cta2}
        </a>
      </div>
      <div style={{ marginTop: 24, borderTop: '1px solid hsl(var(--border))', paddingTop: 12 }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>Director&apos;s Chair Snapshot</p>
        <p style={{ marginBottom: 0 }}>Py.rouette TES/PCS/GOE Engine · StageCred Proof Ledger · Token Incentive Layer</p>
      </div>
    </section>
  );
}
