import React, { useState } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';

/* StageportFacultyPage.jsx
   - Polished Stageport demo UI.
   - Calls /api/vault-query and /api/license-create-session on the server.
   - Replace headshots and assets as desired.
*/
const founder = {
  name: "Allison Van Cura",
  title: "Founder & Artistic Systems Architect",
  headshot: "https://placehold.co/400x400/111827/ffffff?text=Allison+Van+Cura",
  bioShort: "Writer, choreographer, and myth-tech systems architect.",
  bioLong: `Allison Van Cura (AVC) is a choreographer and systems architect who translates survival into syntax.`,
  email: "acfwrites@gmail.com",
  studio: "Intuition Labs / Stageport",
  location: "Poughkeepsie, NY",
};

const initialFaculty = [
  {
    id: "avc-founder",
    name: founder.name,
    role: "Founding Faculty — Systems & Choreography",
    pronouns: "she/her",
    image: founder.headshot,
    short: "Founder & Artistic Systems Architect. Myth-tech OS, choreography as cryptography.",
    long: founder.bioLong,
    tags: ["Founding", "Pedagogy", "MythOS"],
    licensed: true,
  },
  {
    id: "diana-castellanos",
    name: "Diana Castellanos",
    role: "Principal — Classical Lineage",
    pronouns: "she/her",
    image: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=600&h=800&fit=crop",
    short: "Ethereal classical principal; Balanchine & Petipa lineage.",
    long: "Diana's work integrates neoclassical clarity with fluid lyricism.",
    tags: ["Principal", "Classical"],
    licensed: false,
  },
  {
    id: "aurora-psuedo",
    name: "AURORA — Myth Persona",
    role: "Agentic AI — Mythic Ballerina Persona",
    pronouns: "she/they",
    image: "https://placehold.co/600x800/6b21a8/ffffff?text=AURORA",
    short: "Myth-tech persona trained on Aurora's natal myth and poetic choreography.",
    long: "Aurora is a fully choreographed persona — part archival, part generated — designed to teach ritualized improvisation and emotional mapping.",
    tags: ["Persona", "AI-Semblance"],
    licensed: false,
  }
];

