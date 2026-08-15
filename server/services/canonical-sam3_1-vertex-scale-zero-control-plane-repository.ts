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
  assertCanonicalSam31VertexScaleZeroControlPlaneObservation,
  assertCanonicalSam31VertexScaleZeroControlPlaneSubmission,
  type CanonicalSam31VertexScaleZeroControlPlaneObservation,
  type CanonicalSam31VertexScaleZeroControlPlaneSubmission,
} from './canonical-sam3_1-vertex-scale-zero-control-plane'
import {
  assertCanonicalSam31VertexScaleZeroDeploymentRequest,
  type CanonicalSam31VertexScaleZeroDeploymentRequest,
} from './canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'
import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_REPOSITORY_VERSION =
  'canonical-sam3_1-vertex-scale-zero-control-plane-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-scale-zero-control-plane'
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
export type CanonicalSam31VertexScaleZeroControlPlaneRef = z.infer<
  typeof refSchema
>
type Ref = CanonicalSam31VertexScaleZeroControlPlaneRef

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-vertex-scale-zero-request-consumption-v1',
  ),
  source: z.literal(
    'canonical_backend_sam3_1_vertex_scale_zero_control_plane_repository',
  ),
  deploymentProfileRef: refSchema,
  requestRef: refSchema,
  stage: z.enum(['model_upload', 'endpoint_create', 'model_deploy']),
  requestDigestSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  consumedAt: z.string().datetime({ offset: true }),
  createOnly: z.literal(true),
  providerCallMayStartOnlyAfterThisRecord: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict().superRefine((value, context) => {
  const { consumptionHash, ...payload } = value
  if (consumptionHash !== sha256AuthorityValue(payload)) context.addIssue({
    code: 'custom',
    message: 'Vertex scale-zero request consumption digest changed.',
  })
})
export type CanonicalSam31VertexScaleZeroRequestConsumption = z.infer<
  typeof consumptionSchema
>

export interface CanonicalSam31VertexScaleZeroControlPlaneRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_REPOSITORY_VERSION
  persistDeploymentProfile(
    value: CanonicalSam31VertexScaleZeroDeploymentProfile,
  ): Promise<Ref>
  rereadDeploymentProfile(reference: Ref): Promise<
    CanonicalSam31VertexScaleZeroDeploymentProfile | null
  >
  persistRequest(
    value: CanonicalSam31VertexScaleZeroDeploymentRequest,
  ): Promise<Ref>
  rereadRequest(reference: Ref): Promise<
    CanonicalSam31VertexScaleZeroDeploymentRequest | null
  >
  consumeRequestCreateOnly(input: {
    readonly deploymentProfileRef: Ref
    readonly requestRef: Ref
    readonly consumedAt: string
  }): Promise<{
    readonly created: boolean
    readonly consumptionRef: Ref
    readonly consumption: CanonicalSam31VertexScaleZeroRequestConsumption
  }>
  persistSubmission(input: {
    readonly requestRef: Ref
    readonly submission: CanonicalSam31VertexScaleZeroControlPlaneSubmission
  }): Promise<Ref>
  rereadSubmission(reference: Ref): Promise<
    CanonicalSam31VertexScaleZeroControlPlaneSubmission | null
  >
  rereadSubmissionForRequest(requestRef: Ref): Promise<
    CanonicalSam31VertexScaleZeroControlPlaneSubmission | null
  >
  persistObservation(input: {
    readonly submissionRef: Ref
    readonly observation: CanonicalSam31VertexScaleZeroControlPlaneObservation
  }): Promise<Ref>
  rereadObservation(reference: Ref): Promise<
    CanonicalSam31VertexScaleZeroControlPlaneObservation | null
  >
}

