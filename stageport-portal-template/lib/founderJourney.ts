export const LEDGER_QUERY_KEY = ['/api/ledger'] as const;
export const JOURNEY_LEDGER_QUERY_KEY = ['/api/ledger/founder_journey'] as const;

export function getJourneyProgress(
  founderSteps: readonly string[] | undefined,
  completedSteps: number,
) {
  const totalSteps = founderSteps?.length ?? 0;
  const safeCompletedSteps = totalSteps ? Math.min(Math.max(completedSteps, 0), totalSteps) : 0;
  const width = totalSteps ? `${Math.min((safeCompletedSteps / totalSteps) * 100, 100)}%` : '0%';

  return {
    completedSteps: safeCompletedSteps,
    totalSteps,
    width,
  };
}

export async function invalidateLedgerQueries(queryClient: {
  invalidateQueries: (input: { queryKey: readonly string[] }) => Promise<unknown> | unknown;
}) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: LEDGER_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: JOURNEY_LEDGER_QUERY_KEY }),
  ]);
}

export function assertSha256Response(data: unknown): string {
  if (
    !data ||
    typeof data !== 'object' ||
    !('sha256' in data) ||
    typeof (data as { sha256?: unknown }).sha256 !== 'string' ||
    (data as { sha256: string }).sha256.length !== 64
  ) {
    throw new Error('Invalid SHA-256 response');
  }

  return (data as { sha256: string }).sha256;
}
