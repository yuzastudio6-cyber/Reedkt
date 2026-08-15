import { randomUUID } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsTrackAllSam31StorageProbePort,
  createCanonicalTrackAllSam31StorageQualificationRepository,
  qualifyCanonicalTrackAllSam31Storage,
  type CanonicalTrackAllSam31StorageRole,
} from '../services/canonical-track-all-sam3_1-storage-qualification-owner'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_STATE_BUCKET),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
})

const storage = new Storage({ projectId: configuration.GOOGLE_CLOUD_PROJECT_ID })
const qualificationRepository =
  createCanonicalTrackAllSam31StorageQualificationRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
    }),
  })
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000)
const runId = randomUUID()
const roles = Object.freeze([
  'control_plane_state',
  'private_mask_artifacts',
] as const satisfies readonly CanonicalTrackAllSam31StorageRole[])

const receipts = []
for (const role of roles) {
  receipts.push(await qualifyCanonicalTrackAllSam31Storage({
    qualificationId: `track-all-sam3_1-${role}-${runId}`,
    expiresAt: expiresAt.toISOString(),
  }, {
    probePort: createCanonicalGcsTrackAllSam31StorageProbePort({
      storage,
      projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
      role,
    }),
    qualificationRepository,
  }))
}

process.stdout.write(`${JSON.stringify({
  schemaVersion: 'track-all-sam3_1-private-storage-qualification-run-v1',
  source: 'canonical_server_track_all_sam3_1_storage_qualification_operator',
  evidenceClass: 'canonical_private_live_storage_probe',
  receipts,
  gpuJobStarted: false,
  providerOrModelExecuted: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})}\n`)
