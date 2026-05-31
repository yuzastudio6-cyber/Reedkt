import type { OpenTimelineIoGateId, OpenTimelineIoValidationConfig } from './opentimelineio-validation-types'

export const openTimelineIoValidationConfig: OpenTimelineIoValidationConfig = {
  phase: '45C',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'opentimelineio_timeline_validation',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedPhase45ARunId: 'phase45a-20260531T19033',
  approvedPhase45APreviewGcsUri: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  approvedPhase45AReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json',
  approvedPhase45BRunId: 'phase45b-20260531T19552',
  approvedPhase45BPreviewGcsUri: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
  approvedPhase45BReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/reports/phase45b-report.json',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-render-hardening/phase45c',
  timelineName: 'reeditpro_phase45c_controlled_render_chain',
  timelineFps: 30,
  timelineDurationSeconds: 5.056,
  maxTimelineDurationSeconds: 5.25,
}

export const openTimelineIoDoesNotDo = [
  'no arbitrary media',
  'no final delivery',
  'no media processing',
  'no providers',
  'no Revideo',
  'no Track B tools',
  'no production, external beta, paid production, or broad-media unlock',
  'no public URLs or public bucket access',
]

export const openTimelineIoQaGateIds: OpenTimelineIoGateId[] = [
  'source_integrity',
  'phase45a_evidence',
  'phase45b_evidence',
  'otio_timeline_created_or_resolved',
  'otio_schema_valid',
  'timeline_duration_bounds',
  'clip_reference_integrity',
  'caption_render_reference_integrity',
  'no_public_artifacts',
  'no_final_delivery',
  'blocked_features',
]

export function makeOpenTimelineIoRunId(): string {
  return `phase45c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function openTimelineIoArtifactPrefix(runId: string): string {
  if (!/^phase45c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 45C run id: ${runId}`)
  return `${openTimelineIoValidationConfig.reportObjectPrefix}/${runId}`
}

export function validateOpenTimelineIoExecutionEnv(input: {
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
  timelineDurationSeconds?: number
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_OTIO_TIMELINE_VALIDATION
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_OTIO_TIMELINE_RUNTIME_MODE
  const sourceVideo = input.sourceVideo ?? process.env.REEDITPRO_PHASE45C_INPUT_VIDEO_GCS_URI
  const phase45APreview = input.phase45APreview ?? process.env.REEDITPRO_PHASE45C_PHASE45A_PREVIEW_GCS_URI
  const phase45AReport = input.phase45AReport ?? process.env.REEDITPRO_PHASE45C_PHASE45A_REPORT_GCS_URI
  const phase45BPreview = input.phase45BPreview ?? process.env.REEDITPRO_PHASE45C_PHASE45B_PREVIEW_GCS_URI
  const phase45BReport = input.phase45BReport ?? process.env.REEDITPRO_PHASE45C_PHASE45B_REPORT_GCS_URI

  if (projectId !== openTimelineIoValidationConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== openTimelineIoValidationConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== openTimelineIoValidationConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== openTimelineIoValidationConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_OTIO_TIMELINE_VALIDATION=true is required for execution.')
  if (runtimeMode !== openTimelineIoValidationConfig.runtimeMode) blockers.push('Runtime mode must be exactly opentimelineio_timeline_validation.')
  if (sourceVideo !== openTimelineIoValidationConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (phase45APreview !== openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri) blockers.push('Only the approved Phase 45A private burn-in preview is allowed.')
  if (phase45AReport !== openTimelineIoValidationConfig.approvedPhase45AReportGcsUri) blockers.push('Only the approved Phase 45A report is allowed.')
  if (phase45BPreview !== openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri) blockers.push('Only the approved Phase 45B private Remotion preview is allowed.')
  if (phase45BReport !== openTimelineIoValidationConfig.approvedPhase45BReportGcsUri) blockers.push('Only the approved Phase 45B report is allowed.')
  if (input.timelineDurationSeconds !== undefined && input.timelineDurationSeconds > openTimelineIoValidationConfig.maxTimelineDurationSeconds) blockers.push('Timeline duration must remain bounded to the Phase 45B preview duration.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.trackBEnabled ?? process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 45C creates timeline metadata and QA artifacts only.')
  warnings.push('Passing Phase 45C does not approve final delivery, production, external beta, paid production, providers, Revideo, Track B, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
