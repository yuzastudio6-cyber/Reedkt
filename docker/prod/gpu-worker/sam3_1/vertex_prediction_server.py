#!/usr/bin/env python3
"""Closed Vertex Prediction transport for one SAM 3.1 invocation at a time.

The HTTP request contains only canonical invocation identity. Task, source,
checkpoint, and result bytes move through fixed private Cloud Storage owners.
The caller cannot provide a bucket, object, URL, path, model, command, price,
or output destination.
"""

from __future__ import annotations

import concurrent.futures
import hashlib
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import threading
from typing import Any
from urllib import error, parse, request


SERVER_VERSION = "canonical-sam3_1-vertex-prediction-server-v1"
REQUEST_VERSION = "canonical-sam3_1-vertex-prediction-request-v1"
RESULT_VERSION = "canonical-sam3_1-vertex-prediction-result-v1"
READINESS_REQUEST_VERSION = "canonical-sam3_1-vertex-readiness-request-v1"
READINESS_RESULT_VERSION = "canonical-sam3_1-vertex-readiness-result-v1"
TASK_VERSION = "canonical-sam3_1-gpu-task-record-v1"
RUNTIME_REQUEST_VERSION = "canonical-sam3_1-gpu-runtime-request-v1"
RUNTIME_RESPONSE_VERSION = "canonical-sam3_1-gpu-runtime-response-v1"
OPERATION_ID = "tool.sam3_1.segment_and_track_subject.v1"
MASK_BUCKET = "reeditpro-production-reeditpro-masks"
MODEL_BUCKET = "reeditpro-production-reeditpro-model-artifacts"
INVOCATION_PREFIX = "private/canonical-professional-gpu/sam3_1/v1/invocations"
CHECKPOINT_OBJECT = (
    "private/model-artifacts/sam3_1/checkpoint/"
    "daa63191845a41281374e725f4c9e51c7a824460/"
    "sam31-weeditpro-official-ingest-20260806-v12-bb0aa9fdb01770a4/"
    "sam3.1_multiplex.pt"
)
RUNTIME_ROOT = Path("/var/lib/weeditpro/sam31")
MODEL_ROOT = RUNTIME_ROOT / "vertex-prediction-model"
INVOCATION_ROOT = RUNTIME_ROOT / "vertex-prediction-invocations"
CHECKPOINT_PATH = MODEL_ROOT / "sam3.1_multiplex.pt"
RUNNER = Path("/opt/reeditpro/sam3_1/runner.py")
PYTHON = Path("/opt/weeditpro/python-venv/bin/python")
METADATA_TOKEN_URL = (
    "http://metadata.google.internal/computeMetadata/v1/instance/"
    "service-accounts/default/token"
)
STORAGE_DOWNLOAD = "https://storage.googleapis.com/storage/v1/b"
STORAGE_UPLOAD = "https://storage.googleapis.com/upload/storage/v1/b"
MAXIMUM_HTTP_BODY_BYTES = 16 * 1024
MAXIMUM_TASK_BYTES = 512 * 1024
MAXIMUM_SOURCE_BYTES = 2 * 1024 * 1024 * 1024
MAXIMUM_RESPONSE_BYTES = 64 * 1024
MAXIMUM_CHECKPOINT_BYTES = 8 * 1024 * 1024 * 1024
MAXIMUM_RESULT_FILE_BYTES = 64 * 1024 * 1024
MAXIMUM_RESULT_SET_BYTES = 4 * 1024 * 1024 * 1024
MAXIMUM_RESULT_FILE_COUNT = 4_000
MAXIMUM_RUN_SECONDS = 420
MAXIMUM_UPLOAD_WORKERS = 8
EXACT_CHECKPOINT_BYTE_LENGTH = 3_502_755_717
EXACT_CHECKPOINT_SHA256 = (
    "0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6"
)
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
_execution_lock = threading.Lock()
_checkpoint_ready = False
_checkpoint_download_performed_at_startup = False


def stable_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
    ).encode("utf-8")


