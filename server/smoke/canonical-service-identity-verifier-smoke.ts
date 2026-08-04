import assert from 'node:assert/strict'
import {
  generateKeyPairSync,
  sign,
  type KeyObject,
} from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalVerifiedServiceIdentity,
  createCanonicalPrivateServiceIdentityFixture,
  createCanonicalTrustedJwksContractSnapshot,
  createCanonicalTrustedJwksContractVerifier,
} from '../security/canonical-service-identity-verifier'

const nowMs = Date.parse('2026-07-17T07:00:00.000Z')
const nowSeconds = Math.floor(nowMs / 1_000)
const issuer = 'https://accounts.google.com'
const audience = 'https://reeditpro-api.example.run.app'
const principalEmail = 'reeditpro-dispatch@reeditpro.iam.gserviceaccount.com'
const kid = 'reeditpro-contract-key-20260717'
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2_048,
  publicExponent: 0x10001,
})
const exportedJwk = publicKey.export({ format: 'jwk' })
assert.equal(exportedJwk.kty, 'RSA')
assert.ok(exportedJwk.n)
assert.ok(exportedJwk.e)

const snapshot = createCanonicalTrustedJwksContractSnapshot({
  keySetId: 'reeditpro-contract-jwks-20260717',
  fetchedAt: new Date(nowMs - 60_000).toISOString(),
  expiresAt: new Date(nowMs + 60 * 60_000).toISOString(),
  keys: [{
    kty: 'RSA',
    kid,
    alg: 'RS256',
    use: 'sig',
    n: exportedJwk.n,
    e: exportedJwk.e,
  }],
})
const verifier = createCanonicalTrustedJwksContractVerifier({
  snapshot,
  now: () => new Date(nowMs),
})
const validToken = createToken()
const verifiedController = verifier.verify({
  idToken: validToken,
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
})
const controllerEvidence = assertCanonicalVerifiedServiceIdentity(
  verifiedController,
)
assert.equal(controllerEvidence.verificationMode, 'trusted_jwks_contract_fixture')
assert.equal(controllerEvidence.cryptographicSignatureVerified, true)
assert.equal(controllerEvidence.liveGoogleVerificationPerformed, false)
assert.equal(controllerEvidence.principalEmail, principalEmail)
assert.equal(controllerEvidence.audience, audience)
assert.equal(controllerEvidence.rawBearerTokenRetained, false)
assert.equal(JSON.stringify(verifiedController), '{}')
assert.equal(JSON.stringify(controllerEvidence).includes(validToken), false)

const verifiedWorker = verifier.verify({
  idToken: createToken({ sub: '100000000000000000002' }),
  authenticationMechanism: 'google_cloud_run_workload_identity',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
})
assert.equal(
  assertCanonicalVerifiedServiceIdentity(verifiedWorker).authenticationMechanism,
  'google_cloud_run_workload_identity',
)

const callerAuthoredClone = { evidence: controllerEvidence }
expectAuthDenied(() => assertCanonicalVerifiedServiceIdentity(callerAuthoredClone))
expectAuthDenied(() => assertCanonicalVerifiedServiceIdentity(
  structuredClone(verifiedController),
))

const privateFixture = createCanonicalPrivateServiceIdentityFixture({
  authenticationMechanism: 'google_oidc_id_token',
  subject: '100000000000000000003',
  principalEmail,
  audience,
  issuedAt: new Date(nowMs - 30_000).toISOString(),
  expiresAt: new Date(nowMs + 30_000).toISOString(),
  verifiedAt: new Date(nowMs).toISOString(),
})
assert.equal(
  assertCanonicalVerifiedServiceIdentity(privateFixture).verificationMode,
  'private_contract_fixture',
)

expectAuthDenied(() => verifier.verify({
  idToken: mutateSignature(validToken),
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
}))
expectAuthDenied(() => verifier.verify({
  idToken: createToken({}, { alg: 'none' }),
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
}))
expectAuthDenied(() => verifier.verify({
  idToken: createToken({}, { kid: 'unknown-key' }),
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
}))
expectAuthDenied(() => verifier.verify({
  idToken: createToken({}, { jku: 'https://attacker.example/jwks.json' }),
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
}))
for (const payload of [
  { iss: 'https://attacker.example' },
  { aud: 'https://attacker.example' },
  { email: 'attacker@reeditpro.iam.gserviceaccount.com' },
  { email_verified: false },
  { exp: nowSeconds - 1 },
  { iat: nowSeconds + 1 },
  { iat: nowSeconds - 4_000, exp: nowSeconds + 1 },
  { nbf: nowSeconds + 1 },
]) {
  expectAuthDenied(() => verifier.verify({
    idToken: createToken(payload),
    authenticationMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: principalEmail,
    expectedAudience: audience,
  }))
}

