import type { ID, ISODateString } from '../shared'
import type { MotionStudioOwnership, MotionStudioVersionReference } from './shared'

export interface ExportManifest extends MotionStudioOwnership {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  fineCutVersion: MotionStudioVersionReference
  qualityReportVersion: MotionStudioVersionReference
  timelineManifestId: ID
  renderManifestId: ID
  existingExportRecordId: ID
  outputAssetIds: ID[]
  provenanceRecordIds: ID[]
  internalCostActualId: ID
  status: 'planned' | 'qa_blocked' | 'ready_for_existing_export_system' | 'completed' | 'failed'
  createdAt: ISODateString
}