def exact_keys(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ValueError(f"{label} is not closed")
    return value


def exact_id(value: Any, label: str) -> str:
    if (
        not isinstance(value, str)
        or SAFE_ID.fullmatch(value) is None
        or ".." in value
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or RAW_SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def parse_vertex_request(value: Any) -> tuple[str, str, str | None]:
    body = exact_keys(value, {"instances", "parameters"}, "request")
    parameters = exact_keys(
        body["parameters"], {"schemaVersion", "byteFree"}, "parameters"
    )
    schema_version = parameters.get("schemaVersion")
    if parameters.get("byteFree") is not True or schema_version not in {
        REQUEST_VERSION,
        READINESS_REQUEST_VERSION,
    }:
        raise ValueError("request parameters changed")
    instances = body["instances"]
    if not isinstance(instances, list) or len(instances) != 1:
        raise ValueError("exactly one invocation is required")
    if schema_version == READINESS_REQUEST_VERSION:
        instance = exact_keys(
            instances[0],
            {"readinessProbeId", "nonCustomerReadinessTrigger"},
            "readiness instance",
        )
        if instance["nonCustomerReadinessTrigger"] is not True:
            raise ValueError("readiness trigger authority changed")
        return (
            "readiness",
            exact_id(instance["readinessProbeId"], "readiness probe identity"),
            None,
        )
    instance = exact_keys(
        instances[0],
        {"invocationId", "dispatchAdmissionDigestSha256"},
        "instance",
    )
    return (
        "customer_invocation",
        exact_id(instance["invocationId"], "invocation identity"),
        exact_sha(
            instance["dispatchAdmissionDigestSha256"],
            "dispatch admission digest",
        ),
    )


def readiness_result(readiness_probe_id: str) -> dict[str, Any]:
    if _execution_lock.locked():
        raise RuntimeError("the one-attempt endpoint is busy")
    if os.environ.get("WEEDITPRO_GPU_ACCELERATOR_CLASS") != "nvidia_a100_80gb":
        raise RuntimeError("the readiness probe is not on the A100 route")
    if not Path("/dev/nvidia0").exists() or not Path("/dev/nvidiactl").exists():
        raise RuntimeError("the readiness probe cannot observe NVIDIA devices")
    if not _checkpoint_ready:
        raise RuntimeError("the exact checkpoint is not ready")
    return {
        "schemaVersion": READINESS_RESULT_VERSION,
        "readinessProbeId": readiness_probe_id,
        "serverVersion": SERVER_VERSION,
        "acceleratorClass": "nvidia_a100_80gb",
        "nvidiaDeviceNodesPresent": True,
        "checkpointByteLength": EXACT_CHECKPOINT_BYTE_LENGTH,
        "checkpointSha256": EXACT_CHECKPOINT_SHA256,
        "exactCheckpointBytesRereadAndHashed": True,
        "privateCheckpointDownloadPerformedAtReplicaStartup": (
            _checkpoint_download_performed_at_startup
        ),
        "readyForCustomerInvocation": True,
        "customerInvocationStarted": False,
        "modelInferenceExecuted": False,
        "storageReadPerformedAtReplicaStartup": (
            _checkpoint_download_performed_at_startup
        ),
        "storageWritePerformed": False,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "productionAuthorityGranted": False,
    }


def metadata_access_token() -> str:
    req = request.Request(
        METADATA_TOKEN_URL,
        headers={"Metadata-Flavor": "Google"},
        method="GET",
    )
    with request.urlopen(req, timeout=5) as response:
        value = json.loads(response.read(16 * 1024))
    token = value.get("access_token") if isinstance(value, dict) else None
    expires = value.get("expires_in") if isinstance(value, dict) else None
    if not isinstance(token, str) or len(token) < 40 or not isinstance(expires, int):
        raise RuntimeError("workload access token is unavailable")
    return token


def storage_request(
    url: str,
    token: str,
    *,
    method: str = "GET",
    body: bytes | None = None,
    content_type: str | None = None,
) -> request.Request:
    headers = {"Authorization": f"Bearer {token}"}
    if content_type is not None:
        headers["Content-Type"] = content_type
    return request.Request(url, headers=headers, data=body, method=method)


def download_object(
    bucket: str,
    object_name: str,
    destination: Path,
    maximum_bytes: int,
    token: str,
) -> tuple[int, str]:
    quoted_bucket = parse.quote(bucket, safe="")
    quoted_object = parse.quote(object_name, safe="")
    url = f"{STORAGE_DOWNLOAD}/{quoted_bucket}/o/{quoted_object}?alt=media"
    temp = destination.with_suffix(destination.suffix + ".partial")
    hasher = hashlib.sha256()
    count = 0
    destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    temp.unlink(missing_ok=True)
    try:
        with request.urlopen(storage_request(url, token), timeout=60) as response:
            with temp.open("xb") as output:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    count += len(chunk)
                    if count > maximum_bytes:
                        raise ValueError("private object exceeds its byte ceiling")
                    hasher.update(chunk)
                    output.write(chunk)
        os.chmod(temp, 0o600)
        temp.replace(destination)
    finally:
        temp.unlink(missing_ok=True)
    return count, hasher.hexdigest()


def object_exists(bucket: str, object_name: str, token: str) -> bool:
    quoted_bucket = parse.quote(bucket, safe="")
    quoted_object = parse.quote(object_name, safe="")
    url = f"{STORAGE_DOWNLOAD}/{quoted_bucket}/o/{quoted_object}"
    try:
        with request.urlopen(storage_request(url, token), timeout=10) as response:
            return response.status == HTTPStatus.OK
    except error.HTTPError as failure:
        if failure.code == HTTPStatus.NOT_FOUND:
            return False
        raise


def upload_create_only(
    bucket: str,
    object_name: str,
    source: Path,
    token: str,
) -> tuple[int, str]:
    source_size = source.stat().st_size
    if source_size < 1 or source_size > MAXIMUM_RESULT_FILE_BYTES:
        raise ValueError("private result file exceeds its byte ceiling")
    data = source.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    query = parse.urlencode(
        {"uploadType": "media", "name": object_name, "ifGenerationMatch": "0"}
    )
    url = f"{STORAGE_UPLOAD}/{parse.quote(bucket, safe='')}/o?{query}"
    try:
        with request.urlopen(
            storage_request(
                url,
                token,
                method="POST",
                body=data,
                content_type="application/octet-stream",
            ),
            timeout=60,
        ) as response:
            if response.status != HTTPStatus.OK:
                raise RuntimeError("private result upload was not accepted")
    except error.HTTPError as failure:
        if failure.code != HTTPStatus.PRECONDITION_FAILED:
            raise
        raise RuntimeError("create-only private result already exists") from None
    if len(data) != source_size:
        raise RuntimeError("private result file changed during upload")
    return len(data), digest


def hash_file(path: Path, maximum_bytes: int) -> tuple[int, str]:
    hasher = hashlib.sha256()
    count = 0
    with path.open("rb") as source:
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                break
            count += len(chunk)
            if count > maximum_bytes:
                raise ValueError("private file exceeds its byte ceiling")
            hasher.update(chunk)
    return count, hasher.hexdigest()


def ensure_checkpoint(
    token: str,
    expected_size: int,
    expected_hash: str,
) -> bool:
    if (
        isinstance(expected_size, bool)
        or not isinstance(expected_size, int)
        or expected_size < 1
        or expected_size > MAXIMUM_CHECKPOINT_BYTES
        or not isinstance(expected_hash, str)
        or RAW_SHA256.fullmatch(expected_hash) is None
    ):
        raise ValueError("private checkpoint binding is invalid")
    if CHECKPOINT_PATH.is_file():
        size, digest = hash_file(CHECKPOINT_PATH, MAXIMUM_CHECKPOINT_BYTES)
        if size == expected_size and digest == expected_hash:
            return False
        CHECKPOINT_PATH.unlink()
    MODEL_ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    size, digest = download_object(
        MODEL_BUCKET,
        CHECKPOINT_OBJECT,
        CHECKPOINT_PATH,
        MAXIMUM_CHECKPOINT_BYTES,
        token,
    )
    if size != expected_size or digest != expected_hash:
        CHECKPOINT_PATH.unlink(missing_ok=True)
        raise ValueError("private checkpoint bytes changed")
    return True


def stage_invocation(
    invocation_id: str,
    dispatch_digest: str,
    token: str,
) -> tuple[Path, int, str]:
    invocation_dir = INVOCATION_ROOT / invocation_id
    if invocation_dir.exists():
        raise RuntimeError("local invocation identity was already consumed")
    invocation_dir.mkdir(mode=0o700, parents=True)
    task_path = invocation_dir / "task.json"
    source_path = invocation_dir / "mask-proxy.mp4"
    prefix = f"{INVOCATION_PREFIX}/{invocation_id}"
    task_size, _ = download_object(
        MASK_BUCKET,
        f"{prefix}/task.json",
        task_path,
        MAXIMUM_TASK_BYTES,
        token,
    )
    if task_size < 2:
        raise ValueError("private task is empty")
    task = json.loads(task_path.read_bytes())
    if (
        not isinstance(task, dict)
        or task.get("schemaVersion") != TASK_VERSION
        or task.get("invocationId") != invocation_id
        or not isinstance(task.get("runtimeRequest"), dict)
        or task["runtimeRequest"].get("schemaVersion") != RUNTIME_REQUEST_VERSION
        or task["runtimeRequest"].get("operationId") != OPERATION_ID
        or task["runtimeRequest"].get("dispatchAdmissionDigestSha256")
        != dispatch_digest
    ):
        raise ValueError("private task lineage changed")
    source = task["runtimeRequest"].get("sourceMedia")
    if not isinstance(source, dict):
        raise ValueError("private source binding is absent")
    expected_size = source.get("byteLength")
    expected_hash = source.get("sha256")
    if (
        isinstance(expected_size, bool)
        or not isinstance(expected_size, int)
        or expected_size < 1
        or expected_size > MAXIMUM_SOURCE_BYTES
        or not isinstance(expected_hash, str)
        or RAW_SHA256.fullmatch(expected_hash) is None
    ):
        raise ValueError("private source binding is invalid")
    size, digest = download_object(
        MASK_BUCKET,
        f"{prefix}/mask-proxy.mp4",
        source_path,
        MAXIMUM_SOURCE_BYTES,
        token,
    )
    if size != expected_size or digest != expected_hash:
        raise ValueError("private source bytes changed")
    model_artifacts = task["runtimeRequest"].get("modelArtifacts")
    if not isinstance(model_artifacts, dict):
        raise ValueError("private model-artifact binding is absent")
    checkpoint_size = model_artifacts.get("checkpointByteLength")
    checkpoint_hash = model_artifacts.get("checkpointSha256")
    checkpoint_name = model_artifacts.get("checkpointFileName")
    checkpoint_revision = model_artifacts.get("checkpointRepositoryRevision")
    if (
        isinstance(checkpoint_size, bool)
        or not isinstance(checkpoint_size, int)
        or checkpoint_size < 1
        or checkpoint_size > MAXIMUM_CHECKPOINT_BYTES
        or not isinstance(checkpoint_hash, str)
        or RAW_SHA256.fullmatch(checkpoint_hash) is None
        or checkpoint_name != "sam3.1_multiplex.pt"
        or checkpoint_revision != "daa63191845a41281374e725f4c9e51c7a824460"
    ):
        raise ValueError("private checkpoint lineage changed")
    return invocation_dir, checkpoint_size, checkpoint_hash


def run_worker(invocation_id: str) -> int:
    environment = {
        **os.environ,
        "REEDITPRO_GPU_INVOCATION_ID": invocation_id,
        "WEEDITPRO_GPU_ACCELERATOR_CLASS": "nvidia_a100_80gb",
        "WEEDITPRO_SAM31_EXECUTION_PLATFORM": "vertex_prediction_endpoint_v1",
    }
    completed = subprocess.run(
        [str(PYTHON), "-I", "-B", str(RUNNER)],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=environment,
        timeout=MAXIMUM_RUN_SECONDS,
        check=False,
    )
    return completed.returncode


def persist_results(
    invocation_id: str,
    invocation_dir: Path,
    worker_return_code: int,
) -> dict[str, Any]:
    response_path = invocation_dir / "response.json"
    response_bytes = response_path.read_bytes()
    if len(response_bytes) > MAXIMUM_RESPONSE_BYTES:
        raise ValueError("runtime response exceeds its byte ceiling")
    response_value = json.loads(response_bytes)
    status = response_value.get("status") if isinstance(response_value, dict) else None
    if (
        not isinstance(response_value, dict)
        or response_value.get("schemaVersion") != RUNTIME_RESPONSE_VERSION
        or response_value.get("operationId") != OPERATION_ID
        or status not in {"completed", "failed"}
        or (worker_return_code == 0) != (status == "completed")
    ):
        raise RuntimeError("runtime response and worker outcome disagree")
    files = sorted(
        path for path in invocation_dir.rglob("*")
        if path.is_file() and path.name not in {"task.json", "mask-proxy.mp4"}
    )
    evidence_files = [path for path in files if path != response_path]
    if len(evidence_files) + 1 != len(files):
        raise RuntimeError("runtime response commit marker is absent")
    if len(files) > MAXIMUM_RESULT_FILE_COUNT:
        raise ValueError("private result file count exceeds its ceiling")
    total_bytes = sum(path.stat().st_size for path in files)
    if total_bytes < 1 or total_bytes > MAXIMUM_RESULT_SET_BYTES:
        raise ValueError("private result set exceeds its byte ceiling")
    token = metadata_access_token()
    prefix = f"{INVOCATION_PREFIX}/{invocation_id}"

    def upload(path: Path) -> tuple[int, str]:
        relative = path.relative_to(invocation_dir).as_posix()
        return upload_create_only(MASK_BUCKET, f"{prefix}/{relative}", path, token)

    with concurrent.futures.ThreadPoolExecutor(
        max_workers=MAXIMUM_UPLOAD_WORKERS
    ) as executor:
        uploaded = list(executor.map(upload, evidence_files))
    uploaded.append(upload(response_path))
    response_hash = hashlib.sha256(response_bytes).hexdigest()
    return {
        "schemaVersion": RESULT_VERSION,
        "invocationId": invocation_id,
        "runtimeStatus": status,
        "responseRef": {
            "id": f"sam31-gpu-response:{invocation_id}"[:240],
            "version": 1,
            "contentHash": f"sha256:{response_hash}",
        },
        "uploadedObjectCount": len(uploaded),
        "uploadedByteLength": sum(item[0] for item in uploaded),
        "exactPrivateCreateOnlyPersistence": True,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "productionAuthorityGranted": False,
    }


def execute_invocation(invocation_id: str, dispatch_digest: str) -> dict[str, Any]:
    if not _execution_lock.acquire(blocking=False):
        raise RuntimeError("the one-attempt endpoint is busy")
    invocation_dir: Path | None = None
    try:
        token = metadata_access_token()
        remote_response = (
            f"{INVOCATION_PREFIX}/{invocation_id}/response.json"
        )
        if object_exists(MASK_BUCKET, remote_response, token):
            raise RuntimeError("canonical invocation already has a terminal response")
        invocation_dir, checkpoint_size, checkpoint_hash = stage_invocation(
            invocation_id,
            dispatch_digest,
            token,
        )
        ensure_checkpoint(token, checkpoint_size, checkpoint_hash)
        worker_return_code = run_worker(invocation_id)
        return persist_results(
            invocation_id,
            invocation_dir,
            worker_return_code,
        )
    finally:
        if invocation_dir is not None and invocation_dir.is_dir():
            shutil.rmtree(invocation_dir)
        _execution_lock.release()


class Handler(BaseHTTPRequestHandler):
    server_version = "WeEditProSAM31/1"
    sys_version = ""

    def log_message(self, format: str, *args: Any) -> None:
        del format, args

    def send_json(self, status: int, value: Any) -> None:
        encoded = stable_json_bytes(value)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_json(HTTPStatus.NOT_FOUND, {"status": "not_found"})
            return
        self.send_json(HTTPStatus.OK, {"status": "ready"})

    def do_POST(self) -> None:
        if self.path != "/predict":
            self.send_json(HTTPStatus.NOT_FOUND, {"status": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "-1"))
            if length < 2 or length > MAXIMUM_HTTP_BODY_BYTES:
                raise ValueError("request byte length is invalid")
            if self.headers.get_content_type() != "application/json":
                raise ValueError("request content type is invalid")
            value = json.loads(self.rfile.read(length))
            request_kind, invocation_id, dispatch_digest = parse_vertex_request(value)
            if request_kind == "readiness":
                result = readiness_result(invocation_id)
            else:
                if dispatch_digest is None:
                    raise ValueError("dispatch admission digest is absent")
                result = execute_invocation(invocation_id, dispatch_digest)
            self.send_json(HTTPStatus.OK, {"predictions": [result]})
        except ValueError:
            self.send_json(
                HTTPStatus.BAD_REQUEST,
                {"error": {"code": "closed_request_rejected"}},
            )
        except Exception:
            self.send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                {"error": {"code": "private_execution_failed_closed"}},
            )


def main() -> int:
    global _checkpoint_ready, _checkpoint_download_performed_at_startup
    if os.environ.get("WEEDITPRO_SAM31_RUNTIME_MODE") != (
        "vertex_prediction_endpoint_v1"
    ):
        raise RuntimeError("Vertex prediction server mode is not admitted")
    port_text = os.environ.get("AIP_HTTP_PORT", "8080")
    if not port_text.isascii() or not port_text.isdecimal():
        raise RuntimeError("Vertex HTTP port is invalid")
    port = int(port_text)
    if port < 1024 or port > 65535:
        raise RuntimeError("Vertex HTTP port is outside the unprivileged range")
    for directory in (MODEL_ROOT, INVOCATION_ROOT):
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.chmod(directory, 0o700)
    if not Path("/dev/nvidia0").exists() or not Path("/dev/nvidiactl").exists():
        raise RuntimeError("Vertex prediction startup cannot observe NVIDIA devices")
    _checkpoint_download_performed_at_startup = ensure_checkpoint(
        metadata_access_token(),
        EXACT_CHECKPOINT_BYTE_LENGTH,
        EXACT_CHECKPOINT_SHA256,
    )
    _checkpoint_ready = True
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    server.daemon_threads = True
    server.serve_forever(poll_interval=0.5)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