const staleVerifier = createCanonicalTrustedJwksContractVerifier({
  snapshot,
  now: () => new Date(nowMs + 61 * 60_000),
})
expectAuthDenied(() => staleVerifier.verify({
  idToken: validToken,
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
}))

const {
  privateKey: nonStandardExponentPrivateKey,
  publicKey: nonStandardExponentPublicKey,
} = generateKeyPairSync('rsa', {
  modulusLength: 2_048,
  publicExponent: 3,
})
const nonStandardExponentJwk = nonStandardExponentPublicKey.export({
  format: 'jwk',
})
assert.ok(nonStandardExponentJwk.n)
assert.ok(nonStandardExponentJwk.e)
const nonStandardExponentVerifier = createCanonicalTrustedJwksContractVerifier({
  snapshot: createCanonicalTrustedJwksContractSnapshot({
    keySetId: 'reeditpro-nonstandard-exponent-jwks-20260717',
    fetchedAt: new Date(nowMs - 60_000).toISOString(),
    expiresAt: new Date(nowMs + 60 * 60_000).toISOString(),
    keys: [{
      kty: 'RSA',
      kid,
      alg: 'RS256',
      use: 'sig',
      n: nonStandardExponentJwk.n,
      e: nonStandardExponentJwk.e,
    }],
  }),
  now: () => new Date(nowMs),
})
expectAuthDenied(() => nonStandardExponentVerifier.verify({
  idToken: createToken({}, {}, nonStandardExponentPrivateKey),
  authenticationMechanism: 'google_oidc_id_token',
  expectedPrincipalEmail: principalEmail,
  expectedAudience: audience,
}))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'rs256_signature_verified_against_server_owned_bounded_jwks_snapshot',
    'issuer_audience_service_account_email_subject_iat_exp_nbf_and_lifetime_checked',
    'unknown_kid_none_algorithm_embedded_key_source_and_signature_tamper_rejected',
    'rsa_modulus_and_standard_public_exponent_are_required',
    'caller_authored_json_and_structured_clone_cannot_recreate_process_identity_brand',
    'verified_identity_serializes_to_empty_object_and_retains_no_bearer_token',
    'controller_oidc_and_worker_workload_identity_mechanisms_are_distinct',
    'stale_jwks_snapshot_fails_closed_without_network_fetch',
    'live_google_jwks_iam_cloud_tasks_cloud_run_and_production_remain_false',
  ],
  evidence: {
    verificationMode: controllerEvidence.verificationMode,
    cryptographicSignatureVerified:
      controllerEvidence.cryptographicSignatureVerified,
    liveGoogleVerificationPerformed:
      controllerEvidence.liveGoogleVerificationPerformed,
    rawBearerTokenRetained: controllerEvidence.rawBearerTokenRetained,
    callerAuthoredClaimsAccepted: controllerEvidence.callerAuthoredClaimsAccepted,
    snapshotKeyCount: snapshot.keys.length,
    snapshotLiveGoogleJwksFetchPerformed:
      snapshot.liveGoogleJwksFetchPerformed,
  },
}))

function createToken(
  payloadOverrides: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {},
  signingKey: KeyObject = privateKey,
): string {
  const header = {
    alg: 'RS256',
    kid,
    typ: 'JWT',
    ...headerOverrides,
  }
  const payload = {
    iss: issuer,
    sub: '100000000000000000001',
    aud: audience,
    email: principalEmail,
    email_verified: true,
    iat: nowSeconds - 30,
    exp: nowSeconds + 30 * 60,
    ...payloadOverrides,
  }
  const signingInput = `${encodeJson(header)}.${encodeJson(payload)}`
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(signingInput, 'ascii'),
    signingKey,
  ).toString('base64url')
  return `${signingInput}.${signature}`
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

function mutateSignature(token: string): string {
  const segments = token.split('.')
  const signature = segments[2]!
  const replacement = signature.endsWith('A') ? 'B' : 'A'
  segments[2] = `${signature.slice(0, -1)}${replacement}`
  return segments.join('.')
}

function expectAuthDenied(operation: () => unknown): void {
  assert.throws(operation, (error: unknown) =>
    error instanceof ApiError &&
    error.code === 'INTERNAL_SERVICE_AUTH_INVALID' &&
    !error.message.includes(validToken))
}
