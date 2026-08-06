import { createHash } from 'node:crypto'

import { Storage, type Bucket, type File } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100MountObservation,
  sealCanonicalSam31QualificationA100MountObservation,
  type CanonicalSam31QualificationA100MountObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31A100QualificationFoundationObservation,
  canonicalSam31A100QualificationFoundationResourceRefs,
  type CanonicalSam31A100QualificationFoundationReadPort,
} from './canonical-sam3_1-a100-qualification-foundation-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_STAGING_OWNER_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-staging-owner-v2' as const
export const CANONICAL_SAM3_1_QUALIFICATION_GCS_STAGING_PORT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-gcs-staging-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const TARGET_BUCKET =
  'reeditpro-production-sam31-qualification-private' as const
const TARGET_KMS_KEY =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const
const MOUNT_PATH = '/mnt/disks/reeditpro/sam31-qualification' as const
const REQUEST_OBJECT_NAME = 'request/request.json' as const
const CHECKPOINT_OBJECT_NAME =
  'checkpoint/sam3.1_multiplex.pt' as const
const FIXTURE_OBJECT_NAME = 'fixture/probe-person.mp4' as const
const RESULT_OBJECT_NAME = 'result/result.json' as const
const MAXIMUM_REQUEST_BYTES = 512 * 1024
const MAXIMUM_FIXTURE_BYTES = 64 * 1024 * 1024
const MAXIMUM_CHECKPOINT_BYTES = 5_000_000_000
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const objectName = z.string().trim().min(1).max(2_048)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/@+=,-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const bucketName = z.string().regex(
  /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u,
)
const generation = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const etag = z.string().trim().min(1).max(512)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const sourceCoordinateSchema = z.object({
  bucketName,
  objectName,
  generation,
  etag,
  byteLength: positiveInteger,
  sha256: rawSha256,
  contentType: z.enum(['application/octet-stream', 'video/mp4']),
  artifactRef: evidenceRefSchema,
  canonicalSourceAuthorityRef: evidenceRefSchema,
  exactGenerationEtagLengthSha256AndContentTypeReread: z.literal(true),
  publicOrSignedUrlUsed: z.literal(false),
}).strict()

export type CanonicalSam31QualificationStagingSourceCoordinate = z.infer<
  typeof sourceCoordinateSchema
>

export const canonicalSam31QualificationStagingSourceSetSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-source-checkpoint-qualification-staging-source-set-v1',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  workerRequestRef: evidenceRefSchema,
  checkpoint: sourceCoordinateSchema.extend({
    contentType: z.literal('application/octet-stream'),
  }).strict(),
  probeFixture: sourceCoordinateSchema.extend({
    contentType: z.literal('video/mp4'),
  }).strict(),
  callerCoordinateAccepted: z.literal(false),
  observedAt: timestamp,
}).strict()
export type CanonicalSam31QualificationStagingSourceSet = z.infer<
  typeof canonicalSam31QualificationStagingSourceSetSchema
>

export function createCanonicalSam31QualificationStagingSourceSet(input: {
  readonly workerRequest:
    CanonicalSam31SourceCheckpointQualificationWorkerRequest
  readonly checkpoint: CanonicalSam31QualificationStagingSourceCoordinate
  readonly probeFixture: CanonicalSam31QualificationStagingSourceCoordinate
  readonly observedAt: string
}): CanonicalSam31QualificationStagingSourceSet {
  assertPlainSerializedData(input, 'sam31_qualification_staging_source_set')
  const workerRequest =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
      input.workerRequest,
    )
  const sources = canonicalSam31QualificationStagingSourceSetSchema.parse({
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-qualification-staging-source-set-v1',
    evidenceClass: 'canonical_private_reread',
    workerRequestRef: workerRequestRef(workerRequest),
    checkpoint: input.checkpoint,
    probeFixture: input.probeFixture,
    callerCoordinateAccepted: false,
    observedAt: input.observedAt,
  })
  assertSourcesMatchRequest({ sources, workerRequest })
  return sources
}

export function assertCanonicalSam31QualificationStagingSourceSet(
  value: unknown,
): CanonicalSam31QualificationStagingSourceSet {
  assertPlainSerializedData(value, 'sam31_qualification_staging_source_set')
  return canonicalSam31QualificationStagingSourceSetSchema.parse(value)
}

export function assertCanonicalSam31QualificationStagingSourceSetForWorker(
  value: unknown,
  workerRequestValue:
    CanonicalSam31SourceCheckpointQualificationWorkerRequest,
): CanonicalSam31QualificationStagingSourceSet {
  const workerRequest =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
      workerRequestValue,
    )
  const sources = assertCanonicalSam31QualificationStagingSourceSet(value)
  assertSourcesMatchRequest({ sources, workerRequest })
  return sources
}

