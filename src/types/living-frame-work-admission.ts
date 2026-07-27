import type {
  LivingFrameCapabilityKey,
  LivingFrameMiniSkillKey,
} from './living-frame'
import type {
  EditWorkItemType,
} from './editing-agent-runtime'

export const LIVING_FRAME_WORK_ADMISSION_VERSION =
  'living-frame-work-admission-catalog-v2' as const

export const LIVING_FRAME_WORK_ADMISSION_CLASS =
  'controlled_non_executable_named_work_type_coverage' as const

export const LIVING_FRAME_WORK_COVERAGE_STATES = [
  'existing_named_work_type_candidate',
  'planning_only_no_work_item',
  'partial_existing_types_schema_admission_required',
  'explicit_schema_admission_required',
  'safety_blocked',
] as const
export type LivingFrameWorkCoverageState =
  (typeof LIVING_FRAME_WORK_COVERAGE_STATES)[number]

export const LIVING_FRAME_MISSING_OPERATION_CODES = [
  'adapter_training_or_loading_operation_required',
  'identity_conditioned_generation_prohibited_pending_safety',
] as const
export type LivingFrameMissingOperationCode =
  (typeof LIVING_FRAME_MISSING_OPERATION_CODES)[number]

export const LIVING_FRAME_WORK_EXTERNAL_GATE_CODES = [
  'canonical_selected_scene_required',
  'approved_snapshot_required',
  'master_timing_binding_required',
  'soundsync_binding_required',
  'tool_profile_qualification_required',
  'provider_route_qualification_required',
  'model_weight_qualification_required',
  'identity_safety_required',
  'artifact_qa_required',
  'private_remotion_review_required',
] as const
export type LivingFrameWorkExternalGateCode =
  (typeof LIVING_FRAME_WORK_EXTERNAL_GATE_CODES)[number]

export interface LivingFrameCapabilityWorkCoverage {
  readonly capabilityKey: LivingFrameCapabilityKey
  readonly coverageState: LivingFrameWorkCoverageState
  readonly existingNamedWorkItemTypes:
    readonly Exclude<EditWorkItemType, 'custom'>[]
  readonly missingOperationCodes:
    readonly LivingFrameMissingOperationCode[]
  readonly requiredExternalGateCodes:
    readonly LivingFrameWorkExternalGateCode[]
}

export interface LivingFrameMiniSkillWorkCoverage {
  readonly miniSkillKey: LivingFrameMiniSkillKey
  readonly coverageState: LivingFrameWorkCoverageState
  readonly existingNamedWorkItemTypes:
    readonly Exclude<EditWorkItemType, 'custom'>[]
  readonly missingOperationCodes:
    readonly LivingFrameMissingOperationCode[]
  readonly requiredExternalGateCodes:
    readonly LivingFrameWorkExternalGateCode[]
}

export interface LivingFrameWorkAdmissionMetrics {
  readonly capabilityCount: number
  readonly miniSkillCount: number
  readonly existingNamedCoverageCount: number
  readonly planningOnlyCount: number
  readonly partialCoverageCount: number
  readonly missingSchemaAdmissionCount: number
  readonly safetyBlockedCount: number
}

export interface LivingFrameWorkAdmissionAuthorityBoundary {
  readonly vocabularyAuditOnly: true
  readonly selectedSceneAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly modelWeightAuthority: false
  readonly costAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameWorkAdmissionCatalogDraft {
  readonly contractVersion: typeof LIVING_FRAME_WORK_ADMISSION_VERSION
  readonly admissionClass: typeof LIVING_FRAME_WORK_ADMISSION_CLASS
  readonly capabilityCoverage:
    readonly LivingFrameCapabilityWorkCoverage[]
  readonly miniSkillCoverage:
    readonly LivingFrameMiniSkillWorkCoverage[]
  readonly metrics: LivingFrameWorkAdmissionMetrics
  readonly authorityBoundary:
    LivingFrameWorkAdmissionAuthorityBoundary
  readonly customWorkItemAllowed: false
  readonly createsWorkItems: false
  readonly createsAssetManifestEntries: false
  readonly existingExecutionPlannerRemainsAuthority: true
  readonly missingOperationsRequireCanonicalSchemaAdmission: true
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameWorkAdmissionCatalog
  extends LivingFrameWorkAdmissionCatalogDraft {
  readonly catalogDigestSha256: string
}
