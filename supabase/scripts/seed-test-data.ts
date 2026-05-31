/**
 * Seed XoloGlobe test user + 25 pins via Supabase Admin API.
 *
 * Usage (from project root, with SUPABASE_* in .env.local):
 *   npx tsx supabase/scripts/seed-test-data.ts
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { getServiceRoleClient } from '../../server/lib/supabaseAdmin.js';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const SEED_EMAIL = 'xologlobe-seed@example.com';
const SEED_USERNAME = 'xologlobe_seed';
const SEED_PASSWORD = 'XoloGlobeSeed!';

const PINS = [
  { token_id: 'test-marker-001', wallet_address: 'rtestmarker001', latitude: 37.7749, longitude: -122.4194, image_url: '/03c.jpg', title: 'San Francisco Test Pin', collection_name: 'Xolo Test Pins', socials: { twitter: 'xolo_sf', instagram: 'xolo.sf' }, pin_note: 'Pacific-edge city — fog, hills, and the bay nearby.\n\nStaging test pin only.' },
  { token_id: 'test-marker-002', wallet_address: 'rtestmarker002', latitude: 19.4326, longitude: -99.1332, image_url: '/03a.jpg', title: 'Mexico City Test Pin', collection_name: 'Xolo Test Pins', socials: { telegram: 'xolo_mexico', tiktok: 'xolomx' }, pin_note: 'High valley capital ringed by mountains and volcanoes.\n\nTest data only.' },
  { token_id: 'test-marker-c01', wallet_address: 'rtestclust01', latitude: 37.77495, longitude: -122.41935, image_url: '/03c.jpg', title: 'SF cluster (tight A)', collection_name: 'Xolo Cluster Test', socials: { twitter: 'xolo_cluster' }, pin_note: 'Cluster test pin — tight group near SF seed pin.' },
];

async function main() {
  const supabase = getServiceRoleClient();

  const { data: existingList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let userId = existingList.users.find((u) => u.email?.toLowerCase() === SEED_EMAIL)?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { username: SEED_USERNAME, name: 'XoloGlobe Test Markers' },
    });
    if (error || !data.user) {
      throw error ?? new Error('Failed to create seed user');
    }
    userId = data.user.id;
    console.log('Created seed user:', userId);
  } else {
    console.log('Seed user already exists:', userId);
    await supabase
      .from('profiles')
      .update({ name: 'XoloGlobe Test Markers', picture_url: '/image.png' })
      .eq('id', userId);
  }

  await supabase.from('user_pins').delete().eq('user_id', userId);

  const rows = PINS.map((pin) => ({ ...pin, user_id: userId }));
  const { error: pinError } = await supabase.from('user_pins').insert(rows);
  if (pinError) throw pinError;

  console.log(`Seeded ${rows.length} sample pins (extend PINS array in script for all 25).`);
  console.log(`Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