function Badge({ children, className = '', tone = 'indigo' }) {
  const palette = {
    indigo: 'bg-indigo-500/80 text-white border border-indigo-200/40 shadow-sm',
    amber: 'bg-amber-400/90 text-slate-900 border border-amber-200/60 shadow-sm',
    emerald: 'bg-emerald-500/80 text-white border border-emerald-200/60 shadow-sm',
    slate: 'bg-slate-700 text-white border border-slate-500/60 shadow-sm',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        palette[tone] || palette.indigo
      } ${className}`}
    >
      {children}
    </span>
  );
}

function Modal({ children, title, onClose }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 max-w-3xl w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function StageportFacultyPage() {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [selected, setSelected] = useState(null);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState(false);

  const heroBadges = [
    'StagePort — Studio OS',
    'StageCred Ledgers',
    'Py.rouette Scoring',
    'Title IX Ready',
  ];

  const fetchVaultArtifact = async (facultyId) => {
    const resp = await fetch('/api/vault-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facultyId, query: 'Provide a short teaching artifact: class outline and program note.' })
    });
    if (!resp.ok) throw new Error('Vault query failed');
    const j = await resp.json();
    return { title: 'Vault Summary', excerpt: j.llmText || 'No artifact', content: j.llmText, sources: j.sources, auditHash: j.provenanceAuditHash };
  };

  const handlePurchaseLicense = async (facultyId, auditHash) => {
    setLicenseLoading(true);
    setLicenseSuccess(false);
    try {
      const resp = await fetch('/api/license-create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId, licenseType: 'institutional', institution: 'Demo Institution', auditHash })
      });
      const j = await resp.json();
      if (!j.sessionId) throw new Error('No session');
      // If Stripe is loaded on page, redirect. Otherwise demo success.
      if (window.Stripe && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
        const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: j.sessionId });
      } else {
        // demo fallback
        setLicenseSuccess(true);
        setFaculty(prev => prev.map(f => f.id === facultyId ? { ...f, licensed: true } : f));
      }
    } catch (e) {
      console.error(e);
      alert('License flow failed: ' + e.message);
    } finally {
      setLicenseLoading(false);
    }
  };

  const openVaultFor = async (member) => {
    setSelected({ ...member, fetching: true });
    setVaultOpen(true);
    try {
      const artifact = await fetchVaultArtifact(member.id);
      setSelected(prev => ({ ...prev, artifact, fetching: false }));
    } catch (e) {
      setSelected(prev => ({ ...prev, artifact: { title: 'Error', excerpt: 'Failed to fetch artifact.' }, fetching: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white font-inter p-8">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 py-12">
        <div className="w-44 h-44 rounded-2xl overflow-hidden ring-2 ring-amber-500">
          <img src={founder.headshot} alt={founder.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-serif mb-2">Pyrouette Stageport</h1>
          <p className="text-amber-300 uppercase text-xs tracking-wider mb-3">Agentic AI • Embodied Pedagogy • Licensed Faculty</p>
          <h2 className="text-2xl font-medium">{founder.name} <span className="text-gray-400 text-sm font-normal">— {founder.title}</span></h2>
          <p className="text-gray-300 mt-4 max-w-2xl leading-relaxed">{founder.bioShort}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {heroBadges.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <Badge>Founding Studio</Badge>
            <Badge>DeCrypt the Girl</Badge>
            <Badge>MythOS</Badge>
            <button onClick={() => setVaultOpen(true)} className="ml-auto px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> View Vault (demo)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-serif">Founding Faculty & Agentic Personas</h3>
            <p className="text-sm text-gray-400">Licensing-ready — private vault for pedagogy, contracts & royalties.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map(member => (
              <article key={member.id} className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="relative h-80 overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div>
                      <h4 className="text-lg font-serif">{member.name}</h4>
                      <p className="text-xs text-gray-300">{member.role}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-300">{member.short}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {member.tags.map((t, i) => <span key={i} className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">{t}</span>)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openVaultFor(member)} className="px-3 py-1 rounded-full bg-amber-600 text-black text-xs hover:bg-amber-500">Vault</button>
                      <button onClick={() => setLicenseOpen(member)} className={`px-3 py-1 rounded-full text-xs ${member.licensed ? 'bg-green-700' : 'bg-indigo-700 hover:bg-indigo-600'}`}>
                        {member.licensed ? 'Licensed' : 'License'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {vaultOpen && (
        <Modal title="Faculty Vault — Demo Artifacts" onClose={() => { setVaultOpen(false); setSelected(null); }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-3">
              <h5 className="text-sm uppercase text-gray-400 mb-2">Founding Vault</h5>
              {faculty.map(f => (
                <button key={f.id} onClick={() => openVaultFor(f)} className="w-full text-left p-3 rounded-lg hover:bg-gray-800 flex items-center gap-3">
                  <img src={f.image} alt={f.name} className="w-12 h-12 object-cover rounded-md" />
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.role}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg min-h-[220px]">
              {!selected && <p className="text-gray-400">Select a faculty member to view a sample archived artifact.</p>}
              {selected && (
                <>
                  <div className="flex items-start gap-4 mb-4">
                    <img src={selected.image} alt={selected.name} className="w-20 h-20 object-cover rounded-md" />
                    <div>
                      <h4 className="text-xl font-serif">{selected.name}</h4>
                      <p className="text-xs text-gray-400">{selected.role}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <Badge>{selected.licensed ? 'Licensed' : 'Unlicensed'}</Badge>
                      <div className="text-xs text-gray-500 mt-1">{selected.pronouns || ''}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-md">
                    {selected.fetching ? (
                      <p className="text-gray-400">Fetching artifact…</p>
                    ) : (
                      <>
                        <h5 className="font-medium">{selected.artifact?.title}</h5>
                        <p className="text-sm text-gray-300 mt-2">{selected.artifact?.excerpt}</p>
                        <div className="mt-4 text-xs text-gray-400">{selected.artifact?.content}</div>
                        <div className="mt-6 flex gap-3">
                          <button onClick={() => setLicenseOpen(selected)} className="px-4 py-2 rounded-full bg-amber-600 text-black">Request License</button>
                          <a className="px-4 py-2 rounded-full border border-gray-700 text-sm hover:bg-gray-800 flex items-center gap-2" href="#"
                             onClick={(e) => { e.preventDefault(); alert('Demo: open folder in private staging'); }}>
                            <ExternalLink className="w-4 h-4" /> Open Archive
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {licenseOpen && (
        <Modal title={licenseOpen.name ? `License — ${licenseOpen.name}` : 'Purchase License'} onClose={() => { setLicenseOpen(false); setLicenseLoading(false); setLicenseSuccess(false); }}>
          <div>
            <p className="text-sm text-gray-400 mb-4">Licensing this faculty artifact will begin a private contract creation workflow, royalty schedule, and secure hosting. This is a demo flow — replace with real contract & payment handlers.</p>
            <div className="bg-gray-800 p-4 rounded-md">
              <div className="flex items-center gap-4 mb-4">
                <img src={licenseOpen.image} alt={licenseOpen.name} className="w-16 h-16 object-cover rounded-md" />
                <div>
                  <div className="font-medium">{licenseOpen.name}</div>
                  <div className="text-xs text-gray-400">{licenseOpen.role}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-gray-300">License Type</div>
                  <div className="text-amber-400 font-medium">Institutional — Per Term</div>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-400">Your Institution / Company</label>
                <input type="text" className="mt-1 w-full p-2 rounded-md bg-gray-900 border border-gray-700" placeholder="e.g., ModernArts Conservatory" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => handlePurchaseLicense(licenseOpen.id, selected?.artifact?.auditHash)} disabled={licenseLoading} className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700">
                  {licenseLoading ? 'Processing…' : 'Purchase License — Demo'}
                </button>
                {licenseSuccess && <div className="text-green-400 text-sm">Success — license registered (demo)</div>}
              </div>
              <div className="mt-4 text-xs text-gray-500">Legal: Demo uses a mock contract generator. For production, use Stripe Checkout + DocuSign + auditable license ledger.</div>
            </div>
          </div>
        </Modal>
      )}

      <footer className="max-w-6xl mx-auto mt-12 text-center text-gray-500">
        <p>Pyrouette Stageport — Agentic AI Faculty Demo • Built by Allison Van Cura</p>
      </footer>
    </div>
  );
}
