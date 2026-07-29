import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { UploadTarget } from '../storage/storage-types'
import { credentialDigest } from './canonical-durable-upload-target-authority'

export const CANONICAL_UPLOAD_TARGET_CREDENTIAL_ENVELOPE_VERSION =
  'canonical-upload-target-credential-envelope-v1' as const
export const CANONICAL_UPLOAD_TARGET_LOCAL_KEY_WRAP_CAPABILITY_VERSION =
  'canonical-upload-target-local-key-wrap-capability-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const boundedBase64 = z.string().min(4).max(128 * 1024)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u)

const normalizedUploadTargetSchema = z.object({
  uploadMethod: z.enum(['PUT', 'POST']),
  uploadUrl: z.string().min(1).max(16 * 1024).refine(isAllowedUploadUrl),
  uploadHeaders: z.record(
    z.string().trim().min(1).max(256).regex(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u),
    z.string().max(8 * 1024),
  ).superRefine((headers, context) => {
    const names = Object.keys(headers)
    if (names.length > 64) {
      context.addIssue({ code: 'custom', message: 'Too many upload-target headers.' })
    }
    if (names.some((name) => name.toLowerCase() === 'authorization')) {
      context.addIssue({ code: 'custom', message: 'Authorization headers are not escrowed.' })
    }
  }),
  expiresAt: timestamp,
  bucketName: identity,
  objectPath: z.string().trim().min(1).max(2_048)
    .refine((value) => !value.startsWith('/') && !value.includes('\\') && !value.includes('\0'))
    .refine((value) => value.split('/').every((part) => Boolean(part) && part !== '.' && part !== '..')),
  temporary: z.literal(true),
  createOnly: z.literal(true),
  uploadProtocol: z.enum(['single_put', 'gcs_resumable']),
  supportsResume: z.boolean(),
  recommendedChunkSizeBytes: z.number().int().positive().max(1024 ** 3)
    .refine(Number.isSafeInteger).nullable(),
  sessionUriIsCredential: z.literal(true),
}).strict().superRefine((target, context) => {
  if (
    (target.uploadProtocol === 'gcs_resumable' && !target.supportsResume) ||
    (target.uploadProtocol === 'single_put' && target.supportsResume)
  ) context.addIssue({ code: 'custom', message: 'Upload protocol and resume support diverge.' })
})

const encryptedEnvelopePayloadSchema = z.object({
  schemaVersion: z.literal(CANONICAL_UPLOAD_TARGET_CREDENTIAL_ENVELOPE_VERSION),
  contentEncryptionAlgorithm: z.literal('aes-256-gcm'),
  keyWrapAlgorithm: z.literal('aes-256-gcm-local-proof'),
  keyReferenceDigestSha256: sha256,
  payloadCiphertextBase64: boundedBase64,
  payloadIvBase64: boundedBase64,
  payloadAuthTagBase64: boundedBase64,
  wrappedDataKeyBase64: boundedBase64,
  keyWrapIvBase64: boundedBase64,
  keyWrapAuthTagBase64: boundedBase64,
  associatedDataDigestSha256: sha256,
  plaintextDigestSha256: sha256,
})

export const canonicalUploadTargetCredentialEncryptedEnvelopeSchema =
  encryptedEnvelopePayloadSchema.extend({
    envelopeDigestSha256: sha256,
  }).strict()

export type CanonicalUploadTargetCredentialEncryptedEnvelope = z.infer<
  typeof canonicalUploadTargetCredentialEncryptedEnvelopeSchema
>

const keyWrapDescriptorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_UPLOAD_TARGET_LOCAL_KEY_WRAP_CAPABILITY_VERSION),
  implementationClass: z.literal('local_test_process_key_wrap_fixture'),
  keyReferenceDigestSha256: sha256,
  algorithm: z.literal('aes-256-gcm-local-proof'),
  keyMaterialPersisted: z.literal(false),
  localOnly: z.literal(true),
  cloudKmsVerified: z.literal(false),
  workloadIdentityVerified: z.literal(false),
  multiReplicaKeyAvailabilityVerified: z.literal(false),
  productionAuthority: z.literal(false),
  descriptorHash: sha256,
}).strict()

