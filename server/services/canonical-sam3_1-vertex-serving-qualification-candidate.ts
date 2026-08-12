import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingExactDeployment,
  type CanonicalSam31VertexServingExactDeploymentReadPort,
} from './canonical-sam3_1-vertex-serving-deployment-ready-service'
import {
  assertCanonicalSam31VertexServingReadinessProbe,
} from './canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_CANDIDATE_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-candidate-v1' as const

const ENDPOINT_RESOURCE =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-serving-qualification-candidates'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

const candidateWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_CANDIDATE_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_serving_pre_release_qualification_owner',
  ),
  candidateId: safeId,
  deploymentProfileRef: refSchema,
  endpointDeploymentRef: refSchema,
  exactDeploymentObservationRef: refSchema,
  readinessProbeRef: refSchema,
  imageSupplyChainReleaseRef: refSchema,
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  endpointResourceName: z.literal(ENDPOINT_RESOURCE),
  deployedModelId: z.literal('3101000001'),
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  minimumReplicaCount: z.literal(0),
  maximumReplicaCount: z.literal(1),
  exactDeploymentAndDedicatedRouteReread: z.literal(true),
  exactNonCustomerReadinessProbeReread: z.literal(true),
  readyForPrivateQualificationInvocation: z.literal(true),
  readyForCustomerInvocation: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerInvocationStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((candidate, context) => {
  if (
    Date.parse(candidate.expiresAt) <= Date.parse(candidate.observedAt)
    || Date.parse(candidate.expiresAt) - Date.parse(candidate.observedAt)
      > 10 * 60_000
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex qualification candidate validity changed.',
  })
})

