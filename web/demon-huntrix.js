const POWERS = new Set([
  'SPEED',
  'POWER',
  'STEALTH',
  'ENERGY',
  'SHIELD',
  'STRIKE',
  'MAGIC',
  'CHARM',
]);

const FALLBACK_MOVE = {
  name: 'Starlight Elbow Pop',
  emoji: '✨',
  description: 'Pop elbows out, snap to star pose.',
  power: 'CHARM',
  duration: 3000,
};

const BASE_MOVES = [
  {
    id: 'move-intro',
    name: 'Star Tunnel Strut',
    emoji: '🌠',
    description: 'Stride forward, slide back, and lock eyes with the crowd.',
    power: 'SPEED',
    duration: 2600,
  },
  {
    id: 'move-bridge',
    name: 'Phantom Switch Hit',
    emoji: '🕶️',
    description:
      'Switch feet, swing elbows wide, and cut to a diagonal stance.',
    power: 'STEALTH',
    duration: 3200,
  },
  {
    id: 'move-chorus',
    name: 'Vortex Heel Snap',
    emoji: '🌀',
    description:
      'Twist on heels, snap arms overhead, then drop into a hover squat.',
    power: 'POWER',
    duration: 3400,
  },
];

const SHOP_ITEMS = [
  {
    id: 'item-cape',
    name: 'Neon Rift Cape',
    emoji: '🦇',
    description: 'Flowing cape stitched with ultraviolet thread.',
    price: '420 crystals',
  },
  {
    id: 'item-gloves',
    name: 'Signal Spark Gloves',
    emoji: '🧤',
    description: 'Fingerless gloves that trigger glitter pulses on pops.',
    price: '260 crystals',
  },
  {
    id: 'item-boots',
    name: 'Thruster Boots',
    emoji: '🥾',
    description: 'Holographic boots with cushioned rebound soles.',
    price: '510 crystals',
  },
];

const CUES = [
  {
    t: 12.4,
    title: 'Catwalk Hand-on-Hip',
    snapshotKeypointAngles: { leftElbow: 165, rightElbow: 70, pelvisTilt: 4 },
    notes:
      'Right hand on hip, left arm relaxed. Chin slightly down, eyes fierce.',
  },
  {
    t: 18.1,
    title: 'Leopard Lean',
    snapshotKeypointAngles: {
      shouldersLevel: true,
      spineCurve: 8,
      rightKnee: 170,
      leftKnee: 155,
    },
    notes: 'Weight over right leg, left knee soft. Pop the hip.',
  },
  {
    t: 26.25,
    title: 'Side Glance Strike',
    snapshotKeypointAngles: {
      headYaw: -15,
      rightElbow: 160,
      wristHeight: 0.62,
    },
    notes: 'Eyes left, smirk. Snap into stillness for one beat.',
  },
];

const state = {
  danceMoves: [...BASE_MOVES],
  generatedMove: null,
  busy: false,
  modalOpen: false,
  error: '',
  descriptions: {},
  descLoadingId: null,
  activeCue: null,
};

const movesList = document.getElementById('movesList');
const shopList = document.getElementById('shopList');
const cueGrid = document.getElementById('cueGrid');
const timeline = document.getElementById('timeline');
const cueOverlay = document.getElementById('cueOverlay');
const cueOverlayTitle = document.getElementById('cueOverlayTitle');
const cueOverlayNotes = document.getElementById('cueOverlayNotes');

