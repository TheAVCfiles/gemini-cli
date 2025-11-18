/* @jsxImportSource https://esm.sh/react@18.3.1?dev */
import React, { useState } from 'https://esm.sh/react@18.3.1?dev';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?dev';
import { X, Sparkles, ExternalLink } from 'https://esm.sh/lucide-react@0.356.0?bundle';

/**
 * Minimal polished prototype for "Pyrouette Stageport — Agentic AI Ballet Faculty"
 * - Replace `founder` headshot & bio with your own assets.
 * - Replace faculty entries with real people as they sign on.
 * - RAG/LLM demo integration points are commented where backend stubs belong.
 *
 * Expected environment: React + TailwindCSS + lucide-react
 */

/* --------------------------
   === Replace these assets ===
   -------------------------- */
const founder = {
  name: 'Allison Van Cura',
  title: 'Founder & Artistic Systems Architect',
  headshot: 'https://placehold.co/400x400/111827/ffffff?text=Allison+Van+Cura', // replace with your headshot url
  bioShort:
    'Writer, choreographer, and myth-tech systems architect. Creator of DeCrypt the Girl and MythOS — I design embodied pedagogies that blend classical lineage with generative systems.',
  bioLong:
    "Allison Van Cura (AVC) is a choreographer and systems architect who translates survival into syntax. AVC's work blends classical ballet lineage with myth-tech pedagogy to build agentic, licensed AI faculty for training, assessment and creative collaboration. DeCrypt the Girl and MythOS are the operational philosophies behind the Stageport — a secure, licensable vault of embodied teaching.",
  email: 'acfwrites@gmail.com',
  studio: 'Intuition Labs / Stageport',
  location: 'Poughkeepsie, NY',
};

const initialFaculty = [
  {
    id: 'avc-founder',
    name: founder.name,
    role: 'Founding Faculty — Systems & Choreography',
    pronouns: 'she/her',
    image: founder.headshot,
    short: 'Founder & Artistic Systems Architect. Myth-tech OS, choreography as cryptography.',
    long: founder.bioLong,
    tags: ['Founding', 'Pedagogy', 'MythOS'],
    licensed: true,
  },
  {
    id: 'diana-castellanos',
    name: 'Diana Castellanos',
    role: 'Principal — Classical Lineage',
    pronouns: 'she/her',
    image: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=600&h=800&fit=crop',
    short: 'Ethereal classical principal; Balanchine & Petipa lineage.',
    long: "Diana's work integrates neoclassical clarity with fluid lyricism. Her classes emphasize musicality, line and performance architecture.",
    tags: ['Principal', 'Classical'],
    licensed: false,
  },
  {
    id: 'aurora-psuedo',
    name: 'AURORA — Myth Persona',
    role: 'Agentic AI — Mythic Ballerina Persona',
    pronouns: 'she/they',
    image: 'https://placehold.co/600x800/6b21a8/ffffff?text=AURORA',
    short: "Myth-tech persona trained on Aurora's natal myth and poetic choreography.",
    long: 'Aurora is a fully choreographed persona — part archival, part generated — designed to teach ritualized improvisation and emotional mapping.',
    tags: ['Persona', 'AI-Semblance'],
    licensed: false,
  },
];

