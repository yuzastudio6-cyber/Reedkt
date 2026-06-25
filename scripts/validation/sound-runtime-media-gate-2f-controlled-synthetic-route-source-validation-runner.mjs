#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceFiles = {
  types: 'server/workers/sound-cpu/synthetic-route-types.ts',
  decision: 'server/workers/sound-cpu/synthetic-route-decision.ts',
  index: 'server/workers/sound-cpu/index.ts',
}
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]
const rejectedFields = [
  'rawPrompt',
  'uploadedMediaUri',
  'signedUrl',
  'publicArtifactUrl',
  'mediaFilePath',
  'providerOutputBlob',
  'secretValue',
  'serviceRolePayload',
  'modelWeightPath',
  'artifactWriteTarget',
  'supabaseMutation',
  'sqlText',
  'dockerCommand',
  'gcpCommand',
]
const falseRuntimeFlags = [
  'mediaFileOpenEnabled',
  'mediaProcessingEnabled',
  'audioreadAudioOpenEnabled',
  'pydubFileImportExportEnabled',
  'ffmpegEnabled',
  'ffprobeEnabled',
  'dockerRunEnabled',
  'dockerPushEnabled',
  'gcpEnabled',
  'supabaseEnabled',
  'sqlEnabled',
  'artifactWriteEnabled',
  'toolExecutionEnabled',
  'workerExecutionEnabled',
  'routeExecutionEnabled',
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const typesSource = read(sourceFiles.types)
const decisionSource = read(sourceFiles.decision)
const indexSource = read(sourceFiles.index)

for (const jobType of jobTypes) {
  assert(typesSource.includes(jobType) || decisionSource.includes(jobType), `missing job type ${jobType}`)
}
for (const field of rejectedFields) {
  assert(typesSource.includes(`'${field}'`), `missing rejected field ${field}`)
}
for (const flag of falseRuntimeFlags) {
  assert(typesSource.includes(`${flag}: false`), `missing false runtime flag ${flag}`)
}

for (const marker of [
  'resolveSoundCpuSyntheticRoute',
  'rejected_payload_field',
  'missing_required_field',
  'invalid_required_field',
  'invalid_runtime_flags',
  'unsafe_runtime_flag',
  'unknown_job_type',
  'worker_mismatch',
  'image_mismatch',
  'fixture_mismatch',
]) {
  assert(decisionSource.includes(marker), `missing resolver marker ${marker}`)
}

for (const forbidden of ['child_process', 'exec(', 'spawn(', 'fetch(', 'createClient', 'audio_open', 'ffmpeg ', 'ffprobe ']) {
  assert(!decisionSource.includes(forbidden), `forbidden source marker found ${forbidden}`)
}

assert(indexSource.includes('resolveSoundCpuSyntheticRoute'), 'index must export resolver')
assert(indexSource.includes('SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS'), 'index must export rejected field constants')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2f_controlled_source_validation_runner_passed',
  sourceImported: false,
  sourceFilesValidated: Object.values(sourceFiles),
  routeContractCount: jobTypes.length,
  rejectedPayloadFieldCount: rejectedFields.length,
  runtimeFlagFalseCount: falseRuntimeFlags.length,
  workerExecutionRun: false,
  routeExecutionRun: false,
  mediaProcessingRun: false,
  dockerRun: false,
  dockerPush: false,
  gcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  artifactCreated: false,
}, null, 2))