const stagedObjectSchema = z.object({
  objectName: z.enum([
    REQUEST_OBJECT_NAME,
    CHECKPOINT_OBJECT_NAME,
    FIXTURE_OBJECT_NAME,
  ]),
  generation,
  etag,
  byteLength: positiveInteger,
  sha256: rawSha256,
  contentType: z.enum([
    'application/json', 'application/octet-stream', 'video/mp4',
  ]),
  destinationKmsKeyName: z.literal(TARGET_KMS_KEY),
  exactDestinationGenerationEtagLengthSha256AndContentTypeReread:
    z.literal(true),
  sourceGenerationBoundServerSideCopy: z.boolean(),
  sourceCoordinateDigestSha256: rawSha256.nullable(),
  createOnly: z.literal(true),
}).strict()
export type CanonicalSam31QualificationStagedObject = z.infer<
  typeof stagedObjectSchema
>

export interface CanonicalSam31QualificationStagingSourceReadPort {
  rereadExactSources(input: {
    readonly workerRequest:
      CanonicalSam31SourceCheckpointQualificationWorkerRequest
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationPrivateStagingPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_GCS_STAGING_PORT_VERSION
  createRequestJsonOnly(input: {
    readonly remoteSubdirectory: string
    readonly body: Buffer
    readonly sha256: string
  }): Promise<unknown>
  copySourceObjectCreateOnly(input: {
    readonly remoteSubdirectory: string
    readonly targetObjectName:
      | typeof CHECKPOINT_OBJECT_NAME
      | typeof FIXTURE_OBJECT_NAME
    readonly source: z.infer<typeof sourceCoordinateSchema>
  }): Promise<unknown>
  rereadStagedObject(input: {
    readonly remoteSubdirectory: string
    readonly objectName:
      | typeof REQUEST_OBJECT_NAME
      | typeof CHECKPOINT_OBJECT_NAME
      | typeof FIXTURE_OBJECT_NAME
  }): Promise<unknown | null>
  resultObjectExists(input: {
    readonly remoteSubdirectory: string
  }): Promise<boolean>
  listAttemptObjectNames(input: {
    readonly remoteSubdirectory: string
  }): Promise<readonly string[]>
}

interface CanonicalSam31QualificationStagingOwnerDependencies {
  readonly foundationReadPort:
    CanonicalSam31A100QualificationFoundationReadPort
  readonly sourceReadPort: CanonicalSam31QualificationStagingSourceReadPort
  readonly stagingPort: CanonicalSam31QualificationPrivateStagingPort
  readonly observationObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly now?: () => string
}

export interface CanonicalSam31QualificationStagingOwner {
  stageOne(input: {
    readonly attemptId: string
    readonly workerRequest:
      CanonicalSam31SourceCheckpointQualificationWorkerRequest
  }): Promise<CanonicalSam31QualificationA100MountObservation>
  rereadExactAttemptMount(input: {
    readonly attemptId: string
    readonly workerRequest:
      CanonicalSam31SourceCheckpointQualificationWorkerRequest
  }): Promise<CanonicalSam31QualificationA100MountObservation | null>
}

/**
 * Creates the exact attempt subdirectory consumed by the A100 Batch job. The
 * checkpoint is copied server-side from one already-ingested generation; it is
 * never downloaded to the application process or installed on the developer
 * machine.
 */
export function createCanonicalSam31QualificationStagingOwner(
  input: CanonicalSam31QualificationStagingOwnerDependencies,
): CanonicalSam31QualificationStagingOwner {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async stageOne(inputValue: {
      readonly attemptId: string
      readonly workerRequest:
        CanonicalSam31SourceCheckpointQualificationWorkerRequest
    }): Promise<CanonicalSam31QualificationA100MountObservation> {
      assertPlainSerializedData(inputValue, 'sam31_qualification_stage_request')
      const attemptId = safeId.parse(inputValue.attemptId)
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          inputValue.workerRequest,
        )
      const stageAt = now()
      const foundation =
        assertCanonicalSam31A100QualificationFoundationObservation(
          await input.foundationReadPort.rereadCurrentFoundation({
            purpose: 'private_artifact_staging',
            at: stageAt,
          }),
          { purpose: 'private_artifact_staging', at: stageAt },
        )
      const refs =
        canonicalSam31A100QualificationFoundationResourceRefs(foundation)
      const workerRequestReference = workerRequestRef(workerRequest)
      const priorObservation = await rereadObservation({
        port: input.observationObjectPort,
        attemptId,
      })
      if (priorObservation) {
        assertObservationMatchesWorker({
          observation: priorObservation,
          workerRequest,
        })
        assertObservationMatchesFoundation({
          observation: priorObservation,
          refs,
        })
        await assertPersistedStagingMatchesObservation({
          port: input.stagingPort,
          observation: priorObservation,
        })
        return priorObservation
      }
      const untrustedSources = await input.sourceReadPort.rereadExactSources({
        workerRequest,
      })
      if (!untrustedSources) {
        throw new Error('SAM 3.1 qualification staging sources are missing.')
      }
      assertPlainSerializedData(untrustedSources, 'sam31_staging_source_set')
      const sources = canonicalSam31QualificationStagingSourceSetSchema.parse(
        untrustedSources,
      )
      assertSourcesMatchRequest({ sources, workerRequest })
      const remoteSubdirectory =
        `private/sam3_1/source-checkpoint-qualification/v1/attempts/`
        + sha256AuthorityValue(attemptId)
      if (await input.stagingPort.resultObjectExists({
        remoteSubdirectory,
      })) throw new Error('SAM 3.1 qualification result already exists.')
      const requestBody = Buffer.from(
        stableAuthorityStringify(workerRequest),
        'utf8',
      )
      if (
        requestBody.byteLength < 2
        || requestBody.byteLength > MAXIMUM_REQUEST_BYTES
      ) throw new Error('SAM 3.1 qualification request object is oversized.')
      const requestSha256 = digest(requestBody)
      await input.stagingPort.createRequestJsonOnly({
        remoteSubdirectory,
        body: requestBody,
        sha256: requestSha256,
      })
      await input.stagingPort.copySourceObjectCreateOnly({
        remoteSubdirectory,
        targetObjectName: CHECKPOINT_OBJECT_NAME,
        source: sources.checkpoint,
      })
      await input.stagingPort.copySourceObjectCreateOnly({
        remoteSubdirectory,
        targetObjectName: FIXTURE_OBJECT_NAME,
        source: sources.probeFixture,
      })
      const requestObject = stagedObjectSchema.parse(
        await input.stagingPort.rereadStagedObject({
          remoteSubdirectory,
          objectName: REQUEST_OBJECT_NAME,
        }),
      )
      const checkpointObject = stagedObjectSchema.parse(
        await input.stagingPort.rereadStagedObject({
          remoteSubdirectory,
          objectName: CHECKPOINT_OBJECT_NAME,
        }),
      )
      const probeObject = stagedObjectSchema.parse(
        await input.stagingPort.rereadStagedObject({
          remoteSubdirectory,
          objectName: FIXTURE_OBJECT_NAME,
        }),
      )
      const names = await input.stagingPort.listAttemptObjectNames({
        remoteSubdirectory,
      })
      const expectedNames = [
        `${remoteSubdirectory}/${CHECKPOINT_OBJECT_NAME}`,
        `${remoteSubdirectory}/${FIXTURE_OBJECT_NAME}`,
        `${remoteSubdirectory}/${REQUEST_OBJECT_NAME}`,
      ].sort(utf16LexicalCompare)
      if (
        stableAuthorityStringify([...names]) !==
          stableAuthorityStringify(expectedNames)
        || await input.stagingPort.resultObjectExists({ remoteSubdirectory })
      ) throw new Error('SAM 3.1 qualification staging object set changed.')
      assertStagedObjects({
        requestObject,
        checkpointObject,
        probeObject,
        requestSha256,
        requestBodyLength: requestBody.byteLength,
        sources,
      })
      const observation = sealCanonicalSam31QualificationA100MountObservation({
        schemaVersion:
          'canonical-sam3_1-source-checkpoint-qualification-a100-mount-observation-v2',
        source: 'canonical_server_sam3_1_qualification_private_mount_owner',
        evidenceClass: 'canonical_private_reread',
        attemptId,
        qualificationId: workerRequest.qualificationId,
        workerRequestRef: workerRequestReference,
        ...refs,
        projectId: PROJECT_ID,
        region: REGION,
        privateBucketName: TARGET_BUCKET,
        attemptRemoteSubdirectory: remoteSubdirectory,
        gcsRemotePath: `${TARGET_BUCKET}/${remoteSubdirectory}`,
        mountPath: MOUNT_PATH,
        mountOptions: 'rw,implicit-dirs',
        requestObject: {
          objectName: REQUEST_OBJECT_NAME,
          storageGeneration: requestObject.generation,
          storageEtag: requestObject.etag,
          byteLength: requestObject.byteLength,
          sha256: requestObject.sha256,
          exactGenerationEtagLengthAndSha256Reread: true,
          readOnlyForWorker: true,
          requestCanonicalHash: workerRequest.requestHash,
        },
        checkpointObject: {
          objectName: CHECKPOINT_OBJECT_NAME,
          storageGeneration: checkpointObject.generation,
          storageEtag: checkpointObject.etag,
          byteLength: checkpointObject.byteLength,
          sha256: checkpointObject.sha256,
          exactGenerationEtagLengthAndSha256Reread: true,
          readOnlyForWorker: true,
        },
        probeFixtureObject: {
          objectName: FIXTURE_OBJECT_NAME,
          storageGeneration: probeObject.generation,
          storageEtag: probeObject.etag,
          byteLength: probeObject.byteLength,
          sha256: probeObject.sha256,
          exactGenerationEtagLengthAndSha256Reread: true,
          readOnlyForWorker: true,
        },
        resultObjectName: RESULT_OBJECT_NAME,
        resultObjectAbsentBeforeLaunch: true,
        resultParentCreatedForWorkerOnly: true,
        exactAttemptSubdirectoryReread: true,
        requestCheckpointAndFixtureOnlyInputObjectSet: true,
        serviceIdentityReadInputsWriteResultOnly: true,
        objectBytesPathsUrlsOrCredentialsIncludedInWorkerRequest: false,
        signedUrlOrPublicObjectUsed: false,
        callerBucketPrefixPathOrObjectAccepted: false,
        observedAt: stageAt,
      })
      await persistObservationCreateOnly({
        port: input.observationObjectPort,
        observation,
      })
      const reread = await rereadObservation({
        port: input.observationObjectPort,
        attemptId,
      })
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(observation)) {
        throw new Error('SAM 3.1 qualification mount persistence changed.')
      }
      return reread
    },

