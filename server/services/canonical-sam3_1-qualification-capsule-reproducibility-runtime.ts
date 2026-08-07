import { createHash } from 'node:crypto'

import { Storage, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31QualificationCapsuleReproducibility,
  assertCanonicalSam31QualificationCapsuleBuilderResult,
  assertCanonicalSam31QualificationCapsuleMalwareScan,
  canonicalSam31QualificationCapsuleReproducibilityStringify,
  canonicalSam31QualificationCapsuleReproducibilityRef,
  createCanonicalSam31QualificationCapsuleReproducibility,
  type CanonicalSam31QualificationCapsuleReproducibility,
} from '../model-artifacts/canonical-sam3_1-qualification-capsule-reproducibility'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_RUNTIME_VERSION =
  'canonical-sam3_1-qualification-capsule-reproducibility-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const INPUT_BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const INPUT_PREFIX =
  'private/image-build-inputs/sam3_1/qualification/reproducibility' as const
const RECEIPT_PREFIX =
  'private/sam3_1/qualification-capsule-reproducibility/v1' as const
const MAXIMUM_JSON_BYTES = 16 * 1024 * 1024
const buildIdSchema = z.string().uuid()
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export interface CanonicalSam31QualificationCapsuleReproducibilityRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_RUNTIME_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31QualificationCapsuleReproducibility
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly receiptRef: z.infer<typeof refSchema>
  }>
  reread(input: {
    readonly receiptRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31QualificationCapsuleReproducibility | null>
}

export function createCanonicalSam31QualificationCapsuleReproducibilityRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31QualificationCapsuleReproducibilityRepository {
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw new Error('SAM 3.1 capsule reproducibility repository is invalid.')
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_RUNTIME_VERSION,
    evidenceClass: 'private_create_only_exact_reread',
    async persistCreateOnly(untrusted: {
      readonly receipt: CanonicalSam31QualificationCapsuleReproducibility
    }) {
      assertPlainSerializedData(untrusted, 'sam31_capsule_reproducibility_persist')
      const receipt = assertCanonicalSam31QualificationCapsuleReproducibility(
        z.object({ receipt: z.unknown() }).strict().parse(untrusted).receipt,
      )
      const receiptRef = canonicalSam31QualificationCapsuleReproducibilityRef(
        receipt,
      )
      const body = Buffer.from(
        canonicalSam31QualificationCapsuleReproducibilityStringify(receipt),
        'utf8',
      )
      const path = receiptPath(receiptRef)
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: sha256(body),
      })
      const reread = await readReceipt(input.objectPort, path)
      if (
        !reread
        || canonicalSam31QualificationCapsuleReproducibilityStringify(
          reread,
        ) !== body.toString('utf8')
      ) {
        throw new Error('SAM 3.1 capsule reproducibility reread changed.')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        receiptRef,
      })
    },
    async reread(untrusted: {
      readonly receiptRef: z.infer<typeof refSchema>
    }) {
      assertPlainSerializedData(untrusted, 'sam31_capsule_reproducibility_reread')
      const { receiptRef } = z.object({ receiptRef: refSchema })
        .strict().parse(untrusted)
      const receipt = await readReceipt(
        input.objectPort,
        receiptPath(receiptRef),
      )
      if (!receipt) return null
      const actualRef = canonicalSam31QualificationCapsuleReproducibilityRef(
        receipt,
      )
      if (
        canonicalSam31QualificationCapsuleReproducibilityStringify(
          actualRef,
        ) !== canonicalSam31QualificationCapsuleReproducibilityStringify(
          receiptRef,
        )
      ) {
        throw new Error('SAM 3.1 capsule reproducibility reference changed.')
      }
      return structuredClone(receipt)
    },
  })
}

