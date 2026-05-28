import { existsSync, readFileSync } from 'node:fs'
import { buildRealVideoEnhancementSampleCommandPlans } from './real-video-real-esrgan-runner'
import { buildRealVideoEnhancementSampleCropPlan } from './real-video-enhancement-sample-plan'
import { realVideoEnhancementSampleConfig, validateRealVideoEnhancementSampleReport } from './real-video-enhancement-sample-policy'
import type { RealVideoEnhancementSampleExecutionReport, RealVideoEnhancementSampleReport } from './real-video-enhancement-sample-types'

export const PHASE34D_LOCAL_REPORT_PATH = 'activation-logs/real-video-enhancement-sample/phase34d/job-execution/phase34d-report.json'

export function buildRealVideoEnhancementSampleReport(input: {
  executionReport?: RealVideoEnhancementSampleExecutionReport
  reportPath?: string
  runId?: string
  imageDigest?: string
} = {}): RealVideoEnhancementSampleReport {
  const executionReport = input.executionReport ?? readRealVideoEnhancementSampleExecutionReport(input.reportPath ?? PHASE34D_LOCAL_REPORT_PATH)
  const runId = input.runId ?? executionReport?.runId ?? 'phase34d-pending'
  const blockers = validateRealVideoEnhancementSampleReport(executionReport)
  const warnings = Array.from(new Set([
    ...(executionReport?.warnings ?? []),
    'Phase 34D is one bounded real-video-derived enhancement sample only.',
    'Full-frame enhancement, full-video enhancement, FILM, slow motion, providers, public URLs, Revideo, production, external beta, and broad real media remain blocked.',
  ]))
  const ready = Boolean(executionReport) && blockers.length === 0
  return {
    reportId: 'activation-phase-34d-real-video-enhancement-sample',
    createdAt: new Date().toISOString(),
    config: realVideoEnhancementSampleConfig,
    cropPlan: buildRealVideoEnhancementSampleCropPlan(),
    commandPlans: buildRealVideoEnhancementSampleCommandPlans(runId, input.imageDigest),
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    phase34EReadiness: {
      readyForNextEnhancementPhase: ready,
      reason: ready
        ? 'The approved Phase 33D representative frame produced one bounded private Real-ESRGAN enhanced sample and QA has no blocking failures.'
        : 'Phase 34E remains blocked until a bounded enhanced sample exists, checksum/model verification passes, and QA has no blocking failures.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    fullVideoEnhancementAllowed: false,
    slowMotionAllowed: false,
  }
}

export function summarizeRealVideoEnhancementSampleReport(report: RealVideoEnhancementSampleReport): string {
  return [
    `Real-video enhancement sample report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 33D run: ${report.config.phase33dRunId}`,
    `Source frame: ${report.config.sourceFrameGcsUri}`,
    `Model: ${report.config.modelManifestId}`,
    `Checksum: ${report.config.modelFileSha256}`,
    `Sample crop: ${report.executionReport ? `${report.executionReport.sampleCrop.width}x${report.executionReport.sampleCrop.height} at ${report.executionReport.sampleCrop.x},${report.executionReport.sampleCrop.y}` : '(pending)'}`,
    `Enhanced sample: ${report.executionReport?.enhancedSample.gcsUri ?? '(pending)'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 34E ready: ${report.phase34EReadiness.readyForNextEnhancementPhase}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Full-video enhancement allowed: ${report.fullVideoEnhancementAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readRealVideoEnhancementSampleExecutionReport(path: string): RealVideoEnhancementSampleExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoEnhancementSampleExecutionReport
}