    async rereadExactAttemptMount(request: {
      readonly attemptId: string
      readonly workerRequest:
        CanonicalSam31SourceCheckpointQualificationWorkerRequest
    }): Promise<CanonicalSam31QualificationA100MountObservation | null> {
      const attemptId = safeId.parse(request.attemptId)
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          request.workerRequest,
        )
      const rereadAt = now()
      const foundation =
        assertCanonicalSam31A100QualificationFoundationObservation(
          await input.foundationReadPort.rereadCurrentFoundation({
            purpose: 'private_artifact_staging',
            at: rereadAt,
          }),
          { purpose: 'private_artifact_staging', at: rereadAt },
        )
      const refs =
        canonicalSam31A100QualificationFoundationResourceRefs(foundation)
      const observation = await rereadObservation({
        port: input.observationObjectPort,
        attemptId,
      })
      if (!observation) return null
      if (
        observation.qualificationId !== workerRequest.qualificationId
        || !sameRef(observation.workerRequestRef,
          workerRequestRef(workerRequest))
      ) throw new Error('SAM 3.1 qualification mount crossed request.')
      assertObservationMatchesFoundation({ observation, refs })
      return observation
    },
  })
}

/** Actual private GCS create/copy/reread implementation. */
export function createCanonicalSam31QualificationGcsStagingPort(input?: {
  readonly storage?: Storage
}): CanonicalSam31QualificationPrivateStagingPort {
  const storage = input?.storage ?? new Storage({ projectId: PROJECT_ID })
  const bucket = storage.bucket(TARGET_BUCKET)
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_GCS_STAGING_PORT_VERSION,

    async createRequestJsonOnly(
      value: Parameters<
        CanonicalSam31QualificationPrivateStagingPort[
          'createRequestJsonOnly'
        ]
      >[0],
    ) {
      assertRemoteSubdirectory(value.remoteSubdirectory)
      if (
        !Buffer.isBuffer(value.body)
        || value.body.byteLength < 2
        || value.body.byteLength > MAXIMUM_REQUEST_BYTES
        || !rawSha256.safeParse(value.sha256).success
        || digest(value.body) !== value.sha256
      ) throw new Error('SAM 3.1 qualification request staging is invalid.')
      const targetName = targetNameFor(
        value.remoteSubdirectory,
        REQUEST_OBJECT_NAME,
      )
      const target = bucket.file(targetName, {
        kmsKeyName: TARGET_KMS_KEY,
        preconditionOpts: { ifGenerationMatch: 0 },
      })
      try {
        await target.save(value.body, {
          contentType: 'application/json',
          resumable: false,
          validation: 'crc32c',
          metadata: { metadata: {
            weeditproSha256: value.sha256,
            weeditproCreateOnly: 'true',
          } },
          preconditionOpts: { ifGenerationMatch: 0 },
        })
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw error
      }
      return rereadTarget({
        bucket,
        targetName,
        objectName: REQUEST_OBJECT_NAME,
        expectedSha256: value.sha256,
        expectedLength: value.body.byteLength,
        expectedContentType: 'application/json',
        sourceCopy: false,
        expectedSourceCoordinateDigestSha256: null,
        downloadAndHash: true,
      })
    },

    async copySourceObjectCreateOnly(
      value: Parameters<
        CanonicalSam31QualificationPrivateStagingPort[
          'copySourceObjectCreateOnly'
        ]
      >[0],
    ) {
      assertRemoteSubdirectory(value.remoteSubdirectory)
      const source = sourceCoordinateSchema.parse(value.source)
      const expectedContentType = value.targetObjectName ===
        CHECKPOINT_OBJECT_NAME ? 'application/octet-stream' : 'video/mp4'
      if (source.contentType !== expectedContentType) {
        throw new Error('SAM 3.1 qualification source content type changed.')
      }
      const sourceFile = storage.bucket(source.bucketName).file(
        source.objectName,
        { generation: source.generation },
      )
      await assertSourceMetadata(sourceFile, source)
      const targetName = targetNameFor(
        value.remoteSubdirectory,
        value.targetObjectName,
      )
      const target = bucket.file(targetName, {
        kmsKeyName: TARGET_KMS_KEY,
        preconditionOpts: { ifGenerationMatch: 0 },
      })
      try {
        const sourceCoordinateDigestSha256 = sha256AuthorityValue(source)
        await sourceFile.copy(target, {
          contentType: source.contentType,
          destinationKmsKeyName: TARGET_KMS_KEY,
          metadata: {
            weeditproSha256: source.sha256,
            weeditproSourceBucket: source.bucketName,
            weeditproSourceObject: source.objectName,
            weeditproSourceGeneration: source.generation,
            weeditproSourceEtagDigest: sha256AuthorityValue(source.etag),
            weeditproSourceCoordinateDigestSha256:
              sourceCoordinateDigestSha256,
            weeditproCreateOnly: 'true',
          },
          preconditionOpts: { ifGenerationMatch: 0 },
        })
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw error
      }
      return rereadTarget({
        bucket,
        targetName,
        objectName: value.targetObjectName,
        expectedSha256: source.sha256,
        expectedLength: source.byteLength,
        expectedContentType: source.contentType,
        sourceCopy: true,
        expectedSourceCoordinateDigestSha256: sha256AuthorityValue(source),
        downloadAndHash: value.targetObjectName === FIXTURE_OBJECT_NAME,
      })
    },

    async rereadStagedObject(
      value: Parameters<
        CanonicalSam31QualificationPrivateStagingPort[
          'rereadStagedObject'
        ]
      >[0],
    ) {
      assertRemoteSubdirectory(value.remoteSubdirectory)
      const name = targetNameFor(
        value.remoteSubdirectory,
        value.objectName,
      )
      let metadata: Record<string, unknown>
      try {
        const result = await bucket.file(name).getMetadata()
        metadata = result[0] as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const custom = customMetadata(metadata)
      const expectedSha256 = String(custom.weeditproSha256 ?? '')
      const expectedLength = Number(metadata.size ?? -1)
      const contentType = String(metadata.contentType ?? '')
      const sourceCoordinateDigestSha256 = value.objectName ===
        REQUEST_OBJECT_NAME ? null : String(
          custom.weeditproSourceCoordinateDigestSha256 ?? '',
        )
      return rereadTarget({
        bucket,
        targetName: name,
        objectName: value.objectName,
        expectedSha256,
        expectedLength,
        expectedContentType: contentType,
        sourceCopy: value.objectName !== REQUEST_OBJECT_NAME,
        expectedSourceCoordinateDigestSha256: sourceCoordinateDigestSha256,
        downloadAndHash: value.objectName !== CHECKPOINT_OBJECT_NAME,
      })
    },

    async resultObjectExists(
      value: Parameters<
        CanonicalSam31QualificationPrivateStagingPort[
          'resultObjectExists'
        ]
      >[0],
    ) {
      assertRemoteSubdirectory(value.remoteSubdirectory)
      const [exists] = await bucket.file(targetNameFor(
        value.remoteSubdirectory,
        RESULT_OBJECT_NAME,
      )).exists()
      return exists
    },

    async listAttemptObjectNames(
      value: Parameters<
        CanonicalSam31QualificationPrivateStagingPort[
          'listAttemptObjectNames'
        ]
      >[0],
    ) {
      assertRemoteSubdirectory(value.remoteSubdirectory)
      const [files] = await bucket.getFiles({
        prefix: `${value.remoteSubdirectory}/`,
        autoPaginate: false,
        maxResults: 4,
      })
      return Object.freeze(files.map((file) => file.name)
        .sort(utf16LexicalCompare))
    },
  })
}

