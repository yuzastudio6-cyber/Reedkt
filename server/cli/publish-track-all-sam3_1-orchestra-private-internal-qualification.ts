import { z } from 'zod'

import { createCanonicalSkillQualificationRegistry } from '../orchestra/canonical-skill-qualification-registry'
import { createCanonicalGcsSourceAnalysisJsonObjectPort } from '../services/canonical-gcs-source-analysis-lifecycle-store'
import { createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository } from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import { createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository } from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import { createCanonicalSam31GcpGpuRuntimeReleaseRegistry } from '../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  createCanonicalSam31PrivateInternalDispatchReadPort,
  createCanonicalSam31PrivateInternalDispatchReadinessRepository,
} from '../services/canonical-sam3_1-private-internal-dispatch-readiness-owner'
import { createCanonicalGcsTrackAllSam31ArtifactRepositoryReleaseRepository } from '../services/canonical-track-all-sam3_1-artifact-repository-release'
import { createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository } from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import { publishTrackAllSam31OrchestraPrivateInternalQualification } from '../workers/masks/track-all-sam3_1-orchestra-qualification-publisher'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const CONFIRMATION =
  'publish-one-track-all-sam3_1-private-internal-qualification-v1' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refText = z.string().trim().min(1).max(700)
const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_STATE_BUCKET),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_QUALIFICATION_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_TRACK_ALL_A100_RUNTIME_RELEASE_REF: refText,
  WEEDITPRO_TRACK_ALL_L4_FALLBACK_RUNTIME_RELEASE_REF: refText,
  WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_DISPATCH_READINESS_REF: refText,
  WEEDITPRO_TRACK_ALL_A100_RATE_AUTHORITY_REF: refText,
  WEEDITPRO_TRACK_ALL_L4_FALLBACK_RATE_AUTHORITY_REF: refText,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_REF: refText,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_REF: refText,
  WEEDITPRO_TRACK_ALL_ARTIFACT_REPOSITORY_RELEASE_REF: refText,
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET: process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_QUALIFICATION_CONFIRMATION:
    process.env.WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_QUALIFICATION_CONFIRMATION,
  WEEDITPRO_TRACK_ALL_A100_RUNTIME_RELEASE_REF:
    process.env.WEEDITPRO_TRACK_ALL_A100_RUNTIME_RELEASE_REF,
  WEEDITPRO_TRACK_ALL_L4_FALLBACK_RUNTIME_RELEASE_REF:
    process.env.WEEDITPRO_TRACK_ALL_L4_FALLBACK_RUNTIME_RELEASE_REF,
  WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_DISPATCH_READINESS_REF:
    process.env.WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_DISPATCH_READINESS_REF,
  WEEDITPRO_TRACK_ALL_A100_RATE_AUTHORITY_REF:
    process.env.WEEDITPRO_TRACK_ALL_A100_RATE_AUTHORITY_REF,
  WEEDITPRO_TRACK_ALL_L4_FALLBACK_RATE_AUTHORITY_REF:
    process.env.WEEDITPRO_TRACK_ALL_L4_FALLBACK_RATE_AUTHORITY_REF,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_REF:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_REF,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_REF:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_REF,
  WEEDITPRO_TRACK_ALL_ARTIFACT_REPOSITORY_RELEASE_REF:
    process.env.WEEDITPRO_TRACK_ALL_ARTIFACT_REPOSITORY_RELEASE_REF,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: configuration.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage, bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const privateDispatchRepository =
  createCanonicalSam31PrivateInternalDispatchReadinessRepository({ objectPort })
const receipt = await publishTrackAllSam31OrchestraPrivateInternalQualification({
  a100RuntimeReleaseRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_A100_RUNTIME_RELEASE_REF),
  l4FallbackRuntimeReleaseRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_L4_FALLBACK_RUNTIME_RELEASE_REF),
  privateInternalDispatchReadinessRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_PRIVATE_INTERNAL_DISPATCH_READINESS_REF),
  a100RateAuthorityRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_A100_RATE_AUTHORITY_REF),
  l4FallbackRateAuthorityRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_L4_FALLBACK_RATE_AUTHORITY_REF),
  l4TaskQaImageQualificationRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_REF),
  l4TaskQaRuntimeReleaseRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_REF),
  artifactRepositoryReleaseRef: parseRef(
    configuration.WEEDITPRO_TRACK_ALL_ARTIFACT_REPOSITORY_RELEASE_REF),
  observedAt: new Date().toISOString(),
}, {
  runtimeReleaseRegistry: createCanonicalSam31GcpGpuRuntimeReleaseRegistry({ storage }),
  l4TaskQaReleaseRepository:
    createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({ objectPort }),
  rateAuthorityRepository:
    createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository({
      storage, projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
      bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
    }),
  a100ServingRateAuthorityRepository:
    createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
      storage, projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
      bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
    }),
  privateInternalDispatchReadinessReadPort:
    createCanonicalSam31PrivateInternalDispatchReadPort(privateDispatchRepository),
  artifactRepositoryReleaseReadPort:
    createCanonicalGcsTrackAllSam31ArtifactRepositoryReleaseRepository({
      storage, projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
      bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
    }),
  qualificationRegistry: createCanonicalSkillQualificationRegistry({ objectPort }),
})

process.stdout.write(`${JSON.stringify(receipt)}\n`)

function parseRef(value: string) {
  const match = /^(?<id>[^|]+)\|(?<version>[1-9]\d*)\|(?<hash>sha256:[a-f0-9]{64})$/u.exec(value)
  if (!match?.groups) throw new Error('Qualification ref text is invalid.')
  return {
    id: safeId.parse(match.groups.id),
    version: z.coerce.number().int().positive().safe().parse(match.groups.version),
    contentHash: prefixedSha256.parse(match.groups.hash),
  }
}
