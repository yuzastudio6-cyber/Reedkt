import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_VERSION =
  'canonical-track-all-sam3_1-storage-qualification-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_OWNER_VERSION =
  'canonical-track-all-sam3_1-storage-qualification-owner-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-storage-qualification-repository-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION =
  'canonical-track-all-sam3_1-storage-probe-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const roleSchema = z.enum(['control_plane_state', 'private_mask_artifacts'])
const bucketNameSchema = z.enum([
  'reeditpro-production-reeditpro-control-plane-state',
  'reeditpro-production-reeditpro-masks',
])
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const safeLocation = z.string().trim().min(1).max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u)
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const securityObservationSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: bucketNameSchema,
  location: safeLocation,
  uniformBucketLevelAccessEnabled: z.literal(true),
  publicAccessPrevention: z.literal('enforced'),
  publicIamPrincipalCount: z.literal(0),
  browserOrCallerPolicyAccepted: z.literal(false),
  observedAt: timestamp,
}).strict()
const qualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_storage_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_live_storage_probe'),
  status: z.literal('private_internal_qualified'),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  role: roleSchema,
  projectId: z.literal(PROJECT_ID),
  bucketName: bucketNameSchema,
  securityObservation: securityObservationSchema,
  canaryIdentityHash: rawSha256,
  exactCreateOnlyWriteObserved: z.literal(true),
  exactIdenticalReplayObserved: z.literal(true),
  conflictingReplayRejected: z.literal(true),
  exactReadAfterWriteObserved: z.literal(true),
  detachedSecondRereadObserved: z.literal(true),
  unrelatedQualificationPrefixReturnedNoObject: z.literal(true),
  callerBucketPathBytesOrPolicyAccepted: z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((qualification, context) => {
  const expectedBucket = qualification.role === 'control_plane_state'
    ? 'reeditpro-production-reeditpro-control-plane-state'
    : 'reeditpro-production-reeditpro-masks'
  if (qualification.bucketName !== expectedBucket
    || qualification.securityObservation.bucketName !== expectedBucket
    || qualification.securityObservation.observedAt
      !== qualification.qualifiedAt
    || Date.parse(qualification.expiresAt)
      <= Date.parse(qualification.qualifiedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Track All storage qualification lost role, time, or bucket.',
    })
  }
})
const qualificationSchema = qualificationWithoutHashSchema.extend({
  qualificationHash: rawSha256,
}).strict()
const storedRecordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_OWNER_VERSION,
  ),
  recordKind: z.literal('track_all_sam3_1_storage_qualification'),
  qualification: qualificationSchema,
}).strict()
const storedRecordSchema = storedRecordWithoutHashSchema.extend({
  recordHash: rawSha256,
}).strict()

export type CanonicalTrackAllSam31StorageQualification = z.infer<
  typeof qualificationSchema
>
export type CanonicalTrackAllSam31StorageQualificationRef = z.infer<
  typeof refSchema
>
export type CanonicalTrackAllSam31StorageRole = z.infer<typeof roleSchema>
export type CanonicalTrackAllSam31StorageSecurityObservation = z.infer<
  typeof securityObservationSchema
>

export interface CanonicalTrackAllSam31StorageProbePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION
  readonly projectId: typeof PROJECT_ID
  readonly role: CanonicalTrackAllSam31StorageRole
  readonly bucketName: z.infer<typeof bucketNameSchema>
  readSecurityObservation(): Promise<
    CanonicalTrackAllSam31StorageSecurityObservation
  >
  createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'identical_replay'>
  readExact(objectPath: string): Promise<Buffer | null>
}

export interface CanonicalTrackAllSam31StorageQualificationReadPort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_REPOSITORY_VERSION
  readExact(input: {
    readonly qualificationRef:
      CanonicalTrackAllSam31StorageQualificationRef
  }): Promise<CanonicalTrackAllSam31StorageQualification | null>
}

export interface CanonicalTrackAllSam31StorageQualificationRepository
  extends CanonicalTrackAllSam31StorageQualificationReadPort {
  persistCreateOnly(input: {
    readonly qualification: CanonicalTrackAllSam31StorageQualification
  }): Promise<'created' | 'identical_replay'>
}