function assertSourcesMatchRequest(input: {
  sources: CanonicalSam31QualificationStagingSourceSet
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
}): void {
  const expectedRef = workerRequestRef(input.workerRequest)
  if (
    !sameRef(input.sources.workerRequestRef, expectedRef)
    || !sameRef(input.sources.checkpoint.artifactRef,
      input.workerRequest.checkpoint.artifactRef)
    || input.sources.checkpoint.byteLength !==
      input.workerRequest.checkpoint.byteLength
    || input.sources.checkpoint.sha256 !==
      input.workerRequest.checkpoint.sha256
    || !sameRef(input.sources.probeFixture.artifactRef,
      input.workerRequest.deterministicProbeFixture.artifactRef)
    || input.sources.probeFixture.byteLength !==
      input.workerRequest.deterministicProbeFixture.byteLength
    || input.sources.probeFixture.sha256 !==
      input.workerRequest.deterministicProbeFixture.sha256
    || input.sources.checkpoint.byteLength > MAXIMUM_CHECKPOINT_BYTES
    || input.sources.probeFixture.byteLength > MAXIMUM_FIXTURE_BYTES
  ) throw new Error('SAM 3.1 qualification sources crossed request.')
}

function assertStagedObjects(input: {
  requestObject: CanonicalSam31QualificationStagedObject
  checkpointObject: CanonicalSam31QualificationStagedObject
  probeObject: CanonicalSam31QualificationStagedObject
  requestSha256: string
  requestBodyLength: number
  sources: CanonicalSam31QualificationStagingSourceSet
}): void {
  if (
    input.requestObject.objectName !== REQUEST_OBJECT_NAME
    || input.requestObject.sha256 !== input.requestSha256
    || input.requestObject.byteLength !== input.requestBodyLength
    || input.requestObject.contentType !== 'application/json'
    || input.requestObject.sourceGenerationBoundServerSideCopy
    || input.requestObject.sourceCoordinateDigestSha256 !== null
    || input.checkpointObject.objectName !== CHECKPOINT_OBJECT_NAME
    || input.checkpointObject.sha256 !== input.sources.checkpoint.sha256
    || input.checkpointObject.byteLength !==
      input.sources.checkpoint.byteLength
    || input.checkpointObject.contentType !== 'application/octet-stream'
    || !input.checkpointObject.sourceGenerationBoundServerSideCopy
    || input.checkpointObject.sourceCoordinateDigestSha256 !==
      sha256AuthorityValue(input.sources.checkpoint)
    || input.probeObject.objectName !== FIXTURE_OBJECT_NAME
    || input.probeObject.sha256 !== input.sources.probeFixture.sha256
    || input.probeObject.byteLength !== input.sources.probeFixture.byteLength
    || input.probeObject.contentType !== 'video/mp4'
    || !input.probeObject.sourceGenerationBoundServerSideCopy
    || input.probeObject.sourceCoordinateDigestSha256 !==
      sha256AuthorityValue(input.sources.probeFixture)
  ) throw new Error('SAM 3.1 qualification staged object changed.')
}

