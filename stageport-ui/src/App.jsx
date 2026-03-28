import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Code2,
  Copy,
  Orbit,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react';

const LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'PHP',
  'Ruby',
  'R',
  'Scala',
  'Dart',
  'Objective-C',
  'Shell',
  'SQL',
  'MATLAB',
  'Perl',
  'Lua',
  'Haskell',
  'Elixir',
  'Julia',
];

const SAMPLE_SNIPPETS = {
  JavaScript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(8));`,
  Python: `def fibonacci(n):
  if n <= 1:
    return n
  return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(8))`,
  TypeScript: `type User = {
  id: number;
  name: string;
};

function greet(user: User): string {
  return \`Hello, \${user.name}\`;
}

console.log(greet({ id: 1, name: "Allison" }));`,
};

const MODES = [
  {
    key: 'standard',
    label: 'Standard',
    icon: Wand2,
    description: 'Direct language conversion with equivalent logic and idioms.',
  },
  {
    key: 'signal',
    label: 'Signal Mode',
    icon: Sparkles,
    description: 'Adds concise narrative insight about architectural intent.',
  },
  {
    key: 'cipher',
    label: 'Cipher Mode',
    icon: ShieldAlert,
    description: 'Highlights hidden patterns, assumptions, and risky translations.',
  },
  {
    key: 'echo',
    label: 'Echo Mode',
    icon: Orbit,
    description: 'Generates follow-up suggestions, tests, and next-step prompts.',
  },
];

const classNames = (...values) => values.filter(Boolean).join(' ');

function LanguageAutocomplete({ label, value, onChange, placeholder = 'Search language...' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return LANGUAGES;
    }

    return LANGUAGES.filter((language) => language.toLowerCase().includes(normalized));
  }, [query]);

  const selectLanguage = (language) => {
    setQuery(language);
    onChange(language);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);

              const exactMatch = LANGUAGES.find(
                (language) => language.toLowerCase() === query.trim().toLowerCase(),
              );

              if (exactMatch) {
                setQuery(exactMatch);
                onChange(exactMatch);
              } else if (!query.trim() && value) {
                setQuery(value);
              }
            }, 120);
          }}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {filtered.length > 0 ? (
            filtered.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => selectLanguage(language)}
                className={classNames(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition',
                  value === language ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                <span>{language}</span>
                {value === language && <span className="text-xs opacity-80">Selected</span>}
              </button>
            ))
          ) : (
            <div className="rounded-xl px-3 py-3 text-sm text-slate-500">No language match.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ModeCard({ mode, active, onClick }) {
  const Icon = mode.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'rounded-2xl border p-4 text-left transition',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{mode.label}</span>
      </div>
      <p className={classNames('text-xs leading-5', active ? 'text-slate-200' : 'text-slate-500')}>
        {mode.description}
      </p>
    </button>
  );
}

function buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode, mode }) {
  const modeInstructions = {
    standard:
      'Return only the translated code. Preserve business logic, improve syntax correctness, and use idiomatic constructs for the target language.',
    signal:
      "Return the translated code first, then add a short section titled 'Signal Notes' with 3 bullet points explaining architectural intent and notable translation choices.",
    cipher:
      "Return the translated code first, then add a short section titled 'Cipher Notes' with 3 bullet points calling out hidden assumptions, risky mappings, edge cases, or areas that need manual review.",
    echo:
      "Return the translated code first, then add a short section titled 'Echo Notes' with 3 bullet points suggesting tests, refactors, or next-step prompts for the developer.",
  };

  return `You are an expert multilingual software engineer.
Task: Convert code from ${sourceLanguage} to ${targetLanguage}.
Rules:
- Preserve the original logic and intent.
- Use idiomatic ${targetLanguage} syntax and conventions.
- Do not explain every line.
- Do not invent features that are not present.
- If the source code is incomplete, make the smallest valid assumptions.
- ${modeInstructions[mode]}
Source language: ${sourceLanguage}
Target language: ${targetLanguage}
Source code:\n\n${sourceCode}`;
}

