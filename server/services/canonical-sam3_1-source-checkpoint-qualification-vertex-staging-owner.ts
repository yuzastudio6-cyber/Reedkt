import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  type CanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationStagingSourceSetForWorker,
  type CanonicalSam31QualificationPrivateStagingPort,
  type CanonicalSam31QualificationStagingSourceReadPort,
  type CanonicalSam31QualificationStagingSourceSet,
} from './canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import type {
  CanonicalSam31QualificationWorkerRequestReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import { assertPlainSerializedData } from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_STAGING_VERSION =
  'canonical-sam3_1-vertex-source-checkpoint-staging-observation-v1' as const

const TARGET_BUCKET =
  'reeditpro-production-sam31-qualification-private' as const
const TARGET_KMS_KEY =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const
const REQUEST_OBJECT_NAME = 'request/request.json' as const
const CHECKPOINT_OBJECT_NAME = 'checkpoint/sam3.1_multiplex.pt' as const
const FIXTURE_OBJECT_NAME = 'fixture/probe-person.mp4' as const
const RESULT_OBJECT_NAME = 'result/result.json' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const stagedObjectSchema = z.object({
  objectName: z.enum([
    REQUEST_OBJECT_NAME,
    CHECKPOINT_OBJECT_NAME,
    FIXTURE_OBJECT_NAME,
  ]),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: z.number().int().positive().safe(),
  sha256,
  contentType: z.enum([
    'application/json', 'application/octet-stream', 'video/mp4',
  ]),
  destinationKmsKeyName: z.literal(TARGET_KMS_KEY),
  exactDestinationGenerationEtagLengthSha256AndContentTypeReread:
    z.literal(true),
  sourceGenerationBoundServerSideCopy: z.boolean(),
  sourceCoordinateDigestSha256: sha256.nullable(),
  createOnly: z.literal(true),
}).strict()

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_STAGING_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_staging_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  attemptDigestSha256: sha256,
  qualificationId: safeId,
  workerRequestRef: evidenceRefSchema,
  historicalPackageRequestRef: evidenceRefSchema,
  privateBucketName: z.literal(TARGET_BUCKET),
  remoteSubdirectory: z.string().regex(
    /^private\/sam3_1\/source-checkpoint-qualification\/v2\/attempts\/[a-f0-9]{64}$/u,
  ),
  vertexCloudStorageFuseRoot: z.string().regex(
    /^\/gcs\/reeditpro-production-sam31-qualification-private\/private\/sam3_1\/source-checkpoint-qualification\/v2\/attempts\/[a-f0-9]{64}$/u,
  ),
  requestObject: stagedObjectSchema.extend({
    objectName: z.literal(REQUEST_OBJECT_NAME),
  }).strict(),
  checkpointObject: stagedObjectSchema.extend({
    objectName: z.literal(CHECKPOINT_OBJECT_NAME),
  }).strict(),
  probeFixtureObject: stagedObjectSchema.extend({
    objectName: z.literal(FIXTURE_OBJECT_NAME),
  }).strict(),
  resultObjectName: z.literal(RESULT_OBJECT_NAME),
  resultObjectAbsentBeforeLaunch: z.literal(true),
  exactRequestCheckpointFixtureObjectSetReread: z.literal(true),
  checkpointAndFixtureCopiedServerSideFromExactGenerations: z.literal(true),
  attemptScopeDerivedOnlyFromServerAttemptId: z.literal(true),
  callerBucketObjectPrefixPathUrlBytesOrCredentialsAccepted: z.literal(false),
  signedOrPublicUrlUsed: z.literal(false),
  modelOrGpuRuntimeStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const digest = sha256AuthorityValue(value.attemptId)
  if (
    value.attemptDigestSha256 !== digest
    || value.remoteSubdirectory !==
      `private/sam3_1/source-checkpoint-qualification/v2/attempts/${digest}`
    || value.vertexCloudStorageFuseRoot !==
      `/gcs/${TARGET_BUCKET}/${value.remoteSubdirectory}`
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex qualification staging lost exact attempt scope.',
  })
})

export const canonicalSam31VertexQualificationStagingObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationStagingObservation = z.infer<
  typeof canonicalSam31VertexQualificationStagingObservationSchema
>