const modalRoot = document.getElementById('modalRoot');
const modalSpinner = document.getElementById('modalSpinner');
const modalError = document.getElementById('modalError');
const modalDetails = document.getElementById('modalDetails');
const modalEmoji = document.getElementById('modalEmoji');
const modalName = document.getElementById('modalName');
const modalDescription = document.getElementById('modalDescription');
const modalMeta = document.getElementById('modalMeta');
const addMoveBtn = document.getElementById('addMoveBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const closeBtn = document.getElementById('closeBtn');
const generateMoveBtn = document.getElementById('generateMoveBtn');

function formatSeconds(durationMs) {
  return (Math.round(durationMs / 100) / 10).toFixed(1);
}

function renderMoves() {
  if (!movesList) return;
  movesList.innerHTML = '';
  if (!state.danceMoves.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No moves yet. Generate one to get started.';
    movesList.append(empty);
    return;
  }

  state.danceMoves.forEach((move) => {
    const card = document.createElement('article');
    card.className = 'move-card';

    const name = document.createElement('div');
    name.className = 'move-name';
    const emoji = document.createElement('span');
    emoji.textContent = move.emoji;
    const label = document.createElement('span');
    label.textContent = move.name;
    name.append(emoji, label);

    const description = document.createElement('div');
    description.className = 'move-description';
    description.textContent = move.description;

    const meta = document.createElement('div');
    meta.className = 'move-meta';
    meta.textContent = `Power: ${move.power} • ${formatSeconds(move.duration)}s`;

    card.append(name, description, meta);
    movesList.append(card);
  });
}

function renderShop() {
  if (!shopList) return;
  shopList.innerHTML = '';
  SHOP_ITEMS.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'shop-card';

    const name = document.createElement('div');
    name.className = 'move-name';
    const emoji = document.createElement('span');
    emoji.textContent = item.emoji;
    const label = document.createElement('span');
    label.textContent = item.name;
    name.append(emoji, label);

    const meta = document.createElement('div');
    meta.className = 'shop-meta';
    meta.textContent = item.price;

    const description = document.createElement('div');
    description.className = 'shop-description';
    description.textContent = state.descriptions[item.id] || item.description;

    const actions = document.createElement('div');
    actions.className = 'shop-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = state.descLoadingId === item.id ? '…' : 'AI rewrite';
    button.disabled = state.descLoadingId === item.id;
    button.addEventListener('click', () => requestItemDescription(item));
    actions.append(button);

    card.append(name, meta, description, actions);
    shopList.append(card);
  });
}

function renderCueGrid() {
  if (!cueGrid) return;
  cueGrid.innerHTML = '';
  CUES.forEach((cue) => {
    const card = document.createElement('article');
    card.className = 'cue-card-static';

    const title = document.createElement('h3');
    title.textContent = cue.title;

    const notes = document.createElement('p');
    notes.textContent = cue.notes;

    const json = document.createElement('pre');
    json.textContent = JSON.stringify(cue.snapshotKeypointAngles, null, 2);

    card.append(title, notes, json);
    cueGrid.append(card);
  });
}

function updateActiveCue(time) {
  const cue = CUES.find((entry) => Math.abs(entry.t - time) < 0.4) || null;
  state.activeCue = cue;
  if (!cue) {
    cueOverlay?.classList.add('hidden');
    return;
  }

  cueOverlayTitle.textContent = cue.title;
  cueOverlayNotes.textContent = cue.notes;
  cueOverlay.classList.remove('hidden');
}

function coerceJsonText(text) {
  const trimmed = (text || '').trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function validateMove(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (
    typeof candidate.name !== 'string' ||
    candidate.name.length === 0 ||
    candidate.name.length > 40
  ) {
    return false;
  }
  if (
    typeof candidate.emoji !== 'string' ||
    candidate.emoji.length === 0 ||
    candidate.emoji.length > 4
  ) {
    return false;
  }
  if (
    typeof candidate.description !== 'string' ||
    candidate.description.length === 0 ||
    candidate.description.length > 120
  ) {
    return false;
  }
  if (!POWERS.has(candidate.power)) {
    return false;
  }
  if (typeof candidate.duration !== 'number') {
    return false;
  }
  if (candidate.duration < 1500 || candidate.duration > 5000) {
    return false;
  }
  return true;
}

function extractCandidateText(payload) {
  const candidates = payload?.candidates;
  if (!Array.isArray(candidates)) return '';
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    const part = parts.find((entry) => typeof entry?.text === 'string');
    if (part?.text) {
      return part.text;
    }
  }
  return '';
}

