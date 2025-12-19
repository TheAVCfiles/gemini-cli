const state = {
  canonical: [],
  filtered: [],
  letter: 'ALL',
  search: '',
  external: [],
};

const letters = ['ALL', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']; // will expand into individual characters
const glossaryList = document.getElementById('glossaryList');
const emptyState = document.getElementById('emptyState');
const resultsMeta = document.getElementById('resultsMeta');
const alphabetNav = document.querySelector('.alphabet-nav');
const searchInput = document.getElementById('search');
const resetButton = document.getElementById('resetFilters');
const exportButton = document.getElementById('exportCsv');
const uploadInput = document.getElementById('externalUpload');
const conflictList = document.getElementById('conflictList');
const conflictSummary = document.getElementById('conflictSummary');
const askButton = document.getElementById('triggerAsk');
const askDialog = document.getElementById('askDialog');
const submitAsk = document.getElementById('submitAsk');
const cancelAsk = document.getElementById('cancelAsk');
const askPrompt = document.getElementById('askPrompt');
const askResponse = document.getElementById('askResponse');

function normaliseTerm(term) {
  return (term || '').trim().toLowerCase();
}

function buildAlphabetNav() {
  alphabetNav.innerHTML = '';
  letters.forEach((letter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = letter === 'ALL' ? 'All' : letter;
    button.dataset.letter = letter;
    if (letter === state.letter) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => {
      state.letter = letter;
      updateFilteredEntries();
      document
        .querySelectorAll('.alphabet-nav button')
        .forEach((btn) =>
          btn.classList.toggle('active', btn.dataset.letter === state.letter),
        );
    });
    alphabetNav.appendChild(button);
  });
}

function updateResultsMeta() {
  const total = state.filtered.length;
  const canonicalCount = state.canonical.length;
  const externalCount = state.external.length;
  const parts = [`${total} entr${total === 1 ? 'y' : 'ies'} visible`];
  if (state.search) {
    parts.push(`filtered by “${state.search}”`);
  }
  if (state.letter !== 'ALL') {
    parts.push(`letter ${state.letter}`);
  }
  if (externalCount) {
    parts.push(
      `${externalCount} external entr${externalCount === 1 ? 'y' : 'ies'} loaded`,
    );
  }
  parts.push(`${canonicalCount} canonical entries`);
  resultsMeta.textContent = parts.join(' · ');
}

function renderEntries() {
  glossaryList.innerHTML = '';
  if (!state.filtered.length) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  const fragment = document.createDocumentFragment();
  state.filtered.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'glossary-entry';
    const title = document.createElement('h3');
    title.textContent = entry.term;
    const definition = document.createElement('p');
    definition.textContent = entry.definition;
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.textContent = entry.sources ? `Sources: ${entry.sources}` : '';
    item.appendChild(title);
    item.appendChild(definition);
    if (entry.notes) {
      const notes = document.createElement('p');
      notes.className = 'notes';
      notes.textContent = entry.notes;
      item.appendChild(notes);
    }
    item.appendChild(sources);
    fragment.appendChild(item);
  });
  glossaryList.appendChild(fragment);
}

function entryMatchesLetter(entry) {
  if (state.letter === 'ALL') return true;
  const first = (entry.term || '').trim().charAt(0).toUpperCase();
  if (state.letter === '#') {
    return !/[A-Z]/.test(first);
  }
  return first === state.letter;
}

function entryMatchesSearch(entry) {
  if (!state.search) return true;
  const target =
    `${entry.term} ${entry.definition} ${entry.sources || ''}`.toLowerCase();
  return target.includes(state.search.toLowerCase());
}

function updateFilteredEntries() {
  state.filtered = state.canonical.filter(
    (entry) => entryMatchesLetter(entry) && entryMatchesSearch(entry),
  );
  renderEntries();
  updateResultsMeta();
}

function resetFilters() {
  state.letter = 'ALL';
  state.search = '';
  searchInput.value = '';
  updateFilteredEntries();
  buildAlphabetNav();
}

