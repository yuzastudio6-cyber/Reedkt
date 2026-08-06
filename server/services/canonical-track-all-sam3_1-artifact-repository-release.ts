import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_VERSION =
  'canonical-track-all-sam3_1-artifact-repository-release-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-artifact-repository-release-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/artifact-repository-releases'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const componentRepositoryVersionsSchema = z.object({
  taskContextRepository:
    z.literal('canonical-sam3_1-gpu-task-context-repository-v1'),
  taskStore: z.literal('canonical-sam3_1-gpu-task-store-v1'),
  runtimeResultStore:
    z.literal('canonical-sam3_1-gpu-runtime-result-store-v1'),
  taskQaRepository:
    z.literal('canonical-track-all-sam3_1-task-qa-repository-v1'),
  captionSceneEvidenceRepository: z.literal(
    'canonical-track-all-sam3_1-caption-scene-evidence-repository-v1',
  ),
  captionTrackAllEvidenceRepository:
    z.literal('canonical-caption-track-all-evidence-repository-v2'),
}).strict()

const componentQualificationRefsSchema = z.object({
  taskContextRepository: evidenceRefSchema,
  taskStore: evidenceRefSchema,
  runtimeResultStore: evidenceRefSchema,
  taskQaRepository: evidenceRefSchema,
  captionSceneEvidenceRepository: evidenceRefSchema,
  captionTrackAllEvidenceRepository: evidenceRefSchema,
}).strict().superRefine((refs, context) => {
  const identities = Object.values(refs).map((ref) =>
    stableAuthorityStringify(ref))
  if (new Set(identities).size !== identities.length) context.addIssue({
    code: 'custom',
    message: 'Track All repository qualification refs must be unique.',
  })
})

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_artifact_repository_release_owner',
  ),
  evidenceClass: z.literal('canonical_private_create_only_exact_reread'),
  status: z.literal('private_internal_qualified'),
  releaseId: safeId,
  releaseVersion: z.literal(1),
  componentRepositoryVersions: componentRepositoryVersionsSchema,
  componentQualificationRefs: componentQualificationRefsSchema,
  controlPlaneStateStorageRef: evidenceRefSchema,
  privateMaskArtifactStorageRef: evidenceRefSchema,
  exactCreateOnlyConflictAndIdenticalReplayObserved: z.literal(true),
  exactReadAfterWriteAndDetachedRereadObserved: z.literal(true),
  exactWorkspaceSnapshotSceneOutputAndAttemptIsolationObserved:
    z.literal(true),
  exactArtifactHashFrameRangeResultAndQaLineageRereadObserved:
    z.literal(true),
  browserOrCallerStorageLocationAccepted: z.literal(false),
  callerRepositoryVersionOrQualificationAccepted: z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((release, context) => {
  if (Date.parse(release.expiresAt) <= Date.parse(release.qualifiedAt)
    || stableAuthorityStringify(release.controlPlaneStateStorageRef)
      === stableAuthorityStringify(release.privateMaskArtifactStorageRef)) {
    context.addIssue({
      code: 'custom',
      message: 'Track All repository release lost expiry or storage isolation.',
    })
  }
})

const releaseSchema = releaseWithoutHashSchema.extend({
  releaseHash: sha256,
}).strict()

export type CanonicalTrackAllSam31ArtifactRepositoryRelease = z.infer<
  typeof releaseSchema
>
export type CanonicalTrackAllSam31ArtifactRepositoryReleaseInput = z.input<
  typeof releaseWithoutHashSchema
>
export type CanonicalTrackAllSam31ArtifactRepositoryReleaseRef = z.infer<
  typeof evidenceRefSchema
>

export interface CanonicalTrackAllSam31ArtifactRepositoryReleaseReadPort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  readExact(input: {
    readonly releaseRef: CanonicalTrackAllSam31ArtifactRepositoryReleaseRef
  }): Promise<CanonicalTrackAllSam31ArtifactRepositoryRelease | null>
}

export interface CanonicalTrackAllSam31ArtifactRepositoryReleaseRepository
  extends CanonicalTrackAllSam31ArtifactRepositoryReleaseReadPort {
  persistCreateOnly(input: {
    readonly release: CanonicalTrackAllSam31ArtifactRepositoryRelease
  }): Promise<'created' | 'identical_replay'>
}