async function requestTranslation({ sourceLanguage, targetLanguage, sourceCode, mode, endpoint, apiKey }) {
  const prompt = buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode, mode });

  if (!endpoint) {
    return `// Demo mode: no model endpoint configured\n// Source: ${sourceLanguage}\n// Target: ${targetLanguage}\n// Mode: ${MODES.find((item) => item.key === mode)?.label}\n\n/*
Plug your own model endpoint into Settings to perform real translation.
Suggested backend contract:
POST /api/convert
{
  "sourceLanguage": "${sourceLanguage}",
  "targetLanguage": "${targetLanguage}",
  "mode": "${mode}",
  "prompt": "..."
}
*/\n\n${sourceCode}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      sourceLanguage,
      targetLanguage,
      mode,
      prompt,
      sourceCode,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'Translation request failed.');
  }

  const data = await response.json();
  return data.output || data.result || data.code || '';
}

export default function App() {
  const [sourceLanguage, setSourceLanguage] = useState('JavaScript');
  const [targetLanguage, setTargetLanguage] = useState('Python');
  const [sourceCode, setSourceCode] = useState(SAMPLE_SNIPPETS.JavaScript);
  const [translatedCode, setTranslatedCode] = useState('');
  const [mode, setMode] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  const canConvert =
    sourceCode.trim() && sourceLanguage && targetLanguage && sourceLanguage !== targetLanguage;

  const swapLanguages = () => {
    const previousSourceLanguage = sourceLanguage;
    const previousSourceCode = sourceCode;

    setSourceLanguage(targetLanguage);
    setTargetLanguage(previousSourceLanguage);
    setSourceCode(translatedCode || previousSourceCode);
    setTranslatedCode(previousSourceCode);
  };

  const loadSample = () => {
    const sample = SAMPLE_SNIPPETS[sourceLanguage] || SAMPLE_SNIPPETS.JavaScript;
    setSourceCode(sample);
  };

  const handleConvert = async () => {
    setLoading(true);
    setError('');

    try {
      const output = await requestTranslation({
        sourceLanguage,
        targetLanguage,
        sourceCode,
        mode,
        endpoint,
        apiKey,
      });

      setTranslatedCode(output);
    } catch (err) {
      setError(err?.message || 'Something failed during conversion.');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = async () => {
    if (!translatedCode) {
      return;
    }

    await navigator.clipboard.writeText(translatedCode);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <Code2 className="h-3.5 w-3.5" />
                Code translation workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">CodeVerter</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Convert code from one language to another with a model-agnostic pipeline. Plug in any
                backend that accepts a prompt and returns translated code.
              </p>
            </div>

            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Model endpoint
                </label>
                <input
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  placeholder="https://your-domain.com/api/convert"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  API key optional
                </label>
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Bearer token if needed"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MODES.map((item) => (
            <ModeCard key={item.key} mode={item} active={mode === item.key} onClick={() => setMode(item.key)} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_auto_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Source</h2>
              <button
                type="button"
                onClick={loadSample}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Load sample
              </button>
            </div>

            <LanguageAutocomplete
              label="From language"
              value={sourceLanguage}
              onChange={setSourceLanguage}
            />

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Input code
              </label>
              <textarea
                value={sourceCode}
                onChange={(event) => setSourceCode(event.target.value)}
                spellCheck={false}
                placeholder="Paste or write source code here..."
                className="min-h-[520px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </section>

          <div className="flex flex-row items-center justify-center xl:flex-col">
            <button
              type="button"
              onClick={swapLanguages}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Swap
            </button>

            <button
              type="button"
              disabled={!canConvert || loading}
              onClick={handleConvert}
              className={classNames(
                'mt-3 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition xl:mt-4',
                !canConvert || loading
                  ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                  : 'bg-slate-900 text-white hover:bg-slate-800',
              )}
            >
              <ArrowRightLeft className="h-4 w-4" />
              {loading ? 'Converting...' : 'Convert Code'}
            </button>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Output</h2>
              <button
                type="button"
                onClick={copyOutput}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>

            <LanguageAutocomplete label="To language" value={targetLanguage} onChange={setTargetLanguage} />

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Translated code
              </label>
              <textarea
                value={translatedCode}
                onChange={(event) => setTranslatedCode(event.target.value)}
                spellCheck={false}
                placeholder="Converted code will appear here..."
                className="min-h-[520px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-100 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </section>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
