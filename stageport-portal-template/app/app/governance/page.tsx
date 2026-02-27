import { getJourneyProgress } from '../../../lib/founderJourney';

const founderSteps = ['intake', 'scope', 'governance', 'seal', 'release'];

function getStepIndex(journeyState: string) {
  const index = founderSteps.indexOf(journeyState);
  return index < 0 ? 0 : index + 1;
}

export default function GovernancePage() {
  const journeyState = 'governance';
  const journeyLedgerCount = 12;
  const { completedSteps, totalSteps, width } = getJourneyProgress(
    founderSteps,
    getStepIndex(journeyState),
  );

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Governance</h2>
      <p>Governance panel for super_admin controls.</p>
      <p style={{ fontSize: '12px', color: '#64748b', marginTop: 8 }}>
        {completedSteps} of {totalSteps} steps notarized · {journeyLedgerCount ?? 0} ledger events
      </p>
      <div
        style={{
          marginTop: 8,
          background: '#e2e8f0',
          borderRadius: 999,
          height: 6,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          data-testid="progress-journey"
          style={{ background: '#0f172a', height: 6, borderRadius: 999, width }}
        />
      </div>
    </main>
  );
}
