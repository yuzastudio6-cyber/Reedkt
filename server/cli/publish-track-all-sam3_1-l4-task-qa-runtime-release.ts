import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from '../services/canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
  publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'

const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(
    'reeditpro-production-reeditpro-control-plane-state',
  ),
  GCS_PROCESSED_MEDIA_BUCKET: z.literal(
    'reeditpro-production-reeditpro-masks',
  ),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID:
    safeAuthorityId(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH:
    prefixedSha256(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_ID: safeAuthorityId(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_CONTENT_HASH:
    prefixedSha256(),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  GCS_PROCESSED_MEDIA_BUCKET: process.env.GCS_PROCESSED_MEDIA_BUCKET,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_ID:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_ID,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_VERSION:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_VERSION,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_CONTENT_HASH:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_CONTENT_HASH,
})

const storage = new Storage({
  projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const receipt = await publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease({
  imageQualificationRef: {
    id: configuration
      .WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID,
    version: configuration
      .WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION,
    contentHash: configuration
      .WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH,
  },
  runtimeReleaseRef: {
    id: configuration.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_ID,
    version:
      configuration.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_VERSION,
    contentHash:
      configuration.WEEDITPRO_TRACK_ALL_L4_TASK_QA_RUNTIME_RELEASE_CONTENT_HASH,
  },
  evidenceRepository:
    createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({
      objectPort,
    }),
  runtimeConfigurationRepository:
    createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
      storage,
      projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
      bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
      privateObjectTransportBucketName:
        configuration.GCS_PROCESSED_MEDIA_BUCKET,
    }),
})

process.stdout.write(`${JSON.stringify(receipt)}\n`)

function safeAuthorityId() {
  return z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..'))
}

function prefixedSha256() {
  return z.string().regex(/^sha256:[a-f0-9]{64}$/u)
}
