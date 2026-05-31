import type { FinalRenderHardeningConfig, FinalRenderHardeningGateId } from './final-render-hardening-types'

export const finalRenderHardeningConfig: FinalRenderHardeningConfig = {
  phase: '45D',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'ffmpeg_final_render_hardening',
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
  runtimeJobName: 'reeditpro-staging-final-render-hardening-job',
  runtimeImageTag: 'staging-final-render-hardening-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-final-render-hardening:staging-final-render-hardening-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-final-render-hardening',
  serviceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '8Gi',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-render-hardening/phase45d',
  exportDurationSeconds: 5.056,
  maxExportDurationSeconds: 6,
  maxWidth: 768,
  maxHeight: 768,
  expectedVideoCodec: 'h264',
  expectedAudioCodec: 'aac',
  expectedContainer: 'mp4',
}

export const finalRenderHardeningDoesNotDo = [
  'no arbitrary media',
  'no public URLs or signed URLs as source of truth',
  'no user final delivery',
  'no providers',
  'no Revideo',
  'no Track B tools',
  'no production, external beta, paid production, or broad-media unlock',
]

export const finalRenderHardeningQaGateIds: FinalRenderHardeningGateId[] = [
  'source_integrity',
  'phase45a_evidence',
  'phase45b_evidence',
  'phase45c_evidence',
  'ffmpeg_export_invoked',
  'ffprobe_export_validation',
  'codec_container_integrity',
  'duration_bounds',
  'audio_video_integrity',
  'private_artifacts',
  'no_public_access',
  'no_final_delivery',
  'blocked_features',
]

export function makeFinalRenderHardeningRunId(): string {
  return `phase45d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function finalRenderHardeningArtifactPrefix(runId: string): string {
  if (!/^phase45d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 45D run id: ${runId}`)
  return `${finalRenderHardeningConfig.reportObjectPrefix}/${runId}`
}

export function validateFinalRenderHardeningExecutionEnv(input: {
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
  exportDurationSeconds?: number
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
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_FINAL_RENDER_HARDENING_RUNTIME_MODE
  const sourceVideo = input.sourceVideo ?? process.env.REEDITPRO_PHASE45D_INPUT_VIDEO_GCS_URI
  const phase45APreview = input.phase45APreview ?? process.env.REEDITPRO_PHASE45D_PHASE45A_PREVIEW_GCS_URI
  const phase45AReport = input.phase45AReport ?? process.env.REEDITPRO_PHASE45D_PHASE45A_REPORT_GCS_URI
  const phase45BPreview = input.phase45BPreview ?? process.env.REEDITPRO_PHASE45D_PHASE45B_PREVIEW_GCS_URI
  const phase45BReport = input.phase45BReport ?? process.env.REEDITPRO_PHASE45D_PHASE45B_REPORT_GCS_URI
  const phase45COtio = input.phase45COtio ?? process.env.REEDITPRO_PHASE45D_PHASE45C_OTIO_GCS_URI
  const phase45CReport = input.phase45CReport ?? process.env.REEDITPRO_PHASE45D_PHASE45C_REPORT_GCS_URI

  if (projectId !== finalRenderHardeningConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== finalRenderHardeningConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== finalRenderHardeningConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== finalRenderHardeningConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true is required for execution.')
  if (runtimeMode !== finalRenderHardeningConfig.runtimeMode) blockers.push('Runtime mode must be exactly ffmpeg_final_render_hardening.')
  if (sourceVideo !== finalRenderHardeningConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (phase45APreview !== finalRenderHardeningConfig.approvedPhase45APreviewGcsUri) blockers.push('Only the approved Phase 45A preview is allowed.')
  if (phase45AReport !== finalRenderHardeningConfig.approvedPhase45AReportGcsUri) blockers.push('Only the approved Phase 45A report is allowed.')
  if (phase45BPreview !== finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri) blockers.push('Only the approved Phase 45B preview is allowed.')
  if (phase45BReport !== finalRenderHardeningConfig.approvedPhase45BReportGcsUri) blockers.push('Only the approved Phase 45B report is allowed.')
  if (phase45COtio !== finalRenderHardeningConfig.approvedPhase45COtioGcsUri) blockers.push('Only the approved Phase 45C OTIO artifact is allowed.')
  if (phase45CReport !== finalRenderHardeningConfig.approvedPhase45CReportGcsUri) blockers.push('Only the approved Phase 45C report is allowed.')
  if (input.exportDurationSeconds !== undefined && input.exportDurationSeconds > finalRenderHardeningConfig.maxExportDurationSeconds) blockers.push('Review export duration must remain bounded.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.trackBEnabled ?? process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 45D creates one bounded private review export only.')
  warnings.push('Passing Phase 45D does not approve user final delivery, production, external beta, paid production, providers, Revideo, Track B, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
