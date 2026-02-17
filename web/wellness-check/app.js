const form = document.querySelector('#scan');
const result = document.querySelector('#result');

const riskBands = [
  {
    max: 34,
    badge: 'low',
    label: 'Low Echo Risk',
    summary:
      '{handle} exhibits mostly harmonic patterns with only faint reverberations. Their digital footprint is well balanced.',
  },
  {
    max: 67,
    badge: 'moderate',
    label: 'Moderate Echo Risk',
    summary:
      '{handle} resonates through a few active chambers. Their posts echo occasionally and benefit from guided damping.',
  },
  {
    max: 100,
    badge: 'high',
    label: 'High Echo Risk',
    summary:
      '{handle} is generating dense echo blooms. Intervention is recommended to restore a healthier resonance.',
  },
];

const metricPools = [
  {
    label: 'Signal Clarity',
    values: [
      'Pristine (92%)',
      'Crisp with minor static (81%)',
      'Diffuse (67%)',
      'Fragmented (54%)',
    ],
  },
  {
    label: 'Feedback Bloom',
    values: [
      'Dormant',
      'Occasional surges',
      'Active loops',
      'Constant cycling',
    ],
  },
  {
    label: 'Harmonic Drift',
    values: ['Stable', 'Slow drift', 'Erratic drift', 'Chaotic'],
  },
  {
    label: 'Chorus Alignment',
    values: ['Aligned', 'Partial alignment', 'Dissonant', 'Split resonance'],
  },
  {
    label: 'Archive Temperature',
    values: ['Cool', 'Warm', 'Hot', 'Volcanic'],
  },
  {
    label: 'Rhythm Regularity',
    values: ['Metronomic', 'Syncopated', 'Irregular', 'Whiplash'],
  },
];

const recommendationPool = [
  'Schedule a weekly "quiet hour" to break residual feedback loops.',
  'Rotate post formats to reintroduce novel frequencies.',
  'Invite outside voices to guest-post and diversify the chorus.',
  'Archive older viral threads to lower background reverb.',
  'Balance promotional bursts with reflective, long-form updates.',
  'Enable community moderation tools to diffuse sudden surges.',
  'Switch to staggered release windows across platforms.',
  'Pair every reactive post with one proactive insight.',
];

const observationPool = [
  '{handle} drew a 48-hour spike after a collaborative thread with three tagged partners.',
  'Echo intensity for {handle} peaks whenever livestream recaps are clipped into short-form reels.',
  'Night-time posts draw double the resonance for {handle} compared with daytime updates.',
  'Topical news reactions reverberate 36 hours longer than evergreen pieces for {handle}.',
  'Audience crossover from long-form newsletters is steadily strengthening {handle}’s baseline.',
  'Cross-platform quotes create a noticeable phase shift in sentiment around {handle}.',
];

const formatHandle = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return 'Unknown Handle';
  if (trimmed.startsWith('@')) {
    return trimmed;
  }

  const stripped = trimmed
    .replace(/https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/[^a-z0-9._-].*$/i, '');
  return `@${stripped || 'handle'}`;
};

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRiskBand = (score) =>
  riskBands.find((band) => score <= band.max) ?? riskBands.at(-1);

const buildMetric = (label, value) => {
  const metric = document.createElement('div');
  metric.className = 'metric';

  const span = document.createElement('span');
  span.textContent = label;
  metric.append(span);

  const strong = document.createElement('strong');
  strong.textContent = value;
  metric.append(strong);

  return metric;
};

const buildRecommendations = (items) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'recommendations';

  const heading = document.createElement('h3');
  heading.textContent = 'Recommended Adjustments';
  wrapper.append(heading);

  const list = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.append(li);
  });

  wrapper.append(list);
  return wrapper;
};

const renderResult = ({
  handle,
  score,
  band,
  metrics,
  recommendations,
  observation,
}) => {
  result.innerHTML = '';

  const scoreBlock = document.createElement('div');
  scoreBlock.className = 'score';

  const scoreCopy = document.createElement('div');
  const label = document.createElement('span');
  label.textContent = 'Echo-Risk Score';
  scoreCopy.append(label);

  const strong = document.createElement('strong');
  strong.textContent = String(score);
  scoreCopy.append(strong);

  scoreBlock.append(scoreCopy);

  const badge = document.createElement('span');
  badge.className = `badge ${band.badge}`;
  badge.textContent = band.label;
  scoreBlock.append(badge);

  result.append(scoreBlock);

  const summary = document.createElement('p');
  summary.textContent = band.summary.replace('{handle}', handle);
  result.append(summary);

  const observationEl = document.createElement('p');
  observationEl.textContent = observation.replace('{handle}', handle);
  result.append(observationEl);

  const metricsGrid = document.createElement('div');
  metricsGrid.className = 'metrics';
  metrics.forEach(({ label: metricLabel, value }) => {
    metricsGrid.append(buildMetric(metricLabel, value));
  });
  result.append(metricsGrid);

  result.append(buildRecommendations(recommendations));

  result.classList.remove('hidden');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const generatePayload = (handle) => {
  const score = randomBetween(12, 98);
  const band = getRiskBand(score);
  const metrics = [...metricPools]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(({ label, values }) => ({ label, value: choice(values) }));

  const recommendations = [...recommendationPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const observation = choice(observationPool);

  return {
    handle,
    score,
    band,
    metrics,
    recommendations,
    observation,
  };
};

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const handle = formatHandle(formData.get('handle') || '');
  const email = String(formData.get('email') || '').trim();

  if (!email) {
    return;
  }

  renderResult(generatePayload(handle));
});
