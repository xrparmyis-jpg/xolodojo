/**
 * Placeholder for Vitest + Supabase RLS suites (phase 2).
 * Run with: npm run test:integration
 * Requires: .env.local with Supabase URL/keys, npm run auth:seed-test-credentials
 *
 * Intended pattern:
 *   createAuthedClient(email, password) — subject to RLS
 *   createServiceClient() — bypasses RLS for setup/assertions
 */

import { describe, expect, it } from 'vitest'

describe.skip('RLS integration (phase 2)', () => {
  it('will assert own-profile update vs anon restrictions', () => {
    expect(true).toBe(true)
  })
})