export function createCanonicalSam31VertexScaleZeroControlPlaneRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexScaleZeroControlPlaneRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw new Error('Vertex scale-zero control-plane repository is absent.')
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_REPOSITORY_VERSION,
    async persistDeploymentProfile(
      value: CanonicalSam31VertexScaleZeroDeploymentProfile,
    ) {
      assertPlainSerializedData(value, 'vertex_scale_zero_deployment_profile')
      const parsed = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        value,
      )
      const reference = deploymentProfileRef(parsed)
      await persist(input.objectPort,
        recordPath(prefix, 'deployment-profiles', reference), parsed)
      return reference
    },
    async rereadDeploymentProfile(value: Ref) {
      const reference = refSchema.parse(value)
      const profile = await read(input.objectPort,
        recordPath(prefix, 'deployment-profiles', reference),
        assertCanonicalSam31VertexScaleZeroDeploymentProfile)
      if (profile && !sameRef(reference, deploymentProfileRef(profile))) {
        throw new Error('Vertex scale-zero deployment profile ref changed.')
      }
      return profile
    },
    async persistRequest(
      value: CanonicalSam31VertexScaleZeroDeploymentRequest,
    ) {
      assertPlainSerializedData(value, 'vertex_scale_zero_request_record')
      const parsed =
        assertCanonicalSam31VertexScaleZeroDeploymentRequest(value)
      const reference = requestRef(parsed)
      await persist(input.objectPort, recordPath(prefix, 'requests', reference),
        parsed)
      return reference
    },
    async rereadRequest(value: Ref) {
      const reference = refSchema.parse(value)
      const request = await read(input.objectPort,
        recordPath(prefix, 'requests', reference),
        assertCanonicalSam31VertexScaleZeroDeploymentRequest)
      if (request && !sameRef(reference, requestRef(request))) {
        throw new Error('Vertex scale-zero request reference changed.')
      }
      return request
    },
    async consumeRequestCreateOnly(untrusted: {
      readonly deploymentProfileRef: Ref
      readonly requestRef: Ref
      readonly consumedAt: string
    }) {
      assertPlainSerializedData(untrusted,
        'vertex_scale_zero_request_consumption')
      const deploymentProfileRefValue = refSchema.parse(
        untrusted.deploymentProfileRef,
      )
      const requestRefValue = refSchema.parse(untrusted.requestRef)
      const consumedAt = z.string().datetime({ offset: true }).parse(
        untrusted.consumedAt,
      )
      const [profile, request] = await Promise.all([
        read(input.objectPort,
          recordPath(prefix, 'deployment-profiles', deploymentProfileRefValue),
          assertCanonicalSam31VertexScaleZeroDeploymentProfile),
        read(input.objectPort,
          recordPath(prefix, 'requests', requestRefValue),
          assertCanonicalSam31VertexScaleZeroDeploymentRequest),
      ])
      if (
        !profile
        || !request
        || !sameRef(deploymentProfileRefValue, deploymentProfileRef(profile))
        || !sameRef(requestRefValue, requestRef(request))
        || request.profileHash !== profile.profileHash
        || consumedAt !== profile.recordedAt
      ) throw new Error('Vertex request consumption crossed deployment scope.')
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion:
          'canonical-sam3_1-vertex-scale-zero-request-consumption-v1',
        source:
          'canonical_backend_sam3_1_vertex_scale_zero_control_plane_repository',
        deploymentProfileRef: deploymentProfileRefValue,
        requestRef: requestRefValue,
        stage: request.stage,
        requestDigestSha256: request.requestDigestSha256,
        consumedAt,
        createOnly: true,
        providerCallMayStartOnlyAfterThisRecord: true,
        automaticRetryAllowed: false,
        customerRequestOrGpuInferenceStarted: false,
        walletOrCreditMutationAuthorityGranted: false,
        publicDeliveryAuthorityGranted: false,
        productionAuthorityGranted: false,
      })
      const candidate = consumptionSchema.parse({
        ...payload,
        consumptionHash: sha256AuthorityValue(payload),
      })
      const objectPath = recordPath(prefix, 'request-consumptions',
        requestRefValue)
      const body = Buffer.from(stableAuthorityStringify(candidate), 'utf8')
      const result = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const existing = await read(input.objectPort, objectPath,
        (value) => consumptionSchema.parse(value))
      if (!existing) {
        throw new Error('Vertex request consumption reread is absent.')
      }
      if (
        existing.deploymentProfileRef.contentHash !==
          deploymentProfileRefValue.contentHash
        || existing.requestRef.contentHash !== requestRefValue.contentHash
        || existing.stage !== request.stage
        || existing.requestDigestSha256 !== request.requestDigestSha256
      ) throw new Error('Vertex request consumption collision changed.')
      return Object.freeze({
        created: result === 'created',
        consumptionRef: consumptionRef(existing),
        consumption: existing,
      })
    },
    async persistSubmission(untrusted: {
      readonly requestRef: Ref
      readonly submission: CanonicalSam31VertexScaleZeroControlPlaneSubmission
    }) {
      assertPlainSerializedData(untrusted,
        'vertex_scale_zero_submission_record')
      const requestRefValue = refSchema.parse(untrusted.requestRef)
      const submission =
        assertCanonicalSam31VertexScaleZeroControlPlaneSubmission(
          untrusted.submission,
        )
      const request = await read(input.objectPort,
        recordPath(prefix, 'requests', requestRefValue),
        assertCanonicalSam31VertexScaleZeroDeploymentRequest)
      if (
        !request
        || !sameRef(requestRefValue, requestRef(request))
        || request.stage !== submission.stage
        || request.requestDigestSha256 !== submission.requestDigestSha256
      ) throw new Error('Vertex scale-zero submission crossed request.')
      const reference = submissionRef(submission)
      await persist(input.objectPort,
        recordPath(prefix, 'request-submissions', requestRefValue), submission)
      await persist(input.objectPort,
        recordPath(prefix, 'submissions', reference), submission)
      return reference
    },
    async rereadSubmission(value: Ref) {
      const reference = refSchema.parse(value)
      const submission = await read(input.objectPort,
        recordPath(prefix, 'submissions', reference),
        assertCanonicalSam31VertexScaleZeroControlPlaneSubmission)
      if (submission && !sameRef(reference, submissionRef(submission))) {
        throw new Error('Vertex scale-zero submission reference changed.')
      }
      return submission
    },
    async rereadSubmissionForRequest(value: Ref) {
      const requestRefValue = refSchema.parse(value)
      const request = await read(input.objectPort,
        recordPath(prefix, 'requests', requestRefValue),
        assertCanonicalSam31VertexScaleZeroDeploymentRequest)
      if (!request || !sameRef(requestRefValue, requestRef(request))) {
        throw new Error('Vertex request-scoped submission request is absent.')
      }
      const submission = await read(input.objectPort,
        recordPath(prefix, 'request-submissions', requestRefValue),
        assertCanonicalSam31VertexScaleZeroControlPlaneSubmission)
      if (
        submission
        && (
          submission.stage !== request.stage
          || submission.requestDigestSha256 !== request.requestDigestSha256
        )
      ) throw new Error('Vertex request-scoped submission lineage changed.')
      return submission
    },
    async persistObservation(untrusted: {
      readonly submissionRef: Ref
      readonly observation: CanonicalSam31VertexScaleZeroControlPlaneObservation
    }) {
      assertPlainSerializedData(untrusted,
        'vertex_scale_zero_observation_record')
      const submissionRefValue = refSchema.parse(untrusted.submissionRef)
      const observation =
        assertCanonicalSam31VertexScaleZeroControlPlaneObservation(
          untrusted.observation,
        )
      const submission = await read(input.objectPort,
        recordPath(prefix, 'submissions', submissionRefValue),
        assertCanonicalSam31VertexScaleZeroControlPlaneSubmission)
      if (
        !submission
        || !sameRef(submissionRefValue, submissionRef(submission))
        || submission.stage !== observation.stage
        || submission.requestDigestSha256 !==
          observation.requestDigestSha256
        || submission.submissionHash !== observation.submissionHash
      ) throw new Error('Vertex scale-zero observation crossed submission.')
      const reference = observationRef(observation)
      await persist(input.objectPort,
        recordPath(prefix, 'observations', reference), observation)
      return reference
    },
    async rereadObservation(value: Ref) {
      const reference = refSchema.parse(value)
      const observation = await read(input.objectPort,
        recordPath(prefix, 'observations', reference),
        assertCanonicalSam31VertexScaleZeroControlPlaneObservation)
      if (observation && !sameRef(reference, observationRef(observation))) {
        throw new Error('Vertex scale-zero observation reference changed.')
      }
      return observation
    },
  })
}

