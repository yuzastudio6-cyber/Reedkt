import type { ModelCandidateRecord } from './model-approval-types'

export const FASTER_WHISPER_TINY_MANIFEST_ID = 'faster_whisper_tiny_staging_v1'
export const MODEL_APPROVAL_REVIEWED_AT = '2026-05-27'
export const FASTER_WHISPER_TINY_RUNTIME_PATH = '/opt/reeditpro/model-weights/faster-whisper/tiny'
export const FASTER_WHISPER_TINY_STAGING_PATH = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/'

export const modelApprovalCandidateRegistry: ModelCandidateRecord[] = [
  {
    candidateId: 'systran_faster_whisper_tiny',
    toolId: 'faster_whisper',
    runtime: 'ctranslate2',
    modelName: 'Systran/faster-whisper-tiny',
    modelVersion: 'd90ca5fe260221311c53c58e660288d3deb8d356',
    status: 'recommended_for_first_test',
    purpose: 'staging speech/caption test only',
    sourceUrl: 'https://huggingface.co/Systran/faster-whisper-tiny',
    upstreamModelName: 'openai/whisper-tiny',
    expectedPath: FASTER_WHISPER_TINY_RUNTIME_PATH,
    stagingStoragePath: FASTER_WHISPER_TINY_STAGING_PATH,
    requiredForPhase28: true,
    canApproveForStagingSpeechCaption: true,
    approvedFor: ['staging_speech_caption', 'phase28_first_real_video_speech_caption'],
    notes: [
      'Direct execution artifact for Phase 28 planning.',
      'CTranslate2 conversion of openai/whisper-tiny.',
      'Tiny scope is selected to minimize first real-video speech/caption test risk and runtime cost.',
    ],
  },
  {
    candidateId: 'systran_faster_whisper_tiny_en',
    toolId: 'faster_whisper',
    runtime: 'ctranslate2',
    modelName: 'Systran/faster-whisper-tiny.en',
    modelVersion: '53b4a348cf5fad713d6322c9120d56326f831b0d',
    status: 'candidate',
    purpose: 'future English-only speech/caption evaluation',
    sourceUrl: 'https://huggingface.co/Systran/faster-whisper-tiny.en',
    upstreamModelName: 'openai/whisper-tiny.en',
    expectedPath: '/opt/reeditpro/model-weights/faster-whisper/tiny.en',
    stagingStoragePath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny.en/',
    requiredForPhase28: false,
    canApproveForStagingSpeechCaption: false,
    approvedFor: [],
    blockedReason: 'Not approved by default in Phase 26; keep available for later English-only evaluation.',
    notes: ['Candidate only; not approved for Phase 28 by default.'],
  },
  {
    candidateId: 'systran_faster_whisper_base',
    toolId: 'faster_whisper',
    runtime: 'ctranslate2',
    modelName: 'Systran/faster-whisper-base',
    status: 'evaluated_only',
    purpose: 'larger Whisper model comparison after tiny scope',
    sourceUrl: 'https://huggingface.co/Systran/faster-whisper-base',
    upstreamModelName: 'openai/whisper-base',
    expectedPath: '/opt/reeditpro/model-weights/faster-whisper/base',
    stagingStoragePath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/base/',
    requiredForPhase28: false,
    canApproveForStagingSpeechCaption: false,
    approvedFor: [],
    blockedReason: 'Evaluated only; larger models are not approved in Phase 26.',
    notes: ['Requires separate quality/cost/license review before any later use.'],
  },
  {
    candidateId: 'openai_whisper_tiny_upstream',
    toolId: 'faster_whisper',
    runtime: 'openai_whisper_reference',
    modelName: 'openai/whisper-tiny',
    modelVersion: '3b5167921fddc51c5cd60ba4501d79fe1c849254',
    status: 'upstream_evidence',
    purpose: 'upstream evidence for Systran CTranslate2 conversion',
    sourceUrl: 'https://huggingface.co/openai/whisper-tiny',
    requiredForPhase28: false,
    canApproveForStagingSpeechCaption: false,
    approvedFor: [],
    notes: [
      'Upstream evidence only; not the direct execution artifact for Phase 28.',
      'License metadata discrepancy is recorded in model-license-evidence.',
    ],
  },
  blockedModel('birefnet_model', 'birefnet', 'BiRefNet model', 'BiRefNet remains blocked; not speech/caption scope.'),
  blockedModel('sam2_checkpoint', 'sam2', 'SAM2 checkpoint', 'SAM2 remains blocked; not speech/caption scope.'),
  blockedModel('deepfilternet_model', 'deepfilternet', 'DeepFilterNet model', 'DeepFilterNet remains blocked; audio cleanup is not Phase 28 scope.'),
  blockedModel('demucs_model', 'demucs', 'Demucs model', 'Demucs remains blocked; source separation is not Phase 28 scope.'),
  blockedModel('real_esrgan_model', 'real_esrgan', 'Real-ESRGAN model', 'Real-ESRGAN remains blocked; enhancement is not Phase 28 scope.'),
  blockedModel('film_model', 'film', 'FILM model', 'FILM remains blocked; slow motion is not Phase 28 scope.'),
  blockedModel('paddleocr_gpu_model', 'paddleocr', 'PaddleOCR GPU model', 'PaddleOCR GPU remains blocked; OCR is not Phase 28 speech/caption scope.'),
  blockedModel('provider_models', 'provider_models', 'Provider models', 'Provider models remain blocked; no provider calls or approvals in Phase 26.'),
  blockedModel('revideo_runtime', 'revideo', 'Revideo', 'Revideo remains blocked and is not a production/core path.'),
]

export function listModelApprovalCandidates(): ModelCandidateRecord[] {
  return [...modelApprovalCandidateRegistry]
}

export function getModelApprovalCandidate(candidateId: string): ModelCandidateRecord | undefined {
  return modelApprovalCandidateRegistry.find((candidate) => candidate.candidateId === candidateId)
}

function blockedModel(
  candidateId: string,
  toolId: string,
  modelName: string,
  blockedReason: string,
): ModelCandidateRecord {
  return {
    candidateId,
    toolId,
    modelName,
    status: 'blocked',
    purpose: 'blocked pending separate model-weight/license approval',
    requiredForPhase28: false,
    canApproveForStagingSpeechCaption: false,
    approvedFor: [],
    blockedReason,
    notes: [blockedReason],
  }
}
