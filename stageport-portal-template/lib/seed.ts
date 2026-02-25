import { supabaseAdmin } from './supabaseClient';

const DEMO_USERS = [
  { email: 'superadmin@demo.stageport.app', password: 'StagePort!123', role: 'super_admin' },
  { email: 'owner@demo.stageport.app', password: 'StagePort!123', role: 'owner' },
  { email: 'staff@demo.stageport.app', password: 'StagePort!123', role: 'staff' },
  { email: 'auditor@demo.stageport.app', password: 'StagePort!123', role: 'auditor' }
] as const;

async function seed() {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for seeding.');
  }

  for (const demoUser of DEMO_USERS) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      email_confirm: true
    });

    if (error && !error.message.includes('already registered')) {
      throw error;
    }

    if (!data.user) {
      continue;
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      email: demoUser.email,
      role: demoUser.role,
      studio_id: 'studio-demo-001'
    });

    if (profileError) {
      throw profileError;
    }
  }

  console.log('Seed complete. Demo users are ready.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