function deploymentProfileRef(
  value: CanonicalSam31VertexScaleZeroDeploymentProfile,
): Ref {
  return refSchema.parse({
    id: `sam31-vertex-deployment-profile-${value.profileHash.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${value.profileHash}`,
  })
}

export function createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31VertexScaleZeroControlPlaneRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Vertex scale-zero repository project changed.')
  }
  return createCanonicalSam31VertexScaleZeroControlPlaneRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

function requestRef(
  value: CanonicalSam31VertexScaleZeroDeploymentRequest,
): Ref {
  return refSchema.parse({
    id: `sam31-vertex-${value.stage}-request-${value.requestDigestSha256.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${value.requestDigestSha256}`,
  })
}

function submissionRef(
  value: CanonicalSam31VertexScaleZeroControlPlaneSubmission,
): Ref {
  return refSchema.parse({
    id: `sam31-vertex-${value.stage}-submission-${value.submissionHash.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${value.submissionHash}`,
  })
}

function observationRef(
  value: CanonicalSam31VertexScaleZeroControlPlaneObservation,
): Ref {
  return refSchema.parse({
    id: `sam31-vertex-${value.stage}-observation-${value.observationHash.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${value.observationHash}`,
  })
}

function consumptionRef(
  value: CanonicalSam31VertexScaleZeroRequestConsumption,
): Ref {
  return refSchema.parse({
    id: `sam31-vertex-${value.stage}-consumption-${value.consumptionHash.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${value.consumptionHash}`,
  })
}

async function persist(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  const contentSha256 = createHash('sha256').update(body).digest('hex')
  await port.createOnly({ objectPath, body, contentSha256 })
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('Vertex scale-zero create-only reread changed.')
  }
}

async function read<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  let decoded: unknown
  try { decoded = JSON.parse(body.toString('utf8')) } catch {
    throw new Error('Vertex scale-zero repository JSON is invalid.')
  }
  const parsed = parse(decoded)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('Vertex scale-zero repository bytes changed.')
  }
  return structuredClone(parsed)
}

function recordPath(prefix: string, kind: string, reference: Ref): string {
  return `${prefix}/${kind}/${reference.id}-v${reference.version}-${reference.contentHash.slice(7)}.json`
}

function sameRef(left: Ref, right: Ref): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
