import type { EnhancementModelCandidateRecord } from './enhancement-model-approval-types'

export const ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT = '2026-05-28'
export const REAL_ESRGAN_X4PLUS_MANIFEST_ID = 'real_esrgan_x4plus_staging_v1'
export const REAL_ESRGAN_X4PLUS_RUNTIME_PATH = '/opt/reeditpro/model-weights/real-esrgan/x4plus'
export const REAL_ESRGAN_X4PLUS_RUNTIME_TEMP_PATH = '/tmp/reeditpro-model-weights/real-esrgan/x4plus'
export const REAL_ESRGAN_X4PLUS_STAGING_PATH = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/'
export const FILM_EVALUATED_ONLY_STAGING_PATH = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/style/'

export const enhancementModelCandidateRegistry: EnhancementModelCandidateRecord[] = [
  {
    candidateId: 'xinntao_real_esrgan_x4plus',
    toolId: 'real_esrgan',
    modelName: 'RealESRGAN_x4plus',
    statuses: ['candidate_for_phase34_enhancement_test', 'recommended_for_first_enhancement_test'],
    purpose: 'staging sample-first representative-frame or short-sample enhancement planning',
    task: 'image/video restoration, upscaling, and enhancement',
    sourceUrl: 'https://github.com/xinntao/Real-ESRGAN',
    releaseAssetUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
    expectedPath: REAL_ESRGAN_X4PLUS_RUNTIME_PATH,
    runtimeTempPath: REAL_ESRGAN_X4PLUS_RUNTIME_TEMP_PATH,
    stagingStoragePath: REAL_ESRGAN_X4PLUS_STAGING_PATH,
    targetFuturePhases: [
      'phase34b_download_load_real_esrgan_x4plus_weights',
      'phase34c_real_esrgan_runtime_verification',
      'phase34d_real_video_enhancement_sample_after_runtime_passes',
    ],
    canApproveForStagingSampleFirstEnhancement: true,
    approvedFor: [
      'staging_sample_first_enhancement',
      'phase34_enhancement_runtime_verification',
      'phase34_real_video_enhancement_sample_after_runtime_passes',
    ],
    notes: [
      'Only enhancement model approved by Phase 34A.',
      'Approval is limited to staging sample-first enhancement planning.',
      'Actual weight download, runtime loading, media enhancement, slow motion, and full-video processing are separate later phases.',
    ],
  },
  {
    candidateId: 'realesrgan_smaller_general_alternatives',
    toolId: 'real_esrgan',
    modelName: 'RealESRGAN_x2plus / realesr-general alternatives',
    statuses: ['evaluated_only'],
    purpose: 'future smaller or alternate general-image enhancement candidate',
    task: 'image restoration / upscaling / enhancement',
    sourceUrl: 'https://github.com/xinntao/Real-ESRGAN',
    targetFuturePhases: ['future_enhancement_model_selection_phase'],
    canApproveForStagingSampleFirstEnhancement: false,
    approvedFor: [],
    blockedReason: 'Smaller/general Real-ESRGAN alternatives are evaluated-only in Phase 34A; RealESRGAN_x4plus is the only approved first-test model.',
    notes: [
      'Recorded for future cost/runtime comparison only.',
      'No alternate Real-ESRGAN weight download or execution is approved in Phase 34A.',
    ],
  },
  {
    candidateId: 'google_research_film',
    toolId: 'film',
    modelName: 'FILM frame interpolation',
    statuses: ['evaluated_only'],
    purpose: 'future selected-clip slow-motion and frame interpolation candidate',
    task: 'frame interpolation / slow motion',
    sourceUrl: 'https://github.com/google-research/frame-interpolation',
    stagingStoragePath: FILM_EVALUATED_ONLY_STAGING_PATH,
    targetFuturePhases: ['future_film_slowmotion_approval_download_runtime_phase'],
    canApproveForStagingSampleFirstEnhancement: false,
    approvedFor: [],
    blockedReason: 'FILM is evaluated-only in Phase 34A and blocked until a separate slow-motion approval/download/runtime phase.',
    notes: [
      'Official repository evidence is recorded for future slow-motion planning only.',
      'No FILM model download or execution is approved in Phase 34A.',
    ],
  },
  blockedEnhancementModel('film_execution', 'film', 'FILM execution', 'FILM execution remains blocked; slow motion is not Phase 34A scope.'),
  blockedEnhancementModel('film_download', 'film', 'FILM download', 'FILM model downloads remain blocked until a separate approval phase.'),
  blockedEnhancementModel('slow_motion_execution', 'slow_motion', 'Slow-motion execution', 'Slow-motion execution remains blocked until a separate FILM approval/download/runtime phase.'),
  blockedEnhancementModel('full_video_enhancement', 'real_esrgan', 'Full-video enhancement', 'Full-video blind enhancement remains blocked; Phase 34A approves sample-first planning only.'),
  blockedEnhancementModel('sam2_model', 'sam2', 'SAM2 model', 'SAM2 remains blocked; video tracking is not Phase 34A scope.'),
  blockedEnhancementModel('birefnet_new_execution', 'birefnet', 'BiRefNet new execution', 'New BiRefNet execution remains blocked; Phase 34A is enhancement/slow-motion approval only.'),
  blockedEnhancementModel('deepfilternet_model', 'deepfilternet', 'DeepFilterNet model', 'DeepFilterNet remains blocked; audio model execution is not Phase 34A scope.'),
  blockedEnhancementModel('demucs_model', 'demucs', 'Demucs model', 'Demucs remains blocked; source separation is not Phase 34A scope.'),
  blockedEnhancementModel('paddleocr_gpu_model', 'paddleocr', 'PaddleOCR GPU model', 'PaddleOCR GPU remains blocked; OCR is not Phase 34A scope.'),
  blockedEnhancementModel('provider_models', 'provider_models', 'Provider models', 'Provider models remain blocked; no provider calls or approvals in Phase 34A.'),
  blockedEnhancementModel('revideo_runtime', 'revideo', 'Revideo', 'Revideo remains blocked and is not a production/core path.'),
]

export function listEnhancementModelApprovalCandidates(): EnhancementModelCandidateRecord[] {
  return [...enhancementModelCandidateRegistry]
}

export function getEnhancementModelApprovalCandidate(candidateId: string): EnhancementModelCandidateRecord | undefined {
  return enhancementModelCandidateRegistry.find((candidate) => candidate.candidateId === candidateId)
}

function blockedEnhancementModel(
  candidateId: string,
  toolId: string,
  modelName: string,
  blockedReason: string,
): EnhancementModelCandidateRecord {
  return {
    candidateId,
    toolId,
    modelName,
    statuses: ['blocked'],
    purpose: 'blocked pending separate model-weight/license approval',
    task: 'blocked',
    targetFuturePhases: [],
    canApproveForStagingSampleFirstEnhancement: false,
    approvedFor: [],
    blockedReason,
    notes: [blockedReason],
  }
}
