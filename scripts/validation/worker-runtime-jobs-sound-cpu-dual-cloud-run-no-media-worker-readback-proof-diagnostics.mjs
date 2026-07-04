#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_dual_cloud_run_no_media_worker_readback_passed_with_warnings_ready_for_phase210_explicit_fixture_path_intake'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_agent_cloud_proof_completed_with_warnings_ready_for_phase210_explicit_fixture_path_intake'
const SOURCE_COMMIT = 'fdaa833f3ea2e9774956be143d0a32b3e6e73585'
const IMAGE_DIGEST = 'sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366'
const METADATA_EXECUTION = 'reeditpro-sound-audio-metadata-worker-46mws'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE210-PRIVATE-FIXTURE-PATH-INPUT-AND-BOUNDARY-INTAKE-WITH-EXPLICIT-PATH'
const TOOLS = [
  ['librosa', 'librosa', '0.11.0'],
  ['audioread', 'audioread', '3.1.0'],
  ['pydub', 'pydub', '0.25.1'],
  ['scipy', 'scipy', '1.17.1'],
  ['resampy', 'resampy', '0.4.3'],
  ['pyloudnorm', 'pyloudnorm', '0.2.0'],
  ['audioflux', 'audioflux', '0.1.9'],
  ['music21', 'music21', '10.3.0'],
  ['pretty_midi', 'pretty_midi', '0.2.11'],
  ['mido', 'mido', '1.3.3'],
  ['noisereduce', 'noisereduce', '3.0.3'],
  ['pedalboard', 'pedalboard', '0.9.23'],
  ['mir_eval', 'mir_eval', '0.8.2'],
  ['pydub_effects', 'pydub', '0.25.1'],
  ['ebu_r128_pyloudnorm', 'pyloudnorm', '0.2.0'],
]

const DOCS = {
  proof: [
    'docs/worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-readback-proof.md',
    'worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-readback-proof',
  ],
  tools: [
    'docs/worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-tool-result-register.md',
    'worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-tool-result-register',
  ],
  safety: [
    'docs/worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-runtime-safety-register.md',
    'worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-runtime-safety-register',
  ],
  sources: [
    'docs/worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-source-register.md',
    'worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-source-register',
  ],
  claims: [
    'docs/worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-claim-policy',
  ],
}

const FORBIDDEN_TEXT = [
  '"realUserMediaBeta": "yes"',
  '"realUserMediaBetaReady": true',
  '"realUserMediaRead": true',
  '"mediaProcessing": true',
  '"workerDispatch": "yes"',
  '"userRouteExecution": "yes"',
  '"supabaseSql": "yes"',
  '"artifactWrite": "yes"',
  '"externalBetaUnlock": "yes"',
  '"productionUnlock": "yes"',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE_ROLE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBlock(path, label) {
  const text = read(path)
  for (const forbidden of FORBIDDEN_TEXT) {
    assert(!text.includes(forbidden), `${path} contains forbidden text: ${forbidden}`)
  }
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label} in ${path}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`)
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`)
}

