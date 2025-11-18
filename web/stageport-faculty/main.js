// web/stageport-faculty/main.jsx
import React, { useState } from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import { X, Sparkles, ExternalLink } from "https://esm.sh/lucide-react@0.356.0?bundle";
import { Fragment, jsx, jsxs } from "https://esm.sh/react@18.3.1?dev/jsx-runtime";
var founder = {
  name: "Allison Van Cura",
  title: "Founder & Artistic Systems Architect",
  headshot: "https://placehold.co/400x400/111827/ffffff?text=Allison+Van+Cura",
  // replace with your headshot url
  bioShort: "Writer, choreographer, and myth-tech systems architect. Creator of DeCrypt the Girl and MythOS \u2014 I design embodied pedagogies that blend classical lineage with generative systems.",
  bioLong: "Allison Van Cura (AVC) is a choreographer and systems architect who translates survival into syntax. AVC's work blends classical ballet lineage with myth-tech pedagogy to build agentic, licensed AI faculty for training, assessment and creative collaboration. DeCrypt the Girl and MythOS are the operational philosophies behind the Stageport \u2014 a secure, licensable vault of embodied teaching.",
  email: "acfwrites@gmail.com",
  studio: "Intuition Labs / Stageport",
  location: "Poughkeepsie, NY"
};
var initialFaculty = [
  {
    id: "avc-founder",
    name: founder.name,
    role: "Founding Faculty \u2014 Systems & Choreography",
    pronouns: "she/her",
    image: founder.headshot,
    short: "Founder & Artistic Systems Architect. Myth-tech OS, choreography as cryptography.",
    long: founder.bioLong,
    tags: ["Founding", "Pedagogy", "MythOS"],
    licensed: true
  },
  {
    id: "diana-castellanos",
    name: "Diana Castellanos",
    role: "Principal \u2014 Classical Lineage",
    pronouns: "she/her",
    image: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=600&h=800&fit=crop",
    short: "Ethereal classical principal; Balanchine & Petipa lineage.",
    long: "Diana's work integrates neoclassical clarity with fluid lyricism. Her classes emphasize musicality, line and performance architecture.",
    tags: ["Principal", "Classical"],
    licensed: false
  },
  {
    id: "aurora-psuedo",
    name: "AURORA \u2014 Myth Persona",
    role: "Agentic AI \u2014 Mythic Ballerina Persona",
    pronouns: "she/they",
    image: "https://placehold.co/600x800/6b21a8/ffffff?text=AURORA",
    short: "Myth-tech persona trained on Aurora's natal myth and poetic choreography.",
    long: "Aurora is a fully choreographed persona \u2014 part archival, part generated \u2014 designed to teach ritualized improvisation and emotional mapping.",
    tags: ["Persona", "AI-Semblance"],
    licensed: false
  }
];
function Badge({ children, className = "" }) {
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-600 text-black ${className}`, children });
}
function Modal({ children, title, onClose }) {
  return /* @__PURE__ */ jsxs("div", { role: "dialog", "aria-modal": "true", className: "fixed inset-0 z-50 flex items-center justify-center p-6", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/70", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-3xl w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-serif", children: title }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, "aria-label": "Close", className: "p-2 rounded-full hover:bg-gray-800", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { children })
    ] })
  ] });
}
function StageportFacultyPage() {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [selected, setSelected] = useState(null);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState(false);
  const fetchVaultArtifact = async (facultyId) => {
    await new Promise((res) => setTimeout(res, 700));
    if (facultyId === "avc-founder") {
      return {
        title: "The Diary Loop Protocol \u2014 Teaching Guide",
        excerpt: "A ritualized warmup that converts memory into phrase, combining barre with recursive notation.",
        content: "Full artifact: Sequence: 1) Breath-phrase 2) Balanchine adjacency 3) Signal Split. Required props: scarf, metronome..."
      };
    }
    return {
      title: "Class Archive Excerpt",
      excerpt: "A session outline and an annotated exercise.",
      content: "Detailed exercise: use across-floor fouett\xE9 prep as transposition for improvisation..."
    };
  };
  const handlePurchaseLicense = async (facultyId) => {
    setLicenseLoading(true);
    setLicenseSuccess(false);
    try {
      await new Promise((res) => setTimeout(res, 900));
      setFaculty((prev) => prev.map((f) => f.id === facultyId ? { ...f, licensed: true } : f));
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
      setSelected((prev) => ({ ...prev, artifact: { title: "Error", excerpt: "Failed to fetch artifact." }, fetching: false }));
    }
  };
  const pitchCopy = {
    subject: "Founding Faculty Invitation \u2014 Pyrouette Stageport",
    body: `Hi {{name}},

I\u2019m inviting a small circle of high-caliber teachers to join the Pyrouette Stageport \u2014 a licensable agentic AI faculty that preserves your pedagogy, lineage and voice. You\u2019ll be a founding faculty member; we\u2019ll preserve your teaching artifacts in a private vault, license your classes to institutions, and ensure your name & legacy are front-and-center.

This is not an \u201Cembarrassing favor.\u201D It\u2019s an archival, revenue-generating collaboration with clear attribution, legal licensing, and royalties. I\u2019d love to talk details and show the mock prototype.

\u2014 Allison Van Cura`
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white font-inter p-8", children: [
    /* @__PURE__ */ jsxs("header", { className: "max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "w-44 h-44 rounded-2xl overflow-hidden ring-2 ring-amber-500", children: /* @__PURE__ */ jsx("img", { src: founder.headshot, alt: founder.name, className: "w-full h-full object-cover" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-serif mb-2", children: "Pyrouette Stageport" }),
        /* @__PURE__ */ jsx("p", { className: "text-amber-300 uppercase text-xs tracking-wider mb-3", children: "Agentic AI \u2022 Embodied Pedagogy \u2022 Licensed Faculty" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-medium", children: [
          founder.name,
          " ",
          /* @__PURE__ */ jsxs("span", { className: "text-gray-400 text-sm font-normal", children: [
            "\u2014 ",
            founder.title
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-300 mt-4 max-w-2xl leading-relaxed", children: founder.bioShort }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3 items-center", children: [
          /* @__PURE__ */ jsx(Badge, { children: "Founding Studio" }),
          /* @__PURE__ */ jsx(Badge, { children: "DeCrypt the Girl" }),
          /* @__PURE__ */ jsx(Badge, { children: "MythOS" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setVaultOpen(true),
              className: "ml-auto px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-sm flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
                " View Vault (demo)"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "max-w-6xl mx-auto mt-8", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-serif", children: "Founding Faculty & Agentic Personas" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Licensing-ready \u2014 private vault for pedagogy, contracts & royalties." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: faculty.map((member) => /* @__PURE__ */ jsxs("article", { className: "bg-gray-800 rounded-2xl overflow-hidden shadow-lg", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative h-80 overflow-hidden", children: [
            /* @__PURE__ */ jsx("img", { src: member.image, alt: member.name, className: "w-full h-full object-cover" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-lg font-serif", children: member.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-300", children: member.role })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300", children: member.short }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: member.tags.map((t, i) => /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full", children: t }, i)) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => openVaultFor(member),
                    className: "px-3 py-1 rounded-full bg-amber-600 text-black text-xs hover:bg-amber-500",
                    children: "Vault"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setLicenseOpen(member),
                    className: `px-3 py-1 rounded-full text-xs ${member.licensed ? "bg-green-700" : "bg-indigo-700 hover:bg-indigo-600"}`,
                    children: member.licensed ? "Licensed" : "License"
                  }
                )
              ] })
            ] })
          ] })
        ] }, member.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-12 bg-gray-900 rounded-2xl p-6", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-xl font-serif mb-2", children: "Founder Outreach \u2014 Ready Copy" }),
        /* @__PURE__ */ jsx("pre", { className: "bg-gray-800 p-4 rounded-md text-sm text-gray-200 whitespace-pre-wrap", children: pitchCopy.body }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-2", children: "Use this in personalized outreach. Attach the prototype URL and a short 10-minute walkthrough invitation." })
      ] })
    ] }),
    vaultOpen && /* @__PURE__ */ jsx(Modal, { title: "Faculty Vault \u2014 Demo Artifacts", onClose: () => {
      setVaultOpen(false);
      setSelected(null);
    }, children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-1 space-y-3", children: [
        /* @__PURE__ */ jsx("h5", { className: "text-sm uppercase text-gray-400 mb-2", children: "Founding Vault" }),
        faculty.map((f) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => openVaultFor(f),
            className: "w-full text-left p-3 rounded-lg hover:bg-gray-800 flex items-center gap-3",
            children: [
              /* @__PURE__ */ jsx("img", { src: f.image, alt: f.name, className: "w-12 h-12 object-cover rounded-md" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium", children: f.name }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-400", children: f.role })
              ] })
            ]
          },
          f.id
        ))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 bg-gray-800 p-4 rounded-lg min-h-[220px]", children: [
        !selected && /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "Select a faculty member to view a sample archived artifact." }),
        selected && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-4", children: [
            /* @__PURE__ */ jsx("img", { src: selected.image, alt: selected.name, className: "w-20 h-20 object-cover rounded-md" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xl font-serif", children: selected.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: selected.role })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "ml-auto text-right", children: [
              /* @__PURE__ */ jsx(Badge, { children: selected.licensed ? "Licensed" : "Unlicensed" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mt-1", children: selected.pronouns || "" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-gray-900 rounded-md", children: selected.fetching ? /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "Fetching artifact\u2026" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h5", { className: "font-medium", children: selected.artifact?.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-2", children: selected.artifact?.excerpt }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 text-xs text-gray-400", children: selected.artifact?.content }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setLicenseOpen(selected),
                  className: "px-4 py-2 rounded-full bg-amber-600 text-black",
                  children: "Request License"
                }
              ),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  className: "px-4 py-2 rounded-full border border-gray-700 text-sm hover:bg-gray-800 flex items-center gap-2",
                  href: "#",
                  onClick: (e) => {
                    e.preventDefault();
                    alert("Demo: open folder in private staging");
                  },
                  children: [
                    /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
                    " Open Archive"
                  ]
                }
              )
            ] })
          ] }) })
        ] })
      ] })
    ] }) }),
    licenseOpen && /* @__PURE__ */ jsx(
      Modal,
      {
        title: licenseOpen.name ? `License \u2014 ${licenseOpen.name}` : "Purchase License",
        onClose: () => {
          setLicenseOpen(false);
          setLicenseLoading(false);
          setLicenseSuccess(false);
        },
        children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Licensing this faculty artifact will begin a private contract creation workflow, royalty schedule, and deliver secure hosting of the artifact. This is a demo flow \u2014 replace with real contract & payment handlers." }),
          /* @__PURE__ */ jsxs("div", { className: "bg-gray-800 p-4 rounded-md", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("img", { src: licenseOpen.image, alt: licenseOpen.name, className: "w-16 h-16 object-cover rounded-md" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium", children: licenseOpen.name }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-400", children: licenseOpen.role })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "ml-auto text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-300", children: "License Type" }),
                /* @__PURE__ */ jsx("div", { className: "text-amber-400 font-medium", children: "Institutional \u2014 Per Term" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs text-gray-400", children: "Your Institution / Company" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: "mt-1 w-full p-2 rounded-md bg-gray-900 border border-gray-700",
                  placeholder: "e.g., ModernArts Conservatory"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handlePurchaseLicense(licenseOpen.id),
                  disabled: licenseLoading,
                  className: "px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60",
                  children: licenseLoading ? "Processing\u2026" : "Purchase License \u2014 Demo"
                }
              ),
              licenseSuccess && /* @__PURE__ */ jsx("div", { className: "text-green-400 text-sm", children: "Success \u2014 license registered (demo)" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 text-xs text-gray-500", children: "Legal: This demo uses a mock contract generator. For production, we recommend Stripe Checkout + Docusign or Contractbook integration with an auditable license ledger (onchain or server DB)." })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsx("footer", { className: "max-w-6xl mx-auto mt-12 text-center text-gray-500", children: /* @__PURE__ */ jsx("p", { children: "Pyrouette Stageport \u2014 Agentic AI Faculty Demo \u2022 Built by Allison Van Cura" }) })
  ] });
}
var root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsx(StageportFacultyPage, {}));
