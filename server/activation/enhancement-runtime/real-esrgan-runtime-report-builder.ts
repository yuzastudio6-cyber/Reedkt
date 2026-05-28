import { existsSync, readFileSync } from 'node:fs'
import { buildRealEsrganRuntimeBlockers } from './real-esrgan-runtime-blocker-policy'
import { buildRealEsrganRuntimeCommandPlans } from './real-esrgan-runtime-command-runner'
import { buildRealEsrganRuntimeFixturePlan } from './real-esrgan-runtime-fixture-image'
import { buildRealEsrganRuntimeModelSyncSummary } from './real-esrgan-runtime-model-sync'
import { realEsrganRuntimeConfig } from './real-esrgan-runtime-policy'
import type { RealEsrganRuntimeExecutionReport, RealEsrganRuntimeReport } from './real-esrgan-runtime-types'

export const REAL_ESRGAN_RUNTIME_LOCAL_REPORT_PATH = 'activation-logs/enhancement-runtime/phase34c/job-execution/real-esrgan-runtime-report.json'

export function buildRealEsrganRuntimeReport(input: {
  executionReport?: RealEsrganRuntimeExecutionReport
  reportPath?: string
  imageDigest?: string
} = {}): RealEsrganRuntimeReport {
  const executionReport = input.executionReport ?? readRealEsrganRuntimeExecutionReport(input.reportPath ?? REAL_ESRGAN_RUNTIME_LOCAL_REPORT_PATH)
  const modelSync = buildRealEsrganRuntimeModelSyncSummary()
  const fixturePlan = buildRealEsrganRuntimeFixturePlan()
  const evaluation = buildRealEsrganRuntimeBlockers({ executionReport })
  const blockers = Array.from(new Set([...modelSync.blockers, ...fixturePlan.blockers, ...evaluation.blockers]))
  const warnings = Array.from(new Set([...modelSync.warnings, ...fixturePlan.warnings, ...evaluation.warnings, ...(executionReport?.warnings ?? [])]))
  const ready = Boolean(executionReport) && blockers.length === 0

  return {
    reportId: 'activation-phase-34c-real-esrgan-runtime',
    createdAt: new Date().toISOString(),
    config: realEsrganRuntimeConfig,
    commandPlans: buildRealEsrganRuntimeCommandPlans(input.imageDigest),
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(input.imageDigest || executionReport),
    runtimeImagePushed: Boolean(input.imageDigest || executionReport),
    jobDeployed: Boolean(executionReport),
    jobExecuted: Boolean(executionReport),
    phase34DReadiness: {
      readyForControlledEnhancementSample: ready,
      reason: ready
        ? 'Real-ESRGAN loaded RealESRGAN_x4plus from private GCS and generated a private enhanced synthetic-image artifact with no blocking QA failures.'
        : 'Phase 34D remains blocked until Phase 34C runtime execution and enhancement QA pass.',
    },
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaProcessed: false,
    filmUsed: false,
    slowMotionAllowed: false,
    fullVideoEnhancementAllowed: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeRealEsrganRuntimeReport(report: RealEsrganRuntimeReport): string {
  return [
    `Real-ESRGAN runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Job: ${report.config.jobName}`,
    `Image tag: ${report.config.imageTag}`,
    `Model: ${report.config.modelManifestId}`,
    `Release: ${report.config.releaseVersion}`,
    `File checksum: ${report.config.modelFileSha256}`,
    `Aggregate checksum: ${report.config.modelAggregateSha256}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 34D ready: ${report.phase34DReadiness.readyForControlledEnhancementSample}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Full-video enhancement allowed: ${report.fullVideoEnhancementAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Enhanced output:',
    report.executionReport
      ? `- ${report.executionReport.enhanced.status}; output=${report.executionReport.enhanced.gcsUri ?? '(missing)'}; dimensions=${report.executionReport.enhanced.width ?? '?'}x${report.executionReport.enhanced.height ?? '?'}`
      : '- not run',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readRealEsrganRuntimeExecutionReport(path: string): RealEsrganRuntimeExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealEsrganRuntimeExecutionReport
}

export function isRealEsrganRuntimeExecutionVerified(report: RealEsrganRuntimeExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.model.manifestId === realEsrganRuntimeConfig.modelManifestId
      && report.model.name === realEsrganRuntimeConfig.modelName
      && report.model.fileSha256 === realEsrganRuntimeConfig.modelFileSha256
      && report.model.aggregateSha256 === realEsrganRuntimeConfig.modelAggregateSha256
      && report.fixture.generated
      && report.enhanced.status === 'completed'
      && report.enhanced.width === report.fixture.width * 4
      && report.enhanced.height === report.fixture.height * 4
      && report.qa.status !== 'blocked'
      && report.safety.providerExecuted === false
      && report.safety.modelDownloadedExternally === false
      && report.safety.realMediaUsed === false
      && report.safety.realVideoFrameUsed === false
      && report.safety.filmUsed === false
      && report.safety.slowMotionExecuted === false
      && report.safety.fullVideoEnhancementExecuted === false
      && report.safety.faceEnhanceRan === false
      && report.safety.gfpganWeightsPresent === false
      && report.safety.facexlibWeightsPresent === false
      && report.safety.alternateRealEsrganWeightsPresent === false,
  )
}