export function createCanonicalGcsTrackAllSam31StorageProbePort(input: {
  readonly storage?: Storage
  readonly projectId?: string
  readonly role: CanonicalTrackAllSam31StorageRole
}): CanonicalTrackAllSam31StorageProbePort {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Track All storage qualification requires reeditpro.')
  }
  const role = roleSchema.parse(input.role)
  const bucketName = role === 'control_plane_state'
    ? 'reeditpro-production-reeditpro-control-plane-state' as const
    : 'reeditpro-production-reeditpro-masks' as const
  const bucket = (input.storage ?? new Storage({ projectId }))
    .bucket(bucketName)
  const port: CanonicalTrackAllSam31StorageProbePort = {
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION,
    projectId: PROJECT_ID,
    role,
    bucketName,
    async readSecurityObservation() {
      const [[metadata], [policy]] = await Promise.all([
        bucket.getMetadata(),
        bucket.iam.getPolicy({ requestedPolicyVersion: 3 }),
      ])
      const publicIamPrincipalCount = new Set(
        (policy.bindings ?? []).flatMap((binding) => binding.members ?? [])
          .filter((member) => member === 'allUsers'
            || member === 'allAuthenticatedUsers'),
      ).size
      return securityObservationSchema.parse({
        projectId: PROJECT_ID,
        bucketName,
        location: metadata.location,
        uniformBucketLevelAccessEnabled:
          metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled,
        publicAccessPrevention:
          metadata.iamConfiguration?.publicAccessPrevention,
        publicIamPrincipalCount,
        browserOrCallerPolicyAccepted: false,
        observedAt: new Date().toISOString(),
      })
    },
    async createOnly({ objectPath, body, contentSha256 }: {
      readonly objectPath: string
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      const path = safePrefix.parse(objectPath)
      if (!Buffer.isBuffer(body) || hashBytes(body) !== rawSha256.parse(
        contentSha256,
      )) throw new Error('Track All storage canary bytes are invalid.')
      const file = bucket.file(path)
      try {
        await file.save(body, {
          resumable: false,
          validation: 'crc32c',
          preconditionOpts: { ifGenerationMatch: 0 },
          metadata: {
            contentType: 'application/json',
            cacheControl: 'no-store',
          },
        })
        return 'created'
      } catch (error) {
        if (!isPreconditionFailure(error)) throw error
        const [existing] = await file.download({ validation: 'crc32c' })
        if (!Buffer.isBuffer(existing) || !existing.equals(body)) {
          throw new Error('Track All storage create-only conflict.', {
            cause: error,
          })
        }
        return 'identical_replay'
      }
    },
    async readExact(objectPath: string) {
      const file = bucket.file(safePrefix.parse(objectPath))
      const [exists] = await file.exists()
      if (!exists) return null
      const [body] = await file.download({ validation: 'crc32c' })
      return Buffer.from(body)
    },
  }
  return Object.freeze(port)
}

export function canonicalTrackAllSam31StorageQualificationRef(
  value: CanonicalTrackAllSam31StorageQualification,
): CanonicalTrackAllSam31StorageQualificationRef {
  const qualification = assertCanonicalTrackAllSam31StorageQualification(value)
  return refSchema.parse({
    id: qualification.qualificationId,
    version: qualification.qualificationVersion,
    contentHash: `sha256:${qualification.qualificationHash}`,
  })
}

export function assertCanonicalTrackAllSam31StorageQualification(
  value: unknown,
  at?: string,
): CanonicalTrackAllSam31StorageQualification {
  assertPlainSerializedData(value, 'track_all_sam31_storage_qualification')
  const qualification = qualificationSchema.parse(value)
  const { qualificationHash, ...payload } = qualification
  if (qualificationHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(qualification.qualifiedAt)
      || Date.parse(at) >= Date.parse(qualification.expiresAt)
    ))) throw new Error('Track All storage qualification is invalid.')
  return structuredClone(qualification)
}

