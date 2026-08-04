import assert from 'node:assert/strict'

import {
  LoginTicket,
  OAuth2Client,
  type TokenPayload,
  type VerifyIdTokenOptions,
} from 'google-auth-library'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalVerifiedServiceIdentity,
  createCanonicalLiveGoogleServiceIdentityVerifier,
} from '../security/canonical-service-identity-verifier'

const audience = 'https://reeditpro-api.example.run.app'
const principalEmail = 'reeditpro-dispatch@reeditpro.iam.gserviceaccount.com'
const rawToken = createPreflightToken()
let verifyCallCount = 0
const observedClients = new Set<OAuth2Client>()
let verificationBehavior: (
  options: VerifyIdTokenOptions,
) => Promise<LoginTicket> = async () => ticket(validPayload())

const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken
const patchedVerifyIdToken = async function (
  this: OAuth2Client,
  options: VerifyIdTokenOptions,
): Promise<LoginTicket> {
  verifyCallCount += 1
  observedClients.add(this)
  assert.equal(options.idToken, rawToken)
  assert.equal(options.audience, audience)
  assert.equal(options.maxExpiry, 65 * 60)
  return verificationBehavior(options)
}
OAuth2Client.prototype.verifyIdToken = patchedVerifyIdToken as unknown as
  typeof OAuth2Client.prototype.verifyIdToken

try {
  assertConfigurationDenied(() => createCanonicalLiveGoogleServiceIdentityVerifier({
    authenticationMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: 'not-a-service-account@example.com',
    expectedAudience: audience,
  }))
  assertConfigurationDenied(() => createCanonicalLiveGoogleServiceIdentityVerifier({
    authenticationMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: principalEmail,
    expectedAudience: ` ${audience}`,
  }))
  assertConfigurationDenied(() => createCanonicalLiveGoogleServiceIdentityVerifier({
    authenticationMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: principalEmail,
    expectedAudience: audience,
    verificationTimeoutMs: 31_000,
  }))

  const controllerVerifier = createCanonicalLiveGoogleServiceIdentityVerifier({
    authenticationMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: principalEmail,
    expectedAudience: audience,
  })
  const verifiedController = await controllerVerifier.verifyAuthorizationHeader(
    `Bearer ${rawToken}`,
  )
  const controllerEvidence = assertCanonicalVerifiedServiceIdentity(
    verifiedController,
  )
  assert.equal(controllerEvidence.verificationMode, 'trusted_google_identity_verifier')
  assert.equal(controllerEvidence.authenticationMechanism, 'google_oidc_id_token')
  assert.equal(controllerEvidence.verifierId, 'reeditpro-google-auth-library-v9')
  assert.equal(controllerEvidence.issuer, 'https://accounts.google.com')
  assert.equal(controllerEvidence.principalEmail, principalEmail)
  assert.equal(controllerEvidence.audience, audience)
  assert.equal(controllerEvidence.cryptographicSignatureVerified, true)
  assert.equal(controllerEvidence.liveGoogleVerificationPerformed, true)
  assert.equal(controllerEvidence.rawBearerTokenRetained, false)
  assert.equal(controllerEvidence.callerAuthoredClaimsAccepted, false)
  assert.equal(JSON.stringify(verifiedController), '{}')
  assert.equal(JSON.stringify(controllerEvidence).includes(rawToken), false)
  assertIdentityDenied(() => assertCanonicalVerifiedServiceIdentity({
    evidence: controllerEvidence,
  }))
  assertIdentityDenied(() => assertCanonicalVerifiedServiceIdentity(
    structuredClone(verifiedController),
  ))

  verificationBehavior = async () => ticket(validPayload({
    email: principalEmail.toUpperCase(),
  }))
  const normalizedEvidence = assertCanonicalVerifiedServiceIdentity(
    await controllerVerifier.verifyAuthorizationHeader(`bearer ${rawToken}`),
  )
  assert.equal(normalizedEvidence.principalEmail, principalEmail)
  assert.equal(observedClients.size, 1)

  verificationBehavior = async () => ticket(validPayload())
  const workerVerifier = createCanonicalLiveGoogleServiceIdentityVerifier({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    expectedPrincipalEmail: principalEmail,
    expectedAudience: audience,
  })
  const workerEvidence = assertCanonicalVerifiedServiceIdentity(
    await workerVerifier.verifyAuthorizationHeader(`Bearer ${rawToken}`),
  )
  assert.equal(
    workerEvidence.authenticationMechanism,
    'google_cloud_run_workload_identity',
  )
  assert.equal(observedClients.size, 2)

  for (const unsafeAuthorizationHeader of [
    undefined,
    '',
    `Basic ${rawToken}`,
    `Bearer  ${rawToken}`,
    `Bearer ${rawToken}, Bearer ${rawToken}`,
    ` Bearer ${rawToken}`,
    `Bearer ${rawToken} `,
    'Bearer only.two',
    `Bearer ${createPreflightToken({ alg: 'none' })}`,
    `Bearer ${createPreflightToken({ crit: ['kid'] })}`,
    `Bearer ${createPreflightToken({ jku: 'https://attacker.example/jwks' })}`,
    `Bearer ${createPreflightToken({}, Buffer.alloc(1, 1))}`,
    `Bearer ${'a'.repeat(17_000)}.${encodeJson({})}.${Buffer.alloc(256).toString('base64url')}`,
  ]) {
    const callsBefore = verifyCallCount
    await expectAuthDenied(() =>
      controllerVerifier.verifyAuthorizationHeader(unsafeAuthorizationHeader))
    assert.equal(verifyCallCount, callsBefore)
  }

  verificationBehavior = async () => {
    throw new Error(`upstream rejection containing ${rawToken}`)
  }
  await expectAuthDenied(() =>
    controllerVerifier.verifyAuthorizationHeader(`Bearer ${rawToken}`))

  verificationBehavior = async () => new LoginTicket()
  await expectAuthDenied(() =>
    controllerVerifier.verifyAuthorizationHeader(`Bearer ${rawToken}`))

  const nowSeconds = Math.floor(Date.now() / 1_000)
  for (const payloadOverrides of [
    { iss: 'accounts.google.com' },
    { aud: 'https://attacker.example' },
    { email: 'attacker@reeditpro.iam.gserviceaccount.com' },
    { email_verified: false },
    { sub: '' },
    { iat: nowSeconds + 30 },
    { exp: nowSeconds - 1 },
    { iat: nowSeconds - 4_000, exp: nowSeconds + 1 },
    { nbf: nowSeconds + 30 },
  ]) {
    verificationBehavior = async () => ticket(validPayload(payloadOverrides))
    await expectAuthDenied(() =>
      controllerVerifier.verifyAuthorizationHeader(`Bearer ${rawToken}`))
  }

  const timeoutVerifier = createCanonicalLiveGoogleServiceIdentityVerifier({
    authenticationMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: principalEmail,
    expectedAudience: audience,
    verificationTimeoutMs: 15,
  })
  verificationBehavior = () => new Promise<LoginTicket>(() => undefined)
  const timeoutStartedAt = Date.now()
  await expectAuthDenied(() =>
    timeoutVerifier.verifyAuthorizationHeader(`Bearer ${rawToken}`))
  assert.ok(Date.now() - timeoutStartedAt < 1_000)

  assert.equal(verifyCallCount > 3, true)
  console.log(JSON.stringify({
    ok: true,
    checks: [
      'server_owned_principal_audience_mechanism_lifetime_and_timeout_are_frozen_at_construction',
      'one_bounded_canonical_bearer_jwt_is_preflighted_before_google_key_lookup',
      'google_auth_library_verify_id_token_receives_exact_token_audience_and_lifetime',
      'one_google_auth_client_is_reused_per_verifier_for_library_owned_key_cache_and_rotation',
      'canonical_issuer_service_account_principal_audience_subject_iat_exp_nbf_and_lifetime_are_rechecked',
      'verified_identity_is_process_branded_nonserializable_and_retains_no_bearer_token',
      'malformed_duplicate_unsafe_header_and_jwt_inputs_fail_before_library_invocation',
      'library_rejection_missing_payload_claim_mismatch_and_timeout_fail_generically',
      'cloud_tasks_informational_headers_caller_claims_routes_iam_dispatch_and_execution_are_not_accepted_or_enabled',
    ],
    evidence: {
      adapterMode: controllerEvidence.verificationMode,
      adapterCryptographicEvidence: controllerEvidence.cryptographicSignatureVerified,
      productionFieldForSuccessfulOfficialVerification:
        controllerEvidence.liveGoogleVerificationPerformed,
      smokeGoogleVerifierMethodStubbed: true,
      liveGoogleTokenOrKeyFetchPerformedBySmoke: false,
      googleIamOrRouteIntegrationPerformed: false,
      rawBearerTokenRetained: controllerEvidence.rawBearerTokenRetained,
      callerAuthoredClaimsAccepted: controllerEvidence.callerAuthoredClaimsAccepted,
    },
  }))
} finally {
  OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken
}