const parsed = Object.fromEntries(
  Object.entries(DOCS).map(([key, [path, label]]) => [key, parseBlock(path, label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

const proof = parsed.proof
assert(proof.sourceEvidence.sourcePr === 2421, 'source PR mismatch')
assert(proof.sourceEvidence.sourceMergeCommit === SOURCE_COMMIT, 'source commit mismatch')
assert(proof.sourceEvidence.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(proof.dualWorkerReadback.project === 'reeditpro', 'project mismatch')
assert(proof.dualWorkerReadback.region === 'us-central1', 'region mismatch')
assert(proof.dualWorkerReadback.analysisWorkerJob === 'reeditpro-sound-cpu-analysis-worker', 'analysis job mismatch')
assert(proof.dualWorkerReadback.metadataWorkerJob === 'reeditpro-sound-audio-metadata-worker', 'metadata job mismatch')
assert(proof.dualWorkerReadback.analysisWorkerExecutionSucceeded === true, 'analysis proof missing')
assert(proof.dualWorkerReadback.metadataWorkerExecutionSucceeded === true, 'metadata proof missing')
assert(proof.dualWorkerReadback.metadataWorkerExecutionName === METADATA_EXECUTION, 'metadata execution mismatch')
assert(proof.dualWorkerReadback.imageDigest === IMAGE_DIGEST, 'image digest mismatch')
assert(proof.dualWorkerReadback.cpu === '2', 'CPU mismatch')
assert(proof.dualWorkerReadback.memory === '4Gi', 'memory mismatch')
assert(proof.toolProof.toolCount === 15, 'tool count mismatch')
assert(proof.toolProof.analysisWorkerPassedToolCount === 15, 'analysis tool pass mismatch')
assert(proof.toolProof.metadataWorkerAttemptedToolCount === 15, 'metadata attempted mismatch')
assert(proof.toolProof.metadataWorkerPassedToolCount === 15, 'metadata passed mismatch')
assert(proof.toolProof.metadataWorkerFailedToolCount === 0, 'metadata failed mismatch')
assert(proof.toolProof.allFifteenToolsPassedInBothCloudRunWorkerJobs === true, 'dual worker proof missing')
assert(proof.acceptedForToday.controlledMetadataWorkerCloudRunNoMediaProof === 'yes', 'metadata proof not accepted')
for (const [key, value] of Object.entries(proof.acceptedForToday)) {
  if (
    ![
      'controlledAnalysisWorkerCloudRunNoMediaProof',
      'controlledMetadataWorkerCloudRunNoMediaProof',
      'dualWorkerCloudRunNoMediaReadback',
    ].includes(key)
  ) {
    assert(value === 'no', `${key} accepted scope widened`)
  }
}
assert(proof.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(proof.supabaseClassification, 'proof')

assert(parsed.tools.metadataWorkerToolCounts.attempted === 15, 'metadata attempted count mismatch')
assert(parsed.tools.metadataWorkerToolCounts.passed === 15, 'metadata passed count mismatch')
assert(parsed.tools.metadataWorkerToolCounts.failed === 0, 'metadata failed count mismatch')
assert(parsed.tools.tools.length === TOOLS.length, 'tool length mismatch')
for (const [index, [toolId, packageName, version]] of TOOLS.entries()) {
  const tool = parsed.tools.tools[index]
  assert(tool.toolId === toolId, `${toolId} order mismatch`)
  assert(tool.package === packageName, `${toolId} package mismatch`)
  assert(tool.version === version, `${toolId} version mismatch`)
  assert(tool.passed === true, `${toolId} did not pass`)
}
assert(parsed.tools.dualWorkerConclusion.analysisWorkerPreviouslyPassedAllFifteen === true, 'analysis conclusion missing')
assert(parsed.tools.dualWorkerConclusion.metadataWorkerPassedAllFifteen === true, 'metadata conclusion missing')
assert(parsed.tools.dualWorkerConclusion.imageDigest === IMAGE_DIGEST, 'dual image digest mismatch')

for (const [key, value] of Object.entries(parsed.safety.cloudRunDisabledEnvFlags)) {
  assert(value === '0' || value === 'false', `${key} disabled env widened`)
}
for (const [key, value] of Object.entries(parsed.safety.metadataWorkerSideEffects)) {
  assert(value === false, `${key} side effect widened`)
}
for (const [key, value] of Object.entries(parsed.safety.stillBlocked)) {
  assert(value === true, `${key} should remain blocked`)
}

assert(parsed.sources.acceptedWorkers.length === 2, 'accepted workers mismatch')
assert(parsed.sources.acceptedCloudRunJobs.length === 2, 'accepted Cloud Run jobs mismatch')
assert(parsed.sources.acceptedImages.length === 2, 'accepted images mismatch')
assert(parsed.sources.acceptedJobTypes.length === 4, 'accepted job types mismatch')
assert(parsed.sources.cpuGpuClassification.lane === 'SOUND_CPU_15_TOOLS', 'lane mismatch')
assert(parsed.sources.cpuGpuClassification.requiresGpu === false, 'SOUND CPU lane must not require GPU')
assert(parsed.sources.cpuGpuClassification.gpuModelWeightToolsIncluded === false, 'GPU tools must stay out of 15-tool proof')

for (const value of Object.values(parsed.claims.allowedClaims)) {
  assert(value === true, 'allowed claim should be true')
}
for (const value of Object.values(parsed.claims.forbiddenClaims)) {
  assert(value === 'unclaimed', 'forbidden claim widened')
}
for (const value of Object.values(parsed.claims.closedScopes)) {
  assert(value === 'no', 'closed scope widened')
}
assert(parsed.claims.nextPrompt === NEXT_PROMPT, 'claim next prompt mismatch')
assertSupabaseNoop(parsed.claims.supabaseClassification, 'claims')

const gcpConfig = read('server/config/gcp-production-config.ts')
for (const required of [
  "name: 'reeditpro-sound-cpu-analysis-worker'",
  "name: 'reeditpro-sound-audio-metadata-worker'",
  "cpu: 2",
  "memory: '4Gi'",
  'No GPU. SOUND CPU',
]) {
  assert(gcpConfig.includes(required), `GCP config missing ${required}`)
}

const route = read('server/routes/sound-cpu-no-media-agent-call-routes.ts')
assert(route.includes('SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS'), 'route missing allowed tools')
assert(route.includes('acceptedToolCount: 15'), 'route missing accepted tool count')
assert(route.includes('sound-cpu-analysis-worker'), 'route missing analysis worker')
assert(route.includes('sound-audio-metadata-worker'), 'route missing metadata worker')
assert(route.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED'), 'route missing disabled runtime flag')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-dual-cloud-run-no-media-worker-readback-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-readback-proof-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      analysisWorker: 'reeditpro-sound-cpu-analysis-worker',
      metadataWorker: 'reeditpro-sound-audio-metadata-worker',
      metadataExecution: METADATA_EXECUTION,
      toolCountPassed: 15,
      requiresGpu: false,
      realUserMediaBetaReady: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
