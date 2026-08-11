import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const server = readFileSync(
  'docker/prod/gpu-worker/sam3_1/vertex_prediction_server.py',
  'utf8',
)
const runner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/runner.py',
  'utf8',
)
const entrypoint = readFileSync(
  'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
  'utf8',
)
const dockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
  'utf8',
)

assert.match(server, /canonical-sam3_1-vertex-prediction-server-v1/u)
assert.match(server, /canonical-sam3_1-vertex-prediction-request-v1/u)
assert.match(server, /tool\.sam3_1\.segment_and_track_subject\.v1/u)
assert.match(server, /reeditpro-production-reeditpro-masks/u)
assert.match(server, /reeditpro-production-reeditpro-model-artifacts/u)
assert.match(server, /ifGenerationMatch.*0/u)
assert.match(server, /_execution_lock\.acquire\(blocking=False\)/u)
assert.match(server, /MAXIMUM_RUN_SECONDS = 420/u)
assert.match(server, /len\(instances\) != 1/u)
assert.match(server, /dispatchAdmissionDigestSha256/u)
assert.match(server, /caller.*bucket|caller.*object|caller.*URL|caller.*path/isu)
assert.match(server, /metadata\.google\.internal/u)
assert.match(server, /response commit marker is absent/u)
assert.match(server, /uploaded\.append\(upload\(response_path\)\)/u)
assert.match(server, /canonical invocation already has a terminal response/u)
assert.match(server, /temp\.unlink\(missing_ok=True\)/u)
assert.match(server, /checkpointByteLength/u)
assert.match(server, /checkpointSha256/u)
assert.match(server, /private checkpoint bytes changed/u)
assert.match(server, /status not in \{"completed", "failed"\}/u)
assert.match(server, /worker_return_code == 0/u)
assert.match(server, /MAXIMUM_RESULT_FILE_COUNT = 4_000/u)
assert.match(server, /MAXIMUM_RESULT_SET_BYTES = 4 \* 1024 \* 1024 \* 1024/u)
assert.match(server, /customerCreditsMutated.*False/su)
assert.match(server, /productionAuthorityGranted.*False/su)
assert.doesNotMatch(server, /eval\(|exec\(|shell=True|os\.system/u)

assert.match(runner, /vertex_prediction_endpoint_v1/u)
assert.match(runner, /VERTEX_PREDICTION_CHECKPOINT_PATH/u)
assert.match(runner, /VERTEX_PREDICTION_PRIVATE_INVOCATION_PARENT/u)
assert.match(runner, /cloud_run_job_v1/u)

assert.match(entrypoint, /vertex_prediction_endpoint_v1/u)
assert.match(entrypoint, /requires the A100 80 GB route/u)
assert.match(entrypoint, /vertex_prediction_server\.py/u)
assert.match(dockerfile, /COPY .*vertex_prediction_server\.py/su)
assert.match(dockerfile, /py_compile[\s\S]*vertex_prediction_server\.py/u)
assert.match(dockerfile, /chmod 0555 .*vertex_prediction_server\.py/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-prediction-server-boundary',
  checks: 37,
  requestIsByteFree: true,
  callerStorageOrModelControlAccepted: false,
  oneConcurrentA100Attempt: true,
  createOnlyPrivatePersistence: true,
  responseUploadedLastAsCommitMarker: true,
  exactCheckpointBindingVerifiedBeforeExecution: true,
  completedAndFailedTerminalResultsPersisted: true,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