export function createCanonicalTrackAllSam31StorageQualificationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31StorageQualificationRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix
    ?? 'private/track-all/sam3_1/v1/storage-qualifications')
  const readExact = async (
    untrusted: {
      readonly qualificationRef:
        CanonicalTrackAllSam31StorageQualificationRef
    },
  ): Promise<CanonicalTrackAllSam31StorageQualification | null> => {
    assertPlainSerializedData(untrusted, 'storage_qualification_read')
    const { qualificationRef } = z.object({
      qualificationRef: refSchema,
    }).strict().parse(untrusted)
    const body = await input.objectPort.readExact(
      recordPath(prefix, qualificationRef),
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > 2 * 1024 * 1024) {
      throw new Error('Track All storage qualification bytes are invalid.')
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(body.toString('utf8')) as unknown
    } catch {
      throw new Error('Track All storage qualification JSON is invalid.')
    }
    assertPlainSerializedData(parsed, 'storage_qualification_record')
    const record = storedRecordSchema.parse(parsed)
    const { recordHash, ...recordPayload } = record
    const qualification = assertCanonicalTrackAllSam31StorageQualification(
      record.qualification,
    )
    if (recordHash !== sha256AuthorityValue(recordPayload)
      || stableAuthorityStringify(
        canonicalTrackAllSam31StorageQualificationRef(qualification),
      ) !== stableAuthorityStringify(qualificationRef)
      || body.toString('utf8') !== stableAuthorityStringify(record)) {
      throw new Error('Track All storage qualification record changed.')
    }
    return qualification
  }
  const repository: CanonicalTrackAllSam31StorageQualificationRepository = {
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_REPOSITORY_VERSION,
    readExact,
    async persistCreateOnly(untrusted: {
      readonly qualification: CanonicalTrackAllSam31StorageQualification
    }) {
      assertPlainSerializedData(untrusted, 'storage_qualification_write')
      const request = z.object({ qualification: z.unknown() }).strict()
        .parse(untrusted)
      const qualification =
        assertCanonicalTrackAllSam31StorageQualification(
          request.qualification,
        )
      const payload = storedRecordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_OWNER_VERSION,
        recordKind: 'track_all_sam3_1_storage_qualification',
        qualification,
      })
      const record = storedRecordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const result = await input.objectPort.createOnly({
        objectPath: recordPath(
          prefix,
          canonicalTrackAllSam31StorageQualificationRef(qualification),
        ),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readExact({
        qualificationRef:
          canonicalTrackAllSam31StorageQualificationRef(qualification),
      })
      if (!reread || stableAuthorityStringify(reread)
        !== stableAuthorityStringify(qualification)) {
        throw new Error('Track All storage qualification reread failed.')
      }
      return result === 'created' ? 'created' : 'identical_replay'
    },
  }
  return Object.freeze(repository)
}

