import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository,
  createCanonicalTrackAllSam31L4TaskQaGoogleCloudDeploymentReadTransport,
  observeCanonicalTrackAllSam31L4TaskQaDeployment,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-deployment-observer'
import {
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'

const CONFIRMATION =
  'observe-weeditpro-track-all-l4-task-qa-deployment-v1' as const
const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(
    'reeditpro-production-reeditpro-control-plane-state',
  ),
  WEEDITPRO_CONFIRM_TRACK_ALL_L4_DEPLOYMENT_OBSERVATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID:
    safeAuthorityId(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH:
    z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_CONFIRM_TRACK_ALL_L4_DEPLOYMENT_OBSERVATION:
    process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_DEPLOYMENT_OBSERVATION,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION,
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH:
    process.env.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH,
})

const storage = new Storage({ projectId: configuration.GOOGLE_CLOUD_PROJECT_ID })
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const releaseEvidenceRepository =
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({
    objectPort,
  })
const result = await observeCanonicalTrackAllSam31L4TaskQaDeployment({
  imageQualificationRef: {
    id: configuration.WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_ID,
    version: configuration
      .WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION,
    contentHash: configuration
      .WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_QUALIFICATION_CONTENT_HASH,
  },
  imageQualificationReadPort: releaseEvidenceRepository,
  transport:
    createCanonicalTrackAllSam31L4TaskQaGoogleCloudDeploymentReadTransport(),
  deploymentEvidenceRepository:
    createCanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository({
      objectPort,
    }),
  releaseEvidenceRepository,
})

process.stdout.write(`${JSON.stringify(result)}\n`)

function safeAuthorityId() {
  return z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('://'))
}
