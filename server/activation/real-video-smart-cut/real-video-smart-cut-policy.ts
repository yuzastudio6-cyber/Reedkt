import type { RealVideoSmartCutConfig, RealVideoSmartCutRuntimeReport } from './real-video-smart-cut-types'

export const realVideoSmartCutConfig: RealVideoSmartCutConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  phase28RunId: 'phase28-20260528T01552',
  sourceBucket: 'reeditpro-staging-reeditpro-source-media',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  phase28Prefix: 'activation-real-video/phase28/phase28-20260528T01552',
  phase28SourceObject: 'activation-real-video/phase28/phase28-20260528T01552/source-video.mov',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov',
}

export const phase29DoesNotDo = [
  'no second source video',
  'no broad real user media testing',
  'no transcription rerun unless separately approved',
  'no GPU execution',
  'no providers',
  'no model downloads',
  'no audio cleanup, color, masks, enhancement, or slow motion',
  'no final export',
  'no public signed URLs',
  'no service public access change',
  'no secret values',
  'no production or external beta unblock',
]

export function phase29Prefix(runId: string): string {
  if (!/^phase29-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 29 run id: ${runId}`)
  return `activation-real-video/phase29/${runId}`
}

export function validateRealVideoSmartCutEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId !== undefined && input.projectId !== realVideoSmartCutConfig.projectId) {
    blockers.push('GCP project must be exactly reeditpro.')
  }
  if (input.region !== undefined && input.region !== realVideoSmartCutConfig.region) {
    blockers.push('Region must be us-central1.')
  }
  if (input.env !== undefined && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') {
    blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_SMART_CUT=true is required for execution.')
  }
  return blockers
}

export function validateRealVideoSmartCutRuntimeReport(report?: RealVideoSmartCutRuntimeReport): string[] {
  if (!report) return ['Phase 29 runtime report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 29 runtime report did not return ok=true.')
  if (report.sourcePhase28RunId !== realVideoSmartCutConfig.phase28RunId) blockers.push('Phase 29 used the wrong Phase 28 run.')
  if (report.sourceVideoObject !== realVideoSmartCutConfig.sourceGcsUri) blockers.push('Phase 29 used an unapproved source video object.')
  if (report.smartCut.keepSegmentCount <= 0) blockers.push('SmartCutPlan did not retain any source segment.')
  if (report.timeline.durationSeconds <= 0) blockers.push('TimelineManifest duration is zero.')
  if (report.timeline.captionLayerCount <= 0) blockers.push('TimelineManifest is missing caption layer references.')
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.controlledPhase28SourceOnly) blockers.push('Controlled Phase 28 source flag was not true.')
  if (report.safety.secondSourceVideoUsed) blockers.push('A second source video was used.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.gpuUsed) blockers.push('GPU use was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was enabled.')
  if (report.safety.finalExportCreated) blockers.push('Final export was created.')
  if (report.safety.audioCleanupExecuted || report.safety.colorExecuted || report.safety.masksOrEnhancementExecuted) {
    blockers.push('Out-of-scope media processing was reported.')
  }
  return Array.from(new Set(blockers))
}
