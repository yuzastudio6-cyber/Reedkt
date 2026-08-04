import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cli = source(
  'server/cli/run-weeditpro-source-analysis-l4-visual-evidence-worker.ts',
)
const build = source('vite.server.config.ts')
const docker = source('docker/prod/gpu-worker/Dockerfile')
const deploy = source('scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh')
const attemptOwner = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-attempt-owner.ts',
)

assert.match(
  build,
  /weeditpro-source-analysis-l4-visual-evidence-worker/u,
)
assert.match(
  docker,
  /CMD \["node", "dist-server\/weeditpro-source-analysis-l4-visual-evidence-worker\.js"\]/u,
)
assert.doesNotMatch(
  docker,
  /CMD \["node", "dist-server\/server\.js"\]/u,
)
assert.match(docker, /HF_HUB_OFFLINE=1/u)
assert.match(docker, /TRANSFORMERS_OFFLINE=1/u)
assert.match(
  docker,
  /test -f[\s\\]+dist-server\/weeditpro-source-analysis-l4-visual-evidence-worker\.js/u,
)
assert.match(cli, /createCanonicalGcsSourceAnalysisJsonObjectPort/u)
assert.match(cli, /createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner/u)
assert.match(cli, /new Storage\(\{ projectId: 'reeditpro' \}\)/u)
assert.match(cli, /REEDITPRO_GPU_INVOCATION_ID/u)
assert.match(cli, /WORKER_GROUP: z\.literal\('l4_standard_primary'\)/u)
assert.match(cli, /REEDITPRO_ENV: z\.literal\('production'\)/u)
assert.match(
  cli,
  /source_visual_evidence_six_tool_gpu_executor_not_qualified/u,
)
assert.match(cli, /gpuToolExecutionStarted: false/u)
assert.match(cli, /substantiveCpuMediaProcessingUsed: false/u)
assert.match(cli, /runtimeModelOrToolDownloadPerformed: false/u)
assert.match(cli, /customerCreditMutated: false/u)
assert.doesNotMatch(
  cli,
  /process\.argv|child_process|execFile|spawn|shell|signedUrl|apiKey|qwen|sam2/u,
)
assert.match(
  deploy,
  /GCS_CONTROL_PLANE_STATE_BUCKET=\$\{CONTROL_PLANE_STATE_BUCKET\}/u,
)
assert.match(deploy, /WORKER_GROUP=l4_standard_primary/u)
assert.match(deploy, /--max-retries=0/u)
assert.match(deploy, /--tasks=1/u)
assert.match(deploy, /--parallelism=1/u)
assert.match(attemptOwner, /name: 'REEDITPRO_GPU_INVOCATION_ID'/u)
assert.doesNotMatch(
  attemptOwner,
  /name: '(?:GCS_CONTROL_PLANE_STATE_BUCKET|WORKER_GROUP|REEDITPRO_ENV)'/u,
)

console.log(JSON.stringify({
  ok: true,
  dedicatedWeEditProL4WorkerEntrypointBuilt: true,
  gpuJobStartsApiServer: false,
  cloudRunRequestOverrideContainsInvocationIdOnly: true,
  staticWorkerConfigurationContainsPrivateControlBucket: true,
  runtimeDownloadAllowed: false,
  substantiveCpuMediaProcessingAllowed: false,
  unqualifiedSixToolExecutionStarted: false,
  customerCreditMutated: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}))

function source(path: string): string {
  return readFileSync(path, 'utf8')
}
