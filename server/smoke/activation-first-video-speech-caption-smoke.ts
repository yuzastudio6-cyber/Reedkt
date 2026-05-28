import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildFirstRealVideoReport,
  firstRealVideoConfig,
  validateFirstRealVideoEnv,
  validateFirstRealVideoRuntimeReport,
  validateFirstRealVideoSource,
} from '../activation/first-real-video'
import type { FirstRealVideoRuntimeReport } from '../activation/first-real-video'

const sourceValidation = validateFirstRealVideoSource({
  sourceVideoPath: firstRealVideoConfig.sourceVideoPath,
  repoRoot: process.cwd(),
})
assert.equal(sourceValidation.allowed, true, sourceValidation.blockers.join('; '))
assert.equal(validateFirstRealVideoEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  sourceVideoPath: firstRealVideoConfig.sourceVideoPath,
}).length, 0)

const sampleReport: FirstRealVideoRuntimeReport = {
  ok: true,
  runId: 'phase28-20260528T01010',
  projectId: 'reeditpro',
  jobName: firstRealVideoConfig.jobName,
  source: {
    sourceGcsUri: `gs://${firstRealVideoConfig.sourceBucket}/activation-real-video/phase28/phase28-20260528T01010/source-video.mov`,
    sanitizedFilename: 'IMG_6005.MOV',
    durationSeconds: 8,
    width: 1920,
    height: 1080,
    hasAudio: true,
  },
  model: {
    manifestId: firstRealVideoConfig.modelManifestId,
    name: firstRealVideoConfig.modelName,
    revision: firstRealVideoConfig.modelRevision,
    gcsPath: firstRealVideoConfig.modelGcsPath,
    runtimePath: firstRealVideoConfig.modelRuntimePath,
    aggregateSha256: firstRealVideoConfig.modelAggregateSha256,
  },
  speechRuntime: {
    status: 'completed',
    language: 'en',
    transcriptSegmentCount: 1,
    wordTimestampCount: 3,
    fullTranscriptPreview: 'hello world',
  },
  captions: {
    captionSegmentCount: 1,
    srtUri: `gs://${firstRealVideoConfig.transcriptsBucket}/activation-real-video/phase28/phase28-20260528T01010/captions/captions.srt`,
    webvttUri: `gs://${firstRealVideoConfig.transcriptsBucket}/activation-real-video/phase28/phase28-20260528T01010/captions/captions.vtt`,
    assUri: `gs://${firstRealVideoConfig.transcriptsBucket}/activation-real-video/phase28/phase28-20260528T01010/captions/captions.ass`,
  },
  qa: {
    status: 'passed',
    gates: [{ gateId: 'caption_readability', status: 'passed', summary: 'Readable captions.' }],
    blockers: [],
    warnings: [],
  },
  artifacts: [],
  safety: {
    controlledPhase28SourceOnly: true,
    arbitraryRealMediaUsed: false,
    providerExecuted: false,
    gpuUsed: false,
    modelDownloadedExternally: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    finalExportCreated: false,
    smartCutExecuted: false,
    audioCleanupExecuted: false,
    colorExecuted: false,
    masksOrEnhancementExecuted: false,
  },
  uploadedReport: {
    bucket: firstRealVideoConfig.qaBucket,
    object: 'activation-real-video/phase28/phase28-20260528T01010/reports/phase28-report.json',
    gcsUri: `gs://${firstRealVideoConfig.qaBucket}/activation-real-video/phase28/phase28-20260528T01010/reports/phase28-report.json`,
  },
  warnings: [],
}
assert.deepEqual(validateFirstRealVideoRuntimeReport(sampleReport), [])
const plannedReport = buildFirstRealVideoReport({ reportPath: '__missing_phase28_report__.json', uploadPath: '__missing_phase28_upload__.json' })
assert.equal(plannedReport.productionReadyAllowed, false)
assert.equal(plannedReport.externalBetaAllowed, false)
assert.equal(plannedReport.realUserMediaTestingAllowed, false)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-first-video-speech-caption'])
assert.ok(packageJson.scripts['activation:first-video:speech-caption'])
assert.ok(packageJson.scripts['activation:first-video:speech-caption:report'])

console.log(JSON.stringify({ ok: true, checks: ['source_validation', 'env_policy', 'runtime_policy', 'false_launch_gates', 'package_scripts'] }))
