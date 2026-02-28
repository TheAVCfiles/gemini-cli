'use client';

import { useState } from 'react';
import EvolutionBeats from './EvolutionBeats';
import PortalFooter from './PortalFooter';
import PortalHero from './PortalHero';
import PortalNavigation from './PortalNavigation';
import PricingSection from './PricingSection';
import TheGap from './TheGap';

type AudienceMode = 'dance' | 'pivot';

export default function Portal() {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('dance');

  return (
    <>
      <PortalNavigation />
      <main style={{ maxWidth: 980, margin: '40px auto', padding: 24, display: 'grid', gap: 54 }}>
        <PortalHero mode={audienceMode} onModeChange={setAudienceMode} />
        <EvolutionBeats mode={audienceMode} />
        <TheGap mode={audienceMode} />
        <PricingSection />
      </main>
      <PortalFooter />
    </>
  );
}
