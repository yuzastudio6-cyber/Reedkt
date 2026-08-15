import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
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
assert.match(server, /canonical-sam3_1-vertex-readiness-request-v1/u)
assert.match(server, /canonical-sam3_1-vertex-readiness-result-v1/u)
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
assert.match(server, /nonCustomerReadinessTrigger/u)
assert.match(server, /modelInferenceExecuted.*False/su)
assert.match(server, /EXACT_CHECKPOINT_BYTE_LENGTH = 3_502_755_717/u)
assert.match(server,
  /0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6/u)
assert.match(server, /exactCheckpointBytesRereadAndHashed.*True/su)
assert.match(server, /privateCheckpointDownloadPerformedAtReplicaStartup/su)
assert.match(server,
  /ThreadingHTTPServer[\s\S]*threading\.Thread[\s\S]*checkpoint_thread\.start/u)
assert.match(server,
  /if not _checkpoint_ready:[\s\S]*HTTPStatus\.SERVICE_UNAVAILABLE[\s\S]*checkpoint_loading/u)
assert.match(server,
  /ensure_checkpoint\([\s\S]*EXACT_CHECKPOINT_SHA256[\s\S]*_checkpoint_ready = True/u)
assert.match(server, /storageWritePerformed.*False/su)
assert.match(server, /\/dev\/nvidia0/u)
assert.match(server, /response commit marker is absent/u)
assert.match(server, /uploaded\.append\(upload\(response_path\)\)/u)
assert.match(server, /canonical invocation already has a terminal response/u)
assert.match(server, /temp\.unlink\(missing_ok=True\)/u)
assert.match(server, /checkpointByteLength/u)
assert.match(server, /checkpointSha256/u)
assert.match(server, /private checkpoint bytes changed/u)
assert.match(server, /status not in \{"completed", "failed"\}/u)
assert.match(server, /worker_return_code == 0/u)
assert.match(server, /canonical-sam3_1-vertex-worker-diagnostic-evidence-v1/u)
assert.match(server, /parse_worker_process_evidence/u)
assert.match(server, /runtime response and diagnostic stage disagree/u)
assert.match(server, /rawExceptionTextPersisted.*False/su)
assert.match(server, /diagnosticBindingSha256/u)
assert.match(server, /diagnostic\.json/u)
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

const dynamicEvidence = JSON.parse(execFileSync('python3', [
  '-I',
  '-B',
  '-c',
  String.raw`
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

path = Path("docker/prod/gpu-worker/sam3_1/vertex_prediction_server.py")
spec = importlib.util.spec_from_file_location("sam31_vertex_server", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def encoded(value):
    return module.stable_json_bytes(value) + b"\n"

success = subprocess.CompletedProcess(
    args=[],
    returncode=0,
    stdout=b"bounded upstream model-load notice\n" + encoded({
        "schemaVersion": module.WORKER_EXIT_VERSION,
        "status": "completed",
        "responseSha256": "a" * 64,
        "responsePersisted": True,
    }),
    stderr=b"bounded upstream warning\n",
)
success_marker, success_diagnostic = module.parse_worker_process_evidence(success)
if success_marker["status"] != "completed" or success_diagnostic is not None:
    raise AssertionError("successful worker evidence was not exact")

failure = subprocess.CompletedProcess(
    args=[],
    returncode=1,
    stdout=b"bounded upstream model-load notice\n" + encoded({
        "schemaVersion": module.WORKER_EXIT_VERSION,
        "status": "failed",
        "responseSha256": "b" * 64,
        "responsePersisted": True,
    }),
    stderr=b"bounded upstream warning\n" + encoded({
        "schemaVersion": module.WORKER_DIAGNOSTIC_VERSION,
        "terminalStage": "propagation",
        "diagnosticCode": "cuda_out_of_memory",
        "rawExceptionTextPersisted": False,
    }),
)
failure_marker, failure_diagnostic = module.parse_worker_process_evidence(failure)
if failure_marker["status"] != "failed" or failure_diagnostic is None:
    raise AssertionError("failed worker evidence was not exact")

with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    module.persist_failure_diagnostic(
        "sam31-diagnostic-smoke",
        root,
        "b" * 64,
        1,
        failure_diagnostic,
    )
    body = (root / "diagnostic.json").read_bytes()
    value = json.loads(body)
    digest = value.pop("diagnosticBindingSha256")
    if digest != hashlib.sha256(module.stable_json_bytes(value)).hexdigest():
        raise AssertionError("failure diagnostic digest changed")
    if value["diagnosticCode"] != "cuda_out_of_memory":
        raise AssertionError("failure diagnostic code changed")
    if value["rawExceptionTextPersisted"] is not False:
        raise AssertionError("raw worker diagnostic was persisted")

unsafe = subprocess.CompletedProcess(
    args=[],
    returncode=1,
    stdout=b"x" * (module.MAXIMUM_WORKER_STDOUT_BYTES + 1),
    stderr=failure.stderr,
)
try:
    module.parse_worker_process_evidence(unsafe)
except RuntimeError:
    pass
else:
    raise AssertionError("unbounded worker output was accepted")

print(json.dumps({
    "successMarkerAccepted": True,
    "failureDiagnosticAccepted": True,
    "diagnosticDigestVerified": True,
    "boundedUpstreamLogsIgnored": True,
    "unboundedWorkerOutputRejected": True,
}))
`,
], { encoding: 'utf8' })) as {
  readonly successMarkerAccepted: true
  readonly failureDiagnosticAccepted: true
  readonly diagnosticDigestVerified: true
  readonly boundedUpstreamLogsIgnored: true
  readonly unboundedWorkerOutputRejected: true
}

assert.equal(dynamicEvidence.successMarkerAccepted, true)
assert.equal(dynamicEvidence.failureDiagnosticAccepted, true)
assert.equal(dynamicEvidence.diagnosticDigestVerified, true)
assert.equal(dynamicEvidence.boundedUpstreamLogsIgnored, true)
assert.equal(dynamicEvidence.unboundedWorkerOutputRejected, true)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-prediction-server-boundary',
  checks: 60,
  requestIsByteFree: true,
  callerStorageOrModelControlAccepted: false,
  oneConcurrentA100Attempt: true,
  createOnlyPrivatePersistence: true,
  responseUploadedLastAsCommitMarker: true,
  exactCheckpointBindingVerifiedBeforeExecution: true,
  nonCustomerGpuReadinessProbeIsByteFree: true,
  healthServerStartsBeforeBoundedCheckpointInitialization: true,
  healthRemainsUnavailableUntilExactCheckpointReady: true,
  completedAndFailedTerminalResultsPersisted: true,
  boundedFailureDiagnosticPersisted: true,
  rawFailureDiagnosticPersisted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
