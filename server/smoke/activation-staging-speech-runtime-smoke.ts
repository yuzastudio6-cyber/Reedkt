import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildSpeechRuntimeCommandPlans,
  buildSpeechRuntimeReport,
  speechRuntimeConfig,
  validateSpeechRuntimeEnv,
} from '../activation/speech-runtime'
import type { SpeechRuntimeExecutionReport } from '../activation/speech-runtime'

const sampleExecution: SpeechRuntimeExecutionReport = {
  ok: true,
  runId: 'phase27a-smoke',
  projectId: 'reeditpro',
  jobName: 'reeditpro-staging-speech-runtime-job',
  model: {
    manifestId: 'faster_whisper_tiny_staging_v1',
    name: 'Systran/faster-whisper-tiny',
    gcsPath: speechRuntimeConfig.modelGcsPath,
    runtimePath: speechRuntimeConfig.modelRuntimePath,
    aggregateSha256: speechRuntimeConfig.modelAggregateSha256,
    copiedFiles: ['model.bin', 'config.json', 'tokenizer.json', 'vocabulary.txt', 'README.md', '.gitattributes'],
  },
  fixture: {
    generated: true,
    path: '/tmp/reeditpro-speech-runtime/fixture.wav',
    durationSeconds: 2,
  },
  transcription: {
    status: 'completed',
    segmentCount: 0,
    fullText: '',
    warnings: [],
  },
  safety: {
    providerExecuted: false,
    modelDownloadedExternally: false,
    realUserMediaUsed: false,
    gpuUsed: false,
    secretValuesUsed: false,
  },
  warnings: [],
}

assert.deepEqual(validateSpeechRuntimeEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  imageTag: 'staging-speech-cpu-001',
  modelManifestId: 'faster_whisper_tiny_staging_v1',
  modelGcsPath: speechRuntimeConfig.modelGcsPath,
}), [])
assert.ok(validateSpeechRuntimeEnv({ projectId: 'prod-reeditpro' }).length > 0, 'production-looking project must be blocked.')
assert.ok(validateSpeechRuntimeEnv({ modelManifestId: 'birefnet_model' }).length > 0, 'non-approved model must be blocked.')

const commands = buildSpeechRuntimeCommandPlans('sha256:example')
assert.ok(commands.some((command) => command.commandId === 'build-push-image'), 'build/push command must exist.')
assert.ok(commands.some((command) => command.commandId === 'deploy-job'), 'deploy command must exist.')
assert.ok(commands.some((command) => command.commandId === 'execute-job'), 'execute command must exist.')
assert.ok(commands.every((command) => !/--gpu|nvidia|provider_api_key|huggingface-cli|snapshot_download|Systran\/faster-whisper-base/i.test(command.commandString)), 'commands must not deploy GPU, call providers, or download unapproved models.')

const report = buildSpeechRuntimeReport({ executionReport: sampleExecution, imageDigest: 'sha256:example' })
assert.equal(report.phase28Readiness.readyForControlledSpeechCaption, true)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.realUserMediaTestingAllowed, false)
assert.equal(report.providerExecuted, false)
assert.equal(report.gpuExecuted, false)
assert.equal(report.modelDownloadedExternally, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-staging-speech-runtime'])
assert.ok(packageJson.scripts['activation:staging:speech-runtime'])
assert.ok(packageJson.scripts['activation:staging:speech-runtime:report'])
assert.ok(packageJson.scripts['build:staging-speech-runtime-worker'])

console.log(JSON.stringify({
  ok: true,
  checks: [
    'staging_guards',
    'approved_model_only',
    'command_plans',
    'sample_runtime_report_ready',
    'false_launch_gates',
    'package_scripts',
  ],
}))
