import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  UnmergedOwnerEvidenceItem,
} from './unmerged-owner-evidence-types'

export type AllOwnerToolLane =
  | 'track_b_media'
  | 'track_a_render_export'
  | 'ai_graphics'
  | 'sound_music_audio'
  | 'sfx_soundsync'
  | 'web_capture'
  | 'map_geospatial'
  | 'provider_local_runtime'
  | 'worker_runtime'
  | 'tool_calling_overlay'
  | 'unknown_or_pending'

export type AllOwnerCurrentRepoStatus =
  | 'first_class_production_tool_id'
  | 'explicit_tool_calling_study_card'
  | 'generated_registry_card_only'
  | 'owner_inventory_only'
  | 'installed_source_declared'
  | 'install_proof_bounded'
  | 'runtime_proof_bounded'
  | 'fixture_proof_bounded'
  | 'controlled_probe_passed'
  | 'controlled_probe_unavailable'
  | 'fixture_bound_probe_passed'
  | 'blocked_pending_license'
  | 'blocked_pending_model_weight'
  | 'blocked_pending_runtime_lane'
  | 'blocked_pending_registry_expansion'
  | 'evaluation_only'
  | 'provider_api_only'
  | 'unknown'

export type AllOwnerPendingAction =
  | 'none'
  | 'add_tool_calling_study_card'
  | 'add_production_tool_registry_id'
  | 'add_adapter_contract'
  | 'add_safe_command_intent'
  | 'add_fixture_plan'
  | 'add_controlled_probe'
  | 'add_fixture_bound_probe'
  | 'wait_for_owner_install_proof'
  | 'wait_for_license_review'
  | 'wait_for_model_weight_review'
  | 'wait_for_worker_runtime_gate'
  | 'wait_for_unmerged_owner_pr'
  | 'do_not_duplicate_owner_lane'

export type AllOwnerDuplicateRisk =
  | 'none'
  | 'possible_duplicate_study'
  | 'possible_duplicate_adapter'
  | 'possible_duplicate_registry_id'
  | 'possible_duplicate_owner_lane'
  | 'existing_owner_work_in_progress'
  | 'wait_for_unmerged_owner_pr'

export interface AllOwnerSourceMatrixDocument {
  schema: 'reeditpro.allOwnerToolStackReconciliationMatrix.v1'
  notes: readonly string[]
  rows: readonly AllOwnerToolReconciliationSeedRow[]
}

export interface AllOwnerToolReconciliationSeedRow {
  normalizedToolId: string
  displayName: string
  ownerLane: AllOwnerToolLane
  sourceEvidence: readonly string[]
  currentRepoStatus: readonly AllOwnerCurrentRepoStatus[]
  productionToolId: ProductionToolId | null
  aliases: readonly string[]
  packageNames: readonly string[]
  dockerEvidence: readonly string[]
  requirementsEvidence: readonly string[]
  packageJsonEvidence: readonly string[]
  proofEvidence: readonly string[]
  runtimeEvidence: readonly string[]
  operationCoverage: readonly ToolCallingOperationId[]
  hasToolCallingStudyCard: boolean
  hasAdapterContract: boolean
  hasSafeCommandIntent: boolean
  hasFixturePlan: boolean
  hasDryRunFixture: boolean
  hasBinaryFixturePlan: boolean
  hasControlledReadinessProbe: boolean
  hasFixtureBoundProbe: boolean
  selectableAsRuntimeTool: boolean
  pendingAction: AllOwnerPendingAction
  duplicateRisk: AllOwnerDuplicateRisk
  notes: string
}

export interface AllOwnerToolReconciliationRow extends AllOwnerToolReconciliationSeedRow {
  unmergedOwnerEvidenceRefs: readonly string[]
}

export interface AllOwnerReconciliationDuplicateRiskFinding {
  normalizedToolId: string
  displayName: string
  ownerLane: AllOwnerToolLane
  duplicateRisk: AllOwnerDuplicateRisk
  pendingAction: AllOwnerPendingAction
  reason: string
}

export interface AllOwnerRecommendedMilestone {
  milestone: string
  ownerLane: AllOwnerToolLane
  reason: string
  candidateToolIds: readonly string[]
}

export interface AllOwnerCoverageAnalysis {
  matrixRows: readonly AllOwnerToolReconciliationRow[]
  totalMatrixRows: number
  lanesRepresented: readonly AllOwnerToolLane[]
  firstClassProductionToolCount: number
  explicitStudyCardCount: number
  adapterContractCount: number
  commandIntentPolicyCount: number
  pendingRuntimeRegistryExpansionCount: number
  toolsNeedingStudyCards: readonly string[]
  toolsNeedingRuntimeRegistryExpansion: readonly string[]
  toolsNeedingAdapterContracts: readonly string[]
  toolsBlockedByOwnerOrLicense: readonly string[]
  duplicateRiskFindings: readonly AllOwnerReconciliationDuplicateRiskFinding[]
  unmergedOwnerEvidenceCount: number
  recommendedNextMilestones: readonly AllOwnerRecommendedMilestone[]
  safety: {
    executesTools: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    sqlExecuted: false
    duplicateSystemsCreated: false
  }
}

export interface AllOwnerReconciliationSourceBundle {
  seedDocument: AllOwnerSourceMatrixDocument
  unmergedOwnerEvidence: readonly UnmergedOwnerEvidenceItem[]
}
