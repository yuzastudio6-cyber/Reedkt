import { existsSync, readFileSync } from 'node:fs'
import { buildBiRefNetCustomCodeScanSummary } from './birefnet-runtime-custom-code-scan'
import { buildBiRefNetRuntimeCommandPlans } from './birefnet-runtime-command-runner'
import { buildBiRefNetRuntimeFixturePlan } from './birefnet-runtime-fixture-image'
import { buildBiRefNetRuntimeBlockers } from './birefnet-runtime-blocker-policy'
import { buildBiRefNetRuntimeModelSyncSummary } from './birefnet-runtime-model-sync'
import { birefnetRuntimeConfig } from './birefnet-runtime-policy'
import type { BiRefNetRuntimeExecutionReport, BiRefNetRuntimeReport } from './birefnet-runtime-types'

export const BIREFNET_RUNTIME_LOCAL_REPORT_PATH = 'activation-logs/mask-runtime/phase33c/job-execution/birefnet-runtime-report.json'

export function buildBiRefNetRuntimeReport(input: {
  executionReport?: BiRefNetRuntimeExecutionReport
  reportPath?: string
  imageDigest?: string
} = {}): BiRefNetRuntimeReport {
  const executionReport = input.executionReport ?? readBiRefNetRuntimeExecutionReport(input.reportPath ?? BIREFNET_RUNTIME_LOCAL_REPORT_PATH)
  const modelSync = buildBiRefNetRuntimeModelSyncSummary()
  const customCode = buildBiRefNetCustomCodeScanSummary()
  const fixturePlan = buildBiRefNetRuntimeFixturePlan()
  const evaluation = buildBiRefNetRuntimeBlockers({ executionReport })
  const blockers = Array.from(new Set([...modelSync.blockers, ...customCode.blockers, ...fixturePlan.blockers, ...evaluation.blockers]))
  const warnings = Array.from(new Set([...modelSync.warnings, ...customCode.warnings, ...fixturePlan.warnings, ...evaluation.warnings, ...(executionReport?.warnings ?? [])]))
  const ready = Boolean(executionReport) && blockers.length === 0

  return {
    reportId: 'activation-phase-33c-birefnet-runtime',
    createdAt: new Date().toISOString(),
    config: birefnetRuntimeConfig,
    commandPlans: buildBiRefNetRuntimeCommandPlans(input.imageDigest),
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(input.imageDigest || executionReport),
    runtimeImagePushed: Boolean(input.imageDigest || executionReport),
    jobDeployed: Boolean(executionReport),
    jobExecuted: Boolean(executionReport),
    phase33DReadiness: {
      readyForControlledMaskTest: ready,
      reason: ready
        ? 'BiRefNet loaded from private GCS and generated a private mask artifact from a synthetic image with no blocking QA failures.'
        : 'Phase 33D remains blocked until Phase 33C runtime execution and mask QA pass.',
    },
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaProcessed: false,
    sam2Used: false,
    textBehindSubjectAllowed: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeBiRefNetRuntimeReport(report: BiRefNetRuntimeReport): string {
  return [
    `BiRefNet runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Job: ${report.config.jobName}`,
    `Image tag: ${report.config.imageTag}`,
    `Model: ${report.config.modelManifestId}`,
    `Revision: ${report.config.modelRevision}`,
    `Checksum: ${report.config.modelAggregateSha256}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 33D ready: ${report.phase33DReadiness.readyForControlledMaskTest}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Text-behind-subject allowed: ${report.textBehindSubjectAllowed}`,
    '',
    'Mask output:',
    report.executionReport
      ? `- ${report.executionReport.mask.status}; mask=${report.executionReport.mask.maskUri ?? '(missing)'}; nonZeroRatio=${report.executionReport.mask.nonZeroRatio ?? '(missing)'}`
      : '- not run',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readBiRefNetRuntimeExecutionReport(path: string): BiRefNetRuntimeExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as BiRefNetRuntimeExecutionReport
}

export function isBiRefNetRuntimeExecutionVerified(report: BiRefNetRuntimeExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.model.manifestId === birefnetRuntimeConfig.modelManifestId
      && report.model.revision === birefnetRuntimeConfig.modelRevision
      && report.model.aggregateSha256 === birefnetRuntimeConfig.modelAggregateSha256
      && report.fixture.generated
      && report.mask.status === 'completed'
      && report.qa.status !== 'blocked'
      && report.safety.providerExecuted === false
      && report.safety.modelDownloadedExternally === false
      && report.safety.realMediaUsed === false
      && report.safety.realVideoFrameUsed === false
      && report.safety.sam2Used === false
      && report.safety.textBehindSubjectExecuted === false,
  )
}
