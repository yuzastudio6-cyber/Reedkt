import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../../tool-registry'
import type { ProductionContainerImageRole } from '../production-readiness'
import type {
  ProductionReadinessBlockerSummary,
  ProductionReadinessBlockerSeverity,
  ReadinessValidationStatus,
} from './readiness-validation-types'

export type ProductionReadinessBlockerKind =
  | 'required_launch_core_missing'
  | 'model_weight_missing'
  | 'model_weight_blocked'
  | 'non_commercial_model_weight'
  | 'unknown_model_weight_license'
  | 'evaluation_only_production_execution'
  | 'gpu_tool_on_non_gpu_worker'
  | 'revideo_production_execution'
  | 'signed_url_source_of_truth'
  | 'raw_prompt_execution_path'
  | 'secret_in_config'
  | 'missing_approved_snapshot_enforcement'
  | 'optional_tool_missing'
  | 'future_only_tool_not_installed'
  | 'optional_openimageio_opencolorio_pending'
  | 'ffmpeg_lgpl_pending'
  | 'libass_pending_manual_verification'
  | 'source_install_review_required'
  | 'host_tool_missing_static_mode'

export interface ProductionReadinessBlockerCandidate {
  kind: ProductionReadinessBlockerKind
  toolId?: ProductionToolId | 'revideo' | string
  workerType?: ProductionRegistryWorkerType
  imageRole?: ProductionContainerImageRole
  detail?: string
}

const hardBlockerKinds = new Set<ProductionReadinessBlockerKind>([
  'required_launch_core_missing',
  'model_weight_missing',
  'model_weight_blocked',
  'non_commercial_model_weight',
  'unknown_model_weight_license',
  'evaluation_only_production_execution',
  'gpu_tool_on_non_gpu_worker',
  'revideo_production_execution',
  'signed_url_source_of_truth',
  'raw_prompt_execution_path',
  'secret_in_config',
  'missing_approved_snapshot_enforcement',
])

const statusByKind: Record<ProductionReadinessBlockerKind, ReadinessValidationStatus> = {
  required_launch_core_missing: 'missing',
  model_weight_missing: 'model_weight_missing',
  model_weight_blocked: 'model_weight_blocked',
  non_commercial_model_weight: 'model_weight_blocked',
  unknown_model_weight_license: 'needs_model_weight_review',
  evaluation_only_production_execution: 'evaluation_only',
  gpu_tool_on_non_gpu_worker: 'blocked',
  revideo_production_execution: 'evaluation_only',
  signed_url_source_of_truth: 'blocked',
  raw_prompt_execution_path: 'blocked',
  secret_in_config: 'blocked',
  missing_approved_snapshot_enforcement: 'blocked',
  optional_tool_missing: 'warning',
  future_only_tool_not_installed: 'future_only',
  optional_openimageio_opencolorio_pending: 'pending_manual_review',
  ffmpeg_lgpl_pending: 'pending_manual_review',
  libass_pending_manual_verification: 'pending_manual_review',
  source_install_review_required: 'source_install_review_required',
  host_tool_missing_static_mode: 'not_checked',
}

const messageByKind: Record<ProductionReadinessBlockerKind, string> = {
  required_launch_core_missing: 'Required launch-core tool is missing for production readiness.',
  model_weight_missing: 'Required model-weight manifest or mounted model weight is missing.',
  model_weight_blocked: 'Model weight is blocked for production execution.',
  non_commercial_model_weight: 'Non-commercial model weight cannot be used for paid production.',
  unknown_model_weight_license: 'Unknown model-weight license blocks production execution.',
  evaluation_only_production_execution: 'Evaluation-only tool was requested for production execution.',
  gpu_tool_on_non_gpu_worker: 'GPU/model tool is assigned to a non-GPU worker.',
  revideo_production_execution: 'Revideo remains evaluation-only and blocked from production execution.',
  signed_url_source_of_truth: 'Signed URLs cannot be persistent source-of-truth artifact references.',
  raw_prompt_execution_path: 'Workers must execute approved plan snapshots, not raw prompts.',
  secret_in_config: 'Secret-looking value is present in configuration or scripts.',
  missing_approved_snapshot_enforcement: 'Approved snapshot enforcement is missing from worker execution readiness.',
  optional_tool_missing: 'Optional tool is missing and should be tracked as a warning.',
  future_only_tool_not_installed: 'Future-only tool is not installed in this milestone.',
  optional_openimageio_opencolorio_pending: 'OpenImageIO/OpenColorIO readiness is optional and pending review.',
  ffmpeg_lgpl_pending: 'FFmpeg commercial LGPL-safe build verification is pending manual review.',
  libass_pending_manual_verification: 'libass subtitle support is pending manual verification unless explicitly checked.',
  source_install_review_required: 'Tool requires source-install review before production readiness.',
  host_tool_missing_static_mode: 'Host tool availability is not checked in static/dry-run mode.',
}