export const canonicalSam31VertexServingQualificationCandidateSchema =
  candidateWithoutHashSchema.extend({ candidateHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationCandidate = z.infer<
  typeof canonicalSam31VertexServingQualificationCandidateSchema
>

export interface CanonicalSam31VertexServingQualificationCandidateRepository {
  persistCreateOnly(input: {
    readonly candidate: CanonicalSam31VertexServingQualificationCandidate
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly candidateId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexServingQualificationCandidateService(
  input: {
    readonly exactDeploymentReadPort:
      CanonicalSam31VertexServingExactDeploymentReadPort
    readonly repository:
      CanonicalSam31VertexServingQualificationCandidateRepository
  },
) {
  return Object.freeze({
    async produceOne(untrusted: {
      readonly profile: unknown
      readonly deploymentProfileRef: Ref
      readonly modelUploadObservationRef: Ref
      readonly endpointCreateObservationRef: Ref
      readonly modelDeployObservationRef: Ref
      readonly endpointDeploymentRef: Ref
      readonly readinessProbeRef: Ref
      readonly readinessProbe: unknown
      readonly observedAt: string
      readonly expiresAt: string
    }): Promise<CanonicalSam31VertexServingQualificationCandidate> {
      assertPlainSerializedData(untrusted, 'sam31_vertex_qualification_candidate')
      const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        untrusted.profile,
      )
      const refs = z.object({
        deploymentProfileRef: refSchema,
        modelUploadObservationRef: refSchema,
        endpointCreateObservationRef: refSchema,
        modelDeployObservationRef: refSchema,
        endpointDeploymentRef: refSchema,
        readinessProbeRef: refSchema,
        observedAt: timestamp,
        expiresAt: timestamp,
      }).strict().parse({
        deploymentProfileRef: untrusted.deploymentProfileRef,
        modelUploadObservationRef: untrusted.modelUploadObservationRef,
        endpointCreateObservationRef: untrusted.endpointCreateObservationRef,
        modelDeployObservationRef: untrusted.modelDeployObservationRef,
        endpointDeploymentRef: untrusted.endpointDeploymentRef,
        readinessProbeRef: untrusted.readinessProbeRef,
        observedAt: untrusted.observedAt,
        expiresAt: untrusted.expiresAt,
      })
      if (refs.deploymentProfileRef.contentHash !==
        `sha256:${profile.profileHash}`) {
        throw new Error('Vertex qualification profile reference changed.')
      }
      const probe = assertCanonicalSam31VertexServingReadinessProbe(
        untrusted.readinessProbe,
      )
      if (
        refs.readinessProbeRef.contentHash !== `sha256:${probe.probeHash}`
        || probe.endpointDeploymentRef.contentHash !==
          refs.endpointDeploymentRef.contentHash
        || probe.imageSupplyChainReleaseRef.contentHash !==
          profile.imageSupplyChainReleaseRef.contentHash
        || probe.immutableImageDigest !== profile.immutableImageDigest
        || Date.parse(probe.readyObservedAt) > Date.parse(refs.observedAt)
      ) throw new Error('Vertex qualification readiness lineage changed.')
      const exact = assertCanonicalSam31VertexServingExactDeployment(
        await input.exactDeploymentReadPort.rereadExactDeployment({
          profile,
          deploymentProfileRef: refs.deploymentProfileRef,
          modelUploadObservationRef: refs.modelUploadObservationRef,
          endpointCreateObservationRef: refs.endpointCreateObservationRef,
          modelDeployObservationRef: refs.modelDeployObservationRef,
          at: refs.observedAt,
        }),
      )
      assertExactScope({ profile, refs, exact })
      const exactDeploymentObservationRef = refSchema.parse({
        id: `sam31-a100-exact-deployment-${exact.observationHash.slice(0, 32)}`,
        version: 1,
        contentHash: `sha256:${exact.observationHash}`,
      })
      const candidateId = safeId.parse(
        `sam31-a100-serving-candidate-${sha256AuthorityValue({
          probeHash: probe.probeHash,
          observedAt: refs.observedAt,
          expiresAt: refs.expiresAt,
        }).slice(0, 32)}`,
      )
      const payload = candidateWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_CANDIDATE_VERSION,
        source:
          'canonical_server_vertex_serving_pre_release_qualification_owner',
        candidateId,
        deploymentProfileRef: refs.deploymentProfileRef,
        endpointDeploymentRef: refs.endpointDeploymentRef,
        exactDeploymentObservationRef,
        readinessProbeRef: refs.readinessProbeRef,
        imageSupplyChainReleaseRef: profile.imageSupplyChainReleaseRef,
        immutableImageDigest: profile.immutableImageDigest,
        endpointResourceName: ENDPOINT_RESOURCE,
        deployedModelId: '3101000001',
        routeId: 'a100_80gb_heavy_primary',
        executionTarget:
          'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
        machineType: 'a2-ultragpu-1g',
        accelerator: 'nvidia_a100_80gb',
        minimumReplicaCount: 0,
        maximumReplicaCount: 1,
        exactDeploymentAndDedicatedRouteReread: true,
        exactNonCustomerReadinessProbeReread: true,
        readyForPrivateQualificationInvocation: true,
        readyForCustomerInvocation: false,
        runtimeReleaseGranted: false,
        customerInvocationStarted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt: refs.observedAt,
        expiresAt: refs.expiresAt,
      })
      const candidate = canonicalSam31VertexServingQualificationCandidateSchema
        .parse({ ...payload, candidateHash: sha256AuthorityValue(payload) })
      const persisted = await input.repository.persistCreateOnly({ candidate })
      const reread = assertCanonicalSam31VertexServingQualificationCandidate(
        await input.repository.reread({ candidateId }),
        refs.observedAt,
      )
      if (
        reread.candidateHash !== candidate.candidateHash
        || (persisted === 'already_exists'
          && reread.endpointDeploymentRef.contentHash !==
            refs.endpointDeploymentRef.contentHash)
      ) throw new Error('Vertex qualification candidate reread changed.')
      return reread
    },
  })
}

export function createCanonicalSam31VertexServingQualificationCandidateRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexServingQualificationCandidateRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex qualification candidate prefix is invalid.')
  }
  return Object.freeze({
    async persistCreateOnly({ candidate }: {
      readonly candidate:
        CanonicalSam31VertexServingQualificationCandidate
    }) {
      const accepted = assertCanonicalSam31VertexServingQualificationCandidate(
        candidate,
      )
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      return input.objectPort.createOnly({
        objectPath: `${prefix}/${accepted.candidateId}/candidate.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async reread({ candidateId }: { readonly candidateId: string }) {
      const body = await input.objectPort.readExact(
        `${prefix}/${safeId.parse(candidateId)}/candidate.json`,
      )
      if (!body) return null
      const decoded = JSON.parse(body.toString('utf8')) as unknown
      const accepted = assertCanonicalSam31VertexServingQualificationCandidate(
        decoded,
      )
      if (stableAuthorityStringify(accepted) !== body.toString('utf8')) {
        throw new Error('Vertex qualification candidate bytes changed.')
      }
      return structuredClone(accepted)
    },
  })
}

export function createCanonicalGcsSam31VertexServingQualificationCandidateRepository(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31VertexServingQualificationCandidateRepository {
  return createCanonicalSam31VertexServingQualificationCandidateRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
  })
}

export function assertCanonicalSam31VertexServingQualificationCandidate(
  value: unknown,
  at?: string,
): CanonicalSam31VertexServingQualificationCandidate {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_candidate')
  const parsed = canonicalSam31VertexServingQualificationCandidateSchema.parse(
    value,
  )
  const { candidateHash, ...payload } = parsed
  if (
    candidateHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)
    ))
  ) throw new Error('Vertex qualification candidate is invalid.')
  return parsed
}

function assertExactScope(input: {
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile
  refs: { deploymentProfileRef: Ref; modelUploadObservationRef: Ref;
    endpointCreateObservationRef: Ref; modelDeployObservationRef: Ref }
  exact: ReturnType<typeof assertCanonicalSam31VertexServingExactDeployment>
}): void {
  if (
    input.exact.immutableImageDigest !== input.profile.immutableImageDigest
    || input.exact.deploymentProfileRef.contentHash !==
      input.refs.deploymentProfileRef.contentHash
    || input.exact.modelUploadObservationRef.contentHash !==
      input.refs.modelUploadObservationRef.contentHash
    || input.exact.endpointCreateObservationRef.contentHash !==
      input.refs.endpointCreateObservationRef.contentHash
    || input.exact.modelDeployObservationRef.contentHash !==
      input.refs.modelDeployObservationRef.contentHash
  ) throw new Error('Vertex qualification exact deployment scope changed.')
}