function validPayload(
  overrides: Record<string, unknown> = {},
): TokenPayload {
  const nowSeconds = Math.floor(Date.now() / 1_000)
  return {
    iss: 'https://accounts.google.com',
    sub: '100000000000000000001',
    aud: audience,
    email: principalEmail,
    email_verified: true,
    iat: nowSeconds - 30,
    exp: nowSeconds + 30 * 60,
    ...overrides,
  } as TokenPayload
}

function ticket(payload: TokenPayload): LoginTicket {
  return new LoginTicket(undefined, payload)
}

function createPreflightToken(
  headerOverrides: Record<string, unknown> = {},
  signature = Buffer.alloc(256, 1),
): string {
  const header = {
    alg: 'RS256',
    kid: 'google-contract-key-20260717',
    typ: 'JWT',
    ...headerOverrides,
  }
  return [
    encodeJson(header),
    encodeJson({ fixture: 'untrusted-until-google-verification' }),
    signature.toString('base64url'),
  ].join('.')
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

async function expectAuthDenied(
  operation: () => Promise<unknown>,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, 'INTERNAL_SERVICE_AUTH_INVALID')
    assert.equal(error.status, 403)
    assert.equal(error.message, 'Trusted service identity verification failed.')
    assert.equal(error.message.includes(rawToken), false)
    assert.equal(error.message.includes(principalEmail), false)
    assert.equal(error.message.includes(audience), false)
    assert.equal(error.details, undefined)
    return true
  })
}

function assertConfigurationDenied(operation: () => unknown): void {
  assert.throws(operation, (error: unknown) =>
    error instanceof ApiError &&
    error.code === 'VALIDATION_FAILED' &&
    error.status === 400)
}

function assertIdentityDenied(operation: () => unknown): void {
  assert.throws(operation, (error: unknown) =>
    error instanceof ApiError &&
    error.code === 'INTERNAL_SERVICE_AUTH_INVALID' &&
    error.status === 403)
}