const remediationByKind: Record<ProductionReadinessBlockerKind, string> = {
  required_launch_core_missing: 'Install or declare the required launch-core tool in the correct worker image, then rerun readiness.',
  model_weight_missing: 'Provide an approved model-weight manifest and runtime mount policy in a later model execution milestone.',
  model_weight_blocked: 'Replace or review the model weight before production execution.',
  non_commercial_model_weight: 'Select a commercially allowed model weight or block the feature for paid production.',
  unknown_model_weight_license: 'Complete model-weight license review and update the manifest.',
  evaluation_only_production_execution: 'Keep the tool out of production paths or graduate it through a future approval milestone.',
  gpu_tool_on_non_gpu_worker: 'Move the tool to gpu_ai_worker or mark it future/evaluation-only.',
  revideo_production_execution: 'Use the approved Hyperframe + Remotion + FFmpeg + libass + OpenTimelineIO render path.',
  signed_url_source_of_truth: 'Use private storage references and artifact IDs instead of signed URLs.',
  raw_prompt_execution_path: 'Require approvedSnapshotId, toolExecutionPlanId, and idempotencyKey for worker execution.',
  secret_in_config: 'Remove the secret value and replace it with an environment placeholder or secret-manager reference.',
  missing_approved_snapshot_enforcement: 'Wire worker execution through the Milestone 4 approved-snapshot gates.',
  optional_tool_missing: 'Document the missing optional tool or install it in a later readiness milestone.',
  future_only_tool_not_installed: 'Leave as future-only until its milestone promotes it.',
  optional_openimageio_opencolorio_pending: 'Keep optional/pending status until install and license review are complete.',
  ffmpeg_lgpl_pending: 'Complete commercial LGPL-safe FFmpeg build verification before production execution.',
  libass_pending_manual_verification: 'Run a controlled libass readiness check or retain pending manual review status.',
  source_install_review_required: 'Review package/source install, license, and reproducibility before enabling production readiness.',
  host_tool_missing_static_mode: 'Run host_optional or container readiness manually if local availability is needed.',
}

export function classifyProductionReadinessBlocker(
  candidate: ProductionReadinessBlockerCandidate,
): ProductionReadinessBlockerSummary {
  const severity: ProductionReadinessBlockerSeverity = hardBlockerKinds.has(candidate.kind)
    ? 'hard_blocker'
    : 'warning'
  const subject = [
    candidate.imageRole,
    candidate.workerType,
    candidate.toolId,
    candidate.kind,
  ].filter(Boolean).join(':')

  return {
    id: `readiness_${subject}`,
    severity,
    status: statusByKind[candidate.kind],
    workerType: candidate.workerType,
    imageRole: candidate.imageRole,
    toolId: candidate.toolId,
    message: candidate.detail
      ? `${messageByKind[candidate.kind]} ${candidate.detail}`
      : messageByKind[candidate.kind],
    remediation: remediationByKind[candidate.kind],
  }
}

export function classifyProductionReadinessBlockers(
  candidates: ProductionReadinessBlockerCandidate[],
): ProductionReadinessBlockerSummary[] {
  return candidates.map(classifyProductionReadinessBlocker)
}

export function hasHardReadinessBlocker(blockers: ProductionReadinessBlockerSummary[]): boolean {
  return blockers.some((blocker) => blocker.severity === 'hard_blocker')
}
