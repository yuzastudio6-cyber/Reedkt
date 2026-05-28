import { existsSync, readFileSync } from 'node:fs'
import { buildBiRefNetFrameCommandPlans } from './real-video-birefnet-frame-runner'
import { buildFrameExtractionCommandPlans } from './real-video-frame-extraction-runner'
import { validateBiRefNetFrameMaskReport, validateFrameExtractionReport, realVideoMaskConfig } from './real-video-mask-policy'
import { buildRepresentativeFramePlan } from './real-video-representative-frame-plan'
import type {
  RealVideoBiRefNetFrameMaskReport,
  RealVideoFrameExtractionReport,
  RealVideoMaskReport,
} from './real-video-mask-types'

export const PHASE33D_FRAME_EXTRACTION_LOCAL_REPORT_PATH = 'activation-logs/real-video-mask/phase33d/frame-extraction/frame-extraction-report.json'
export const PHASE33D_BIREFNET_LOCAL_REPORT_PATH = 'activation-logs/real-video-mask/phase33d/birefnet-execution/real-video-frame-mask-report.json'

export function buildRealVideoMaskReport(input: {
  frameExtractionReport?: RealVideoFrameExtractionReport
  birefnetFrameMaskReport?: RealVideoBiRefNetFrameMaskReport
  frameReportPath?: string
  birefnetReportPath?: string
  runId?: string
  renderImageDigest?: string
  birefnetImageDigest?: string
} = {}): RealVideoMaskReport {
  const frameExtractionReport = input.frameExtractionReport ?? readFrameExtractionReport(input.frameReportPath ?? PHASE33D_FRAME_EXTRACTION_LOCAL_REPORT_PATH)
  const birefnetFrameMaskReport = input.birefnetFrameMaskReport ?? readBiRefNetFrameMaskReport(input.birefnetReportPath ?? PHASE33D_BIREFNET_LOCAL_REPORT_PATH)
  const runId = input.runId ?? birefnetFrameMaskReport?.runId ?? frameExtractionReport?.runId ?? 'phase33d-pending'
  const frameBlockers = validateFrameExtractionReport(frameExtractionReport)
  const birefnetBlockers = validateBiRefNetFrameMaskReport(birefnetFrameMaskReport)
  const blockers = Array.from(new Set([...frameBlockers, ...birefnetBlockers]))
  const warnings = Array.from(new Set([
    ...(frameExtractionReport?.warnings ?? []),
    ...(birefnetFrameMaskReport?.warnings ?? []),
    'mask_temporal_stability is not_applicable because Phase 33D uses one representative frame only.',
    'Text-behind-subject remains execution-blocked until Phase 33E.',
  ]))
  const ready = Boolean(frameExtractionReport && birefnetFrameMaskReport) && blockers.length === 0
  return {
    reportId: 'activation-phase-33d-real-video-birefnet-frame-mask',
    createdAt: new Date().toISOString(),
    config: realVideoMaskConfig,
    representativeFramePlan: buildRepresentativeFramePlan(),
    commandPlans: [
      ...buildFrameExtractionCommandPlans(runId, input.renderImageDigest),
      ...buildBiRefNetFrameCommandPlans(runId, input.birefnetImageDigest),
    ],
    frameExtractionReport,
    birefnetFrameMaskReport,
    status: ready ? 'ready' : frameExtractionReport || birefnetFrameMaskReport ? 'failed' : 'planned',
    blockers,
    warnings,
    phase33EReadiness: {
      readyForTextBehindSubjectPlanning: ready,
      reason: ready
        ? 'The approved Phase 32 export produced one representative frame, BiRefNet created private mask/cutout artifacts, and mask QA had no blocking failures.'
        : 'Phase 33E remains blocked until one representative frame, BiRefNet mask/cutout artifacts, and non-blocking mask QA exist.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    textBehindSubjectAllowed: false,
  }
}

export function summarizeRealVideoMaskReport(report: RealVideoMaskReport): string {
  return [
    `Real video BiRefNet frame mask report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 32 run: ${report.config.phase32RunId}`,
    `Source: ${report.config.sourceGcsUri}`,
    `Representative frame: ${report.frameExtractionReport?.representativeFrame.gcsUri ?? '(pending)'}`,
    `Selected timestamp: ${report.frameExtractionReport?.selectedTimestampSeconds ?? '(pending)'}`,
    `Model: ${report.config.modelManifestId}`,
    `Revision: ${report.config.modelRevision}`,
    `Checksum: ${report.config.modelAggregateSha256}`,
    `Mask: ${report.birefnetFrameMaskReport?.mask.maskUri ?? '(pending)'}`,
    `RGBA cutout: ${report.birefnetFrameMaskReport?.mask.cutoutUri ?? '(pending)'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 33E ready: ${report.phase33EReadiness.readyForTextBehindSubjectPlanning}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Text-behind-subject allowed: ${report.textBehindSubjectAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readFrameExtractionReport(path: string): RealVideoFrameExtractionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoFrameExtractionReport
}

export function readBiRefNetFrameMaskReport(path: string): RealVideoBiRefNetFrameMaskReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoBiRefNetFrameMaskReport
}