export function createCanonicalSam31VertexQualificationStagingOwner(input: {
  readonly historicalWorkerRequestReadPort:
    CanonicalSam31QualificationWorkerRequestReadPort
  readonly historicalSourceReadPort:
    CanonicalSam31QualificationStagingSourceReadPort
  readonly stagingPort: CanonicalSam31QualificationPrivateStagingPort
  readonly observationObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly now?: () => string
}) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async stageOne(value: {
      readonly workerRequest: unknown
    }): Promise<CanonicalSam31VertexQualificationStagingObservation> {
      assertPlainSerializedData(value, 'sam31_vertex_staging_request')
      const request =
        assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
          value.workerRequest,
        )
      const prior = await rereadObservation({
        port: input.observationObjectPort,
        attemptId: request.attemptId,
      })
      if (prior) {
        assertObservationRequestMatch(prior, request)
        await assertStagedSet({
          port: input.stagingPort,
          observation: prior,
        })
        return prior
      }
      const historical = assertHistoricalRequest(
        await input.historicalWorkerRequestReadPort.rereadExactWorkerRequest({
          workerRequestRef: {
            id: request.historicalPackageRequestRef.id,
            version: request.historicalPackageRequestRef.version,
            contentHash: request.historicalPackageRequestRef.contentHash,
          },
        }),
        request,
      )
      const sources =
        assertCanonicalSam31QualificationStagingSourceSetForWorker(
          await input.historicalSourceReadPort.rereadExactSources({
            workerRequest: historical,
          }),
          historical,
        )
      assertSourceLineageMatchesVertexRequest({ sources, request })
      const remoteSubdirectory =
        `private/sam3_1/source-checkpoint-qualification/v2/attempts/`
        + request.attemptDigestSha256
      if (await input.stagingPort.resultObjectExists({ remoteSubdirectory })) {
        throw new Error('Vertex qualification result already exists.')
      }
      const body = Buffer.from(stableAuthorityStringify(request), 'utf8')
      const requestSha256 = digest(body)
      await input.stagingPort.createRequestJsonOnly({
        remoteSubdirectory,
        body,
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
      const probeFixtureObject = stagedObjectSchema.parse(
        await input.stagingPort.rereadStagedObject({
          remoteSubdirectory,
          objectName: FIXTURE_OBJECT_NAME,
        }),
      )
      assertObjectsMatch({
        requestObject,
        checkpointObject,
        probeFixtureObject,
        requestSha256,
        bodyLength: body.byteLength,
        request,
      })
      const names = await input.stagingPort.listAttemptObjectNames({
        remoteSubdirectory,
      })
      const expected = [
        `${remoteSubdirectory}/${CHECKPOINT_OBJECT_NAME}`,
        `${remoteSubdirectory}/${FIXTURE_OBJECT_NAME}`,
        `${remoteSubdirectory}/${REQUEST_OBJECT_NAME}`,
      ].sort(utf16LexicalCompare)
      if (
        stableAuthorityStringify([...names]) !==
          stableAuthorityStringify(expected)
        || await input.stagingPort.resultObjectExists({ remoteSubdirectory })
      ) throw new Error('Vertex qualification staged object set changed.')
      const payload = observationWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_STAGING_VERSION,
        source: 'canonical_server_sam3_1_vertex_qualification_staging_owner',
        evidenceClass: 'canonical_private_reread',
        attemptId: request.attemptId,
        attemptDigestSha256: request.attemptDigestSha256,
        qualificationId: request.qualificationId,
        workerRequestRef: vertexRequestRef(request),
        historicalPackageRequestRef: {
          id: request.historicalPackageRequestRef.id,
          version: request.historicalPackageRequestRef.version,
          contentHash: request.historicalPackageRequestRef.contentHash,
        },
        privateBucketName: TARGET_BUCKET,
        remoteSubdirectory,
        vertexCloudStorageFuseRoot: `/gcs/${TARGET_BUCKET}/${remoteSubdirectory}`,
        requestObject,
        checkpointObject,
        probeFixtureObject,
        resultObjectName: RESULT_OBJECT_NAME,
        resultObjectAbsentBeforeLaunch: true,
        exactRequestCheckpointFixtureObjectSetReread: true,
        checkpointAndFixtureCopiedServerSideFromExactGenerations: true,
        attemptScopeDerivedOnlyFromServerAttemptId: true,
        callerBucketObjectPrefixPathUrlBytesOrCredentialsAccepted: false,
        signedOrPublicUrlUsed: false,
        modelOrGpuRuntimeStarted: false,
        customerCreditsMutated: false,
        productionAuthorityGranted: false,
        observedAt: now(),
      })
      const observation =
        canonicalSam31VertexQualificationStagingObservationSchema.parse({
          ...payload,
          observationHash: sha256AuthorityValue(payload),
        })
      await persistObservation(input.observationObjectPort, observation)
      const reread = await rereadObservation({
        port: input.observationObjectPort,
        attemptId: request.attemptId,
      })
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(observation)) {
        throw new Error('Vertex qualification staging persistence changed.')
      }
      return reread
    },

    async rereadExact(inputValue: {
      readonly workerRequest: unknown
    }): Promise<CanonicalSam31VertexQualificationStagingObservation | null> {
      const request =
        assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
          inputValue.workerRequest,
        )
      const observation = await rereadObservation({
        port: input.observationObjectPort,
        attemptId: request.attemptId,
      })
      if (!observation) return null
      assertObservationRequestMatch(observation, request)
      await assertStagedSet({ port: input.stagingPort, observation })
      return observation
    },
  })
}