/* -----------------------
   === Small UI helpers ===
   ----------------------- */

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-600 text-black ${className}`}>
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

/* -----------------------
   === Main Component ===
   ----------------------- */
function StageportFacultyPage() {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [selected, setSelected] = useState(null);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState(false);

  const fetchVaultArtifact = async (facultyId) => {
    await new Promise((res) => setTimeout(res, 700));
    if (facultyId === 'avc-founder') {
      return {
        title: 'The Diary Loop Protocol — Teaching Guide',
        excerpt: 'A ritualized warmup that converts memory into phrase, combining barre with recursive notation.',
        content: 'Full artifact: Sequence: 1) Breath-phrase 2) Balanchine adjacency 3) Signal Split. Required props: scarf, metronome...',
      };
    }
    return {
      title: 'Class Archive Excerpt',
      excerpt: 'A session outline and an annotated exercise.',
      content: 'Detailed exercise: use across-floor fouetté prep as transposition for improvisation...',
    };
  };

  const handlePurchaseLicense = async (facultyId) => {
    setLicenseLoading(true);
    setLicenseSuccess(false);
    try {
      await new Promise((res) => setTimeout(res, 900));
      setFaculty((prev) => prev.map((f) => (f.id === facultyId ? { ...f, licensed: true } : f)));
      setLicenseSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLicenseLoading(false);
    }
  };

  const openVaultFor = async (member) => {
    setSelected({ ...member, artifact: null, fetching: true });
    setVaultOpen(true);

    try {
      const artifact = await fetchVaultArtifact(member.id);
      setSelected((prev) => ({ ...prev, artifact, fetching: false }));
    } catch (e) {
      setSelected((prev) => ({ ...prev, artifact: { title: 'Error', excerpt: 'Failed to fetch artifact.' }, fetching: false }));
    }
  };

  const pitchCopy = {
    subject: 'Founding Faculty Invitation — Pyrouette Stageport',
    body: `Hi {{name}},\n\nI’m inviting a small circle of high-caliber teachers to join the Pyrouette Stageport — a licensable agentic AI faculty that preserves your pedagogy, lineage and voice. You’ll be a founding faculty member; we’ll preserve your teaching artifacts in a private vault, license your classes to institutions, and ensure your name & legacy are front-and-center.\n\nThis is not an “embarrassing favor.” It’s an archival, revenue-generating collaboration with clear attribution, legal licensing, and royalties. I’d love to talk details and show the mock prototype.\n\n— Allison Van Cura`,
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

          <h2 className="text-2xl font-medium">
            {founder.name} <span className="text-gray-400 text-sm font-normal">— {founder.title}</span>
          </h2>
          <p className="text-gray-300 mt-4 max-w-2xl leading-relaxed">{founder.bioShort}</p>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <Badge>Founding Studio</Badge>
            <Badge>DeCrypt the Girl</Badge>
            <Badge>MythOS</Badge>
            <button
              onClick={() => setVaultOpen(true)}
              className="ml-auto px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
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
            {faculty.map((member) => (
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
                      {member.tags.map((t, i) => (
                        <span key={i} className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openVaultFor(member)}
                        className="px-3 py-1 rounded-full bg-amber-600 text-black text-xs hover:bg-amber-500"
                      >
                        Vault
                      </button>
                      <button
                        onClick={() => setLicenseOpen(member)}
                        className={`px-3 py-1 rounded-full text-xs ${member.licensed ? 'bg-green-700' : 'bg-indigo-700 hover:bg-indigo-600'}`}
                      >
                        {member.licensed ? 'Licensed' : 'License'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 bg-gray-900 rounded-2xl p-6">
          <h4 className="text-xl font-serif mb-2">Founder Outreach — Ready Copy</h4>
          <pre className="bg-gray-800 p-4 rounded-md text-sm text-gray-200 whitespace-pre-wrap">{pitchCopy.body}</pre>
          <p className="text-xs text-gray-400 mt-2">
            Use this in personalized outreach. Attach the prototype URL and a short 10-minute walkthrough invitation.
          </p>
        </section>
      </main>

      {vaultOpen && (
        <Modal title="Faculty Vault — Demo Artifacts" onClose={() => { setVaultOpen(false); setSelected(null); }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-3">
              <h5 className="text-sm uppercase text-gray-400 mb-2">Founding Vault</h5>
              {faculty.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openVaultFor(f)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-800 flex items-center gap-3"
                >
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
                          <button
                            onClick={() => setLicenseOpen(selected)}
                            className="px-4 py-2 rounded-full bg-amber-600 text-black"
                          >
                            Request License
                          </button>
                          <a
                            className="px-4 py-2 rounded-full border border-gray-700 text-sm hover:bg-gray-800 flex items-center gap-2"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              alert('Demo: open folder in private staging');
                            }}
                          >
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
        <Modal
          title={licenseOpen.name ? `License — ${licenseOpen.name}` : 'Purchase License'}
          onClose={() => {
            setLicenseOpen(false);
            setLicenseLoading(false);
            setLicenseSuccess(false);
          }}
        >
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Licensing this faculty artifact will begin a private contract creation workflow, royalty schedule, and deliver secure hosting of the
              artifact. This is a demo flow — replace with real contract & payment handlers.
            </p>

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
                <input
                  type="text"
                  className="mt-1 w-full p-2 rounded-md bg-gray-900 border border-gray-700"
                  placeholder="e.g., ModernArts Conservatory"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => handlePurchaseLicense(licenseOpen.id)}
                  disabled={licenseLoading}
                  className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {licenseLoading ? 'Processing…' : 'Purchase License — Demo'}
                </button>

                {licenseSuccess && <div className="text-green-400 text-sm">Success — license registered (demo)</div>}
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Legal: This demo uses a mock contract generator. For production, we recommend Stripe Checkout + Docusign or Contractbook integration with
                an auditable license ledger (onchain or server DB).
              </div>
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

const root = createRoot(document.getElementById('root'));
root.render(<StageportFacultyPage />);
