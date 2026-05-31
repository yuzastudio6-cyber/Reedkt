import { PHASE39A_VLM_BLOCKED_SCOPES } from './vlm-model-approval-policy'
import type {
  VlmApprovalBlockerReport,
  VlmGpuCostRiskReport,
  VlmPrivacySecurityPolicyReport,
} from './vlm-model-approval-types'

export const vlmModelApprovalBlockers = [
  'phase39a_no_model_download: Qwen3-VL model/tokenizer/processor downloads are blocked until Phase 39B.',
  'phase39a_no_runtime_execution: vLLM, Transformers, SGLang, GPU, and inference execution are blocked until later approved phases.',
  'phase39a_no_media_processing: images, videos, real media, arbitrary files, and controlled frames are blocked.',
  'phase39a_no_gcp_mutation: GCS uploads, IAM changes, Cloud Run deploys, Docker build/push, and GPU jobs are blocked.',
  'phase39a_no_track_a_or_launch_unlock: Track A, beta, production, providers, and public output remain blocked.',
]

export const vlmModelApprovalWarnings = [
  'Qwen3-VL/vLLM evidence supports planning only; Phase 39B must revalidate exact revision and file metadata before download.',
  'The prompt-provided Qwen vLLM version note and current Qwen3-VL repo runtime note differ; Phase 39C must pin a compatible vLLM version after runtime review.',
  'vLLM and Transformers can download from external model hubs by default unless future runtime code uses private local paths and a network/model-download guard.',
  'Qwen3-VL practical runtime likely requires GPU memory/cost review before generated-fixture verification.',
]

export function buildVlmPrivacySecurityPolicyReport(): VlmPrivacySecurityPolicyReport {
  return {
    reportId: 'phase_39a_vlm_privacy_security_policy_report',
    metadataOnly: true,
    privateArtifactsOnly: true,
    publicArtifactPathsAllowed: false,
    signedUrlsAllowed: false,
    credentialsOrSecretsAllowed: false,
    mediaBytesAllowed: false,
    modelBytesAllowed: false,
    generatedReportsSafeToCommit: true,
    blockedInputs: [
      'public artifact paths',
      'signed URLs',
      'local media files',
      'image/video bytes',
      'model/tokenizer/processor payloads',
      'credential files',
      'secret logs',
    ],
    retentionNotes: [
      'Phase 39A reports are safe metadata only and may be committed.',
      'Future private model assets must live in generated-assets private GCS and outside git.',
      'Future VLM QA artifacts must be JSON-only and private unless a later explicit policy permits otherwise.',
    ],
  }
}

export function buildVlmGpuCostRiskReport(): VlmGpuCostRiskReport {
  return {
    reportId: 'phase_39a_vlm_gpu_cost_risk_report',
    gpuRuntimeApprovedNow: false,
    likelyGpuNeed: 'high',
    candidateRuntime: 'vLLM',
    risks: [
      {
        riskId: 'vlm-gpu-memory-cost',
        severity: 'blocker',
        currentStatus: 'Qwen3-VL 8B runtime is not costed or GPU-sized in Phase 39A.',
        mitigation: 'Phase 39C must choose bounded generated fixtures, max tokens, image size, batch size, and GPU class before execution.',
        evidenceRequiredToClear: 'Pinned runtime profile with memory estimate, timeout, max tokens, and cost guard.',
      },
      {
        riskId: 'runtime-auto-download',
        severity: 'blocker',
        currentStatus: 'vLLM/Transformers may fetch model files if local paths are not used.',
        mitigation: 'Future runtime must use private local paths and a network/model-download guard.',
        evidenceRequiredToClear: 'Phase 39C no-download-at-runtime proof.',
      },
      {
        riskId: 'vlm-output-overtrust',
        severity: 'warning',
        currentStatus: 'VLM object/safe-zone suggestions are advisory and may be wrong.',
        mitigation: 'Route low-confidence or collision-risk outputs to manual review and deterministic QA.',
        evidenceRequiredToClear: 'Generated and controlled fixture QA showing structured confidence/manual-review behavior.',
      },
      {
        riskId: 'version-compatibility-drift',
        severity: 'warning',
        currentStatus: 'Qwen/vLLM minimum-version evidence varies across docs and model families.',
        mitigation: 'Phase 39C must pin exact vLLM, CUDA, Torch, Transformers, and qwen-vl-utils versions after current-source review.',
        evidenceRequiredToClear: 'Runtime dependency lock and local generated-fixture pass.',
      },
    ],
  }
}

export function buildVlmApprovalBlockerReport(): VlmApprovalBlockerReport {
  return {
    reportId: 'phase_39a_vlm_approval_blocker_report',
    blockers: vlmModelApprovalBlockers,
    warnings: vlmModelApprovalWarnings,
    blockedScopes: PHASE39A_VLM_BLOCKED_SCOPES,
    requiredHumanReviews: [
      'Human legal/source review before Phase 39B if exact model-card license/source metadata differs from Phase 39A evidence.',
      'Human GPU/cost review before Phase 39C runtime execution.',
      'Human privacy review before any Phase 39D controlled real-frame VLM run.',
    ],
  }
}
