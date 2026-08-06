import { randomUUID } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalCaptionTrackAllEvidenceRepository,
  createCanonicalTrackAllSam31CaptionSceneEvidenceRepository,
} from '../services/canonical-caption-track-all-support-service'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GpuTaskContextRepository,
} from '../services/canonical-sam3_1-gpu-task-context-owner'
import {
  createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository,
} from '../services/canonical-track-all-sam3_1-artifact-repository-release'
import {
  publishCanonicalTrackAllSam31ArtifactRepositoryRelease,
} from '../services/canonical-track-all-sam3_1-artifact-repository-release-publisher'
import {
  createCanonicalTrackAllSam31StorageQualificationRepository,
} from '../services/canonical-track-all-sam3_1-storage-qualification-owner'
import {
  createCanonicalTrackAllSam31TaskQaRepository,
} from '../services/canonical-track-all-sam3_1-task-qa-owner'
import {
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_OBJECT_BUCKET =
  'reeditpro-production-reeditpro-masks' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refText = z.string().trim().min(1).max(700)
const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_STATE_BUCKET),
  GCS_PROCESSED_MEDIA_BUCKET: z.literal(PRIVATE_GPU_OBJECT_BUCKET),
  WEEDITPRO_TRACK_ALL_SUPPORT_REQUEST_REF: refText,
  WEEDITPRO_TRACK_ALL_CONTROL_PLANE_STORAGE_QUALIFICATION_REF: refText,
  WEEDITPRO_TRACK_ALL_MASK_STORAGE_QUALIFICATION_REF: refText,
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  GCS_PROCESSED_MEDIA_BUCKET: process.env.GCS_PROCESSED_MEDIA_BUCKET,
  WEEDITPRO_TRACK_ALL_SUPPORT_REQUEST_REF:
    process.env.WEEDITPRO_TRACK_ALL_SUPPORT_REQUEST_REF,
  WEEDITPRO_TRACK_ALL_CONTROL_PLANE_STORAGE_QUALIFICATION_REF:
    process.env.WEEDITPRO_TRACK_ALL_CONTROL_PLANE_STORAGE_QUALIFICATION_REF,
  WEEDITPRO_TRACK_ALL_MASK_STORAGE_QUALIFICATION_REF:
    process.env.WEEDITPRO_TRACK_ALL_MASK_STORAGE_QUALIFICATION_REF,
})

const storage = new Storage({ projectId: configuration.GOOGLE_CLOUD_PROJECT_ID })
const controlPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const privateGpuPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_PROCESSED_MEDIA_BUCKET,
})
const qualifiedAt = new Date()
const expiresAt = new Date(qualifiedAt.getTime() + 24 * 60 * 60 * 1_000)
const receipt = await publishCanonicalTrackAllSam31ArtifactRepositoryRelease({
  releaseId: `track-all-sam3_1-artifact-repository-${randomUUID()}`,
  supportRequestRef: parseSkillRef(
    configuration.WEEDITPRO_TRACK_ALL_SUPPORT_REQUEST_REF,
  ),
  controlPlaneStateStorageQualificationRef: parseBackendRef(
    configuration.WEEDITPRO_TRACK_ALL_CONTROL_PLANE_STORAGE_QUALIFICATION_REF,
  ),
  privateMaskArtifactStorageQualificationRef: parseBackendRef(
    configuration.WEEDITPRO_TRACK_ALL_MASK_STORAGE_QUALIFICATION_REF,
  ),
  qualifiedAt: qualifiedAt.toISOString(),
  expiresAt: expiresAt.toISOString(),
}, {
  taskContextRepository: createCanonicalSam31GpuTaskContextRepository({
    objectPort: controlPort,
  }),
  taskStore: createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: privateGpuPort,
  }),
  runtimeResultStore: createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: privateGpuPort,
  }),
  taskQaRepository: createCanonicalTrackAllSam31TaskQaRepository({
    objectPort: controlPort,
  }),
  captionSceneEvidenceRepository:
    createCanonicalTrackAllSam31CaptionSceneEvidenceRepository({
      objectPort: controlPort,
    }),
  captionTrackAllEvidenceRepository:
    createCanonicalCaptionTrackAllEvidenceRepository({
      objectPort: controlPort,
    }),
  storageQualificationReadPort:
    createCanonicalTrackAllSam31StorageQualificationRepository({
      objectPort: controlPort,
    }),
  releaseRepository:
    createCanonicalTrackAllSam31ArtifactRepositoryReleaseRepository({
      objectPort: controlPort,
    }),
})

process.stdout.write(`${JSON.stringify(receipt)}\n`)

function parseBackendRef(value: string) {
  const match = /^(?<id>[^|]+)\|(?<version>[1-9]\d*)\|(?<hash>sha256:[a-f0-9]{64})$/u
    .exec(value)
  if (!match?.groups) throw new Error('Backend evidence ref is invalid.')
  return {
    id: safeId.parse(match.groups.id),
    version: z.coerce.number().int().positive().safe()
      .parse(match.groups.version),
    contentHash: prefixedSha256.parse(match.groups.hash),
  }
}

function parseSkillRef(value: string) {
  const match = /^(?<id>[^|]+)\|(?<version>[^|]+)\|(?<hash>[a-f0-9]{64})$/u
    .exec(value)
  if (!match?.groups) throw new Error('Skill support-request ref is invalid.')
  return {
    id: safeId.parse(match.groups.id),
    version: safeId.parse(match.groups.version),
    contentHash: rawSha256.parse(match.groups.hash),
  }
}
