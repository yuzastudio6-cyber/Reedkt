import type { FullVisualVideoPrivateE2eConfig, FullVisualVideoPrivateE2eGateId } from './full-visual-video-private-e2e-types'

export const fullVisualVideoPrivateE2eConfig: FullVisualVideoPrivateE2eConfig = {
  phase: '45E',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'full_visual_video_private_e2e',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedPhase45ARunId: 'phase45a-20260531T19033',
  approvedPhase45APreviewGcsUri: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  approvedPhase45AReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json',
  approvedPhase45BRunId: 'phase45b-20260531T19552',
  approvedPhase45BPreviewGcsUri: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
  approvedPhase45BReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/reports/phase45b-report.json',
  approvedPhase45CRunId: 'phase45c-20260531T20404',
  approvedPhase45COtioGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json',
  approvedPhase45CReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45c/phase45c-20260531T20404/reports/phase45c-report.json',
  approvedPhase45DRunId: 'phase45d-20260531T22235',
  approvedPhase45DReviewExportGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4',
  approvedPhase45DFfprobeValidationGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45d/phase45d-20260531T22235/export/ffprobe-export-validation.json',
  approvedPhase45DReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45d/phase45d-20260531T22235/reports/phase45d-report.json',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-render-hardening/phase45e',
  maxReviewDurationSeconds: 6,
  maxWidth: 768,
  maxHeight: 768,
  expectedVideoCodec: 'h264',
  expectedAudioCodec: 'aac',
}

export const fullVisualVideoPrivateE2eDoesNotDo = [
  'no arbitrary media',
  'no public URLs or signed URLs as source of truth',
  'no user final delivery',
  'no providers',
  'no Revideo',
  'no Track B tools',
  'no production, external beta, paid production, or broad-media unlock',
]

export const fullVisualVideoPrivateE2eQaGateIds: FullVisualVideoPrivateE2eGateId[] = [
  'source_integrity',
  'phase45a_libass_evidence',
  'phase45b_remotion_evidence',
  'phase45c_otio_evidence',
  'phase45d_ffmpeg_ffprobe_evidence',
  'private_review_export_integrity',
  'ffprobe_review_export_validation',
  'evidence_manifest_created',
  'artifact_privacy',
  'no_public_access',
  'no_final_delivery',
  'blocked_features',
]

export function makeFullVisualVideoPrivateE2eRunId(): string {
  return `phase45e-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function fullVisualVideoPrivateE2eArtifactPrefix(runId: string): string {
  if (!/^phase45e-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 45E run id: ${runId}`)
  return `${fullVisualVideoPrivateE2eConfig.reportObjectPrefix}/${runId}`
}

export function validateFullVisualVideoPrivateE2eExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  sourceVideo?: string
  phase45APreview?: string
  phase45AReport?: string
  phase45BPreview?: string
  phase45BReport?: string
  phase45COtio?: string
  phase45CReport?: string
  phase45DReviewExport?: string
  phase45DFfprobeValidation?: string
  phase45DReport?: string
  providerExecutionEnabled?: string
  revideoEnabled?: string
  trackBEnabled?: string
  publicAccessEnabled?: string
  finalDeliveryEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const config = fullVisualVideoPrivateE2eConfig
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_FULL_VISUAL_VIDEO_PRIVATE_E2E_RUNTIME_MODE ?? config.runtimeMode
  const sourceVideo = input.sourceVideo ?? process.env.REEDITPRO_PHASE45E_INPUT_VIDEO_GCS_URI ?? config.approvedInputVideoGcsUri
  const phase45APreview = input.phase45APreview ?? process.env.REEDITPRO_PHASE45E_PHASE45A_PREVIEW_GCS_URI ?? config.approvedPhase45APreviewGcsUri
  const phase45AReport = input.phase45AReport ?? process.env.REEDITPRO_PHASE45E_PHASE45A_REPORT_GCS_URI ?? config.approvedPhase45AReportGcsUri
  const phase45BPreview = input.phase45BPreview ?? process.env.REEDITPRO_PHASE45E_PHASE45B_PREVIEW_GCS_URI ?? config.approvedPhase45BPreviewGcsUri
  const phase45BReport = input.phase45BReport ?? process.env.REEDITPRO_PHASE45E_PHASE45B_REPORT_GCS_URI ?? config.approvedPhase45BReportGcsUri
  const phase45COtio = input.phase45COtio ?? process.env.REEDITPRO_PHASE45E_PHASE45C_OTIO_GCS_URI ?? config.approvedPhase45COtioGcsUri
  const phase45CReport = input.phase45CReport ?? process.env.REEDITPRO_PHASE45E_PHASE45C_REPORT_GCS_URI ?? config.approvedPhase45CReportGcsUri
  const phase45DReviewExport = input.phase45DReviewExport ?? process.env.REEDITPRO_PHASE45E_PHASE45D_REVIEW_EXPORT_GCS_URI ?? config.approvedPhase45DReviewExportGcsUri
  const phase45DFfprobeValidation = input.phase45DFfprobeValidation ?? process.env.REEDITPRO_PHASE45E_PHASE45D_FFPROBE_VALIDATION_GCS_URI ?? config.approvedPhase45DFfprobeValidationGcsUri
  const phase45DReport = input.phase45DReport ?? process.env.REEDITPRO_PHASE45E_PHASE45D_REPORT_GCS_URI ?? config.approvedPhase45DReportGcsUri

  if (projectId !== config.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== config.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== config.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== config.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E=true is required for execution.')
  if (runtimeMode !== config.runtimeMode) blockers.push('Runtime mode must be exactly full_visual_video_private_e2e.')
  if (sourceVideo !== config.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (phase45APreview !== config.approvedPhase45APreviewGcsUri) blockers.push('Only the approved Phase 45A preview is allowed.')
  if (phase45AReport !== config.approvedPhase45AReportGcsUri) blockers.push('Only the approved Phase 45A report is allowed.')
  if (phase45BPreview !== config.approvedPhase45BPreviewGcsUri) blockers.push('Only the approved Phase 45B preview is allowed.')
  if (phase45BReport !== config.approvedPhase45BReportGcsUri) blockers.push('Only the approved Phase 45B report is allowed.')
  if (phase45COtio !== config.approvedPhase45COtioGcsUri) blockers.push('Only the approved Phase 45C OTIO artifact is allowed.')
  if (phase45CReport !== config.approvedPhase45CReportGcsUri) blockers.push('Only the approved Phase 45C report is allowed.')
  if (phase45DReviewExport !== config.approvedPhase45DReviewExportGcsUri) blockers.push('Only the approved Phase 45D private review export is allowed.')
  if (phase45DFfprobeValidation !== config.approvedPhase45DFfprobeValidationGcsUri) blockers.push('Only the approved Phase 45D FFprobe validation is allowed.')
  if (phase45DReport !== config.approvedPhase45DReportGcsUri) blockers.push('Only the approved Phase 45D report is allowed.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.trackBEnabled ?? process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 45E assembles a private E2E evidence package only.')
  warnings.push('Passing Phase 45E does not approve user final delivery, production, external beta, paid production, providers, Revideo, Track B, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