async function assertSourceMetadata(
  file: File,
  source: z.infer<typeof sourceCoordinateSchema>,
): Promise<void> {
  const [metadata] = await file.getMetadata()
  if (
    String(metadata.generation ?? '') !== source.generation
    || String(metadata.etag ?? '') !== source.etag
    || Number(metadata.size ?? -1) !== source.byteLength
    || String(metadata.contentType ?? '') !== source.contentType
  ) throw new Error('SAM 3.1 qualification source generation changed.')
}

async function rereadTarget(input: {
  bucket: Bucket
  targetName: string
  objectName:
    | typeof REQUEST_OBJECT_NAME
    | typeof CHECKPOINT_OBJECT_NAME
    | typeof FIXTURE_OBJECT_NAME
  expectedSha256: string
  expectedLength: number
  expectedContentType: string
  sourceCopy: boolean
  expectedSourceCoordinateDigestSha256: string | null
  downloadAndHash: boolean
}): Promise<CanonicalSam31QualificationStagedObject> {
  if (
    !rawSha256.safeParse(input.expectedSha256).success
    || !Number.isSafeInteger(input.expectedLength)
    || input.expectedLength < 2
  ) throw new Error('SAM 3.1 qualification target expectation invalid.')
  const [metadata] = await input.bucket.file(input.targetName).getMetadata()
  const generationValue = String(metadata.generation ?? '')
  const etagValue = String(metadata.etag ?? '')
  const contentType = String(metadata.contentType ?? '')
  const length = Number(metadata.size ?? -1)
  const kmsKeyName = String(metadata.kmsKeyName ?? '')
  const custom = customMetadata(metadata as unknown as Record<string, unknown>)
  if (
    !generation.safeParse(generationValue).success
    || !etag.safeParse(etagValue).success
    || length !== input.expectedLength
    || contentType !== input.expectedContentType
    || kmsKeyName !== TARGET_KMS_KEY
    || custom.weeditproSha256 !== input.expectedSha256
    || custom.weeditproCreateOnly !== 'true'
    || (input.sourceCopy
      ? !rawSha256.safeParse(
        input.expectedSourceCoordinateDigestSha256,
      ).success
        || custom.weeditproSourceCoordinateDigestSha256 !==
          input.expectedSourceCoordinateDigestSha256
      : input.expectedSourceCoordinateDigestSha256 !== null
        || custom.weeditproSourceCoordinateDigestSha256 !== undefined)
  ) throw new Error('SAM 3.1 qualification target metadata changed.')
  const exact = input.bucket.file(input.targetName, {
    generation: generationValue,
  })
  if (input.downloadAndHash) {
    const [body] = await exact.download({ validation: 'crc32c' })
    if (body.byteLength !== length || digest(body) !== input.expectedSha256) {
      throw new Error('SAM 3.1 qualification target bytes changed.')
    }
  }
  const [stable] = await exact.getMetadata()
  if (
    String(stable.generation ?? '') !== generationValue
    || String(stable.etag ?? '') !== etagValue
    || Number(stable.size ?? -1) !== length
    || String(stable.contentType ?? '') !== contentType
  ) throw new Error('SAM 3.1 qualification target changed during reread.')
  return stagedObjectSchema.parse({
    objectName: input.objectName,
    generation: generationValue,
    etag: etagValue,
    byteLength: length,
    sha256: input.expectedSha256,
    contentType,
    destinationKmsKeyName: TARGET_KMS_KEY,
    exactDestinationGenerationEtagLengthSha256AndContentTypeReread: true,
    sourceGenerationBoundServerSideCopy: input.sourceCopy,
    sourceCoordinateDigestSha256:
      input.expectedSourceCoordinateDigestSha256,
    createOnly: true,
  })
}

