import { vlmModelCandidates } from './vlm-model-candidate-registry'
import { vlmModelLicenseEvidence } from './vlm-model-license-evidence'
import {
  PHASE39A_VLM_BLOCKED_SCOPES,
  PHASE39A_VLM_EXPECTED_ARTIFACTS,
  vlmModelApprovalPolicy,
} from './vlm-model-approval-policy'
import {
  buildVlmApprovalBlockerReport,
  buildVlmGpuCostRiskReport,
  buildVlmPrivacySecurityPolicyReport,
  vlmModelApprovalBlockers,
  vlmModelApprovalWarnings,
} from './vlm-model-approval-blocker-policy'
import type {
  VlmModelApprovalArtifacts,
  VlmModelApprovalPlan,
  VlmModelApprovalReport,
} from './vlm-model-approval-types'
import { buildVlmPrivateArtifactManifest } from './vlm-model-artifact-manifest-writer'
import {
  buildVlmControlledRealFramePlan,
  buildVlmDownloadHandoffPlan,
  buildVlmGeneratedFixturePlan,
  buildVlmRuntimeHandoffPlan,
  buildVlmToolPlanningIntegrationPlan,
} from './vlm-model-handoff-plans'
import { buildVlmModelStoragePlan } from './vlm-model-storage-plan'
import { vlmRuntimeSupportEvidence } from './vlm-runtime-support-evidence'
import { vlmModelSourceEvidence } from './vlm-model-source-evidence'

export function buildVlmModelApprovalArtifacts(createdAt = new Date().toISOString()): VlmModelApprovalArtifacts {
  const storagePlan = buildVlmModelStoragePlan()
  const plan: VlmModelApprovalPlan = {
    phase: '39A',
    track: 'B',
    reportId: 'phase_39a_vlm_model_approval_plan',
    createdAt,
    approvalDecision: 'staging_planning_approved',
    candidateModel: 'Qwen/Qwen3-VL-8B-Instruct',
    candidateFamily: 'Qwen3-VL',
    runtimeCandidate: 'vLLM',
    fallbackRuntimePlanningOnly: 'local Transformers',
    expectedArtifacts: [...PHASE39A_VLM_EXPECTED_ARTIFACTS],
    futureSequence: ['39B', '39C', '39D', '39E'],
    blockedScopes: PHASE39A_VLM_BLOCKED_SCOPES,
    safety: {
      metadataOnly: true,
      modelDownloadExecuted: false,
      tokenizerDownloadExecuted: false,
      processorDownloadExecuted: false,
      runtimeExecuted: false,
      mediaProcessed: false,
      gpuJobExecuted: false,
      gcpMutated: false,
      trackATouched: false,
      betaAllowed: false,
      productionAllowed: false,
    },
  }

  const partialArtifacts = {
    plan,
    candidateRegistry: vlmModelCandidates,
    sourceEvidence: vlmModelSourceEvidence,
    licenseEvidence: vlmModelLicenseEvidence,
    runtimeSupportEvidence: vlmRuntimeSupportEvidence,
    storagePlan,
    downloadHandoffPlan: buildVlmDownloadHandoffPlan(storagePlan),
    runtimeHandoffPlan: buildVlmRuntimeHandoffPlan(),
    generatedFixturePlan: buildVlmGeneratedFixturePlan(),
    controlledRealFramePlan: buildVlmControlledRealFramePlan(),
    toolPlanningIntegrationPlan: buildVlmToolPlanningIntegrationPlan(),
    privacySecurityPolicyReport: buildVlmPrivacySecurityPolicyReport(),
    gpuCostRiskReport: buildVlmGpuCostRiskReport(),
    approvalBlockerReport: buildVlmApprovalBlockerReport(),
  }

  return {
    ...partialArtifacts,
    privateArtifactManifest: buildVlmPrivateArtifactManifest(createdAt),
  }
}

