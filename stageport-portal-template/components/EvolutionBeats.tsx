type AudienceMode = 'dance' | 'pivot';

type EvolutionBeatsProps = {
  mode?: AudienceMode;
};

export default function EvolutionBeats({ mode = 'dance' }: EvolutionBeatsProps) {
  const isPivot = mode === 'pivot';

  return (
    <section>
      <p style={{ fontSize: 12, letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>Evolution Beats</p>
      <h2>{isPivot ? 'Your operation runs on a 28-day evolution engine.' : 'Your studio runs on a 28-day mutation engine.'}</h2>
      <p style={{ lineHeight: 1.65 }}>
        {isPivot
          ? 'Every organization has a rhythm: attention, build, peak, reset. StagePort hooks your operation into the same predictable mutation cycle. Every 28 days, the system pushes a new module, patch, or governance upgrade across your ledger.'
          : 'Your body already knows the pattern: attention, build, peak, reset. StagePort hooks your studio into the same biological schedule. Not quarterly. Not “when things slow down.” Every 28 days, the system pushes a new module, patch, or release across your ledger.'}
      </p>
      <ul>
        {isPivot ? (
          <>
            <li><strong>Week 1 – Baseline &amp; Score:</strong> Map kinetic workflows, score contribution patterns, generate first-cycle reports.</li>
            <li><strong>Week 2 – Ledger &amp; Tokens:</strong> Set governance rules, weight leadership and consistency, translate effort into bankable credentials.</li>
            <li><strong>Week 3-4 – Patch &amp; Release:</strong> Adjust scoring based on data, publish governance views, lock the cycle and start the next 28-day pass.</li>
          </>
        ) : (
          <>
            <li><strong>Week 1 – Scan &amp; Score:</strong> Baseline the work onstage and in class.</li>
            <li><strong>Week 2 – Ledger &amp; Tokens:</strong> Lock scoring + incentives so contribution becomes bankable.</li>
            <li><strong>Week 3-4 – Patch &amp; Release:</strong> Ship the next evolution beat and start the next cycle.</li>
          </>
        )}
      </ul>
    </section>
  );
}