function assertObservationMatchesWorker(input: {
  observation: CanonicalSam31QualificationA100MountObservation
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
}): void {
  if (
    input.observation.qualificationId !== input.workerRequest.qualificationId
    || !sameRef(input.observation.workerRequestRef,
      workerRequestRef(input.workerRequest))
    || input.observation.checkpointObject.byteLength !==
      input.workerRequest.checkpoint.byteLength
    || input.observation.checkpointObject.sha256 !==
      input.workerRequest.checkpoint.sha256
    || input.observation.probeFixtureObject.byteLength !==
      input.workerRequest.deterministicProbeFixture.byteLength
    || input.observation.probeFixtureObject.sha256 !==
      input.workerRequest.deterministicProbeFixture.sha256
  ) throw new Error('SAM 3.1 qualification mount crossed worker request.')
}

function assertObservationMatchesFoundation(input: {
  observation: CanonicalSam31QualificationA100MountObservation
  refs: ReturnType<
    typeof canonicalSam31A100QualificationFoundationResourceRefs
  >
}): void {
  if (
    !sameRef(input.observation.foundationResourceRef,
      input.refs.foundationResourceRef)
    || !sameRef(input.observation.stagingAuthorityRef,
      input.refs.stagingAuthorityRef)
    || !sameRef(input.observation.serviceIdentityRef,
      input.refs.serviceIdentityRef)
    || !sameRef(input.observation.privateNetworkPolicyRef,
      input.refs.privateNetworkPolicyRef)
    || !sameRef(input.observation.instanceTemplateRef,
      input.refs.instanceTemplateRef)
  ) throw new Error('SAM 3.1 qualification mount crossed foundation.')
}