export function buildVlmModelApprovalReport(createdAt = new Date().toISOString()): VlmModelApprovalReport {
  const artifacts = buildVlmModelApprovalArtifacts(createdAt)
  return {
    phase: '39A',
    track: 'B',
    reportId: 'phase_39a_vlm_model_approval_report',
    createdAt,
    status: 'staging_planning_approved',
    approvedPlanningScopes: [
      vlmModelApprovalPolicy.approvedPlanningScope,
      'qwen3_vl_8b_instruct_exact_revision_selection_planning',
      'vllm_generated_fixture_runtime_planning',
      'controlled_real_frame_vlm_planning',
      'structured_tool_planning_hint_planning',
    ],
    ...artifacts,
    blockers: vlmModelApprovalBlockers,
    warnings: vlmModelApprovalWarnings,
    phase39BReadiness: {
      ready: true,
      nextPhase: 'Phase 39B Qwen3-VL exact model revision/file selection and private staging',
      status: 'ready_for_exact_revision_and_file_selection',
      blockers: [
        'Model/tokenizer/processor download remains blocked until Phase 39B current-shell confirmations are set.',
      ],
      criteria: [
        'Candidate model is selected: Qwen/Qwen3-VL-8B-Instruct.',
        'Official/public source evidence is recorded.',
        'Private storage prefix is documented.',
        'Exact revision/file manifest and checksums are deferred to Phase 39B.',
        'No model files were downloaded in Phase 39A.',
      ],
    },
    phase39CReadiness: {
      ready: false,
      nextPhase: 'Phase 39C generated-fixture VLM runtime verification',
      status: 'blocked_until_phase39b_private_model_assets',
      blockers: [
        'No exact Qwen3-VL revision/file manifest exists yet.',
        'No private staged model/tokenizer/processor checksums exist yet.',
        'No vLLM no-runtime-download guard has run yet.',
      ],
      criteria: [
        'Phase 39B must stage private verified model assets.',
        'Phase 39C must pin runtime dependencies and prove local-path/no-network behavior.',
      ],
    },
    phase39DReadiness: {
      ready: false,
      nextPhase: 'Phase 39D controlled real-frame VLM verification',
      status: 'blocked_until_phase39c_generated_runtime',
      blockers: [
        'Generated-fixture VLM runtime verification has not passed.',
        'Controlled real-frame source/window has not been selected by a Phase 39D gate.',
      ],
      criteria: [
        'Phase 39C generated-fixture runtime must pass.',
        'Phase 39D must select exactly one approved private controlled frame/sample.',
      ],
    },
    phase39EReadiness: {
      ready: false,
      nextPhase: 'Phase 39E VLM tool-planning integration',
      status: 'blocked_until_phase39d_controlled_real_frame',
      blockers: [
        'Controlled real-frame VLM verification has not passed.',
        'Structured planning-hint integration contract has not been validated.',
      ],
      criteria: [
        'Phase 39D controlled evidence must pass with redacted/hash-only metadata.',
        'Phase 39E must integrate hints only as structured planning data.',
      ],
    },
    modelDownloadAllowed: false,
    tokenizerDownloadAllowed: false,
    processorDownloadAllowed: false,
    runtimeExecutionAllowed: false,
    vllmExecutionAllowed: false,
    transformersExecutionAllowed: false,
    sglangExecutionAllowed: false,
    gpuJobAllowed: false,
    mediaProcessingAllowed: false,
    providerAllowed: false,
    publicOutputAllowed: false,
    gcpMutationAllowed: false,
    iamMutationAllowed: false,
    cloudRunDeployAllowed: false,
    dockerBuildPushAllowed: false,
    trackAExecutionAllowed: false,
    productionReadyAllowed: false,
    internalBetaAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeVlmModelApprovalReport(report: VlmModelApprovalReport): string {
  return [
    `Phase: ${report.phase}`,
    `Track: ${report.track}`,
    `Report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Candidate model: ${report.plan.candidateModel}`,
    `Candidate family: ${report.plan.candidateFamily}`,
    `Runtime candidate: ${report.plan.runtimeCandidate}`,
    `Fallback runtime planning only: ${report.plan.fallbackRuntimePlanningOnly}`,
    `Expected artifacts: ${report.plan.expectedArtifacts.length}`,
    `Model download allowed: ${report.modelDownloadAllowed}`,
    `Tokenizer download allowed: ${report.tokenizerDownloadAllowed}`,
    `Processor download allowed: ${report.processorDownloadAllowed}`,
    `vLLM execution allowed: ${report.vllmExecutionAllowed}`,
    `Transformers execution allowed: ${report.transformersExecutionAllowed}`,
    `SGLang execution allowed: ${report.sglangExecutionAllowed}`,
    `GPU job allowed: ${report.gpuJobAllowed}`,
    `Media processing allowed: ${report.mediaProcessingAllowed}`,
    `GCP mutation allowed: ${report.gcpMutationAllowed}`,
    `Track A execution allowed: ${report.trackAExecutionAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Phase 39B ready: ${report.phase39BReadiness.ready}`,
    `Phase 39C ready: ${report.phase39CReadiness.ready}`,
    `Phase 39D ready: ${report.phase39DReadiness.ready}`,
    `Phase 39E ready: ${report.phase39EReadiness.ready}`,
    '',
    'Sources:',
    ...report.sourceEvidence.map((evidence) => `- ${evidence.evidenceId}: ${evidence.sourceUrl}`),
    '',
    'Blockers:',
    ...report.blockers.map((blocker) => `- ${blocker}`),
    '',
    'Warnings:',
    ...report.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}

export function buildVlmModelApprovalPlanText(): string {
  const report = buildVlmModelApprovalReport()
  return [
    'Phase 39A Qwen3-VL/vLLM approval workflow plan',
    `Track: ${report.track}`,
    `Candidate model: ${report.plan.candidateModel}`,
    `Runtime candidate: ${report.plan.runtimeCandidate}`,
    `Private future storage: ${report.storagePlan.baseStagingPath}`,
    `Phase 39B ready for exact revision/file selection: ${report.phase39BReadiness.ready}`,
    `Blocked scopes: ${report.plan.blockedScopes.length}`,
    'Phase 39A does not download model/tokenizer/processor files, run vLLM/Transformers/SGLang, process media, run GPU jobs, mutate GCP/IAM, deploy, unlock beta/production, or touch Track A.',
    '',
    'Future handoffs:',
    ...report.downloadHandoffPlan.map((plan) => `- ${plan.planId}: ${plan.description}`),
    ...report.runtimeHandoffPlan.map((plan) => `- ${plan.planId}: ${plan.description}`),
  ].join('\n')
}

export function buildVlmModelWeightSummary(): string {
  const report = buildVlmModelApprovalReport()
  return [
    'Qwen3-VL model weight summary',
    `Candidate model: ${report.plan.candidateModel}`,
    `Candidate family: ${report.plan.candidateFamily}`,
    `Future private storage: ${report.storagePlan.baseStagingPath}`,
    'Exact revision: missing_until_phase39b',
    'Exact file manifest: missing_until_phase39b',
    'Checksums: missing_until_download',
    `Model download allowed now: ${report.modelDownloadAllowed}`,
    `Tokenizer download allowed now: ${report.tokenizerDownloadAllowed}`,
    `Processor download allowed now: ${report.processorDownloadAllowed}`,
    `Runtime execution allowed now: ${report.runtimeExecutionAllowed}`,
    `Phase 39B ready: ${report.phase39BReadiness.ready}`,
  ].join('\n')
}
