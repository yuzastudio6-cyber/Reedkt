import type { RealVideoPrivateExportConfig, RealVideoPrivateExportRuntimeReport } from './real-video-private-export-types'

export const realVideoPrivateExportConfig: RealVideoPrivateExportConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  phase28RunId: 'phase28-20260528T01552',
  phase29RunId: 'phase29-20260528T02254',
  sourceBucket: 'reeditpro-staging-reeditpro-source-media',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  phase28Prefix: 'activation-real-video/phase28/phase28-20260528T01552',
  phase29Prefix: 'activation-real-video/phase29/phase29-20260528T02254',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov',
  expectedTimelineDurationSeconds: 15.443,
}

export const phase30DoesNotDo = [
  'no second source video',
  'no broad real user media testing',
  'no GPU execution',
  'no providers',
  'no model downloads',
  'no new transcription unless explicitly approved',
  'no audio cleanup, color, masks, enhancement, or slow motion',
  'no public signed URLs',
  'no service public access change',
  'no secret values',
  'no Revideo',
  'no production or external beta unblock',
]

export function phase30Prefix(runId: string): string {
  if (!/^phase30-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 30 run id: ${runId}`)
  return `activation-real-video/phase30/${runId}`
}

export function validateRealVideoPrivateExportEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId !== undefined && input.projectId !== realVideoPrivateExportConfig.projectId) {
    blockers.push('GCP project must be exactly reeditpro.')
  }
  if (input.region !== undefined && input.region !== realVideoPrivateExportConfig.region) {
    blockers.push('Region must be us-central1.')
  }
  if (input.env !== undefined && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') {
    blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_PRIVATE_EXPORT=true is required for execution.')
  }
  return blockers
}

export function validateRealVideoPrivateExportRuntimeReport(report?: RealVideoPrivateExportRuntimeReport): string[] {
  if (!report) return ['Phase 30 runtime report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 30 runtime report did not return ok=true.')
  if (report.sourcePhase28RunId !== realVideoPrivateExportConfig.phase28RunId) blockers.push('Phase 30 used the wrong Phase 28 run.')
  if (report.sourcePhase29RunId !== realVideoPrivateExportConfig.phase29RunId) blockers.push('Phase 30 used the wrong Phase 29 run.')
  if (report.sourceVideoObject !== realVideoPrivateExportConfig.sourceGcsUri) blockers.push('Phase 30 used an unapproved source video object.')
  if (report.keepSegmentCount <= 0) blockers.push('Private export did not retain any source segment.')
  if (!report.finalExport?.gcsUri) blockers.push('Private final_export artifact is missing.')
  if (report.finalExport && !report.finalExport.gcsUri.startsWith(`gs://${realVideoPrivateExportConfig.finalExportsBucket}/activation-real-video/phase30/`)) {
    blockers.push('Final export was not stored under the private Phase 30 final exports prefix.')
  }
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.controlledPhase28SourceOnly) blockers.push('Controlled Phase 28 source flag was not true.')
  if (!report.safety.controlledPhase29TimelineOnly) blockers.push('Controlled Phase 29 timeline flag was not true.')
  if (report.safety.secondSourceVideoUsed) blockers.push('A second source video was used.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.gpuUsed) blockers.push('GPU use was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was enabled.')
  if (!report.safety.finalExportCreated) blockers.push('Final export creation flag was false.')
  if (report.safety.audioCleanupExecuted || report.safety.colorExecuted || report.safety.masksOrEnhancementExecuted) {
    blockers.push('Out-of-scope media processing was reported.')
  }
  if (report.safety.revideoUsed) blockers.push('Revideo use was reported.')
  return Array.from(new Set(blockers))
}
