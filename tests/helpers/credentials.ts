/**
 * Shared local/test auth identities.
 * Passwords are for local Supabase only — never use in production.
 */

export type TestCredential = {
  id: string
  email: string
  username: string
  fullName: string
  password: string
}

/** Fixed local password used by seed-test-credentials. */
export const TEST_PASSWORD = process.env.TEST_AUTH_PASSWORD ?? 'password'

export const TEST_USERS = {
  emailUser: {
    id: '20000000-0000-4000-8000-000000000001',
    email: 'test-user@xolodojo.local',
    username: 'test_user',
    fullName: 'Test User',
    password: TEST_PASSWORD,
  },
  emailUserSecondary: {
    id: '20000000-0000-4000-8000-000000000002',
    email: 'test-user-2@xolodojo.local',
    username: 'test_user_2',
    fullName: 'Test User Two',
    password: TEST_PASSWORD,
  },
} as const satisfies Record<string, TestCredential>

export type TestUserKey = keyof typeof TEST_USERS

export function getTestUser(key: TestUserKey = 'emailUser'): TestCredential {
  return TEST_USERS[key]
}

export function listTestUsers(): TestCredential[] {
  return Object.values(TEST_USERS)
}
