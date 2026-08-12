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
type Ref = z.infer<typeof refSchema>

export interface CanonicalSam31VertexScaleZeroControlPlaneRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_CONTROL_PLANE_REPOSITORY_VERSION
  persistRequest(
    value: CanonicalSam31VertexScaleZeroDeploymentRequest,
  ): Promise<Ref>
  rereadRequest(reference: Ref): Promise<
    CanonicalSam31VertexScaleZeroDeploymentRequest | null
  >
  persistSubmission(input: {
    readonly requestRef: Ref
    readonly submission: CanonicalSam31VertexScaleZeroControlPlaneSubmission
  }): Promise<Ref>
  rereadSubmission(reference: Ref): Promise<
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
