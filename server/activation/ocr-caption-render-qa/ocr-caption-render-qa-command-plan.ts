import {
  OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES,
  OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS,
  buildOcrCaptionRenderQaCandidateZones,
  ocrCaptionRenderQaConfig,
} from './ocr-caption-render-qa-policy'
import type { OcrCaptionRenderQaPlan } from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaPlan(createdAt = new Date().toISOString()): OcrCaptionRenderQaPlan {
  return {
    phase: '37E',
    planId: 'phase37e_ocr_caption_render_qa_plan',
    createdAt,
    executionScope: 'metadata_only_caption_render_qa_integration',
    requiredConfirmations: [
      'REEDITPRO_CONFIRM_OCR_CAPTION_RENDER_QA_EXECUTE=true',
      'REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ=true',
      'REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD=true',
    ],
    expectedArtifacts: OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS,
    candidateZones: buildOcrCaptionRenderQaCandidateZones(),
    blockedScopes: OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES,
    safety: {
      trackBOnly: true,
      ocrRuntimeExecuted: false,
      frameExtractionPerformed: false,
      mediaBytesRead: false,
      renderExecuted: false,
      trackAImported: false,
      betaProductionUnlocked: false,
    },
  }
}

export function buildOcrCaptionRenderQaCommandPlans() {
  return {
    phase: '37E' as const,
    scripts: {
      plan: 'npm run activation:ocr-caption-render-qa:plan',
      execute: 'npm run activation:ocr-caption-render-qa -- --execute --keep-temp',
      report: 'npm run activation:ocr-caption-render-qa:report',
      iamPlan: 'npm run activation:ocr-caption-render-qa:iam-plan',
      smoke: 'npm run smoke:activation-ocr-caption-render-qa',
    },
    requiredEnvironment: {
      GCP_PROJECT_ID: ocrCaptionRenderQaConfig.projectId,
      GCP_REGION: ocrCaptionRenderQaConfig.region,
      REEDITPRO_ENV: ocrCaptionRenderQaConfig.env,
    },
    currentShellOnlyConfirmations: [
      'REEDITPRO_CONFIRM_OCR_CAPTION_RENDER_QA_EXECUTE=true',
      'REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ=true',
      'REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD=true',
    ],
    forbiddenConfirmations: [
      'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true',
      'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE=true',
      'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION=true',
      'TRACK_A_EXECUTION_ENABLED=true',
      'REEDITPRO_PRODUCTION_READY=true',
      'REEDITPRO_EXTERNAL_BETA_READY=true',
    ],
  }
}
