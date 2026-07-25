#!/usr/bin/env tsx
/**
 * Sets known passwords on the seeded local Auth users.
 * Requires: .env.local with SUPABASE_URL (or VITE_SUPABASE_URL), anon, and service_role keys.
 *
 * Usage: npm run auth:seed-test-credentials
 */

import '../tests/helpers/load-env'
import {
  ensureTestCredentials,
  listTestUsers,
  TEST_PASSWORD,
} from '../tests/helpers'

async function main() {
  await ensureTestCredentials()
  console.log(`Set password "${TEST_PASSWORD}" for:`)
  for (const user of listTestUsers()) {
    console.log(`  ${user.email} (${user.username})`)
  }
  console.log('\nSign in at http://localhost:5173 (Get Started → XoloDojo Account)')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
