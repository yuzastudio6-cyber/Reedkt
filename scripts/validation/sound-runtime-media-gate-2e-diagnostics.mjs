#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2e_actual_synthetic_worker_route_source_created_with_warnings_ready_for_source_owner_review'
const sourceHead = 'aa9377f5b75f11f3e14ce2953d95395dc97de817'
const expectedSourceFiles = [
  'server/workers/sound-cpu/synthetic-route-types.ts',
  'server/workers/sound-cpu/synthetic-route-decision.ts',
  'server/workers/sound-cpu/index.ts',
]
const expectedDocs = [
  'docs/sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result.md',
  'docs/sound-runtime-media-gate-2e-source-file-register.md',
  'docs/sound-runtime-media-gate-2e-route-contract-implementation-register.md',
  'docs/sound-runtime-media-gate-2e-fail-closed-validation-report.md',
  'docs/sound-runtime-media-gate-2e-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2e-runtime-claim-policy.md',
]
const expectedPrompts = [
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review.md',
  'docs/implementation-prompts/prompt-sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation.md',
]
const expectedJobTypes = [
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
  'workerExecutionEnabled',
  'routeExecutionEnabled',
  'toolExecutionEnabled',
  'mediaProcessingEnabled',
  'mediaFileOpenEnabled',
  'ffmpegEnabled',
  'ffprobeEnabled',
  'dockerRunEnabled',
  'dockerPushEnabled',
  'gcpEnabled',
  'supabaseEnabled',
  'sqlEnabled',
  'artifactWriteEnabled',
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseBlock(file, label) {
  const text = read(file)
  const marker = `\`\`\`json ${label}`
  const start = text.indexOf(marker)
  assert(start >= 0, `${file} missing JSON block ${label}`)
  const jsonStart = start + marker.length
  const end = text.indexOf('```', jsonStart)
  assert(end >= 0, `${file} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart, end).trim())
}

for (const file of [...expectedSourceFiles, ...expectedDocs, ...expectedPrompts]) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
}

const result = parseBlock(expectedDocs[0], 'sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result')
const fileRegister = parseBlock(expectedDocs[1], 'sound-runtime-media-gate-2e-source-file-register')
const contractRegister = parseBlock(expectedDocs[2], 'sound-runtime-media-gate-2e-route-contract-implementation-register')
const validation = parseBlock(expectedDocs[3], 'sound-runtime-media-gate-2e-fail-closed-validation-report')
const blockers = parseBlock(expectedDocs[4], 'sound-runtime-media-gate-2e-blocker-follow-up-register')
const policy = parseBlock(expectedDocs[5], 'sound-runtime-media-gate-2e-runtime-claim-policy')

assert(result.decision === decision, 'Gate 2E decision mismatch')
assert(result.sourceVerification.pr763MergedSourceHead === sourceHead, 'PR #763 source head mismatch')
assert(result.actualSourceCreated === true, 'actual source must be created in Gate 2E')
assert(result.sourceFileCount === 3, 'source file count mismatch')
assert(result.routeContractCount === 4, 'route contract count mismatch')
assert(result.rejectedPayloadFieldCount === 14, 'rejected field count mismatch')
assert(result.publicRouteCreated === false, 'public route must not be created')
assert(result.serverRouteCreated === false, 'server route must not be created')
assert(result.workerImplementationCreated === false, 'worker implementation must not be created')
assert(result.workerExecutionRun === false, 'worker execution must not run')
assert(result.routeExecutionRun === false, 'route execution must not run')
assert(result.supabaseTouched === false, 'Supabase must not be touched')
assert(result.sqlExecuted === false, 'SQL must not execute')

for (const file of expectedSourceFiles) {
  assert(fileRegister.sourceFiles.some((entry) => entry.path === file && entry.createdInGate2e === true), `${file} not registered`)
}

for (const jobType of expectedJobTypes) {
  assert(contractRegister.routeContracts.some((contract) => contract.jobType === jobType), `missing route contract ${jobType}`)
}

for (const field of rejectedFields) {
  assert(validation.rejectedPayloadFields.includes(field), `missing rejected field ${field}`)
}

for (const flag of falseRuntimeFlags) {
  assert(policy.runtimeFlags[flag] === false, `${flag} must remain false`)
}
assert(policy.runtimeFlags.generatedLocalFixturePassedClaimed === false, 'generated fixture pass must remain unclaimed')
assert(policy.runtimeFlags.dryRunPassedClaimed === false, 'dry-run pass must remain unclaimed')
assert(policy.runtimeFlags.runtimeReadinessClaimed === false, 'runtime readiness must remain unclaimed')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.blockers.some((blocker) => blocker.blockerId === 'source_owner_review_required' && blocker.status === 'next'), 'source owner review next blocker missing')

const typesSource = read(expectedSourceFiles[0])
const decisionSource = read(expectedSourceFiles[1])
const indexSource = read(expectedSourceFiles[2])
for (const jobType of expectedJobTypes) {
  assert(typesSource.includes(jobType) || decisionSource.includes(jobType), `source missing ${jobType}`)
}
for (const field of rejectedFields) {
  assert(typesSource.includes(field), `source missing rejected field ${field}`)
}
for (const flag of Object.keys(policy.runtimeFlags).filter((flag) => falseRuntimeFlags.includes(flag))) {
  assert(typesSource.includes(flag), `source missing runtime flag ${flag}`)
}
assert(decisionSource.includes('resolveSoundCpuSyntheticRoute'), 'resolver export missing')
assert(decisionSource.includes('rejected_payload_field'), 'fail-closed rejected field reason missing')
assert(decisionSource.includes('unsafe_runtime_flag'), 'unsafe runtime flag rejection missing')
assert(!decisionSource.includes('child_process'), 'source must not shell out')
assert(!decisionSource.includes('fetch('), 'source must not call network fetch')
assert(!decisionSource.includes('createClient'), 'source must not create Supabase clients')
assert(indexSource.includes('resolveSoundCpuSyntheticRoute'), 'index export missing resolver')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2e:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2e-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2e_diagnostics_passed',
  decision,
  sourceHead,
  sourceFileCount: expectedSourceFiles.length,
  routeContractCount: expectedJobTypes.length,
  rejectedPayloadFieldCount: rejectedFields.length,
  publicRouteCreated: result.publicRouteCreated,
  workerExecutionRun: result.workerExecutionRun,
  routeExecutionRun: result.routeExecutionRun,
  supabaseTouched: result.supabaseTouched,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ACTUAL-SYNTHETIC-ROUTE-SOURCE-OWNER-REVIEW: review actual synthetic route source, no execution',
}, null, 2))