export function assertCanonicalSam31VertexQualificationStagingObservation(
  value: unknown,
): CanonicalSam31VertexQualificationStagingObservation {
  assertPlainSerializedData(value, 'sam31_vertex_staging_observation')
  const parsed = canonicalSam31VertexQualificationStagingObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification staging observation hash changed.')
  }
  return parsed
}

function assertHistoricalRequest(
  value: unknown,
  vertex: CanonicalSam31VertexSourceCheckpointWorkerRequest,
): CanonicalSam31SourceCheckpointQualificationWorkerRequest {
  if (!value) throw new Error('Historical qualification package is missing.')
  const historical =
    assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(value)
  if (
    historical.qualificationId !== vertex.qualificationId
    || historical.requestHash !==
      vertex.historicalPackageRequestRef.contentHash.slice(7)
    || stableAuthorityStringify(packagePayload(historical)) !==
      stableAuthorityStringify(packagePayload(vertex))
  ) throw new Error('Vertex qualification crossed historical package bytes.')
  return historical
}

function packagePayload(value:
  | CanonicalSam31SourceCheckpointQualificationWorkerRequest
  | CanonicalSam31VertexSourceCheckpointWorkerRequest) {
  return {
    source: value.source,
    evidenceClass: value.evidenceClass,
    qualificationId: value.qualificationId,
    operationId: value.operationId,
    candidateRef: value.candidateRef,
    officialArtifactPublicationRef: value.officialArtifactPublicationRef,
    ingestReceiptRef: value.ingestReceiptRef,
    qualificationImage: value.qualificationImage,
    sourceArchive: value.sourceArchive,
    patchedSourceArchive: value.patchedSourceArchive,
    checkpoint: value.checkpoint,
    dependencyClosure: value.dependencyClosure,
    sourceCodeSecurityReviewRef: value.sourceCodeSecurityReviewRef,
    deterministicProbeFixture: value.deterministicProbeFixture,
  }
}

function assertSourceLineageMatchesVertexRequest(input: {
  sources: CanonicalSam31QualificationStagingSourceSet
  request: CanonicalSam31VertexSourceCheckpointWorkerRequest
}) {
  if (
    input.sources.checkpoint.byteLength !== input.request.checkpoint.byteLength
    || input.sources.checkpoint.sha256 !== input.request.checkpoint.sha256
    || input.sources.probeFixture.byteLength !==
      input.request.deterministicProbeFixture.byteLength
    || input.sources.probeFixture.sha256 !==
      input.request.deterministicProbeFixture.sha256
  ) throw new Error('Vertex qualification staging sources crossed request.')
}

function assertObjectsMatch(input: {
  requestObject: z.infer<typeof stagedObjectSchema>
  checkpointObject: z.infer<typeof stagedObjectSchema>
  probeFixtureObject: z.infer<typeof stagedObjectSchema>
  requestSha256: string
  bodyLength: number
  request: CanonicalSam31VertexSourceCheckpointWorkerRequest
}) {
  if (
    input.requestObject.objectName !== REQUEST_OBJECT_NAME
    || input.requestObject.sha256 !== input.requestSha256
    || input.requestObject.byteLength !== input.bodyLength
    || input.requestObject.sourceGenerationBoundServerSideCopy
    || input.checkpointObject.objectName !== CHECKPOINT_OBJECT_NAME
    || input.checkpointObject.sha256 !== input.request.checkpoint.sha256
    || input.checkpointObject.byteLength !== input.request.checkpoint.byteLength
    || !input.checkpointObject.sourceGenerationBoundServerSideCopy
    || input.probeFixtureObject.objectName !== FIXTURE_OBJECT_NAME
    || input.probeFixtureObject.sha256 !==
      input.request.deterministicProbeFixture.sha256
    || input.probeFixtureObject.byteLength !==
      input.request.deterministicProbeFixture.byteLength
    || !input.probeFixtureObject.sourceGenerationBoundServerSideCopy
  ) throw new Error('Vertex qualification staged object changed.')
}

