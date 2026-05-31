import type { RemotionRenderValidationConfig } from './remotion-render-validation-types'

export const remotionRenderValidationConfig: RemotionRenderValidationConfig = {
  phase: '45B',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'remotion_render_validation',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedPhase45ARunId: 'phase45a-20260531T19033',
  approvedPhase45APreviewGcsUri: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  approvedPhase45AReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json',
  runtimeJobName: 'reeditpro-staging-remotion-render-validation-job',
  runtimeImageTag: 'staging-remotion-render-validation-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-remotion-render-validation:staging-remotion-render-validation-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-remotion-render-validation',
  serviceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '8Gi',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-render-hardening/phase45b',
  previewDurationSeconds: 5,
  maxPreviewDurationSeconds: 5,
  previewWidth: 432,
  previewHeight: 768,
  previewFps: 30,
}

export const remotionRenderDoesNotDo = [
  'no arbitrary media',
  'no final delivery',
  'no providers',
  'no Revideo',
  'no Track B tools',
  'no production, external beta, paid production, or broad-media unlock',
  'no public URLs or public bucket access',
]

export function makeRemotionRenderRunId(): string {
  return `phase45b-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function remotionRenderArtifactPrefix(runId: string): string {
  if (!/^phase45b-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 45B run id: ${runId}`)
  return `${remotionRenderValidationConfig.reportObjectPrefix}/${runId}`
}

export function validateRemotionRenderExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  sourceVideo?: string
  phase45APreview?: string
  phase45AReport?: string
  previewDurationSeconds?: number
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_REMOTION_RENDER_RUNTIME_MODE
  const sourceVideo = input.sourceVideo ?? process.env.REEDITPRO_PHASE45B_INPUT_VIDEO_GCS_URI
  const phase45APreview = input.phase45APreview ?? process.env.REEDITPRO_PHASE45B_PHASE45A_PREVIEW_GCS_URI
  const phase45AReport = input.phase45AReport ?? process.env.REEDITPRO_PHASE45B_PHASE45A_REPORT_GCS_URI

  if (projectId !== remotionRenderValidationConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== remotionRenderValidationConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== remotionRenderValidationConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== remotionRenderValidationConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION=true is required for execution.')
  if (runtimeMode !== remotionRenderValidationConfig.runtimeMode) blockers.push('Runtime mode must be exactly remotion_render_validation.')
  if (sourceVideo !== remotionRenderValidationConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (phase45APreview !== remotionRenderValidationConfig.approvedPhase45APreviewGcsUri) blockers.push('Only the approved Phase 45A private burn-in preview is allowed.')
  if (phase45AReport !== remotionRenderValidationConfig.approvedPhase45AReportGcsUri) blockers.push('Only the approved Phase 45A report is allowed.')
  if (input.previewDurationSeconds !== undefined && input.previewDurationSeconds > remotionRenderValidationConfig.maxPreviewDurationSeconds) blockers.push('Preview duration must remain bounded to 5 seconds or less.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.trackBEnabled ?? process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 45B creates a bounded private Remotion render preview only.')
  warnings.push('Passing Phase 45B does not approve final delivery, production, external beta, paid production, providers, Revideo, Track B, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