export type CanonicalUploadTargetLocalKeyWrapDescriptor = z.infer<
  typeof keyWrapDescriptorSchema
>

export interface CanonicalUploadTargetCredentialKeyWrapCapability {
  readonly descriptor: CanonicalUploadTargetLocalKeyWrapDescriptor
  wrapDataKey(input: {
    readonly dataKey: Uint8Array
    readonly associatedData: Uint8Array
  }): Promise<{
    readonly wrappedDataKeyBase64: string
    readonly keyWrapIvBase64: string
    readonly keyWrapAuthTagBase64: string
  }>
  unwrapDataKey(input: {
    readonly wrappedDataKeyBase64: string
    readonly keyWrapIvBase64: string
    readonly keyWrapAuthTagBase64: string
    readonly associatedData: Uint8Array
  }): Promise<Uint8Array>
}

const keyWrapBrands = new WeakSet<object>()

export function createLocalCanonicalUploadTargetCredentialKeyWrapCapability(input: {
  readonly keyVersionId: string
  readonly keyMaterial: Uint8Array
}): CanonicalUploadTargetCredentialKeyWrapCapability {
  const keyVersionId = identity.parse(input.keyVersionId)
  if (!(input.keyMaterial instanceof Uint8Array) || input.keyMaterial.byteLength !== 32) {
    throw escrowError('local_key_wrap_material_invalid')
  }
  const key = Buffer.from(input.keyMaterial)
  const descriptorPayload = {
    schemaVersion: CANONICAL_UPLOAD_TARGET_LOCAL_KEY_WRAP_CAPABILITY_VERSION,
    implementationClass: 'local_test_process_key_wrap_fixture' as const,
    keyReferenceDigestSha256: sha256AuthorityValue({
      domain: 'canonical_upload_target_local_key_reference_v1',
      keyVersionId,
    }),
    algorithm: 'aes-256-gcm-local-proof' as const,
    keyMaterialPersisted: false as const,
    localOnly: true as const,
    cloudKmsVerified: false as const,
    workloadIdentityVerified: false as const,
    multiReplicaKeyAvailabilityVerified: false as const,
    productionAuthority: false as const,
  }
  const descriptor = Object.freeze(keyWrapDescriptorSchema.parse({
    ...descriptorPayload,
    descriptorHash: sha256AuthorityValue(descriptorPayload),
  }))
  const capability: CanonicalUploadTargetCredentialKeyWrapCapability = {
    descriptor,
    async wrapDataKey({ dataKey, associatedData }) {
      assertCanonicalUploadTargetCredentialKeyWrapCapability(capability)
      if (!(dataKey instanceof Uint8Array) || dataKey.byteLength !== 32) {
        throw escrowError('data_key_invalid')
      }
      assertAssociatedData(associatedData)
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      cipher.setAAD(Buffer.from(associatedData))
      const wrapped = Buffer.concat([
        cipher.update(Buffer.from(dataKey)),
        cipher.final(),
      ])
      const authTag = cipher.getAuthTag()
      return Object.freeze({
        wrappedDataKeyBase64: wrapped.toString('base64'),
        keyWrapIvBase64: iv.toString('base64'),
        keyWrapAuthTagBase64: authTag.toString('base64'),
      })
    },
    async unwrapDataKey({
      wrappedDataKeyBase64,
      keyWrapIvBase64,
      keyWrapAuthTagBase64,
      associatedData,
    }) {
      assertCanonicalUploadTargetCredentialKeyWrapCapability(capability)
      assertAssociatedData(associatedData)
      try {
        const wrapped = decodeBase64(wrappedDataKeyBase64, 32, 'wrapped_data_key')
        const iv = decodeBase64(keyWrapIvBase64, 12, 'key_wrap_iv')
        const authTag = decodeBase64(keyWrapAuthTagBase64, 16, 'key_wrap_auth_tag')
        const decipher = createDecipheriv('aes-256-gcm', key, iv)
        decipher.setAAD(Buffer.from(associatedData))
        decipher.setAuthTag(authTag)
        const dataKey = Buffer.concat([decipher.update(wrapped), decipher.final()])
        if (dataKey.byteLength !== 32) throw escrowError('unwrapped_data_key_invalid')
        return dataKey
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw escrowError('data_key_unwrap_failed')
      }
    },
  }
  Object.freeze(capability)
  keyWrapBrands.add(capability)
  return capability
}

