export type LedgerEntry = {
  documentId: string;
  hash: string;
  eventType: string;
  createdAt: string;
};

const globalStore = globalThis as unknown as { __ledgerEntries?: LedgerEntry[] };

if (!globalStore.__ledgerEntries) {
  globalStore.__ledgerEntries = [];
}

export function notarize(documentId: string, hash: string, eventType: string): LedgerEntry {
  const entry: LedgerEntry = {
    documentId,
    hash,
    eventType,
    createdAt: new Date().toISOString(),
  };

  globalStore.__ledgerEntries!.unshift(entry);
  return entry;
}

export function getLedgerEntries(): LedgerEntry[] {
  return globalStore.__ledgerEntries ?? [];
}
