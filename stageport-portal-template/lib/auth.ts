export type ProfileRole = 'super_admin' | 'owner' | 'staff' | 'auditor';

export type Profile = {
  id: string;
  email: string;
  role: ProfileRole;
  studio_id: string;
};

export async function getCurrentProfile(): Promise<Profile> {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'owner@demo.stageport.app',
    role: 'owner',
    studio_id: 'studio-demo-001'
  };
}
