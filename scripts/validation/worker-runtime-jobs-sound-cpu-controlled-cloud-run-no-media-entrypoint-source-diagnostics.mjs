import fs from 'node:fs'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-source.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-source',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-contract-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-contract-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-dockerfile-update-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-dockerfile-update-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-next-proof-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-next-proof-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-claim-policy',
  ],
]

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_entrypoint_source_completed_with_warnings_ready_for_image_rebuild_deploy_execution_proof'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path, label) {
  const text = read(path)
  const match = text.match(new RegExp('```json ' + label + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label}`)
  return JSON.parse(match[1])
}

const parsed = Object.fromEntries(docs.map(([path, label]) => [path, parseJsonBlock(path, label)]))
const source = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-source.md']
const contract =
  parsed['docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-contract-register.md']
const dockerfileRegister =
  parsed['docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-dockerfile-update-register.md']
const nextProof =
  parsed['docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-next-proof-register.md']
const claimPolicy =
  parsed['docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-claim-policy.md']

assert(source.decision === expectedDecision, 'Unexpected decision')
assert(source.sourcePr === 2414, 'Source PR evidence missing')
assert(source.sourceMergeCommit === 'fbb673af61971ba91aeeabd30236c5852f03b385', 'Source merge commit mismatch')
assert(source.toolCount === 15, 'Tool count mismatch')
assert(source.dockerBuildInThisPacket === 'no', 'Docker build must not run in this packet')
assert(source.cloudRunExecutionInThisPacket === 'no', 'Cloud Run execution must not run in this packet')
assert(contract.tools.length === 15, 'Contract must list all 15 tools')
assert(contract.readinessClaims === 'unclaimed', 'Readiness claims must remain unclaimed')
assert(dockerfileRegister.entrypointCopied === 'yes', 'Entrypoint copy not recorded')
assert(dockerfileRegister.failClosedPlaceholderRemoved === 'yes', 'Fail-closed placeholder removal not recorded')
assert(dockerfileRegister.actualDockerBuild === 'no', 'Docker build claim widened')
assert(nextProof.remainingBlockers.includes('controlled_cloud_run_execution_not_yet_run'), 'Execution blocker missing')
assert(claimPolicy.claimsForbidden.externalBetaReady === 'unclaimed', 'External beta must remain unclaimed')
assert(claimPolicy.supabase.updateRequired === 'no', 'Supabase update must remain no')

const dockerfile = read('server/workers/sound-cpu/Dockerfile')
assert(dockerfile.includes('FROM --platform=linux/amd64 python:3.13-slim'), 'Dockerfile base/platform mismatch')
assert(
  dockerfile.includes(
    'COPY --chmod=0644 scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py ./controlled-tool-execution-runner.py',
  ),
  'Dockerfile must copy controlled runner with non-root-readable permissions',
)
assert(
  dockerfile.includes(
    'COPY --chmod=0644 server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt ./requirements.sound-oss-tools.txt',
  ),
  'Dockerfile must copy requirements with non-root-readable permissions',
)
assert(
  dockerfile.includes('CMD ["python", "./controlled-tool-execution-runner.py", "--require-disabled-env"]'),
  'Dockerfile CMD must use controlled no-media runner',
)
for (const expected of [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0',
  'REEDITPRO_WORKER_EXECUTION_ENABLED=0',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED=0',
  'REEDITPRO_SUPABASE_MUTATION_ENABLED=0',
  'REEDITPRO_ARTIFACT_WRITE_ENABLED=0',
  'REEDITPRO_EXTERNAL_BETA_READY=false',
  'REEDITPRO_PRODUCTION_READY=false',
]) {
  assert(dockerfile.includes(expected), `Dockerfile missing ${expected}`)
}
assert(!dockerfile.includes('raise SystemExit'), 'Fail-closed placeholder CMD must be removed')
assert(!dockerfile.includes('gcloud run jobs execute'), 'Dockerfile must not execute Cloud Run')

const runner = read(
  'scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py',
)
assert(runner.includes('DISABLED_ENV_DEFAULTS'), 'Runner must define disabled env defaults')
assert(runner.includes('--require-disabled-env'), 'Runner must expose disabled-env requirement flag')
assert(runner.includes('validate_disabled_env'), 'Runner must validate disabled env')
assert(runner.includes('"librosa"') && runner.includes('"ebu_r128_pyloudnorm"'), 'Runner must cover direct and alias tools')
assert(!runner.includes('audio_open('), 'Runner must not call audioread.audio_open')
assert(!runner.includes('ffmpeg '), 'Runner must not execute ffmpeg')
assert(!runner.includes('ffprobe '), 'Runner must not execute ffprobe')

const prompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof.md',
)
assert(prompt.includes(expectedDecision), 'Next prompt must require entrypoint source decision')
assert(prompt.includes('Execute only the approved controlled no-media Cloud Run proof'), 'Next prompt missing execution scope')
assert(prompt.includes('keep beta/production closed'), 'Next prompt must keep beta/production closed')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-cloud-run-no-media-entrypoint-source:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-source-diagnostics.mjs',
  'Package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      toolCount: source.toolCount,
      dockerfileEntrypointReadyForNextGate: true,
      dockerBuildInThisPacket: false,
      cloudRunExecutionInThisPacket: false,
      externalBetaReady: false,
      productionReady: false,
    },
    null,
    2,
  ),
)