export function assertCanonicalUploadTargetCredentialKeyWrapCapability(
  value: unknown,
): asserts value is CanonicalUploadTargetCredentialKeyWrapCapability {
  if (!value || typeof value !== 'object' || !keyWrapBrands.has(value)) {
    throw escrowError('key_wrap_capability_not_process_branded')
  }
  const capability = value as CanonicalUploadTargetCredentialKeyWrapCapability
  const parsed = keyWrapDescriptorSchema.safeParse(capability.descriptor)
  if (!parsed.success) throw escrowError('key_wrap_descriptor_invalid')
  const { descriptorHash, ...payload } = parsed.data
  if (
    descriptorHash !== sha256AuthorityValue(payload) ||
    typeof capability.wrapDataKey !== 'function' ||
    typeof capability.unwrapDataKey !== 'function'
  ) throw escrowError('key_wrap_capability_invalid')
}

export async function encryptCanonicalUploadTargetCredential(input: {
  readonly recordId: string
  readonly uploadIntentId: string
  readonly attemptId: string
  readonly credentialDigestSha256: string
  readonly expiresAt: string
  readonly target: UploadTarget
  readonly keyWrapCapability: CanonicalUploadTargetCredentialKeyWrapCapability
}): Promise<CanonicalUploadTargetCredentialEncryptedEnvelope> {
  assertCanonicalUploadTargetCredentialKeyWrapCapability(input.keyWrapCapability)
  const context = parseEnvelopeContext(input)
  const target = normalizeUploadTarget(input.target)
  if (
    target.expiresAt !== context.expiresAt ||
    credentialDigest(toUploadTarget(target)) !== context.credentialDigestSha256
  ) throw escrowError('credential_target_digest_or_expiry_mismatch')

  const plaintextValue = {
    schemaVersion: 'canonical-upload-target-credential-plaintext-v1' as const,
    target,
  }
  const plaintext = Buffer.from(canonicalJson(plaintextValue), 'utf8')
  if (plaintext.byteLength > 64 * 1024) throw escrowError('credential_plaintext_too_large')
  const plaintextDigestSha256 = sha256AuthorityValue(plaintextValue)
  const associatedData = envelopeAssociatedData(context, plaintextDigestSha256)
  const associatedDataDigestSha256 = sha256Buffer(associatedData)
  const dataKey = randomBytes(32)
  try {
    const payloadIv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', dataKey, payloadIv)
    cipher.setAAD(associatedData)
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const payloadAuthTag = cipher.getAuthTag()
    const wrapped = await input.keyWrapCapability.wrapDataKey({
      dataKey,
      associatedData,
    })
    const envelopePayload = encryptedEnvelopePayloadSchema.parse({
      schemaVersion: CANONICAL_UPLOAD_TARGET_CREDENTIAL_ENVELOPE_VERSION,
      contentEncryptionAlgorithm: 'aes-256-gcm',
      keyWrapAlgorithm: input.keyWrapCapability.descriptor.algorithm,
      keyReferenceDigestSha256:
        input.keyWrapCapability.descriptor.keyReferenceDigestSha256,
      payloadCiphertextBase64: ciphertext.toString('base64'),
      payloadIvBase64: payloadIv.toString('base64'),
      payloadAuthTagBase64: payloadAuthTag.toString('base64'),
      ...wrapped,
      associatedDataDigestSha256,
      plaintextDigestSha256,
    })
    return Object.freeze(canonicalUploadTargetCredentialEncryptedEnvelopeSchema.parse({
      ...envelopePayload,
      envelopeDigestSha256: sha256AuthorityValue(envelopePayload),
    }))
  } finally {
    dataKey.fill(0)
    plaintext.fill(0)
  }
}

