import { describe, expect, it } from 'vitest'

import { validateDisplayName, validateUsername } from '@/lib/username'
import { normalizeNfTokenId } from '@/utils/nfTokenId'
import {
  accountDisplayLabel,
  truncateWalletAddress,
} from '@/utils/userDisplayLabel'
import type { AuthUser } from '@/lib/authApi'

describe('validateUsername', () => {
  it('accepts valid usernames and normalizes to lowercase', () => {
    expect(validateUsername('Test_User')).toEqual({
      ok: true,
      normalized: 'test_user',
    })
  })

  it('rejects empty, short, and invalid usernames', () => {
    expect(validateUsername('').ok).toBe(false)
    expect(validateUsername('ab').ok).toBe(false)
    expect(validateUsername('bad name').ok).toBe(false)
  })
})

describe('validateDisplayName', () => {
  it('requires a non-empty name', () => {
    expect(validateDisplayName('  ').ok).toBe(false)
    expect(validateDisplayName('Xolo')).toEqual({
      ok: true,
      normalized: 'Xolo',
    })
  })
})

describe('normalizeNfTokenId', () => {
  it('trims whitespace and uppercases hex', () => {
    expect(normalizeNfTokenId('  abcd1234ef  ')).toBe('ABCD1234EF')
  })
})

describe('accountDisplayLabel', () => {
  it('prefers username, then name, then email local-part', () => {
    const base: AuthUser = { id: '1', createdAt: '2026-01-01T00:00:00.000Z' }
    expect(accountDisplayLabel({ ...base, username: 'xolo' })).toBe('xolo')
    expect(accountDisplayLabel({ ...base, name: 'Xolo Dojo' })).toBe('Xolo Dojo')
    expect(
      accountDisplayLabel({ ...base, email: 'hello@example.com' }),
    ).toBe('hello')
  })

  it('truncates long wallet addresses', () => {
    expect(truncateWalletAddress('rN7n7otQDd6FczFgLdlqtyMVrn3L')).toBe(
      'rN7n7o...rn3L',
    )
  })
})