async function callGemini(prompt) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text || '{}');
  } catch (error) {
    throw new Error('Gemini proxy returned invalid JSON');
  }

  if (!response.ok) {
    const message = data?.error || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

async function generateMove() {
  const prompt = `Return ONLY JSON. Create one K-Pop dance move for a game "Demon Huntrix Dance Academy".
Fields:
- name: 3–5 words
- emoji: one emoji
- description: <= 100 chars, kid-friendly
- power: one of [SPEED, POWER, STEALTH, ENERGY, SHIELD, STRIKE, MAGIC, CHARM]
- duration: integer milliseconds between 2000 and 4500

Example:
{"name":"Celestial Kick Flip","emoji":"💫","description":"Quick flip then a sharp kick with star hands.","power":"STRIKE","duration":3200}`;

  const payload = await callGemini(prompt);
  const rawText = extractCandidateText(payload);
  const normalised = coerceJsonText(rawText);
  const parsed = safeParseJson(normalised);
  if (validateMove(parsed)) {
    return parsed;
  }
  throw new Error('Gemini returned an unexpected schema');
}

function validateDescription(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (
    typeof candidate.description !== 'string' ||
    !candidate.description.trim()
  ) {
    return false;
  }
  return true;
}

function trimDescription(text) {
  if (text.length <= 80) {
    return text;
  }
  return `${text.slice(0, 77)}…`;
}

async function describeItem(name, emoji) {
  const prompt = `Return ONLY JSON: {"description": "..."}.
Write a fun 1-sentence description (<=80 chars) for a kids dance game shop item called "${name}" ${emoji}. Family-friendly.`;

  try {
    const payload = await callGemini(prompt);
    const rawText = extractCandidateText(payload);
    const normalised = coerceJsonText(rawText);
    const parsed = safeParseJson(normalised);
    if (validateDescription(parsed)) {
      return { description: trimDescription(parsed.description.trim()) };
    }
  } catch (error) {
    console.warn('describeItem fallback', error);
  }
  return { description: 'Fresh from the vault.' };
}

function updateModal() {
  if (!modalRoot) return;
  modalRoot.classList.toggle('hidden', !state.modalOpen);
  if (!state.modalOpen) {
    return;
  }

  modalSpinner.classList.toggle('hidden', !state.busy);
  modalDetails.classList.toggle('hidden', state.busy || !state.generatedMove);
  modalError.classList.toggle('hidden', !state.error);
  modalError.textContent = state.error || '';
  addMoveBtn.disabled = state.busy || !state.generatedMove;
  shuffleBtn.disabled = state.busy;

  if (state.generatedMove) {
    modalEmoji.textContent = state.generatedMove.emoji;
    modalName.textContent = state.generatedMove.name;
    modalDescription.textContent = state.generatedMove.description;
    modalMeta.textContent = `Power: ${state.generatedMove.power} • ${formatSeconds(
      state.generatedMove.duration,
    )}s`;
  }
}

async function requestGenerateMove() {
  state.modalOpen = true;
  state.busy = true;
  state.error = '';
  state.generatedMove = null;
  updateModal();

  try {
    state.generatedMove = await generateMove();
  } catch (error) {
    console.warn('generateMove fallback', error);
    state.error =
      'Gemini could not produce a clean move. Using the fallback pose.';
    state.generatedMove = { ...FALLBACK_MOVE };
  } finally {
    state.busy = false;
    updateModal();
  }
}

async function reshuffleMove() {
  if (state.busy) return;
  state.busy = true;
  state.error = '';
  state.generatedMove = null;
  updateModal();
  try {
    state.generatedMove = await generateMove();
  } catch (error) {
    console.warn('reshuffle fallback', error);
    state.error = 'Gemini sent back a wonky payload. Showing fallback instead.';
    state.generatedMove = { ...FALLBACK_MOVE };
  } finally {
    state.busy = false;
    updateModal();
  }
}

function addGeneratedMoveToRoutine() {
  if (!state.generatedMove) return;
  const move = {
    ...state.generatedMove,
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  state.danceMoves.push(move);
  renderMoves();
  closeModal();
}

async function requestItemDescription(item) {
  if (state.descLoadingId) {
    return;
  }
  state.descLoadingId = item.id;
  renderShop();
  let result;
  try {
    result = await describeItem(item.name, item.emoji);
  } catch (error) {
    console.warn('describeItem unexpected error', error);
    result = { description: 'Fresh from the vault.' };
  } finally {
    state.descLoadingId = null;
  }
  state.descriptions[item.id] = result.description;
  renderShop();
}

function closeModal() {
  if (state.busy) return;
  state.modalOpen = false;
  updateModal();
}

function setupEventListeners() {
  generateMoveBtn?.addEventListener('click', () => {
    requestGenerateMove();
  });

  addMoveBtn?.addEventListener('click', addGeneratedMoveToRoutine);
  shuffleBtn?.addEventListener('click', reshuffleMove);
  closeBtn?.addEventListener('click', closeModal);

  modalRoot?.addEventListener('click', (event) => {
    if (event.target === modalRoot) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.modalOpen && !state.busy) {
      closeModal();
    }
  });

  timeline?.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    updateActiveCue(value);
  });
}

renderMoves();
renderShop();
renderCueGrid();
setupEventListeners();

if (timeline) {
  updateActiveCue(Number(timeline.value));
}
