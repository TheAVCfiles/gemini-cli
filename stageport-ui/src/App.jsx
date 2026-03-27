import { useMemo, useState } from 'react';

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

function normalizeLanguage(value) {
  const match = LANGUAGES.find((lang) => lang.toLowerCase() === value.trim().toLowerCase());
  return match ?? value.trim();
}

function LanguageAutocomplete({ label, value, onChange }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return LANGUAGES;
    return LANGUAGES.filter((lang) => lang.toLowerCase().includes(lowered));
  }, [query]);

  const handleSelect = (language) => {
    setQuery(language);
    onChange(language);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={styles.label}>{label}</label>
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          const exact = LANGUAGES.find((lang) => lang.toLowerCase() === next.trim().toLowerCase());
          if (exact) {
            onChange(exact);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            const normalized = normalizeLanguage(query);
            if (LANGUAGES.includes(normalized)) {
              setQuery(normalized);
              onChange(normalized);
            } else {
              setQuery(value);
            }
          }, 100);
        }}
        placeholder="Type to search language..."
        style={styles.input}
      />
      {open && (
        <div style={styles.dropdown}>
          {filtered.length ? (
            filtered.map((lang) => (
              <button
                key={lang}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(lang)}
                style={{
                  ...styles.option,
                  ...(lang === value ? styles.optionSelected : {}),
                }}
              >
                {lang}
              </button>
            ))
          ) : (
            <div style={styles.noResult}>No language match.</div>
          )}
        </div>
      )}
    </div>
  );
}

function buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode }) {
  return `You are an expert multilingual software engineer.
Convert the following code from ${sourceLanguage} to ${targetLanguage}.
Rules:
- Preserve original logic and behavior.
- Use idiomatic ${targetLanguage} syntax.
- Return only translated code.

Source code:\n\n${sourceCode}`;
}

async function requestTranslation({ endpoint, apiKey, sourceLanguage, targetLanguage, sourceCode }) {
  const prompt = buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode });

  if (!endpoint) {
    return `// Demo mode (no endpoint configured)
// Source language: ${sourceLanguage}
// Target language: ${targetLanguage}

/*
Configure a backend endpoint to run real conversions.
Expected contract:
POST /api/convert
{
  "sourceLanguage": "${sourceLanguage}",
  "targetLanguage": "${targetLanguage}",
  "sourceCode": "...",
  "prompt": "..."
}
*/

${sourceCode}`;
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
      sourceCode,
      prompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Code conversion request failed.');
  }

  const data = await response.json();
  return data.output || data.result || data.code || '';
}

export default function App() {
  const [sourceLanguage, setSourceLanguage] = useState('JavaScript');
  const [targetLanguage, setTargetLanguage] = useState('Python');
  const [sourceCode, setSourceCode] = useState(SAMPLE_SNIPPETS.JavaScript);
  const [translatedCode, setTranslatedCode] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canConvert =
    sourceCode.trim().length > 0 &&
    sourceLanguage &&
    targetLanguage &&
    sourceLanguage !== targetLanguage;

  const onSwap = () => {
    const previousSourceLanguage = sourceLanguage;
    const previousSourceCode = sourceCode;

    setSourceLanguage(targetLanguage);
    setTargetLanguage(previousSourceLanguage);
    setSourceCode(translatedCode || previousSourceCode);
    setTranslatedCode(previousSourceCode);
  };

  const onLoadSample = () => {
    setSourceCode(SAMPLE_SNIPPETS[sourceLanguage] || SAMPLE_SNIPPETS.JavaScript);
  };

  const onConvert = async () => {
    setLoading(true);
    setError('');

    try {
      const translated = await requestTranslation({
        endpoint,
        apiKey,
        sourceLanguage,
        targetLanguage,
        sourceCode,
      });
      setTranslatedCode(translated);
    } catch (requestError) {
      setError(requestError.message || 'Something failed during conversion.');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    if (!translatedCode) return;
    await navigator.clipboard.writeText(translatedCode);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>CodeVerter</h1>
        <p style={styles.description}>
          Convert code between 25 major programming languages with a model-agnostic backend.
        </p>

        <div style={styles.settingsGrid}>
          <div>
            <label style={styles.label}>Model endpoint</label>
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://your-domain.com/api/convert"
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>API key (optional)</label>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Bearer token"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.panes}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Source</h2>
              <button type="button" onClick={onLoadSample} style={styles.ghostButton}>
                Load sample
              </button>
            </div>
            <LanguageAutocomplete
              label="From language"
              value={sourceLanguage}
              onChange={setSourceLanguage}
            />
            <label style={styles.label}>Input code</label>
            <textarea
              value={sourceCode}
              onChange={(event) => setSourceCode(event.target.value)}
              spellCheck={false}
              style={styles.textarea}
            />
          </section>

          <div style={styles.middleActions}>
            <button type="button" onClick={onSwap} style={styles.ghostButton}>
              Swap
            </button>
            <button
              type="button"
              disabled={!canConvert || loading}
              onClick={onConvert}
              style={{
                ...styles.primaryButton,
                ...((!canConvert || loading) ? styles.primaryButtonDisabled : {}),
              }}
            >
              {loading ? 'Converting...' : 'Convert Code'}
            </button>
          </div>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Output</h2>
              <button type="button" onClick={onCopy} style={styles.ghostButton}>
                Copy
              </button>
            </div>
            <LanguageAutocomplete label="To language" value={targetLanguage} onChange={setTargetLanguage} />
            <label style={styles.label}>Translated code</label>
            <textarea
              value={translatedCode}
              onChange={(event) => setTranslatedCode(event.target.value)}
              spellCheck={false}
              placeholder="Converted code will appear here..."
              style={styles.textarea}
            />
          </section>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: '#f1f5f9',
    minHeight: '100vh',
    padding: '32px 16px',
    color: '#0f172a',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
  },
  title: {
    margin: 0,
    fontSize: '2.2rem',
  },
  description: {
    color: '#475569',
    marginBottom: 20,
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  panes: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    gap: 14,
    alignItems: 'stretch',
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    margin: 0,
    fontSize: 20,
  },
  middleActions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#475569',
  },
  input: {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: 420,
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    lineHeight: 1.5,
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 180,
    overflowY: 'auto',
    zIndex: 50,
    padding: 6,
    boxSizing: 'border-box',
  },
  option: {
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    padding: '8px 10px',
    cursor: 'pointer',
  },
  optionSelected: {
    background: '#0f172a',
    color: '#ffffff',
  },
  noResult: {
    color: '#64748b',
    padding: '8px 10px',
  },
  primaryButton: {
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  ghostButton: {
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '9px 12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    marginTop: 14,
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#991b1b',
    borderRadius: 10,
    padding: '10px 12px',
  },
};