async function assertPersistedStagingMatchesObservation(input: {
  port: CanonicalSam31QualificationPrivateStagingPort
  observation: CanonicalSam31QualificationA100MountObservation
}): Promise<void> {
  const remoteSubdirectory = input.observation.attemptRemoteSubdirectory
  if (await input.port.resultObjectExists({ remoteSubdirectory })) {
    throw new Error('SAM 3.1 qualification result already exists.')
  }
  const observedObjects = await Promise.all([
    input.port.rereadStagedObject({
      remoteSubdirectory,
      objectName: REQUEST_OBJECT_NAME,
    }),
    input.port.rereadStagedObject({
      remoteSubdirectory,
      objectName: CHECKPOINT_OBJECT_NAME,
    }),
    input.port.rereadStagedObject({
      remoteSubdirectory,
      objectName: FIXTURE_OBJECT_NAME,
    }),
  ])
  const expectedObjects = [
    input.observation.requestObject,
    input.observation.checkpointObject,
    input.observation.probeFixtureObject,
  ]
  for (let index = 0; index < expectedObjects.length; index += 1) {
    const observed = stagedObjectSchema.parse(observedObjects[index])
    const expected = expectedObjects[index]
    if (
      observed.objectName !== expected.objectName
      || observed.generation !== expected.storageGeneration
      || observed.etag !== expected.storageEtag
      || observed.byteLength !== expected.byteLength
      || observed.sha256 !== expected.sha256
      || !observed.createOnly
      || !observed.exactDestinationGenerationEtagLengthSha256AndContentTypeReread
    ) throw new Error('SAM 3.1 qualification staged object changed.')
  }
  const names = await input.port.listAttemptObjectNames({
    remoteSubdirectory,
  })
  const expectedNames = [
    `${remoteSubdirectory}/${CHECKPOINT_OBJECT_NAME}`,
    `${remoteSubdirectory}/${FIXTURE_OBJECT_NAME}`,
    `${remoteSubdirectory}/${REQUEST_OBJECT_NAME}`,
  ].sort(utf16LexicalCompare)
  if (stableAuthorityStringify([...names]) !==
    stableAuthorityStringify(expectedNames)) {
    throw new Error('SAM 3.1 qualification staging object set changed.')
  }
}