export async function decryptCanonicalUploadTargetCredential(input: {
  readonly recordId: string
  readonly uploadIntentId: string
  readonly attemptId: string
  readonly credentialDigestSha256: string
  readonly expiresAt: string
  readonly envelope: CanonicalUploadTargetCredentialEncryptedEnvelope
  readonly keyWrapCapability: CanonicalUploadTargetCredentialKeyWrapCapability
}): Promise<UploadTarget> {
  assertCanonicalUploadTargetCredentialKeyWrapCapability(input.keyWrapCapability)
  const context = parseEnvelopeContext(input)
  const envelope = canonicalUploadTargetCredentialEncryptedEnvelopeSchema.parse(input.envelope)
  const { envelopeDigestSha256, ...envelopePayload } = envelope
  if (
    envelopeDigestSha256 !== sha256AuthorityValue(envelopePayload) ||
    envelope.keyReferenceDigestSha256 !==
      input.keyWrapCapability.descriptor.keyReferenceDigestSha256
  ) throw escrowError('credential_envelope_identity_invalid')
  const associatedData = envelopeAssociatedData(context, envelope.plaintextDigestSha256)
  if (envelope.associatedDataDigestSha256 !== sha256Buffer(associatedData)) {
    throw escrowError('credential_envelope_associated_data_invalid')
  }

  const dataKey = Buffer.from(await input.keyWrapCapability.unwrapDataKey({
    wrappedDataKeyBase64: envelope.wrappedDataKeyBase64,
    keyWrapIvBase64: envelope.keyWrapIvBase64,
    keyWrapAuthTagBase64: envelope.keyWrapAuthTagBase64,
    associatedData,
  }))
  let plaintext: Buffer | undefined
  try {
    const payloadIv = decodeBase64(envelope.payloadIvBase64, 12, 'payload_iv')
    const payloadAuthTag = decodeBase64(
      envelope.payloadAuthTagBase64,
      16,
      'payload_auth_tag',
    )
    const ciphertext = decodeBase64(
      envelope.payloadCiphertextBase64,
      undefined,
      'payload_ciphertext',
    )
    const decipher = createDecipheriv('aes-256-gcm', dataKey, payloadIv)
    decipher.setAAD(associatedData)
    decipher.setAuthTag(payloadAuthTag)
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    const parsed = JSON.parse(plaintext.toString('utf8')) as unknown
    const plaintextSchema = z.object({
      schemaVersion: z.literal('canonical-upload-target-credential-plaintext-v1'),
      target: normalizedUploadTargetSchema,
    }).strict()
    const value = plaintextSchema.parse(parsed)
    if (
      envelope.plaintextDigestSha256 !== sha256AuthorityValue(value) ||
      value.target.expiresAt !== context.expiresAt ||
      credentialDigest(toUploadTarget(value.target)) !== context.credentialDigestSha256
    ) throw escrowError('decrypted_credential_lineage_invalid')
    return toUploadTarget(value.target)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw escrowError('credential_envelope_decryption_failed')
  } finally {
    dataKey.fill(0)
    plaintext?.fill(0)
  }
}

export function normalizeCanonicalUploadTargetCredential(
  target: UploadTarget,
): UploadTarget {
  return toUploadTarget(normalizeUploadTarget(target))
}

function normalizeUploadTarget(target: UploadTarget): z.infer<
  typeof normalizedUploadTargetSchema