export async function publishCanonicalSam31QualificationCapsuleReproducibility(
  input: {
    readonly receiptId: string
    readonly primaryBuildId: string
    readonly confirmationBuildId: string
    readonly storage?: Storage
    readonly repository?:
      CanonicalSam31QualificationCapsuleReproducibilityRepository
  },
) {
  assertPlainSerializedData({
    receiptId: input.receiptId,
    primaryBuildId: input.primaryBuildId,
    confirmationBuildId: input.confirmationBuildId,
  }, 'sam31_capsule_reproducibility_publish')
  const receiptId = safeId.parse(input.receiptId)
  const primaryBuildId = buildIdSchema.parse(input.primaryBuildId)
  const confirmationBuildId = buildIdSchema.parse(input.confirmationBuildId)
  if (primaryBuildId === confirmationBuildId) {
    throw new Error('SAM 3.1 reproducibility needs two distinct builds.')
  }
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const [primary, confirmation] = await Promise.all([
    readBuildEvidence(storage, primaryBuildId),
    readBuildEvidence(storage, confirmationBuildId),
  ])
  const receipt = createCanonicalSam31QualificationCapsuleReproducibility({
    receiptId,
    primary,
    confirmation,
    observedAt: latestTimestamp(
      primary.capsuleUpdatedAt,
      confirmation.capsuleUpdatedAt,
    ),
  })
  const repository = input.repository
    ?? createCanonicalSam31QualificationCapsuleReproducibilityRepository({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: CONTROL_BUCKET,
      }),
    })
  const persisted = await repository.persistCreateOnly({ receipt })
  const reread = await repository.reread({
    receiptRef: persisted.receiptRef,
  })
  if (!reread || reread.receiptHash !== receipt.receiptHash) {
    throw new Error('SAM 3.1 reproducibility receipt was not exactly reread.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_RUNTIME_VERSION,
    disposition: persisted.disposition,
    receiptRef: persisted.receiptRef,
    receipt: structuredClone(reread),
    modelOrCheckpointBytesReadLocally: false as const,
    developerMachineModelInstallPerformed: false as const,
    qualificationAuthorityGranted: false as const,
    runtimeReleaseGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

export async function rereadCanonicalSam31QualificationCapsuleBuildEvidence(
  storage: Storage,
  untrustedBuildId: string,
) {
  const buildId = buildIdSchema.parse(untrustedBuildId)
  const prefix = `${INPUT_PREFIX}/${buildId}`
  const scan = await readExactJson(
    storage,
    `${prefix}/capsule-malware-scan.json`,
  )
  const scanValue = z.object({
    capsuleSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  }).passthrough().parse(scan.value)
  const builder = await readExactJson(
    storage,
    `${prefix}/${scanValue.capsuleSha256}.capsule.json`,
  )
  const capsuleObjectName =
    `${prefix}/${scanValue.capsuleSha256}.tar.gz`
  const [metadata] = await storage.bucket(INPUT_BUCKET)
    .file(capsuleObjectName).getMetadata()
  const coordinate = capsuleCoordinate(metadata, capsuleObjectName)
  return Object.freeze({
    builderResult: assertCanonicalSam31QualificationCapsuleBuilderResult(
      builder.value,
    ),
    builderResultFileSha256: builder.sha256,
    malwareScan: assertCanonicalSam31QualificationCapsuleMalwareScan(
      scan.value,
    ),
    malwareScanFileSha256: scan.sha256,
    coordinate,
    capsuleUpdatedAt: exactTimestamp(metadata.updated ?? metadata.timeCreated),
  })
}

const readBuildEvidence =
  rereadCanonicalSam31QualificationCapsuleBuildEvidence

async function readExactJson(
  storage: Storage,
  objectName: string,
): Promise<{ readonly value: unknown; readonly sha256: string }> {
  const live = storage.bucket(INPUT_BUCKET).file(objectName)
  const [before] = await live.getMetadata()
  const generation = String(before.generation ?? '')
  const etag = String(before.etag ?? '')
  const size = Number(before.size ?? -1)
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || !Number.isSafeInteger(size)
    || size < 2
    || size > MAXIMUM_JSON_BYTES
    || before.contentType !== 'application/json'
  ) throw new Error('SAM 3.1 capsule evidence metadata is invalid.')
  const file = storage.bucket(INPUT_BUCKET).file(objectName, { generation })
  const [body] = await file.download({ validation: 'crc32c' })
  const [after] = await file.getMetadata()
  if (
    body.byteLength !== size
    || String(after.generation ?? '') !== generation
    || String(after.etag ?? '') !== etag
  ) throw new Error('SAM 3.1 capsule evidence identity changed.')
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 capsule evidence JSON is invalid.')
  }
  assertPlainSerializedData(value, 'sam31_capsule_evidence_json')
  return Object.freeze({ value, sha256: sha256(body) })
}

function capsuleCoordinate(metadata: FileMetadata, objectName: string) {
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const byteLength = Number(metadata.size ?? -1)
  const crc32c = String(metadata.crc32c ?? '')
  const md5Hash = String(metadata.md5Hash ?? '')
  const shaMatch = objectName.match(/\/([a-f0-9]{64})\.tar\.gz$/u)
  if (
    !shaMatch
    || !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || !Number.isSafeInteger(byteLength)
    || byteLength < 1
    || metadata.contentType !== 'application/x-tar'
    || !crc32c
    || !md5Hash
  ) throw new Error('SAM 3.1 qualification capsule metadata is invalid.')
  return Object.freeze({
    projectId: PROJECT_ID,
    bucketName: INPUT_BUCKET,
    objectName,
    generation,
    etag,
    byteLength,
    sha256: shaMatch[1],
    storageContentType: 'application/x-tar' as const,
    crc32c,
    md5Hash,
  })
}

function receiptPath(ref: z.infer<typeof refSchema>): string {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return `${RECEIPT_PREFIX}/${idHash}/${ref.contentHash.slice(7)}.json`
}

async function readReceipt(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  path: string,
) {
  const body = await objectPort.readExact(path)
  if (!body) return null
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 capsule reproducibility JSON is invalid.')
  }
  const receipt = assertCanonicalSam31QualificationCapsuleReproducibility(
    value,
  )
  if (
    canonicalSam31QualificationCapsuleReproducibilityStringify(receipt) !==
      body.toString('utf8')
  ) {
    throw new Error('SAM 3.1 capsule reproducibility bytes changed.')
  }
  return receipt
}

function latestTimestamp(left: string, right: string): string {
  const leftMs = Date.parse(left)
  const rightMs = Date.parse(right)
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) {
    throw new Error('SAM 3.1 capsule timestamps are invalid.')
  }
  return new Date(Math.max(leftMs, rightMs)).toISOString()
}

function exactTimestamp(value: unknown): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error('SAM 3.1 capsule timestamp is missing.')
  }
  return new Date(value).toISOString()
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
