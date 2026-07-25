import type { SupabaseClient } from '@supabase/supabase-js'

import {
  listTestUsers,
  type TestCredential,
  TEST_PASSWORD,
} from './credentials'
import { createServiceClient } from './supabase'

/**
 * Ensure seeded local users exist with the known TEST_PASSWORD.
 * Uses the service role Admin API (idempotent).
 */
export async function ensureTestCredentials(
  client: SupabaseClient = createServiceClient(),
  users: TestCredential[] = listTestUsers(),
): Promise<void> {
  const { data: listed, error: listError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listError) {
    throw new Error(`listUsers failed: ${listError.message}`)
  }

  const byEmail = new Map(
    listed.users
      .filter((u) => u.email)
      .map((u) => [u.email!.toLowerCase(), u] as const),
  )

  for (const user of users) {
    const existing = byEmail.get(user.email.toLowerCase())
    const metadata = {
      username: user.username,
      name: user.fullName,
      full_name: user.fullName,
    }

    if (existing) {
      const { error } = await client.auth.admin.updateUserById(existing.id, {
        password: user.password,
        email_confirm: true,
        user_metadata: metadata,
      })
      if (error) {
        throw new Error(
          `updateUserById(${user.email}) failed: ${error.message}`,
        )
      }

      await client
        .from('profiles')
        .update({ username: user.username, name: user.fullName })
        .eq('id', existing.id)

      continue
    }

    const { error } = await client.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: metadata,
    })
    if (error) {
      throw new Error(`createUser(${user.email}) failed: ${error.message}`)
    }
  }
}

export { TEST_PASSWORD, listTestUsers }
