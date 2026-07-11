import type {
  EditLevel,
  PlannerInput,
} from './reeditpro'
import type { PlanningContext } from './planning-context'
import type {
  ReEditProModelRoleId,
  ReEditProRequestedModelUse,
} from './model-role-routing'

export type ProfessionalSkillFamily =
  | 'intent_direction'
  | 'source_structure'
  | 'captions'
  | 'audio_cleanup'
  | 'music_sound'
  | 'visual_graphics'
  | 'data_visuals'
  | 'motion_design'
  | 'color_image'
  | 'mask_enhancement'
  | 'render_packaging'
  | 'qa_review'

export type ProfessionalSkillInputKind =
  | 'user_prompt'
  | 'source_video'
  | 'source_audio'
  | 'source_order'
  | 'planning_context'
  | 'edit_brief'
  | 'edit_cues'
  | 'approved_snapshot'
  | 'private_artifact_manifest'

export type ProfessionalSkillOutputKind =
  | 'compiled_intent'
  | 'source_sequence_plan'
  | 'caption_plan'
  | 'audio_plan'
  | 'music_timing_plan'
  | 'visual_layer_plan'
  | 'data_visual_plan'
  | 'motion_plan'
  | 'color_plan'
  | 'mask_plan'
  | 'private_review_plan'
  | 'qa_report'

export type ProfessionalSkillExecutionMode =
  | 'plan_only'
  | 'dry_run'
  | 'bounded_execution'
  | 'readiness_check'
  | 'blocked_until_model_weight_ready'

export type ProfessionalSkillSelectionSource =
  | 'baseline'
  | 'user_prompt'
  | 'compiled_intent'
  | 'edit_brief'
  | 'edit_cue'
  | 'workflow_profile'
  | 'edit_level'
  | 'source_context'

export interface ProfessionalSkillSelectionEvidence {
  source: ProfessionalSkillSelectionSource
  label: string
  summary: string
}

export type ProfessionalSkillReadinessStatus =
  | 'ready_for_plan'
  | 'needs_review'
  | 'blocked'

export type ProfessionalSkillBackendIntentKind =
  | 'model_role'
  | 'provider_asset'
  | 'adapter_tool_bundle'

export type ProfessionalSkillBackendExecutionBoundary =
  | 'metadata_only'
  | 'backend_approved_after_snapshot'

export interface ProfessionalSkillBackendIntent {
  intentId: string
  intentKind: ProfessionalSkillBackendIntentKind
  userFacingActivity: string
  executionBoundary: ProfessionalSkillBackendExecutionBoundary
  providerRoute?: string
  providerModel?: string
  modelRoleId?: ReEditProModelRoleId
  requestedModelUse?: ReEditProRequestedModelUse
  generationType?: string
  outputAssetType?: string
  hiddenAdapterToolNames: string[]
  requiredApprovalGates: string[]
}

export interface ProfessionalSkillDefinition {
  id: string
  family: ProfessionalSkillFamily
  userFacingName: string
  userFacingActivity: string
  plannerDescription: string
  triggerKeywords: string[]
  requiredInputs: ProfessionalSkillInputKind[]
  optionalInputs: ProfessionalSkillInputKind[]
  outputArtifacts: ProfessionalSkillOutputKind[]
  supportedEditLevels: EditLevel[]
  hiddenAdapterToolNames: string[]
  backendIntents?: ProfessionalSkillBackendIntent[]
  qaGates: string[]
  executionModes: ProfessionalSkillExecutionMode[]
  userVisible: boolean
  requiresPrivateArtifacts: boolean
}

export interface ProfessionalSkillSelection {
  skillId: string
  family: ProfessionalSkillFamily
  userFacingName: string
  userFacingActivity: string
  selectionSources: ProfessionalSkillSelectionSource[]
  selectionEvidence: ProfessionalSkillSelectionEvidence[]
  reason: string
  requiredInputs: ProfessionalSkillInputKind[]
  outputArtifacts: ProfessionalSkillOutputKind[]
  hiddenAdapterToolNames: string[]
  backendIntents: ProfessionalSkillBackendIntent[]
  qaGates: string[]
  executionModes: ProfessionalSkillExecutionMode[]
  readiness: ProfessionalSkillReadinessStatus
  blockers: string[]
}

export interface ProfessionalSkillActivityGroup {
  id: ProfessionalSkillFamily
  label: string
  selectedActivityCount: number
  readyActivityCount: number
  reviewActivityCount: number
  blockedActivityCount: number
  status: ProfessionalSkillReadinessStatus
  userFacingSummary: string
}

export interface ProfessionalSkillModelRoleTrace {
  source: 'reeditpro_model_role_contract'
  contractVersion: string
  ok: boolean
  blocked: boolean
  checkedContractCount: number
  modelRoleIntentCount: number
  roles: Array<{
    modelRoleId: ReEditProModelRoleId
    providerBoundary: string
    canonicalProviderModel: string
    requestedUses: ReEditProRequestedModelUse[]
    intentIds: string[]
    userReasoningAllowed: boolean
    editPlanningAllowed: boolean
    visualUnderstandingAllowed: boolean
    toolCodeAllowed: boolean
    remotionDraftAllowed: boolean
  }>
  errors: string[]
  mockOnly: true
}

export interface ProfessionalSkillPlan {
  id: string
  status: ProfessionalSkillReadinessStatus
  source: 'professional_skill_planner'
  selectedSkillCount: number
  selectedFamilies: ProfessionalSkillFamily[]
  selectedSkills: ProfessionalSkillSelection[]
  activityGroups: ProfessionalSkillActivityGroup[]
  userFacingSummary: string
  userFacingActivities: string[]
  hiddenAdapterToolNames: string[]
  backendIntents: ProfessionalSkillBackendIntent[]
  modelRoleTrace: ProfessionalSkillModelRoleTrace
  qaGateSummary: string[]
  blockers: string[]
  warnings: string[]
  editBriefUsed: boolean
  editBriefOptional: true
  promptFirstPlanning: true
  noUserVisibleToolNames: true
}

export interface ProfessionalSkillPlannerInput {
  plannerInput: PlannerInput
  planningContext?: PlanningContext | null
}
