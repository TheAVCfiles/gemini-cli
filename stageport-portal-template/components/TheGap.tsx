type AudienceMode = 'dance' | 'pivot';

type TheGapProps = {
  mode?: AudienceMode;
};

export default function TheGap({ mode = 'dance' }: TheGapProps) {
  const isPivot = mode === 'pivot';

  return (
    <section>
      <p style={{ fontSize: 12, letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>The Gap</p>
      <h2>{isPivot ? 'Every kinetic worker builds the stage. Almost none of them own the math.' : 'Robotics kids get ecosystems. Dancers get ribbons.'}</h2>
      <p style={{ lineHeight: 1.65 }}>
        {isPivot
          ? 'In tech, process is documented, scored, and credentialed. In movement-based industries — dance, sales, construction, logistics, performance — contribution stays verbal, subjective, and disposable. StagePort fixes that with transparent scoring, cryptographic records, and a token economy that reinvests back into the people who move.'
          : 'In tech and STEM, students collect badges, scores, and credentials that feed real pipelines into scholarships, internships, and careers. In dance, cheer, gymnastics and performance, most girls get subjective scores, one-night trophies and no ledger. StagePort fixes that with transparent scoring, cryptographic StageCred reports and a token economy that reinvests back into the students who carry your studio.'}
      </p>
      <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 0 }}>
        {isPivot ? '“Putting the business back into show business.”' : '“Movement deserves math. Ledgers and exits too.”'}
      </p>
    </section>
  );
}
