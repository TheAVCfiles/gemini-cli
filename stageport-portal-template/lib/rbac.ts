import type { ProfileRole } from './auth';

const accessByRoute: Record<string, ProfileRole[]> = {
  '/app/sessions': ['staff', 'owner', 'super_admin'],
  '/app/ledger': ['auditor', 'owner', 'super_admin'],
  '/app/contracts': ['owner', 'super_admin'],
  '/app/governance': ['super_admin']
};

export function canViewRoute(role: ProfileRole, route: string): boolean {
  if (role === 'super_admin') {
    return true;
  }

  return accessByRoute[route]?.includes(role) ?? false;
}