async function persistObservationCreateOnly(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  observation: CanonicalSam31QualificationA100MountObservation
}): Promise<void> {
  const body = Buffer.from(
    stableAuthorityStringify(input.observation),
    'utf8',
  )
  await input.port.createOnly({
    objectPath: observationPath(input.observation.attemptId),
    body,
    contentSha256: digest(body),
  })
}

async function rereadObservation(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  attemptId: string
}): Promise<CanonicalSam31QualificationA100MountObservation | null> {
  const body = await input.port.readExact(observationPath(input.attemptId))
  if (!body) return null
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 qualification mount JSON is invalid.')
  }
  return assertCanonicalSam31QualificationA100MountObservation(value)
}

function observationPath(attemptId: string): string {
  safeId.parse(attemptId)
  return 'private/sam3_1/source-checkpoint-qualification/v1/mounts/'
    + `${sha256AuthorityValue(attemptId)}.json`
}

function targetNameFor(remoteSubdirectory: string, name: string): string {
  assertRemoteSubdirectory(remoteSubdirectory)
  if (![REQUEST_OBJECT_NAME, CHECKPOINT_OBJECT_NAME, FIXTURE_OBJECT_NAME,
    RESULT_OBJECT_NAME].includes(name as never)) {
    throw new Error('SAM 3.1 qualification target object name is invalid.')
  }
  return `${remoteSubdirectory}/${name}`
}

function assertRemoteSubdirectory(value: string): void {
  if (!/^private\/sam3_1\/source-checkpoint-qualification\/v1\/attempts\/[a-f0-9]{64}$/u
    .test(value)) {
    throw new Error('SAM 3.1 qualification remote subdirectory is invalid.')
  }
}

function workerRequestRef(
  value: CanonicalSam31SourceCheckpointQualificationWorkerRequest,
) {
  return evidenceRefSchema.parse({
    id: value.qualificationId,
    version: value.qualificationVersion,
    contentHash: `sha256:${value.requestHash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function customMetadata(value: Record<string, unknown>): Record<string, string> {
  const custom = value.metadata
  if (!custom || typeof custom !== 'object') return {}
  return Object.fromEntries(Object.entries(custom).map(([key, item]) => [
    key,
    String(item),
  ]))
}

function utf16LexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function assertDependencies(
  input: CanonicalSam31QualificationStagingOwnerDependencies,
): void {
  if (
    typeof input.foundationReadPort?.rereadCurrentFoundation !== 'function'
    || typeof input.sourceReadPort?.rereadExactSources !== 'function'
    || input.stagingPort?.schemaVersion !==
      CANONICAL_SAM3_1_QUALIFICATION_GCS_STAGING_PORT_VERSION
    || typeof input.stagingPort?.createRequestJsonOnly !== 'function'
    || typeof input.stagingPort?.copySourceObjectCreateOnly !== 'function'
    || typeof input.stagingPort?.rereadStagedObject !== 'function'
    || typeof input.stagingPort?.resultObjectExists !== 'function'
    || typeof input.stagingPort?.listAttemptObjectNames !== 'function'
    || typeof input.observationObjectPort?.createOnly !== 'function'
    || typeof input.observationObjectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification staging dependencies invalid.')
}

function digest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const code = Reflect.get(error, 'code')
  return typeof code === 'number' ? code : undefined
}
