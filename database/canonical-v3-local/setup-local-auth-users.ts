import assert from 'node:assert/strict'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const serviceRoleKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const users = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'owner-a@example.test',
    password: 'Canonical-V3-Browser-Only-2026!',
    displayName: 'Owner A',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'owner-b@example.test',
    password: 'Canonical-V3-Browser-Only-2026!',
    displayName: 'Owner B',
  },
] as const

for (const user of users) {
  const response = await fetch(`${endpointOrigin}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { display_name: user.displayName },
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const payload = await response.json().catch(() => null) as {
    id?: string
    user?: { id?: string }
    message?: string
    msg?: string
  } | null
  if (!response.ok) {
    throw new Error(
      `canonical_v3_local_auth_user_create_failed:${response.status}:${payload?.message ?? payload?.msg ?? 'unknown'}`,
    )
  }
  assert.equal(payload?.id ?? payload?.user?.id, user.id)
}

console.log(JSON.stringify({
  ok: true,
  localAuthUsersProvisioned: users.length,
  endpointClass: 'canonical_v3_loopback_only',
  remoteMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`canonical_v3_local_auth_environment_missing:${name}`)
  return value
}