async function assertStagedSet(input: {
  port: CanonicalSam31QualificationPrivateStagingPort
  observation: CanonicalSam31VertexQualificationStagingObservation
}) {
  if (await input.port.resultObjectExists({
    remoteSubdirectory: input.observation.remoteSubdirectory,
  })) throw new Error('Vertex qualification result already exists.')
  const observed = await Promise.all([
    input.port.rereadStagedObject({
      remoteSubdirectory: input.observation.remoteSubdirectory,
      objectName: REQUEST_OBJECT_NAME,
    }),
    input.port.rereadStagedObject({
      remoteSubdirectory: input.observation.remoteSubdirectory,
      objectName: CHECKPOINT_OBJECT_NAME,
    }),
    input.port.rereadStagedObject({
      remoteSubdirectory: input.observation.remoteSubdirectory,
      objectName: FIXTURE_OBJECT_NAME,
    }),
  ])
  const expected = [
    input.observation.requestObject,
    input.observation.checkpointObject,
    input.observation.probeFixtureObject,
  ]
  for (let index = 0; index < expected.length; index += 1) {
    if (stableAuthorityStringify(stagedObjectSchema.parse(observed[index])) !==
      stableAuthorityStringify(expected[index])) {
      throw new Error('Vertex qualification staged object reread changed.')
    }
  }
}

function assertObservationRequestMatch(
  observation: CanonicalSam31VertexQualificationStagingObservation,
  request: CanonicalSam31VertexSourceCheckpointWorkerRequest,
) {
  if (
    observation.attemptId !== request.attemptId
    || observation.attemptDigestSha256 !== request.attemptDigestSha256
    || !sameRef(observation.workerRequestRef, vertexRequestRef(request))
    || observation.checkpointObject.sha256 !== request.checkpoint.sha256
    || observation.probeFixtureObject.sha256 !==
      request.deterministicProbeFixture.sha256
  ) throw new Error('Vertex qualification staging crossed request.')
}

async function persistObservation(
  port: CanonicalCreateOnlyJsonObjectPort,
  value: CanonicalSam31VertexQualificationStagingObservation,
) {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  await port.createOnly({
    objectPath: observationPath(value.attemptId),
    body,
    contentSha256: digest(body),
  })
}

async function rereadObservation(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  attemptId: string
}) {
  const body = await input.port.readExact(observationPath(input.attemptId))
  if (!body) return null
  let value: unknown
  try { value = JSON.parse(body.toString('utf8')) } catch {
    throw new Error('Vertex qualification staging JSON is invalid.')
  }
  return assertCanonicalSam31VertexQualificationStagingObservation(value)
}

function observationPath(attemptId: string) {
  safeId.parse(attemptId)
  return 'private/sam3_1/source-checkpoint-qualification/v2/mounts/'
    + `${sha256AuthorityValue(attemptId)}.json`
}

function vertexRequestRef(
  value: CanonicalSam31VertexSourceCheckpointWorkerRequest,
) {
  return evidenceRefSchema.parse({
    id: value.qualificationId,
    version: 2,
    contentHash: `sha256:${value.requestHash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertDependencies(input: {
  historicalWorkerRequestReadPort?: Partial<
    CanonicalSam31QualificationWorkerRequestReadPort
  >
  historicalSourceReadPort?: Partial<
    CanonicalSam31QualificationStagingSourceReadPort
  >
  stagingPort?: Partial<CanonicalSam31QualificationPrivateStagingPort>
  observationObjectPort?: Partial<CanonicalCreateOnlyJsonObjectPort>
}) {
  if (
    typeof input.historicalWorkerRequestReadPort
      ?.rereadExactWorkerRequest !== 'function'
    || typeof input.historicalSourceReadPort?.rereadExactSources !== 'function'
    || typeof input.stagingPort?.createRequestJsonOnly !== 'function'
    || typeof input.stagingPort?.copySourceObjectCreateOnly !== 'function'
    || typeof input.stagingPort?.rereadStagedObject !== 'function'
    || typeof input.stagingPort?.resultObjectExists !== 'function'
    || typeof input.stagingPort?.listAttemptObjectNames !== 'function'
    || typeof input.observationObjectPort?.createOnly !== 'function'
    || typeof input.observationObjectPort?.readExact !== 'function'
  ) throw new Error('Vertex qualification staging dependencies are invalid.')
}

function digest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function utf16LexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
