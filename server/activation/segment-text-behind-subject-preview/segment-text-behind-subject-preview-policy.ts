import type {
  SegmentTextBehindSubjectPreviewConfig,
  SegmentTextBehindSubjectPreviewEnvValidationInput,
  SegmentTextBehindSubjectPreviewExecutionReport,
  SegmentTextBehindSubjectPreviewValidationResult,
} from './segment-text-behind-subject-preview-types'

export const segmentTextBehindSubjectPreviewConfig: SegmentTextBehindSubjectPreviewConfig = {
  phase: '35E',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedPhase35DRunId: 'phase35d-20260530T004442',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedSegmentStartSeconds: 6.9,
  approvedSegmentEndSeconds: 8.9,
  approvedSegmentDurationSeconds: 2.0,
  approvedFrameCount: 10,
  approvedFrameWidth: 768,
  approvedFrameHeight: 432,
  approvedText: 'REEDITPRO',
  generatedAssetsInputPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-20260530T004442/',
  masksInputPrefix: 'gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-20260530T004442/',
  qaInputPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/phase35d-20260530T004442/',
  outputPreviewPrefix: 'gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/',
  outputGeneratedAssetsPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/',
  outputQaPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35e/',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  masksBucket: 'reeditpro-staging-reeditpro-masks',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  segmentTextBehindSubjectAllowed: true,
  fullVideoTextBehindSubjectAllowed: false,
  fullVideoMaskAllowed: false,
  finalExportAllowed: false,
  publicAccessAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealUserMediaAllowed: false,
  filmAllowed: false,
  slowMotionAllowed: false,
}

export const segmentTextBehindSubjectPreviewDoesNotDo = [
  'no arbitrary real user media',
  'no new source video',
  'no full-video text-behind-subject',
  'no full-video masks',
  'no final delivery export',
  'no providers',
  'no Revideo',
  'no FILM or slow motion',
  'no Real-ESRGAN',
  'no model downloads',
  'no public URLs or public buckets',
  'no production or external beta unlock',
]

