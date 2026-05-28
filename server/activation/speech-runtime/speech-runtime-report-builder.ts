import { existsSync, readFileSync } from 'node:fs'
import { buildSpeechRuntimeBlockers } from './speech-runtime-blocker-policy'
import { buildSpeechRuntimeCommandPlans } from './speech-runtime-command-runner'
import { buildSpeechRuntimeFixturePlan } from './speech-runtime-fixture-audio'
import { buildSpeechRuntimeModelSyncSummary } from './speech-runtime-model-sync'
import { speechRuntimeConfig } from './speech-runtime-policy'
import type { SpeechRuntimeExecutionReport, SpeechRuntimeReport } from './speech-runtime-types'

export const SPEECH_RUNTIME_LOCAL_REPORT_PATH = 'activation-logs/speech-runtime/phase27a/job-execution/speech-runtime-report.json'

export function buildSpeechRuntimeReport(input: {
  executionReport?: SpeechRuntimeExecutionReport
  reportPath?: string
  imageDigest?: string
} = {}): SpeechRuntimeReport {
  const executionReport = input.executionReport ?? readSpeechRuntimeExecutionReport(input.reportPath ?? SPEECH_RUNTIME_LOCAL_REPORT_PATH)
  const evaluation = buildSpeechRuntimeBlockers({
    executionReport,
    env: {
      projectId: speechRuntimeConfig.projectId,
      region: speechRuntimeConfig.region,
      env: 'staging',
      confirmation: 'true',
      imageTag: speechRuntimeConfig.imageTag,
      modelManifestId: speechRuntimeConfig.modelManifestId,
      modelGcsPath: speechRuntimeConfig.modelGcsPath,
    },
  })
  const modelSync = buildSpeechRuntimeModelSyncSummary()
  const fixturePlan = buildSpeechRuntimeFixturePlan()
  const blockers = Array.from(new Set([...modelSync.blockers, ...evaluation.blockers]))
  const ready = blockers.length === 0

  return {
    reportId: 'activation-phase-27a-staging-speech-runtime',
    createdAt: new Date().toISOString(),
    config: speechRuntimeConfig,
    commandPlans: buildSpeechRuntimeCommandPlans(input.imageDigest),
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings: Array.from(new Set([...modelSync.warnings, ...fixturePlan.notes, ...evaluation.warnings, ...(executionReport?.warnings ?? [])])),
    phase28Readiness: {
      readyForControlledSpeechCaption: ready,
      reason: ready
        ? 'Approved tiny model loaded from private GCS and faster-whisper completed on generated audio.'
        : 'CPU speech runtime verification is incomplete or blocked.',
    },
    runtimeImageBuilt: Boolean(input.imageDigest || executionReport),
    runtimeImagePushed: Boolean(input.imageDigest || executionReport),
    jobDeployed: Boolean(executionReport),
    jobExecuted: Boolean(executionReport),
    providerExecuted: false,
    gpuDeployed: false,
    gpuExecuted: false,
    modelDownloadedExternally: false,
    realUserMediaProcessed: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeSpeechRuntimeReport(report: SpeechRuntimeReport): string {
  return [
    `Speech runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Job: ${report.config.jobName}`,
    `Image tag: ${report.config.imageTag}`,
    `Model: ${report.config.modelManifestId}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 28 ready: ${report.phase28Readiness.readyForControlledSpeechCaption}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Transcript test:',
    report.executionReport
      ? `- ${report.executionReport.transcription.status}; segments=${report.executionReport.transcription.segmentCount}; text=${JSON.stringify(report.executionReport.transcription.fullText)}`
      : '- not run',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readSpeechRuntimeExecutionReport(path: string): SpeechRuntimeExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as SpeechRuntimeExecutionReport
}

export function isSpeechRuntimeExecutionVerified(report: SpeechRuntimeExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.model.manifestId === 'faster_whisper_tiny_staging_v1'
      && report.model.aggregateSha256 === '331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5'
      && report.transcription.status === 'completed'
      && report.fixture.generated
      && report.safety.providerExecuted === false
      && report.safety.modelDownloadedExternally === false
      && report.safety.realUserMediaUsed === false
      && report.safety.gpuUsed === false
      && report.safety.secretValuesUsed === false,
  )
}