export async function qualifyCanonicalTrackAllSam31Storage(
  input: {
    readonly qualificationId: string
    readonly expiresAt: string
  },
  dependencies: {
    readonly probePort: CanonicalTrackAllSam31StorageProbePort
    readonly qualificationRepository:
      CanonicalTrackAllSam31StorageQualificationRepository
  },
): Promise<Readonly<{
  disposition: 'created' | 'identical_replay'
  qualification: CanonicalTrackAllSam31StorageQualification
  qualificationRef: CanonicalTrackAllSam31StorageQualificationRef
  exactPersistedRereadVerified: true
  gpuJobStarted: false
  customerCreditsMutated: false
  productionAuthorityGranted: false
}>> {
  assertPlainSerializedData(input, 'storage_qualification_request')
  const request = z.object({
    qualificationId: safeId,
    expiresAt: timestamp,
  }).strict().parse(input)
  assertProbePort(dependencies.probePort)
  if (!dependencies.qualificationRepository
    || typeof dependencies.qualificationRepository.persistCreateOnly
      !== 'function'
    || typeof dependencies.qualificationRepository.readExact !== 'function') {
    throw new Error('Track All storage qualification repository is invalid.')
  }
  const role = dependencies.probePort.role
  const identity = stableAuthorityStringify({
    qualificationId: request.qualificationId,
    role,
    projectId: dependencies.probePort.projectId,
    bucketName: dependencies.probePort.bucketName,
  })
  const canaryIdentityHash = hashText(identity)
  const objectPath = `private/qualification/track-all/sam3_1/storage/v1/${
    role}/${canaryIdentityHash}.json`
  const unrelatedPath = `private/qualification/track-all/sam3_1/storage/v1/${
    role}/unrelated-${canaryIdentityHash}.json`
  const canary = Buffer.from(stableAuthorityStringify({
    schemaVersion: 'track-all-sam3_1-storage-canary-v1',
    qualificationId: request.qualificationId,
    role,
    canaryIdentityHash,
  }), 'utf8')
  const canaryHash = hashBytes(canary)
  const first = await dependencies.probePort.createOnly({
    objectPath,
    body: canary,
    contentSha256: canaryHash,
  })
  if (first !== 'created' && first !== 'identical_replay') {
    throw new Error('Track All storage canary was not created.')
  }
  const replay = await dependencies.probePort.createOnly({
    objectPath,
    body: Buffer.from(canary),
    contentSha256: canaryHash,
  })
  if (replay !== 'identical_replay') {
    throw new Error('Track All storage identical replay was not observed.')
  }
  let conflictRejected = false
  const conflictBody = Buffer.from(stableAuthorityStringify({
    schemaVersion: 'track-all-sam3_1-storage-canary-v1',
    qualificationId: request.qualificationId,
    role,
    canaryIdentityHash,
    conflict: true,
  }), 'utf8')
  try {
    await dependencies.probePort.createOnly({
      objectPath,
      body: conflictBody,
      contentSha256: hashBytes(conflictBody),
    })
  } catch {
    conflictRejected = true
  }
  const reread = await dependencies.probePort.readExact(objectPath)
  const detachedReread = await dependencies.probePort.readExact(objectPath)
  const unrelated = await dependencies.probePort.readExact(unrelatedPath)
  const securityObservation = securityObservationSchema.parse(
    await dependencies.probePort.readSecurityObservation(),
  )
  if (!conflictRejected || !reread?.equals(canary)
    || !detachedReread?.equals(canary) || unrelated !== null
    || securityObservation.projectId !== dependencies.probePort.projectId
    || securityObservation.bucketName !== dependencies.probePort.bucketName) {
    throw new Error('Track All storage qualification probe failed closed.')
  }
  const payload = qualificationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_STORAGE_QUALIFICATION_VERSION,
    source: 'canonical_server_track_all_sam3_1_storage_qualification_owner',
    evidenceClass: 'canonical_private_live_storage_probe',
    status: 'private_internal_qualified',
    qualificationId: request.qualificationId,
    qualificationVersion: 1,
    role,
    projectId: PROJECT_ID,
    bucketName: dependencies.probePort.bucketName,
    securityObservation,
    canaryIdentityHash,
    exactCreateOnlyWriteObserved: true,
    exactIdenticalReplayObserved: true,
    conflictingReplayRejected: true,
    exactReadAfterWriteObserved: true,
    detachedSecondRereadObserved: true,
    unrelatedQualificationPrefixReturnedNoObject: true,
    callerBucketPathBytesOrPolicyAccepted: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: securityObservation.observedAt,
    expiresAt: request.expiresAt,
  })
  const qualification = qualificationSchema.parse({
    ...payload,
    qualificationHash: sha256AuthorityValue(payload),
  })
  const disposition = await dependencies.qualificationRepository
    .persistCreateOnly({ qualification })
  const qualificationRef =
    canonicalTrackAllSam31StorageQualificationRef(qualification)
  const exact = await dependencies.qualificationRepository.readExact({
    qualificationRef,
  })
  if (!exact || stableAuthorityStringify(exact)
    !== stableAuthorityStringify(qualification)) {
    throw new Error('Track All storage qualification exact reread failed.')
  }
  return Object.freeze({
    disposition,
    qualification,
    qualificationRef,
    exactPersistedRereadVerified: true,
    gpuJobStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
}

function assertProbePort(
  port: CanonicalTrackAllSam31StorageProbePort,
): void {
  if (!port || port.schemaVersion
      !== CANONICAL_TRACK_ALL_SAM3_1_STORAGE_PROBE_PORT_VERSION
    || port.projectId !== PROJECT_ID
    || typeof port.readSecurityObservation !== 'function'
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Track All storage qualification probe port is invalid.')
  }
  const expectedBucket = port.role === 'control_plane_state'
    ? 'reeditpro-production-reeditpro-control-plane-state'
    : 'reeditpro-production-reeditpro-masks'
  if (port.bucketName !== expectedBucket) {
    throw new Error('Track All storage qualification bucket is invalid.')
  }
}

function recordPath(
  prefix: string,
  ref: CanonicalTrackAllSam31StorageQualificationRef,
): string {
  return `${prefix}/records/${hashText(stableAuthorityStringify(ref))}.json`
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Track All storage qualification object port is invalid.')
  }
}

function isPreconditionFailure(error: unknown): boolean {
  return typeof error === 'object' && error !== null
    && 'code' in error
    && (Reflect.get(error, 'code') === 412
      || Reflect.get(error, 'code') === '412')
}
