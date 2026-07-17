import {
  createPublicKey,
  verify as verifySignature,
  type JsonWebKey,
} from 'node:crypto'
import { TextDecoder } from 'node:util'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  CANONICAL_SERVICE_IDENTITY_EVIDENCE_VERSION,
  canonicalServiceIdentityEvidenceSchema,
  type CanonicalServiceIdentityEvidence,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_TRUSTED_JWKS_SNAPSHOT_VERSION =
  'canonical-trusted-jwks-snapshot-v1' as const

const GOOGLE_IDENTITY_ISSUER = 'https://accounts.google.com'
const PRIVATE_FIXTURE_VERIFIER_ID = 'reeditpro-private-contract-fixture'
const TRUSTED_JWKS_FIXTURE_VERIFIER_ID = 'reeditpro-trusted-jwks-contract-fixture'
const MAX_TOKEN_BYTES = 16 * 1024
const MAX_JWT_SEGMENT_BYTES = 12 * 1024
const MAX_JWKS_KEYS = 16
const DEFAULT_MAX_TOKEN_LIFETIME_SECONDS = 65 * 60
const utf8Decoder = new TextDecoder('utf-8', { fatal: true })
const verifiedIdentityBrands = new WeakSet<object>()

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const base64Url = z.string().min(1).max(8_192).regex(/^[A-Za-z0-9_-]+$/u)

const trustedJwkSchema = z.object({
  kty: z.literal('RSA'),
  kid: identity,
  alg: z.literal('RS256'),
  use: z.literal('sig'),
  n: base64Url,
  e: base64Url,
}).strict()

export const canonicalTrustedJwksSnapshotSchema = z.object({
  schemaVersion: z.literal(CANONICAL_TRUSTED_JWKS_SNAPSHOT_VERSION),
  source: z.literal('server_owned_trusted_jwks_contract_snapshot'),
  issuer: z.literal(GOOGLE_IDENTITY_ISSUER),
  keySetId: identity,
  fetchedAt: timestamp,
  expiresAt: timestamp,
  liveGoogleJwksFetchPerformed: z.literal(false),
  keys: z.array(trustedJwkSchema).min(1).max(MAX_JWKS_KEYS),
  snapshotHash: sha256,
}).strict().superRefine((snapshot, context) => {
  if (Date.parse(snapshot.expiresAt) <= Date.parse(snapshot.fetchedAt)) {
    context.addIssue({ code: 'custom', message: 'Trusted JWKS snapshot lifetime is invalid.' })
  }
  const keyIds = snapshot.keys.map((key) => key.kid)
  if (new Set(keyIds).size !== keyIds.length) {
    context.addIssue({ code: 'custom', message: 'Trusted JWKS snapshot key IDs are duplicated.' })
  }
})

const jwtHeaderSchema = z.object({
  alg: z.literal('RS256'),
  kid: identity,
  typ: z.literal('JWT').optional(),
}).passthrough().superRefine((header, context) => {
  const unsafeHeaders = ['crit', 'jku', 'jwk', 'x5u', 'x5c']
  if (unsafeHeaders.some((name) => Object.hasOwn(header, name))) {
    context.addIssue({ code: 'custom', message: 'JWT header contains an untrusted key source.' })
  }
})

const jwtPayloadSchema = z.object({
  iss: z.literal(GOOGLE_IDENTITY_ISSUER),
  sub: identity,
  aud: z.string().trim().min(1).max(1_024),
  email: z.string().email(),
  email_verified: z.literal(true),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  nbf: z.number().int().positive().optional(),
}).passthrough()

export type CanonicalTrustedJwksSnapshot = z.infer<
  typeof canonicalTrustedJwksSnapshotSchema
>

/**
 * Process-local capability returned only by a reviewed verifier or explicit
 * private fixture helper. It deliberately serializes to `{}` and loses its
 * authority across JSON parsing, structured cloning, or process boundaries.
 */
export interface CanonicalVerifiedServiceIdentity {
  readonly evidence: CanonicalServiceIdentityEvidence
}

