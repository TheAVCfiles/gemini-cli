import { mkdir, rm, writeFile, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(__dirname, '..');
const distRoot = path.join(kitRoot, 'dist');
const containerRoot = path.join(distRoot, 'AVC_Systems_Studio_Container_v1');

const placeholder = {
  pdf: (title, summary) => `${title}\n\n${summary}\n\nReplace this placeholder with the designed PDF before shipping.`,
  png: (title, notes) => `${title}\n${notes}\n\nReplace with final PNG export when art is approved.`,
  svg: (title, notes) => `${title}\n${notes}\n\nReplace with final SVG once assets are finalized.`,
  txt: (title, body) => `${title}\n\n${body}`,
};

const ledgerSchema = {
  description:
    'Chain-of-custody ledger entry schema. Fields are append-only and timestamped in UTC.',
  fields: {
    artifact_id: 'Unique artifact identifier (string, required).',
    sha256: 'Hex-encoded SHA-256 hash of the artifact bytes.',
    role: 'Role at interaction (Architect | Operator | Archivist).',
    action: 'Action performed (created | verified | exported | sealed).',
    timestamp_utc: 'ISO-8601 timestamp in UTC.',
    signature: 'Initials or signing key reference (human + machine).',
    jurisdiction: 'Optional jurisdiction notice at time of action.',
    notes: 'Optional freeform annotations.',
  },
};

const sampleLedgerEntry = {
  artifact_id: 'AKS-2025-0001',
  sha256: '<hash_of_final_pdf>',
  role: 'Architect',
  action: 'created',
  timestamp_utc: '2025-01-12T18:42:13Z',
  signature: 'AVC/Sign-01',
  jurisdiction: 'NY, USA',
  notes: 'Derived from rehearsal + system design logs; see AKS record.',
};

const files = [
  {
    relative: '00_FRONT_MATTER/COVER_SYSTEMS_MANUAL.pdf',
    content: placeholder.pdf(
      'Cover + Systems Manual',
      'Front matter for the AVC Systems Studio Container v1. Include issuance statement, authority line, and summary of custody expectations.',
    ),
  },
  {
    relative: '00_FRONT_MATTER/JURISDICTION_NOTICE.txt',
    content: placeholder.txt(
      'Jurisdiction Notice',
      'Declare the governing jurisdiction for custody and dispute resolution. Keep the language concise and reference Exhibit C (Chain of Custody).',
    ),
  },
  {
    relative: '00_FRONT_MATTER/HOW_TO_READ_THIS_CONTAINER.pdf',
    content: placeholder.pdf(
      'How to Read This Container',
      'Plain-language guide for counsel and operators: folder map, manifest usage, and how to verify hashes offline.',
    ),
  },
  {
    relative: '01_RUNTIME_SPEC/Exhibit_A_Runtime_Spec.pdf',
    content: placeholder.pdf(
      'Exhibit A — Runtime Spec',
      'Define system runtime expectations, dependencies, and operational constraints. Prioritize offline viability.',
    ),
  },
  {
    relative: '01_RUNTIME_SPEC/Exhibit_B_Hash_Manifest.pdf',
    content: placeholder.pdf(
      'Exhibit B — Hash Manifest',
      'Printable copy of the SHA-256 manifest to pair with the digital `SHA256SUMS.txt`.',
    ),
  },
  {
    relative: '01_RUNTIME_SPEC/Exhibit_C_Chain_of_Custody.pdf',
    content: placeholder.pdf(
      'Exhibit C — Chain of Custody',
      'Narrative-free chain-of-custody rules: roles, actions, and signature expectations.',
    ),
  },
  {
    relative: '02_VISUAL_SYSTEMS/Container_Licensing_Diagram.png',
    content: placeholder.png(
      'Container Licensing Diagram',
      'Visual showing how operators, studios, and partners access licensed artifacts without control creep.',
    ),
  },
  {
    relative: '02_VISUAL_SYSTEMS/Proof_of_Use_Cycle.png',
    content: placeholder.png(
      'Proof of Use Cycle',
      'Depict request → use → verification → archive loop. Keep monochrome and ledger-first.',
    ),
  },
  {
    relative: '02_VISUAL_SYSTEMS/Role_Boundary_Map.png',
    content: placeholder.png(
      'Role Boundary Map',
      'Map the boundaries for parents, operators, archivists, and partners. Parents get a window, not control.',
    ),
  },
  {
    relative: '02_VISUAL_SYSTEMS/FILED_Stamp_Sheet.svg',
    content: placeholder.svg(
      'FILED Stamp Sheet',
      'Stamp sheet for marking sealed artifacts and custody events.',
    ),
  },
  {
    relative: '03_GARMENTABLE_LAYER/Garmentable_Spec_v1.pdf',
    content: placeholder.pdf(
      'Garmentable Spec v1',
      'Attach custody + memory to physical garments. Detail attachment points, identifiers, and scanning expectations.',
    ),
  },
  {
    relative: '03_GARMENTABLE_LAYER/Chain_of_Custody_on_Garments.pdf',
    content: placeholder.pdf(
      'Chain of Custody on Garments',
      'Rules for tracking costumes as witnessed artifacts with chain-of-custody and attached dance history.',
    ),
  },
  {
    relative: '03_GARMENTABLE_LAYER/NFT_Attachment_Model.txt',
    content: placeholder.txt(
      'NFT Attachment Model',
      'Describe how (or if) tokenization is allowed. Keep optional, revocable, and aligned to chain-of-custody.',
    ),
  },
  {
    relative: '03_GARMENTABLE_LAYER/Thrift_to_Stage_Flow_Map.png',
    content: placeholder.png(
      'Thrift to Stage Flow Map',
      'Flow from sourcing garments → custody → rehearsal → performance → archive.',
    ),
  },
  {
    relative: '04_COMMUNITY_OPS/Parent_Window_Access_Rules.pdf',
    content: placeholder.pdf(
      'Parent Window Access Rules',
      'Time-boxed visibility rules for parents; no feeds, no control.',
    ),
  },
  {
    relative: '04_COMMUNITY_OPS/Local_PopUp_Event_Protocol.pdf',
    content: placeholder.pdf(
      'Local Pop-Up Event Protocol',
      'Operational play for pop-up events with custody-safe capture and consent boundaries.',
    ),
  },
  {
    relative: '04_COMMUNITY_OPS/Costume_Circulation_Playbook.pdf',
    content: placeholder.pdf(
      'Costume Circulation Playbook',
      'Lifecycle guidance for lending, cleaning, and archiving costumes without IP leakage.',
    ),
  },
  {
    relative: '04_COMMUNITY_OPS/Studio_Internal_Magazine_Template.indd',
    content:
      'Adobe InDesign template placeholder. Drop final `.indd` here for the internal magazine; keep assets local to the container.',
  },
  {
    relative: '05_LEDGER/ledger_schema.json',
    content: JSON.stringify(ledgerSchema, null, 2),
  },
  {
    relative: '05_LEDGER/sample_entry.json',
    content: JSON.stringify(sampleLedgerEntry, null, 2),
  },
  {
    relative: '05_LEDGER/audit_readme.txt',
    content: placeholder.txt(
      'Audit + Verification',
      'Use the SHA256SUMS.txt file to verify every artifact. Compare against Exhibit B and the printed manifest. Ledger entries are append-only; never edit in place.',
    ),
  },
  {
    relative: '06_LICENSE/License_Terms_ReadOnly.pdf',
    content: placeholder.pdf(
      'License Terms (Read Only)',
      'Read-only license terms covering operator usage, redistribution boundaries, and non-extraction guardrails.',
    ),
  },
  {
    relative: '06_LICENSE/Renewal_and_Proof_of_Use.pdf',
    content: placeholder.pdf(
      'Renewal + Proof of Use',
      'Outline renewal cadence and what counts as acceptable proof of use during audits.',
    ),
  },
  {
    relative: '06_LICENSE/Non_Extraction_Clause.txt',
    content: placeholder.txt(
      'Non-Extraction Clause',
      'Plain-language boundary against data, story, or motion extraction outside licensed scope.',
    ),
  },
  {
    relative: '07_APPENDIX/Isometric_Not_Woo_Explainer.pdf',
    content: placeholder.pdf(
      'Isometric Not Woo',
      'Brief explainer on why the system is isometric and audit-first, not performative.',
    ),
  },
  {
    relative: '07_APPENDIX/Ballet_as_Measurement.pdf',
    content: placeholder.pdf(
      'Ballet as Measurement',
      'Show how ballet is used as a measurement and logging modality, not sentiment.',
    ),
  },
  {
    relative: '07_APPENDIX/Historical_Context_Balanchine.txt',
    content: placeholder.txt(
      'Historical Context — Balanchine',
      'Contextual note on Balanchine and custody-aware choreography lineage.',
    ),
  },
];

async function writeContainerFiles() {
  for (const file of files) {
    const destination = path.join(containerRoot, file.relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, 'utf8');
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function buildManifests() {
  const entries = [];
  for (const file of files) {
    const fullPath = path.join(containerRoot, file.relative);
    const buffer = await readFile(fullPath);
    const fileHash = sha256(buffer);
    const fileStat = await stat(fullPath);
    entries.push({ path: file.relative, hash: fileHash, bytes: fileStat.size });
  }

  const manifestRoot = path.join(containerRoot, 'MANIFEST');
  await mkdir(manifestRoot, { recursive: true });

  const csvHeader = 'path,bytes,sha256\n';
  const csvRows = entries
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => `${entry.path},${entry.bytes},${entry.hash}`)
    .join('\n');
  await writeFile(path.join(manifestRoot, 'FILE_INDEX.csv'), csvHeader + csvRows, 'utf8');

  const shaLines = entries
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => `${entry.hash}  ${entry.path}`)
    .join('\n');
  await writeFile(path.join(manifestRoot, 'SHA256SUMS.txt'), shaLines, 'utf8');

  const generatedStamp = new Date().toISOString();
  await writeFile(path.join(manifestRoot, 'GENERATED_UTC.txt'), generatedStamp + '\n', 'utf8');
}

async function main() {
  await rm(containerRoot, { recursive: true, force: true });
  await mkdir(containerRoot, { recursive: true });
  await writeContainerFiles();
  await buildManifests();
  console.log(`Container generated at ${containerRoot}`);
}

main().catch((error) => {
  console.error('Failed to build container:', error);
  process.exitCode = 1;
});
