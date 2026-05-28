import type { MaskModelCandidateRecord } from './mask-model-approval-types'

export const MASK_MODEL_APPROVAL_REVIEWED_AT = '2026-05-28'
export const BIREFNET_MANIFEST_ID = 'birefnet_main_staging_v1'
export const BIREFNET_RUNTIME_PATH = '/opt/reeditpro/model-weights/birefnet/main'
export const BIREFNET_RUNTIME_TEMP_PATH = '/tmp/reeditpro-model-weights/birefnet/main'
export const BIREFNET_STAGING_PATH = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/'

export const maskModelCandidateRegistry: MaskModelCandidateRecord[] = [
  {
    candidateId: 'zhengpeng7_birefnet',
    toolId: 'birefnet',
    modelName: 'ZhengPeng7/BiRefNet',
    statuses: ['candidate_for_phase33_mask_test', 'recommended_for_first_mask_test'],
    purpose: 'staging representative-frame single-frame background-removal test',
    task: 'image segmentation / background removal / mask generation',
    sourceUrl: 'https://huggingface.co/ZhengPeng7/BiRefNet',
    officialGithubUrl: 'https://github.com/ZhengPeng7/BiRefNet',
    expectedPath: BIREFNET_RUNTIME_PATH,
    runtimeTempPath: BIREFNET_RUNTIME_TEMP_PATH,
    stagingStoragePath: BIREFNET_STAGING_PATH,
    targetFuturePhases: [
      'phase33b_download_load_birefnet_weights',
      'phase33c_gpu_runtime_verification',
      'phase33d_real_video_mask_test_after_runtime_passes',
    ],
    canApproveForStagingSingleFrameBackgroundRemoval: true,
    approvedFor: [
      'staging_single_frame_background_removal',
      'phase33_mask_model_runtime_verification',
      'phase33_real_video_mask_test_after_runtime_passes',
    ],
    notes: [
      'Only mask model approved by Phase 33A.',
      'Approval is limited to representative-frame/single-frame background removal planning.',
      'Actual model download, runtime loading, mask execution, and text-behind-subject execution are separate later phases.',
    ],
  },
  {
    candidateId: 'facebook_sam2_hiera_tiny',
    toolId: 'sam2',
    modelName: 'facebook/sam2-hiera-tiny',
    statuses: ['evaluated_only'],
    purpose: 'future video subject tracking and mask propagation candidate',
    task: 'mask generation / segmentation / future video tracking',
    sourceUrl: 'https://huggingface.co/facebook/sam2-hiera-tiny',
    officialGithubUrl: 'https://github.com/facebookresearch/sam2',
    expectedPath: '/opt/reeditpro/model-weights/sam2/hiera-tiny',
    runtimeTempPath: '/tmp/reeditpro-model-weights/sam2/hiera-tiny',
    stagingStoragePath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/hiera-tiny/',
    targetFuturePhases: ['future_video_mask_tracking_phase'],
    canApproveForStagingSingleFrameBackgroundRemoval: false,
    approvedFor: [],
    blockedReason: 'SAM2 is evaluated-only in Phase 33A and blocked until a separate video tracking approval phase.',
    notes: [
      'Recorded as future mask propagation evidence only.',
      'No SAM2 checkpoint download or execution is approved in Phase 33A.',
    ],
  },
  {
    candidateId: 'meta_sam2_official_checkpoints',
    toolId: 'sam2',
    modelName: 'Meta SAM2 official repo/checkpoints',
    statuses: ['upstream_evidence', 'evaluated_only'],
    purpose: 'upstream SAM2 license/checkpoint evidence for future video mask tracking',
    task: 'mask generation / video segmentation upstream evidence',
    sourceUrl: 'https://github.com/facebookresearch/sam2',
    targetFuturePhases: ['future_video_mask_tracking_phase'],
    canApproveForStagingSingleFrameBackgroundRemoval: false,
    approvedFor: [],
    blockedReason: 'SAM2 official checkpoints are evidence-only in Phase 33A and blocked for execution.',
    notes: [
      'Official repository and checkpoint evidence only.',
      'Third-party font and optional third-party code license notes must remain in evidence.',
    ],
  },
  blockedMaskModel('deepfilternet_model', 'deepfilternet', 'DeepFilterNet model', 'DeepFilterNet remains blocked; audio model execution is not Phase 33A scope.'),
  blockedMaskModel('demucs_model', 'demucs', 'Demucs model', 'Demucs remains blocked; source separation is not Phase 33A scope.'),
  blockedMaskModel('real_esrgan_model', 'real_esrgan', 'Real-ESRGAN model', 'Real-ESRGAN remains blocked; enhancement is not Phase 33A scope.'),
  blockedMaskModel('film_model', 'film', 'FILM model', 'FILM remains blocked; slow motion is not Phase 33A scope.'),
  blockedMaskModel('paddleocr_gpu_model', 'paddleocr', 'PaddleOCR GPU model', 'PaddleOCR GPU remains blocked; OCR is not Phase 33A scope.'),
  blockedMaskModel('provider_models', 'provider_models', 'Provider models', 'Provider models remain blocked; no provider calls or approvals in Phase 33A.'),
  blockedMaskModel('revideo_runtime', 'revideo', 'Revideo', 'Revideo remains blocked and is not a production/core path.'),
  blockedMaskModel('text_behind_subject_execution', 'text_behind_subject', 'Text-behind-subject execution', 'Text-behind-subject remains blocked until runtime mask QA passes.'),
]

export function listMaskModelApprovalCandidates(): MaskModelCandidateRecord[] {
  return [...maskModelCandidateRegistry]
}

export function getMaskModelApprovalCandidate(candidateId: string): MaskModelCandidateRecord | undefined {
  return maskModelCandidateRegistry.find((candidate) => candidate.candidateId === candidateId)
}

function blockedMaskModel(
  candidateId: string,
  toolId: string,
  modelName: string,
  blockedReason: string,
): MaskModelCandidateRecord {
  return {
    candidateId,
    toolId,
    modelName,
    statuses: ['blocked'],
    purpose: 'blocked pending separate model-weight/license approval',
    task: 'blocked',
    targetFuturePhases: [],
    canApproveForStagingSingleFrameBackgroundRemoval: false,
    approvedFor: [],
    blockedReason,
    notes: [blockedReason],
  }
}