export function createCanonicalTrustedJwksContractSnapshot(input: {
  keySetId: string
  fetchedAt: string
  expiresAt: string
  keys: Array<z.input<typeof trustedJwkSchema>>
}): CanonicalTrustedJwksSnapshot {
  const payload = {
    schemaVersion: CANONICAL_TRUSTED_JWKS_SNAPSHOT_VERSION,
    source: 'server_owned_trusted_jwks_contract_snapshot' as const,
    issuer: GOOGLE_IDENTITY_ISSUER,
    keySetId: input.keySetId,
    fetchedAt: input.fetchedAt,
    expiresAt: input.expiresAt,
    liveGoogleJwksFetchPerformed: false as const,
    keys: input.keys,
  }
  return assertTrustedJwksSnapshot({
    ...payload,
    snapshotHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalTrustedJwksContractVerifier(input: {
  snapshot: CanonicalTrustedJwksSnapshot
  now?: () => Date
  maxTokenLifetimeSeconds?: number
}) {
  const snapshot = assertTrustedJwksSnapshot(input.snapshot)
  const now = input.now ?? (() => new Date())
  const maxTokenLifetimeSeconds = boundedMaxTokenLifetimeSeconds(
    input.maxTokenLifetimeSeconds,
  )

  return Object.freeze({
    verify(request: {
      idToken: string
      authenticationMechanism:
        CanonicalServiceIdentityEvidence['authenticationMechanism']
      expectedPrincipalEmail: string
      expectedAudience: string
    }): CanonicalVerifiedServiceIdentity {
      try {
        const verifiedAt = now()
        if (!Number.isFinite(verifiedAt.getTime())) throw new Error('Invalid verifier clock.')
        const verifiedAtMs = verifiedAt.getTime()
        if (
          verifiedAtMs < Date.parse(snapshot.fetchedAt) ||
          verifiedAtMs >= Date.parse(snapshot.expiresAt)
        ) throw new Error('Trusted JWKS snapshot is stale.')

        const parsed = parseJwt(request.idToken)
        const header = jwtHeaderSchema.parse(parsed.header)
        const key = snapshot.keys.find((candidate) => candidate.kid === header.kid)
        if (!key) throw new Error('JWT signing key is not trusted.')
        const publicKey = createPublicKey({
          key: {
            kty: key.kty,
            n: key.n,
            e: key.e,
            alg: key.alg,
            use: key.use,
            kid: key.kid,
          } satisfies JsonWebKey,
          format: 'jwk',
        })
        if (
          publicKey.asymmetricKeyType !== 'rsa' ||
          (publicKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2_048 ||
          publicKey.asymmetricKeyDetails?.publicExponent !== 65_537n ||
          !verifySignature(
            'RSA-SHA256',
            Buffer.from(parsed.signingInput, 'ascii'),
            publicKey,
            parsed.signature,
          )
        ) throw new Error('JWT signature is invalid.')

        const payload = jwtPayloadSchema.parse(parsed.payload)
        const issuedAtMs = payload.iat * 1_000
        const expiresAtMs = payload.exp * 1_000
        if (
          payload.aud !== request.expectedAudience ||
          payload.email !== request.expectedPrincipalEmail ||
          issuedAtMs > verifiedAtMs ||
          expiresAtMs <= verifiedAtMs ||
          expiresAtMs <= issuedAtMs ||
          payload.exp - payload.iat > maxTokenLifetimeSeconds ||
          (payload.nbf !== undefined && payload.nbf * 1_000 > verifiedAtMs)
        ) throw new Error('JWT claims do not match receiver authority.')

        const evidencePayload = {
          schemaVersion: CANONICAL_SERVICE_IDENTITY_EVIDENCE_VERSION,
          source: 'trusted_service_identity_verifier_output' as const,
          verificationMode: 'trusted_jwks_contract_fixture' as const,
          authenticationMechanism: request.authenticationMechanism,
          verifierId: TRUSTED_JWKS_FIXTURE_VERIFIER_ID,
          issuer: payload.iss,
          subject: payload.sub,
          principalEmail: payload.email,
          audience: payload.aud,
          issuedAt: new Date(issuedAtMs).toISOString(),
          expiresAt: new Date(expiresAtMs).toISOString(),
          verifiedAt: verifiedAt.toISOString(),
          emailVerified: true as const,
          issuerVerified: true as const,
          audienceVerified: true as const,
          expiryVerified: true as const,
          cryptographicSignatureVerified: true,
          liveGoogleVerificationPerformed: false,
          rawBearerTokenRetained: false as const,
          callerAuthoredClaimsAccepted: false as const,
        }
        return brandVerifiedIdentity(canonicalServiceIdentityEvidenceSchema.parse({
          ...evidencePayload,
          evidenceHash: sha256AuthorityValue(evidencePayload),
        }))
      } catch {
        throw serviceIdentityDenied()
      }
    },
  })
}

export function createCanonicalPrivateServiceIdentityFixture(input: {
  authenticationMechanism:
    CanonicalServiceIdentityEvidence['authenticationMechanism']
  subject: string
  principalEmail: string
  audience: string
  issuedAt: string
  expiresAt: string
  verifiedAt: string
}): CanonicalVerifiedServiceIdentity {
  const payload = {
    schemaVersion: CANONICAL_SERVICE_IDENTITY_EVIDENCE_VERSION,
    source: 'trusted_service_identity_verifier_output' as const,
    verificationMode: 'private_contract_fixture' as const,
    authenticationMechanism: input.authenticationMechanism,
    verifierId: PRIVATE_FIXTURE_VERIFIER_ID,
    issuer: GOOGLE_IDENTITY_ISSUER,
    subject: input.subject,
    principalEmail: input.principalEmail,
    audience: input.audience,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    verifiedAt: input.verifiedAt,
    emailVerified: true as const,
    issuerVerified: true as const,
    audienceVerified: true as const,
    expiryVerified: true as const,
    cryptographicSignatureVerified: false,
    liveGoogleVerificationPerformed: false,
    rawBearerTokenRetained: false as const,
    callerAuthoredClaimsAccepted: false as const,
  }
  return brandVerifiedIdentity(canonicalServiceIdentityEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalVerifiedServiceIdentity(
  value: unknown,
): CanonicalServiceIdentityEvidence {
  if (
    !value || typeof value !== 'object' ||
    !verifiedIdentityBrands.has(value) ||
    !Object.hasOwn(value, 'evidence')
  ) throw serviceIdentityDenied()
  const evidence = (value as CanonicalVerifiedServiceIdentity).evidence
  const parsed = canonicalServiceIdentityEvidenceSchema.safeParse(evidence)
  if (!parsed.success) throw serviceIdentityDenied()
  return parsed.data
}

function assertTrustedJwksSnapshot(value: unknown): CanonicalTrustedJwksSnapshot {
  const parsed = canonicalTrustedJwksSnapshotSchema.safeParse(value)
  if (!parsed.success) throw serviceIdentityDenied()
  const { snapshotHash, ...payload } = parsed.data
  if (snapshotHash !== sha256AuthorityValue(payload)) throw serviceIdentityDenied()
  return parsed.data
}

function brandVerifiedIdentity(
  evidence: CanonicalServiceIdentityEvidence,
): CanonicalVerifiedServiceIdentity {
  const value = Object.create(null) as CanonicalVerifiedServiceIdentity
  Object.defineProperty(value, 'evidence', {
    value: Object.freeze({ ...evidence }),
    enumerable: false,
    configurable: false,
    writable: false,
  })
  Object.freeze(value)
  verifiedIdentityBrands.add(value)
  return value
}

function parseJwt(value: string): {
  header: unknown
  payload: unknown
  signingInput: string
  signature: Buffer
} {
  if (
    typeof value !== 'string' || value.length < 1 ||
    Buffer.byteLength(value, 'utf8') > MAX_TOKEN_BYTES ||
    value.trim() !== value
  ) throw new Error('JWT envelope is invalid.')
  const segments = value.split('.')
  if (segments.length !== 3) throw new Error('JWT segment count is invalid.')
  const [encodedHeader, encodedPayload, encodedSignature] = segments
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('JWT segment is empty.')
  }
  const headerBytes = decodeBase64Url(encodedHeader)
  const payloadBytes = decodeBase64Url(encodedPayload)
  const signature = decodeBase64Url(encodedSignature)
  if (
    headerBytes.length > MAX_JWT_SEGMENT_BYTES ||
    payloadBytes.length > MAX_JWT_SEGMENT_BYTES ||
    signature.length < 256 || signature.length > 512
  ) throw new Error('JWT segment size is invalid.')
  return {
    header: JSON.parse(utf8Decoder.decode(headerBytes)),
    payload: JSON.parse(utf8Decoder.decode(payloadBytes)),
    signingInput: `${encodedHeader}.${encodedPayload}`,
    signature,
  }
}

function decodeBase64Url(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('JWT encoding is invalid.')
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.toString('base64url') !== value) throw new Error('JWT encoding is not canonical.')
  return decoded
}

function boundedMaxTokenLifetimeSeconds(value: number | undefined): number {
  const resolved = value ?? DEFAULT_MAX_TOKEN_LIFETIME_SECONDS
  if (!Number.isInteger(resolved) || resolved < 60 || resolved > 24 * 60 * 60) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical service identity maximum token lifetime is invalid.',
      400,
    )
  }
  return resolved
}

function serviceIdentityDenied(): ApiError {
  return new ApiError(
    'INTERNAL_SERVICE_AUTH_INVALID',
    'Trusted service identity verification failed.',
    403,
  )
}
