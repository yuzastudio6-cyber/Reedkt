import type { ID, ISODateString } from '../../types/shared'
import type {
  ProductionToolIssue,
  ProductionToolRecommendation,
  ProductionWorkerType,
  QualityGateStatus,
  QualityGateType,
} from './production-tool-runtime-contracts'

export interface QualityGateResult {
  id: ID
  workspaceId: ID
  projectId: ID
  mediaAssetId: ID
  toolExecutionPlanId: ID
  recipeId: ID
  gateType: QualityGateType
  status: QualityGateStatus
  score?: number
  threshold?: number
  required: boolean
  blocking: boolean
  checkedAt: ISODateString
  checkedByWorkerType: ProductionWorkerType
  inputArtifactIds: ID[]
  outputArtifactIds: ID[]
  issues: ProductionToolIssue[]
  recommendations: ProductionToolRecommendation[]
  fallbackRequired: boolean
  blocksPreview: boolean
  blocksFinalExport: boolean
  humanReviewRequired: boolean
}
