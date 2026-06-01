import { buildVlmModelApprovalReport } from '../vlm-model-approval'

export const VLM_MODEL_DOWNLOAD_PHASE39A_PR = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62'
export const VLM_MODEL_DOWNLOAD_PHASE39A_BRANCH = 'codex/rp-activation-39a-qwen3-vl-vllm-approval-workflow'
export const VLM_MODEL_DOWNLOAD_PHASE39A_COMMIT = '698410e'

export function buildVlmPhase39AEvidenceReview(createdAt = new Date().toISOString()) {
  const phase39A = buildVlmModelApprovalReport(createdAt)
  const blockers: string[] = []
  const warnings: string[] = []

  if (phase39A.status !== 'staging_planning_approved') blockers.push('Phase 39A VLM approval report is not staging_planning_approved.')
  if (phase39A.plan.candidateModel !== 'Qwen/Qwen3-VL-8B-Instruct') blockers.push('Phase 39A candidate model is not Qwen/Qwen3-VL-8B-Instruct.')
  if (phase39A.plan.runtimeCandidate !== 'vLLM') blockers.push('Phase 39A runtime candidate is not vLLM.')
  if (!phase39A.phase39BReadiness.ready) blockers.push('Phase 39A does not mark Phase 39B ready for exact revision/file selection.')
  if (phase39A.modelDownloadAllowed) blockers.push('Phase 39A unexpectedly allowed model download.')
  if (phase39A.runtimeExecutionAllowed) blockers.push('Phase 39A unexpectedly allowed runtime execution.')
  if (phase39A.trackAExecutionAllowed) blockers.push('Phase 39A unexpectedly allowed Track A execution.')
  if (phase39A.productionReadyAllowed || phase39A.internalBetaAllowed || phase39A.externalBetaAllowed) blockers.push('Phase 39A unexpectedly allowed beta/production readiness.')
  warnings.push('Phase 39A evidence is metadata-only; Phase 39B revalidates the current Hugging Face revision and file list before download.')

  return {
    phase: '39B' as const,
    reviewedAt: createdAt,
    phase39APr: VLM_MODEL_DOWNLOAD_PHASE39A_PR,
    phase39ABranch: VLM_MODEL_DOWNLOAD_PHASE39A_BRANCH,
    phase39ACommit: VLM_MODEL_DOWNLOAD_PHASE39A_COMMIT,
    approvalStatus: phase39A.status,
    candidateModel: phase39A.plan.candidateModel,
    runtimeCandidate: phase39A.plan.runtimeCandidate,
    phase39BReady: phase39A.phase39BReadiness.ready,
    phase39CReady: phase39A.phase39CReadiness.ready,
    modelDownloadAllowedInPhase39A: phase39A.modelDownloadAllowed,
    runtimeAllowedInPhase39A: phase39A.runtimeExecutionAllowed,
    mediaProcessingAllowedInPhase39A: phase39A.mediaProcessingAllowed,
    trackAAllowedInPhase39A: phase39A.trackAExecutionAllowed,
    productionAllowedInPhase39A: phase39A.productionReadyAllowed,
    blockers,
    warnings,
  }
}