type PersistReleaseInput = Parameters<
  CanonicalTrackAllSam31ArtifactRepositoryReleaseRepository[
    'persistCreateOnly'
  ]
>[0]
type ReadReleaseInput = Parameters<
  CanonicalTrackAllSam31ArtifactRepositoryReleaseReadPort['readExact']
>[0]

export function createCanonicalTrackAllSam31ArtifactRepositoryRelease(
  input: CanonicalTrackAllSam31ArtifactRepositoryReleaseInput,
): CanonicalTrackAllSam31ArtifactRepositoryRelease {
  assertPlainSerializedData(input, 'track_all_repository_release_input')
  const payload = releaseWithoutHashSchema.parse(input)
  return releaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31ArtifactRepositoryRelease(
  value: unknown,
  at?: string,
): CanonicalTrackAllSam31ArtifactRepositoryRelease {
  assertPlainSerializedData(value, 'track_all_repository_release')
  const release = releaseSchema.parse(value)
  const { releaseHash, ...payload } = release
  if (releaseHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(release.qualifiedAt)
      || Date.parse(at) >= Date.parse(release.expiresAt)
    ))) throw new Error('Track All artifact repository release is invalid.')
  return structuredClone(release)
}

export function canonicalTrackAllSam31ArtifactRepositoryReleaseRef(
  value: CanonicalTrackAllSam31ArtifactRepositoryRelease,
): CanonicalTrackAllSam31ArtifactRepositoryReleaseRef {
  const release = assertCanonicalTrackAllSam31ArtifactRepositoryRelease(value)
  return evidenceRefSchema.parse({
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  })
}

export function createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31ArtifactRepositoryReleaseRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread' as const,
    async persistCreateOnly(untrusted: PersistReleaseInput) {
      assertPlainSerializedData(untrusted, 'track_all_repository_release_write')
      const request = z.object({ release: z.unknown() }).strict()
        .parse(untrusted)
      const release = assertCanonicalTrackAllSam31ArtifactRepositoryRelease(
        request.release,
      )
      const body = serialize(release)
      const result = await input.objectPort.createOnly({
        objectPath: recordPath(
          prefix,
          canonicalTrackAllSam31ArtifactRepositoryReleaseRef(release),
        ),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readRecord(
        input.objectPort,
        prefix,
        canonicalTrackAllSam31ArtifactRepositoryReleaseRef(release),
      )
      if (!reread || reread.releaseHash !== release.releaseHash) {
        throw new Error('Track All repository release exact reread failed.')
      }
      return result === 'created' ? 'created' : 'identical_replay'
    },
    async readExact(untrusted: ReadReleaseInput) {
      assertPlainSerializedData(untrusted, 'track_all_repository_release_read')
      const request = z.object({ releaseRef: evidenceRefSchema }).strict()
        .parse(untrusted)
      return readRecord(input.objectPort, prefix, request.releaseRef)
    },
  })
}

export function createCanonicalGcsTrackAllSam31ArtifactRepositoryReleaseRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalTrackAllSam31ArtifactRepositoryReleaseRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Track All repository release requires project reeditpro.')
  }
  return createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  ref: CanonicalTrackAllSam31ArtifactRepositoryReleaseRef,
): Promise<CanonicalTrackAllSam31ArtifactRepositoryRelease | null> {
  const body = await port.readExact(recordPath(prefix, ref))
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Track All repository release bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error('Track All repository release JSON is invalid.')
  }
  const release = assertCanonicalTrackAllSam31ArtifactRepositoryRelease(value)
  if (stableAuthorityStringify(
    canonicalTrackAllSam31ArtifactRepositoryReleaseRef(release),
  ) !== stableAuthorityStringify(ref)
    || body.toString('utf8') !== stableAuthorityStringify(release)) {
    throw new Error('Track All repository release changed after publication.')
  }
  return release
}

function recordPath(
  prefix: string,
  ref: CanonicalTrackAllSam31ArtifactRepositoryReleaseRef,
): string {
  return `${prefix}/records/${hashText(stableAuthorityStringify(ref))}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Track All repository release record is oversized.')
  }
  return body
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
    throw new Error('Track All repository release object port is invalid.')
  }
}