> {
  return normalizedUploadTargetSchema.parse({
    uploadMethod: target.uploadMethod,
    uploadUrl: target.uploadUrl,
    uploadHeaders: Object.fromEntries(
      Object.entries(target.uploadHeaders)
        .map(([name, value]) => [name.toLowerCase(), value] as const)
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
    expiresAt: target.expiresAt,
    bucketName: target.bucketName,
    objectPath: target.objectPath,
    temporary: target.temporary,
    createOnly: target.createOnly,
    uploadProtocol: target.uploadProtocol ?? 'single_put',
    supportsResume: target.supportsResume ?? false,
    recommendedChunkSizeBytes: target.recommendedChunkSizeBytes ?? null,
    sessionUriIsCredential: target.sessionUriIsCredential ?? true,
  })
}

function toUploadTarget(
  target: z.infer<typeof normalizedUploadTargetSchema>,
): UploadTarget {
  return {
    ...structuredClone(target),
    ...(target.recommendedChunkSizeBytes === null
      ? { recommendedChunkSizeBytes: undefined }
      : { recommendedChunkSizeBytes: target.recommendedChunkSizeBytes }),
  }
}

function parseEnvelopeContext(input: {
  readonly recordId: string
  readonly uploadIntentId: string
  readonly attemptId: string
  readonly credentialDigestSha256: string
  readonly expiresAt: string
}) {
  return z.object({
    recordId: identity,
    uploadIntentId: identity,
    attemptId: identity,
    credentialDigestSha256: sha256,
    expiresAt: timestamp,
  }).strict().parse({
    recordId: input.recordId,
    uploadIntentId: input.uploadIntentId,
    attemptId: input.attemptId,
    credentialDigestSha256: input.credentialDigestSha256,
    expiresAt: input.expiresAt,
  })
}

function envelopeAssociatedData(
  context: ReturnType<typeof parseEnvelopeContext>,
  plaintextDigestSha256: string,
): Buffer {
  return Buffer.from(canonicalJson({
    schemaVersion: 'canonical-upload-target-credential-aad-v1',
    ...context,
    plaintextDigestSha256,
  }), 'utf8')
}

function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value !== 'object') throw escrowError('canonical_json_value_invalid')
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  ).join(',')}}`
}

function decodeBase64(value: string, exactBytes: number | undefined, label: string): Buffer {
  if (!boundedBase64.safeParse(value).success) throw escrowError(`${label}_base64_invalid`)
  const decoded = Buffer.from(value, 'base64')
  if (
    decoded.byteLength === 0 ||
    (exactBytes !== undefined && decoded.byteLength !== exactBytes) ||
    decoded.toString('base64') !== value
  ) throw escrowError(`${label}_bytes_invalid`)
  return decoded
}

function assertAssociatedData(value: Uint8Array): void {
  if (!(value instanceof Uint8Array) || value.byteLength < 32 || value.byteLength > 16 * 1024) {
    throw escrowError('key_wrap_associated_data_invalid')
  }
}

function sha256Buffer(value: Uint8Array): string {
  return sha256AuthorityValue({
    schemaVersion: 'canonical-upload-target-byte-digest-v1',
    bytesBase64: Buffer.from(value).toString('base64'),
  })
}

function isAllowedUploadUrl(value: string): boolean {
  if (value.startsWith('/')) {
    const match = value.match(
      /^\/v1\/upload-intents\/([A-Za-z0-9][A-Za-z0-9._:@-]{0,239})\/local-object\?workspaceId=([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/u,
    )
    return Boolean(match?.[1] && !match[1].includes('..'))
  }
  try {
    const url = new URL(value)
    if (url.username || url.password || url.hash) return false
    return url.protocol === 'https:' ||
      (
        url.protocol === 'http:' &&
        (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
      )
  } catch {
    return false
  }
}

function escrowError(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Temporary upload-target credential escrow verification failed.',
    503,
    {
      reason,
      rawCredentialLoggedOrStoredInCanonicalDatabase: false,
      liveCloudKmsVerified: false,
      productionAuthority: false,
    },
  )
}