function downloadCsv(entries) {
  if (!entries.length) return;
  const header = ['term', 'definition', 'sources'];
  const rows = entries.map((entry) => [
    entry.term,
    entry.definition,
    entry.sources || '',
  ]);
  const csv = [header, ...rows]
    .map((cols) =>
      cols
        .map((value) => {
          const safe = (value || '').replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'mwra-glossary-export.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) {
    return [];
  }
  const headers = lines
    .shift()
    .split(',')
    .map((h) => h.trim().toLowerCase());
  const termIdx = headers.indexOf('term');
  const defIdx = headers.indexOf('definition');
  const sourceIdx = headers.indexOf('sources');
  const entries = [];
  lines.forEach((line) => {
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);
    const term = parts[termIdx];
    const definition = parts[defIdx];
    const sources = sourceIdx > -1 ? parts[sourceIdx] : '';
    if (term && definition) {
      entries.push({
        term: term.trim(),
        definition: definition.trim(),
        sources: (sources || '').trim(),
      });
    }
  });
  return entries;
}

function computeConflicts(external) {
  const canonicalMap = new Map();
  const externalMap = new Map();
  state.canonical.forEach((entry) => {
    canonicalMap.set(normaliseTerm(entry.term), entry);
  });
  external.forEach((entry) => {
    externalMap.set(normaliseTerm(entry.term), entry);
  });

  const newTerms = [];
  const changedTerms = [];
  const missingTerms = [];

  externalMap.forEach((entry, key) => {
    if (!canonicalMap.has(key)) {
      newTerms.push(entry);
    } else {
      const canonicalEntry = canonicalMap.get(key);
      if (
        canonicalEntry.definition.trim() !== (entry.definition || '').trim() ||
        (canonicalEntry.sources || '').trim() !== (entry.sources || '').trim()
      ) {
        changedTerms.push({ canonical: canonicalEntry, external: entry });
      }
    }
  });

  canonicalMap.forEach((entry, key) => {
    if (!externalMap.has(key)) {
      missingTerms.push(entry);
    }
  });

  return { newTerms, changedTerms, missingTerms };
}

function renderConflicts(report) {
  conflictList.innerHTML = '';
  conflictSummary.textContent = '';
  if (!state.external.length) {
    conflictSummary.textContent = 'No external glossary loaded.';
    return;
  }

  const parts = [];
  if (report.newTerms.length) {
    parts.push(`${report.newTerms.length} new terms`);
  }
  if (report.changedTerms.length) {
    parts.push(`${report.changedTerms.length} potential conflicts`);
  }
  if (report.missingTerms.length) {
    parts.push(
      `${report.missingTerms.length} canonical terms missing externally`,
    );
  }
  conflictSummary.textContent = parts.length
    ? parts.join(' · ')
    : 'No conflicts detected.';

  const fragment = document.createDocumentFragment();

  report.newTerms.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'conflict-item';
    const heading = document.createElement('strong');
    heading.textContent = `${entry.term} · New in external dataset`;
    const detail = document.createElement('p');
    detail.textContent = entry.definition;
    item.appendChild(heading);
    item.appendChild(detail);
    fragment.appendChild(item);
  });

  report.changedTerms.forEach(({ canonical, external }) => {
    const item = document.createElement('div');
    item.className = 'conflict-item';
    const heading = document.createElement('strong');
    heading.textContent = `${external.term} · Definition mismatch`;
    const canonicalP = document.createElement('p');
    canonicalP.textContent = `Canonical: ${canonical.definition}`;
    const externalP = document.createElement('p');
    externalP.textContent = `External: ${external.definition}`;
    item.appendChild(heading);
    item.appendChild(canonicalP);
    item.appendChild(externalP);
    fragment.appendChild(item);
  });

  report.missingTerms.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'conflict-item';
    const heading = document.createElement('strong');
    heading.textContent = `${entry.term} · Missing from external dataset`;
    item.appendChild(heading);
    fragment.appendChild(item);
  });

  conflictList.appendChild(fragment);
}

function handleUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      let entries = [];
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          entries = parsed
            .map((row) => ({
              term: row.term?.toString().trim(),
              definition: row.definition?.toString().trim(),
              sources: row.sources?.toString().trim() || '',
            }))
            .filter((row) => row.term && row.definition);
        }
      } else {
        entries = parseCsv(reader.result.toString());
      }
      state.external = entries;
      const report = computeConflicts(entries);
      renderConflicts(report);
      updateResultsMeta();
    } catch (error) {
      console.error('Failed to parse uploaded glossary', error);
      conflictSummary.textContent =
        'Unable to parse uploaded file. Provide valid CSV or JSON.';
    }
  };
  reader.readAsText(file);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(null, args), delay);
  };
}

async function fetchGlossary() {
  try {
    const response = await fetch('glossary.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load glossary.json (${response.status})`);
    }
    const data = await response.json();
    state.canonical = Array.isArray(data) ? data : [];
    updateFilteredEntries();
    buildAlphabetNav();
  } catch (error) {
    console.error(error);
    glossaryList.innerHTML = '';
    emptyState.hidden = false;
    emptyState.innerHTML =
      '<p>Unable to load glossary data. Please try again later.</p>';
  }
}

async function sendAsk(prompt) {
  if (!prompt.trim()) {
    return 'Provide a prompt to query the glossary.';
  }
  try {
    const response = await fetch('/.netlify/functions/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        glossary: state.filtered.slice(0, 50),
      }),
    });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    const payload = await response.json();
    return (
      payload.answer || payload.message || JSON.stringify(payload, null, 2)
    );
  } catch (error) {
    console.error(error);
    return 'The glossary bot could not be reached. Ensure the Netlify function is deployed.';
  }
}

function setupAskDialog() {
  askButton.addEventListener('click', () => {
    askResponse.textContent = '';
    askPrompt.value = '';
    askDialog.showModal();
  });
  cancelAsk.addEventListener('click', () => {
    askDialog.close();
  });
  askDialog.addEventListener('close', () => {
    askResponse.textContent = '';
    askPrompt.value = '';
  });
  askDialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    submitAsk.setAttribute('aria-busy', 'true');
    submitAsk.disabled = true;
    askResponse.textContent = 'Thinking…';
    const answer = await sendAsk(askPrompt.value || '');
    askResponse.textContent = answer;
    submitAsk.removeAttribute('aria-busy');
    submitAsk.disabled = false;
  });
}

function setupEventListeners() {
  const debouncedSearch = debounce((value) => {
    state.search = value;
    updateFilteredEntries();
  }, 180);

  searchInput.addEventListener('input', (event) => {
    debouncedSearch(event.target.value.trim());
  });

  resetButton.addEventListener('click', resetFilters);
  exportButton.addEventListener('click', () => downloadCsv(state.filtered));
  uploadInput.addEventListener('change', handleUpload);
  setupAskDialog();
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchGlossary();
  conflictSummary.textContent = 'Load an external glossary to compare.';
});