export function phase35ePrefix(runId: string): string {
  if (!/^phase35e-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35E run id: ${runId}`)
  return `activation-real-video/phase35e/${runId}`
}

export function validateSegmentTextBehindSubjectPreviewExecutionEnv(
  input: SegmentTextBehindSubjectPreviewEnvValidationInput = {},
): SegmentTextBehindSubjectPreviewValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW
  const phase35DRunId = input.phase35DRunId ?? process.env.REEDITPRO_PHASE35D_RUN_ID ?? segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId
  const text = input.text ?? process.env.REEDITPRO_PHASE35E_TEXT ?? segmentTextBehindSubjectPreviewConfig.approvedText

  if (projectId !== segmentTextBehindSubjectPreviewConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== segmentTextBehindSubjectPreviewConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== segmentTextBehindSubjectPreviewConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== segmentTextBehindSubjectPreviewConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW=true is required for execution.')
  if (phase35DRunId !== segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId) blockers.push('Phase 35D run id must be exactly phase35d-20260530T004442.')
  if (text !== segmentTextBehindSubjectPreviewConfig.approvedText) blockers.push('Phase 35E text must be exactly REEDITPRO.')
  if (input.segmentDurationSeconds !== undefined && input.segmentDurationSeconds > segmentTextBehindSubjectPreviewConfig.approvedSegmentDurationSeconds) blockers.push('Segment duration must be <= 2.0 seconds.')
  if (input.frameCount !== undefined && input.frameCount !== segmentTextBehindSubjectPreviewConfig.approvedFrameCount) blockers.push('Frame count must be exactly the approved Phase 35D count of 10.')
  if (input.generatedAssetsInputPrefix !== undefined && input.generatedAssetsInputPrefix !== segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix) blockers.push('Generated-assets input prefix must be the approved Phase 35D private prefix.')
  if (input.masksInputPrefix !== undefined && input.masksInputPrefix !== segmentTextBehindSubjectPreviewConfig.masksInputPrefix) blockers.push('Mask input prefix must be the approved Phase 35D private prefix.')
  if (input.qaInputPrefix !== undefined && input.qaInputPrefix !== segmentTextBehindSubjectPreviewConfig.qaInputPrefix) blockers.push('QA input prefix must be the approved Phase 35D private prefix.')
  if (input.outputPreviewPrefix !== undefined && input.outputPreviewPrefix !== segmentTextBehindSubjectPreviewConfig.outputPreviewPrefix) blockers.push('Preview output prefix must be the approved Phase 35E private prefix.')
  if (input.outputGeneratedAssetsPrefix !== undefined && input.outputGeneratedAssetsPrefix !== segmentTextBehindSubjectPreviewConfig.outputGeneratedAssetsPrefix) blockers.push('Generated-assets output prefix must be the approved Phase 35E private prefix.')
  if (input.outputQaPrefix !== undefined && input.outputQaPrefix !== segmentTextBehindSubjectPreviewConfig.outputQaPrefix) blockers.push('QA output prefix must be the approved Phase 35E private prefix.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBeta ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMedia ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real media flag must remain false.')
  if ((input.fullVideoTextBehindSubjectEnabled ?? process.env.FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED ?? 'false') !== 'false') blockers.push('Full-video text-behind-subject must remain disabled.')
  if ((input.fullVideoMaskEnabled ?? process.env.FULL_VIDEO_MASK_ENABLED ?? 'false') !== 'false') blockers.push('Full-video masks must remain disabled.')
  if ((input.finalExportEnabled ?? process.env.FINAL_EXPORT_ENABLED ?? 'false') !== 'false') blockers.push('Final export must remain disabled.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 35E execution orchestration.')

  warnings.push('Phase 35E is one controlled private segment preview only.')
  warnings.push('Passing Phase 35E does not approve full-video text-behind-subject, final export, production, external beta, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateSegmentTextBehindSubjectPreviewStaticPlan(
  input: Partial<SegmentTextBehindSubjectPreviewEnvValidationInput> = {},
): SegmentTextBehindSubjectPreviewValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== segmentTextBehindSubjectPreviewConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== segmentTextBehindSubjectPreviewConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== segmentTextBehindSubjectPreviewConfig.env) blockers.push('Environment must be staging.')
  if (input.phase35DRunId && input.phase35DRunId !== segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId) blockers.push('Only the approved Phase 35D run may feed Phase 35E.')
  if (input.text && input.text !== segmentTextBehindSubjectPreviewConfig.approvedText) blockers.push('Only REEDITPRO text is approved for Phase 35E.')
  warnings.push('Static plan/report mode does not compose frames, write GCS, run providers, or process arbitrary media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateSegmentTextBehindSubjectPreviewReport(report?: SegmentTextBehindSubjectPreviewExecutionReport): string[] {
  if (!report) return ['Phase 35E execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 35E execution report did not return ok=true.')
  if (report.source.phase35DRunId !== segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId) blockers.push('Phase 35E used the wrong Phase 35D run.')
  if (report.segment.durationSeconds > segmentTextBehindSubjectPreviewConfig.approvedSegmentDurationSeconds) blockers.push('Segment duration exceeded the approved 2.0 seconds.')
  if (report.segment.frameCount !== segmentTextBehindSubjectPreviewConfig.approvedFrameCount) blockers.push('Preview frame count does not match the approved 10-frame segment.')
  if (report.segment.width !== segmentTextBehindSubjectPreviewConfig.approvedFrameWidth || report.segment.height !== segmentTextBehindSubjectPreviewConfig.approvedFrameHeight) blockers.push('Preview dimensions do not match the approved 768x432 segment.')
  if (report.textLayerPlan.text !== segmentTextBehindSubjectPreviewConfig.approvedText) blockers.push('Unexpected text content was composed.')
  if (report.composition.previewFrameUris.length !== segmentTextBehindSubjectPreviewConfig.approvedFrameCount) blockers.push('Preview frame artifact count is wrong.')
  if (!report.composition.previewFrameUris.every((uri) => uri.startsWith(segmentTextBehindSubjectPreviewConfig.outputPreviewPrefix))) blockers.push('Preview frames are not under the approved private Phase 35E prefix.')
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.approvedPhase35DRunOnly || !report.safety.approvedFrameMaskManifestsOnly) blockers.push('Approved Phase 35D source safety flags were not true.')
  if (report.safety.arbitraryRealUserMediaUsed || report.safety.fullVideoMaskExecuted || report.safety.fullVideoTextBehindSubjectExecuted) blockers.push('Forbidden arbitrary/full-video media path was reported.')
  if (report.safety.finalExportCreated || report.safety.providerExecuted || report.safety.revideoUsed) blockers.push('Forbidden final export/provider/Revideo path was reported.')
  if (report.safety.realEsrganUsed || report.safety.filmUsed || report.safety.slowMotionExecuted) blockers.push('Forbidden enhancement/FILM/slow-motion path was reported.')
  if (report.safety.publicAccessEnabled || report.safety.secretValuesUsed) blockers.push('Forbidden public access or secret value use was reported.')
  return Array.from(new Set([...blockers, ...(report.blockers ?? [])]))
}
