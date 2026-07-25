import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function requiredEnv(name: string, fallbacks: string[] = []): string {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key]
    if (value) return value
  }
  throw new Error(
    `Missing ${name}. Copy .env.example → .env.local and fill Supabase URL/keys.`,
  )
}

export function getSupabaseUrl(): string {
  return requiredEnv('SUPABASE_URL', [
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
  ])
}

export function getAnonKey(): string {
  return requiredEnv('SUPABASE_ANON_KEY', [
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ])
}

export function getServiceRoleKey(): string {
  return requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
}

/** Anon client — subject to RLS. */
export function createAnonClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/** Service-role client — bypasses RLS. Local/test only. */
export function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/** Authenticated client for a user (password grant). Subject to RLS. */
export async function createAuthedClient(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createAnonClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`)
  }
  return client
}
