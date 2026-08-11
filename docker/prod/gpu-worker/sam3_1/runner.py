#!/usr/bin/env python3
"""Fixed, one-shot SAM 3.1 Object Multiplex CUDA runner.

This file is source-complete but not release-admissible until the private gated
checkpoint, patched source archive, dependency closure, immutable image, A100
and L4 qualifications, and server-owned dispatch/cost repositories are frozen.
It accepts only a server-created invocation identity, rereads that invocation's
closed task from private storage, and writes one create-only private response.
It never accepts a request, path, URL, command, model, or route on stdin.
"""

from __future__ import annotations

import contextlib
import concurrent.futures
import ctypes
from collections import deque
import hashlib
import importlib.metadata
import io
import json
import math
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import threading
import time
from typing import Any


REQUEST_VERSION = "canonical-sam3_1-gpu-runtime-request-v1"
RESPONSE_VERSION = "canonical-sam3_1-gpu-runtime-response-v1"
TASK_VERSION = "canonical-sam3_1-gpu-task-record-v1"
FIXED_TASK_CONTRACT_VERSION = "canonical-sam3_1-gpu-fixed-task-contract-v1"
OPERATION_ID = "tool.sam3_1.segment_and_track_subject.v1"
SOURCE_REVISION = "96914d2425f90a64f45ca977c2b5165418099543"
SOURCE_ARCHIVE_SHA256 = (
    "5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a"
)
SOURCE_ARCHIVE_BYTE_LENGTH = 73_605_120
GPU_DECODE_PATCH_SHA256 = (
    "daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca"
)
CHECKPOINT_REVISION = "daa63191845a41281374e725f4c9e51c7a824460"
CHECKPOINT_FILE_NAME = "sam3.1_multiplex.pt"
REAL_ROPE_CACHE_DERIVATION_POLICY = (
    "sam3_1_real_rope_cache_from_complex_buffer_v1"
)
DETECTOR_ROPE_CACHE_BASE = re.compile(
    r"^(?:sam3_model|detector)\.backbone\.vision_backbone\.trunk\."
    r"blocks\.(?P<block>[0-9]+)\.attn\.freqs_cis$"
)
EXPECTED_DETECTOR_ROPE_BLOCKS = tuple(range(32))

LEGACY_MOUNT_CHECKPOINT_PATH = Path(
    "/mnt/reeditpro/model-artifacts/sam3_1/sam3.1_multiplex.pt"
)
VERTEX_A100_CHECKPOINT_PATH = Path(
    "/gcs/reeditpro-production-reeditpro-model-artifacts/private/"
    "model-artifacts/sam3_1/checkpoint/"
    "daa63191845a41281374e725f4c9e51c7a824460/"
    "sam31-weeditpro-official-ingest-20260806-v12-bb0aa9fdb01770a4/"
    "sam3.1_multiplex.pt"
)
CHECKPOINT_PATH = LEGACY_MOUNT_CHECKPOINT_PATH
ARTIFACT_BUILD_BINDING_PATH = Path(
    "/opt/reeditpro/sam3_1/private-artifact-build-binding.json"
)
COMPATIBILITY_RECEIPT_PATH = Path(
    "/opt/reeditpro/sam3_1/source-checkpoint-compatibility-receipt.json"
)
LEGACY_MOUNT_PRIVATE_INVOCATION_PARENT = Path(
    "/mnt/reeditpro/private/canonical-professional-gpu/"
    "sam3_1/v1/invocations"
)
VERTEX_A100_PRIVATE_INVOCATION_PARENT = Path(
    "/gcs/reeditpro-production-reeditpro-masks/"
    "private/canonical-professional-gpu/sam3_1/v1/invocations"
)
PRIVATE_INVOCATION_PARENT = LEGACY_MOUNT_PRIVATE_INVOCATION_PARENT
SOURCE_PROXY_PATH = Path("/nonexistent/sam3_1-mask-proxy.mp4")
PRIVATE_OUTPUT_ROOT = Path("/nonexistent/sam3_1-mask-sequence")
MANIFEST_PATH = PRIVATE_OUTPUT_ROOT / "manifest.json"
RESPONSE_PATH = Path("/nonexistent/response.json")

EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
MAXIMUM_TASK_BYTES = 512 * 1024
MAXIMUM_RESPONSE_BYTES = 64 * 1024
MAXIMUM_SOURCE_BYTES = 2 * 1024 * 1024 * 1024
MAXIMUM_CHECKPOINT_BYTES = 8 * 1024 * 1024 * 1024
MAXIMUM_FRAMES = 240
MAXIMUM_OBJECTS = 16
OUTPUT_PERSISTENCE_WORKERS = 8
MAXIMUM_PENDING_MASK_PERSISTENCE_TASKS = 16
MAXIMUM_ASYNC_FRAME_LOAD_WAIT_SECONDS = 300
A100_GPU_MEMORY_PROFILE = "a100_full_gpu_state_v1"
L4_GPU_MEMORY_PROFILE = (
    "l4_gpu_only_trimmed_past_non_conditioning_memory_v1"
)
EXPECTED_TORCH_VERSION = "2.10.0+cu128"
EXPECTED_TORCHVISION_VERSION = "0.25.0+cu128"
EXPECTED_TORCHCODEC_VERSION = "0.10.0+cu128"
EXPECTED_EINOPS_VERSION = "0.8.2"
EXPECTED_CUDA_VERSION = "12.8"
CUDA_FORWARD_COMPAT_PACKAGE_SHA256 = (
    "e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893"
)
CUDA_FORWARD_COMPAT_PATH = "/usr/local/cuda-12.8/compat"
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
FORBIDDEN_TEXT = re.compile(
    r"(?:https?:|file:|data:|blob:|javascript:|\\|/Users/|/Volumes/|/tmp/|"
    r"x-goog-|api[_-]?key|password|credential|secret|access[_-]?token|"
    r"refresh[_-]?token|\bsk-[A-Za-z0-9_-]+)",
    re.IGNORECASE,
)
GPU_DECODE_BACKEND_OBSERVATIONS: list[str] = []


def verify_ffmpeg_nvdec_runtime() -> None:
    ffmpeg = "/opt/weeditpro/ffmpeg/bin/ffmpeg"
    version = subprocess.run(
        [ffmpeg, "-hide_banner", "-version"],
        check=True,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=15,
    ).stdout
    decoders = subprocess.run(
        [ffmpeg, "-hide_banner", "-decoders"],
        check=True,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=15,
    ).stdout
    if (
        "ffmpeg version 8.0.3" not in version
        or "--enable-gpl" in version
        or "--enable-nonfree" in version
        or "--enable-libnpp" in version
        or not re.search(r"\bh264_cuvid\b", decoders)
        or not re.search(r"\bhevc_cuvid\b", decoders)
    ):
        raise RuntimeError("runtime FFmpeg NVDEC closure changed")


def install_torchcodec_gpu_decode_guard() -> None:
    from sam3.model import io_utils
    from torchcodec import _core as core

    decoder_type = io_utils.TorchCodecDecoder
    original_getitem = decoder_type.__getitem__
    if getattr(original_getitem, "_weeditpro_gpu_decode_guard", False):
        raise RuntimeError("TorchCodec GPU decode guard was installed twice")

    def guarded_getitem(decoder: Any, key: int) -> Any:
        frame = original_getitem(decoder, key)
        details = core._get_backend_details(decoder._decoder)
        if (
            not isinstance(details, str)
            or "status unknown" in details
            or "CPU fallback" in details
            or frame.device.type != "cuda"
        ):
            raise RuntimeError("TorchCodec CUDA/NVDEC decode was not verified")
        GPU_DECODE_BACKEND_OBSERVATIONS.append(details)
        return frame

    guarded_getitem._weeditpro_gpu_decode_guard = True
    decoder_type.__getitem__ = guarded_getitem


def install_sam31_multiplex_session_compatibility_guard(predictor: Any) -> None:
    """Require the complete GPU-only session API on the installed model.

    The separately hashed source patch forwards every base-predictor session
    option through both multiplex overrides. Refuse an unpatched or open-ended
    signature here so no compatibility shim can silently discard CUDA decode
    controls or state-offload policy.
    """
    import inspect

    model = getattr(predictor, "model", None)
    original_init_state = getattr(model, "init_state", None)
    if not callable(original_init_state):
        raise RuntimeError("SAM 3.1 multiplex init_state is unavailable")
    parameters = inspect.signature(original_init_state).parameters
    required_parameters = {
        "resource_path",
        "offload_video_to_cpu",
        "offload_state_to_cpu",
        "async_loading_frames",
        "use_torchcodec",
        "use_cv2",
        "input_is_mp4",
        "gpu_acceleration",
        "gpu_device",
    }
    if not required_parameters.issubset(parameters):
        raise RuntimeError("SAM 3.1 multiplex init_state signature changed")
    if any(
        parameter.kind is inspect.Parameter.VAR_KEYWORD
        for parameter in parameters.values()
    ):
        raise RuntimeError("SAM 3.1 multiplex init_state became open-ended")

FIXED_TASK_CONTRACT = {
    "schemaVersion": FIXED_TASK_CONTRACT_VERSION,
    "operationId": OPERATION_ID,
    "invocationEnvironmentName": "REEDITPRO_GPU_INVOCATION_ID",
    "acceleratorEnvironmentName": "WEEDITPRO_GPU_ACCELERATOR_CLASS",
    "taskFileName": "task.json",
    "responseFileName": "response.json",
    "taskRecordVersion": TASK_VERSION,
    "runtimeRequestVersion": REQUEST_VERSION,
    "runtimeResponseVersion": RESPONSE_VERSION,
    "privateInputStagingEvidenceVersion": (
        "canonical-sam3_1-gpu-private-input-staging-evidence-v1"
    ),
    "byteFreeCloudEnvelope": True,
    "privateCreateOnlyTaskAndResultObjects": True,
    "runtimeDownloadAllowed": False,
    "cpuOnlySubstantiveExecutionAllowed": False,
}

stage = "request_validation"


def stable_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def observed_canonical_json_bytes(value: Any) -> bytes:
    """Preserve the canonical JavaScript owner's observed key order.

    Qualification and image-build records are serialized by the canonical
    JavaScript owner after its locale-based recursive ordering. The capsule
    builder verifies that exact wire order before copying the records into the
    immutable image. Re-sorting those keys with Python's code-point comparator
    would compute a different digest for otherwise identical v2/v3 records.
    """
    return json.dumps(
        value,
        sort_keys=False,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


FIXED_TASK_CONTRACT_HASH = sha256_bytes(
    stable_json_bytes(FIXED_TASK_CONTRACT)
)


def read_bounded_regular_file(
    path: Path,
    maximum_bytes: int,
    *,
    retain_bytes: bool = False,
) -> tuple[int, str, bytes | None]:
    if path.is_symlink():
        raise ValueError("private artifact symlinks are forbidden")
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags)
    digest = hashlib.sha256()
    observed = 0
    retained: list[bytes] | None = [] if retain_bytes else None
    try:
        initial = os.fstat(descriptor)
        if (
            not stat.S_ISREG(initial.st_mode)
            or initial.st_size <= 0
            or initial.st_size > maximum_bytes
        ):
            raise ValueError("private artifact size or type is invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum_bytes:
                raise ValueError("private artifact exceeded its byte bound")
            digest.update(chunk)
            if retained is not None:
                retained.append(chunk)
        final = os.fstat(descriptor)
        if (
            observed != initial.st_size
            or final.st_dev != initial.st_dev
            or final.st_ino != initial.st_ino
            or final.st_size != initial.st_size
            or final.st_mtime_ns != initial.st_mtime_ns
        ):
            raise ValueError("private artifact changed during reread")
        return (
            observed,
            digest.hexdigest(),
            b"".join(retained) if retained is not None else None,
        )
    finally:
        os.close(descriptor)


def file_sha256(path: Path, maximum_bytes: int) -> tuple[int, str]:
    byte_length, digest, _contents = read_bounded_regular_file(
        path,
        maximum_bytes,
    )
    return byte_length, digest


def exact_keys(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value.keys()) != keys:
        raise ValueError(f"{label} shape is invalid")
    return value


def exact_id(value: Any, label: str) -> str:
    if (
        not isinstance(value, str)
        or SAFE_ID.fullmatch(value) is None
        or ".." in value
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_raw_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or RAW_SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def exact_prefixed_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or PREFIXED_SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def exact_int(value: Any, minimum: int, maximum: int, label: str) -> int:
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < minimum
        or value > maximum
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_ref(value: Any, label: str) -> dict[str, Any]:
    result = exact_keys(value, {"id", "version", "contentHash"}, label)
    exact_id(result["id"], f"{label} id")
    exact_int(result["version"], 1, 2**31 - 1, f"{label} version")
    exact_prefixed_sha(result["contentHash"], f"{label} content hash")
    return result


def configure_invocation_paths(invocation_id: str) -> Path:
    global SOURCE_PROXY_PATH, PRIVATE_OUTPUT_ROOT, MANIFEST_PATH, RESPONSE_PATH
    exact_id(invocation_id, "GPU invocation identity")
    invocation_root = PRIVATE_INVOCATION_PARENT / invocation_id
    task_path = invocation_root / "task.json"
    SOURCE_PROXY_PATH = invocation_root / "mask-proxy.mp4"
    PRIVATE_OUTPUT_ROOT = invocation_root / "sam3_1-mask-sequence"
    MANIFEST_PATH = PRIVATE_OUTPUT_ROOT / "manifest.json"
    RESPONSE_PATH = invocation_root / "response.json"
    for root, label in (
        (PRIVATE_INVOCATION_PARENT, "private invocation parent"),
        (invocation_root, "private invocation root"),
    ):
        if root.is_symlink() or not root.is_dir():
            raise ValueError(f"{label} is unavailable or unsafe")
    return task_path


def configure_execution_mounts(accelerator_class: str) -> None:
    """Select only the fixed platform-owned private artifact mount.

    Vertex AI Custom Jobs expose authorized Cloud Storage buckets through the
    platform Cloud Storage FUSE root at /gcs. The separately qualified Cloud
    Run L4 lane retains its preconfigured /mnt/reeditpro volume. No caller or
    environment value may select a bucket, object, checkpoint, or path.
    """
    global CHECKPOINT_PATH, PRIVATE_INVOCATION_PARENT
    if accelerator_class == "nvidia_a100_80gb":
        CHECKPOINT_PATH = VERTEX_A100_CHECKPOINT_PATH
        PRIVATE_INVOCATION_PARENT = VERTEX_A100_PRIVATE_INVOCATION_PARENT
    elif accelerator_class == "nvidia_l4":
        CHECKPOINT_PATH = LEGACY_MOUNT_CHECKPOINT_PATH
        PRIVATE_INVOCATION_PARENT = LEGACY_MOUNT_PRIVATE_INVOCATION_PARENT
    else:
        raise ValueError("GPU execution mount route is invalid")


def validate_task(value: Any, invocation_id: str) -> dict[str, Any]:
    task = exact_keys(
        value,
        {
            "schemaVersion",
            "source",
            "evidenceClass",
            "taskId",
            "invocationId",
            "taskContextRef",
            "fixedTaskContractRef",
            "dispatchAdmissionRef",
            "admissionConsumptionRef",
            "executionEnvelopeRef",
            "runtimeReleaseRef",
            "specializedRuntimeReleaseRef",
            "primaryRateAuthorityRef",
            "fallbackRateAuthorityRef",
            "privateTaskInputTransportRef",
            "privateTaskOutputTransportRef",
            "privateInputStagingEvidenceRef",
            "privateInputStagingEvidence",
            "runtimeRequestRef",
            "runtimeRequestContentSha256",
            "runtimeRequest",
            "privateWorkerMustRereadThisExactTaskBeforeAnySourceOrModelRead",
            "responseMustBeCreateOnlyAndServerRereadBeforeAdmission",
            "callerPathUrlBytesCommandModelRoutePriceOrEnvironmentIncluded",
            "cloudJobCreated",
            "customerCreditsMutated",
            "qaApproved",
            "publicDeliveryAuthorized",
            "productionAuthorityGranted",
            "preparedAt",
            "taskRecordHash",
        },
        "fixed SAM 3.1 task",
    )
    if (
        task["schemaVersion"] != TASK_VERSION
        or task["source"] != "canonical_server_sam3_1_gpu_task_owner"
        or task["evidenceClass"] != "canonical_private_reread"
        or task["taskId"] != f"sam31-task:{invocation_id}"
        or task["invocationId"] != invocation_id
        or task[
            "privateWorkerMustRereadThisExactTaskBeforeAnySourceOrModelRead"
        ] is not True
        or task[
            "responseMustBeCreateOnlyAndServerRereadBeforeAdmission"
        ] is not True
        or task[
            "callerPathUrlBytesCommandModelRoutePriceOrEnvironmentIncluded"
        ] is not False
        or task["cloudJobCreated"] is not False
        or task["customerCreditsMutated"] is not False
        or task["qaApproved"] is not False
        or task["publicDeliveryAuthorized"] is not False
        or task["productionAuthorityGranted"] is not False
        or not isinstance(task["preparedAt"], str)
        or FORBIDDEN_TEXT.search(task["preparedAt"]) is not None
    ):
        raise ValueError("fixed SAM 3.1 task authority is invalid")
    for key in (
        "taskContextRef",
        "dispatchAdmissionRef",
        "admissionConsumptionRef",
        "executionEnvelopeRef",
        "runtimeReleaseRef",
        "specializedRuntimeReleaseRef",
        "primaryRateAuthorityRef",
        "fallbackRateAuthorityRef",
        "privateTaskInputTransportRef",
        "privateTaskOutputTransportRef",
        "privateInputStagingEvidenceRef",
        "runtimeRequestRef",
    ):
        exact_ref(task[key], f"task {key}")
    fixed_contract_ref = exact_ref(
        task["fixedTaskContractRef"], "fixed task contract"
    )
    if fixed_contract_ref != {
        "id": FIXED_TASK_CONTRACT_VERSION,
        "version": 1,
        "contentHash": f"sha256:{FIXED_TASK_CONTRACT_HASH}",
    }:
        raise ValueError("fixed SAM 3.1 task contract changed")
    if task["executionEnvelopeRef"]["id"] != invocation_id:
        raise ValueError("fixed SAM 3.1 task invocation lineage changed")
    task_record_hash = exact_raw_sha(
        task["taskRecordHash"], "task record hash"
    )
    task_payload = dict(task)
    task_payload.pop("taskRecordHash")
    if sha256_bytes(stable_json_bytes(task_payload)) != task_record_hash:
        raise ValueError("fixed SAM 3.1 task record hash changed")
    request = validate_request(task["runtimeRequest"])
    staging = validate_private_input_staging_evidence(
        task["privateInputStagingEvidence"],
        invocation_id,
        task,
        request,
    )
    if task["privateInputStagingEvidenceRef"] != {
        "id": staging["stagingId"],
        "version": 1,
        "contentHash": f"sha256:{staging['evidenceHash']}",
    }:
        raise ValueError("private input staging evidence ref changed")
    request_hash = exact_raw_sha(
        task["runtimeRequestContentSha256"], "runtime request content hash"
    )
    if (
        sha256_bytes(stable_json_bytes(request)) != request_hash
        or task["runtimeRequestRef"] != {
            "id": f"sam31-runtime-request:{invocation_id}",
            "version": 1,
            "contentHash": f"sha256:{request_hash}",
        }
        or task["dispatchAdmissionRef"] != request["dispatchAdmissionRef"]
    ):
        raise ValueError("fixed SAM 3.1 runtime request lineage changed")
    return task


def validate_private_input_staging_evidence(
    value: Any,
    invocation_id: str,
    task: dict[str, Any],
    request: dict[str, Any],
) -> dict[str, Any]:
    evidence = exact_keys(
        value,
        {
            "schemaVersion",
            "source",
            "evidenceClass",
            "stagingId",
            "invocationId",
            "scope",
            "dispatchAdmissionRef",
            "executionEnvelopeRef",
            "sourceBindingRef",
            "finalizedSourceArtifactRef",
            "gpuPreparedMaskProxyArtifactRef",
            "exactSourceReadEvidenceRef",
            "sourceFrameRangeMappingRef",
            "proxyPixelGeometryQaRef",
            "privateTaskInputTransportRef",
            "privateInvocationObjectRef",
            "contentType",
            "byteLength",
            "sha256",
            "width",
            "height",
            "decodedFrameCount",
            "selectedStartFrameInclusive",
            "selectedEndFrameInclusive",
            "storageGeneration",
            "storageEtagSha256",
            "sourceArtifactOpenedThroughCanonicalReadPort",
            "exactSourceStreamByteLengthAndSha256Verified",
            "targetCreatedWithIfGenerationMatchZero",
            "exactCreatedGenerationMetadataReread",
            "exactCreatedGenerationBytesRereadAndHashed",
            "sourceAndTargetBytesIdentical",
            "taskAndSourceShareExactInvocationPrefix",
            "callerPathUrlBucketObjectGenerationOrBytesAccepted",
            "signedUrlOrPublicObjectUsed",
            "sourceOrTargetMutationAllowed",
            "runtimeDownloadAllowed",
            "customerCreditsMutated",
            "qaApproved",
            "publicDeliveryAuthorized",
            "productionAuthorityGranted",
            "stagedAt",
            "evidenceHash",
        },
        "private input staging evidence",
    )
    if (
        evidence["schemaVersion"]
        != "canonical-sam3_1-gpu-private-input-staging-evidence-v1"
        or evidence["source"]
        != "canonical_server_sam3_1_private_input_staging_owner"
        or evidence["evidenceClass"] != "canonical_private_reread"
        or evidence["stagingId"] != f"sam31-input-staging:{invocation_id}"
        or evidence["invocationId"] != invocation_id
        or evidence["contentType"] != "video/mp4"
        or not isinstance(evidence["stagedAt"], str)
        or FORBIDDEN_TEXT.search(evidence["stagedAt"]) is not None
    ):
        raise ValueError("private input staging authority is invalid")
    expected_true = (
        "sourceArtifactOpenedThroughCanonicalReadPort",
        "exactSourceStreamByteLengthAndSha256Verified",
        "targetCreatedWithIfGenerationMatchZero",
        "exactCreatedGenerationMetadataReread",
        "exactCreatedGenerationBytesRereadAndHashed",
        "sourceAndTargetBytesIdentical",
        "taskAndSourceShareExactInvocationPrefix",
    )
    expected_false = (
        "callerPathUrlBucketObjectGenerationOrBytesAccepted",
        "signedUrlOrPublicObjectUsed",
        "sourceOrTargetMutationAllowed",
        "runtimeDownloadAllowed",
        "customerCreditsMutated",
        "qaApproved",
        "publicDeliveryAuthorized",
        "productionAuthorityGranted",
    )
    if any(evidence[key] is not True for key in expected_true) or any(
        evidence[key] is not False for key in expected_false
    ):
        raise ValueError("private input staging boundary is invalid")
    for key in (
        "dispatchAdmissionRef",
        "executionEnvelopeRef",
        "sourceBindingRef",
        "finalizedSourceArtifactRef",
        "gpuPreparedMaskProxyArtifactRef",
        "exactSourceReadEvidenceRef",
        "sourceFrameRangeMappingRef",
        "proxyPixelGeometryQaRef",
        "privateTaskInputTransportRef",
        "privateInvocationObjectRef",
    ):
        exact_ref(evidence[key], f"staging {key}")
    evidence_hash = exact_raw_sha(
        evidence["evidenceHash"], "staging evidence hash"
    )
    payload = dict(evidence)
    payload.pop("evidenceHash")
    if sha256_bytes(stable_json_bytes(payload)) != evidence_hash:
        raise ValueError("private input staging evidence hash changed")
    scope = exact_keys(
        evidence["scope"],
        {
            "ownerUserId",
            "workspaceId",
            "projectId",
            "editSessionId",
            "approvedSnapshotRef",
            "approvedWorkItemRef",
            "workerLeaseRef",
            "executionAttemptRef",
        },
        "staging scope",
    )
    for key in ("ownerUserId", "workspaceId", "projectId", "editSessionId"):
        exact_id(scope[key], f"staging scope {key}")
    for key in (
        "approvedSnapshotRef",
        "approvedWorkItemRef",
        "workerLeaseRef",
        "executionAttemptRef",
    ):
        exact_ref(scope[key], f"staging scope {key}")
    source = request["sourceMedia"]
    request_scope = request["scope"]
    if (
        evidence["dispatchAdmissionRef"] != task["dispatchAdmissionRef"]
        or evidence["executionEnvelopeRef"] != task["executionEnvelopeRef"]
        or evidence["sourceBindingRef"] != request_scope["sourceBindingRef"]
        or evidence["finalizedSourceArtifactRef"]
        != source["finalizedSourceArtifactRef"]
        or evidence["gpuPreparedMaskProxyArtifactRef"]
        != source["gpuPreparedMaskProxyArtifactRef"]
        or evidence["exactSourceReadEvidenceRef"]
        != source["exactSourceReadEvidenceRef"]
        or evidence["sourceFrameRangeMappingRef"]
        != source["sourceFrameRangeMappingRef"]
        or evidence["proxyPixelGeometryQaRef"]
        != source["proxyPixelGeometryQaRef"]
        or evidence["privateTaskInputTransportRef"]
        != task["privateTaskInputTransportRef"]
        or scope["ownerUserId"] != request_scope["ownerUserId"]
        or scope["workspaceId"] != request_scope["workspaceId"]
        or scope["projectId"] != request_scope["projectId"]
        or scope["editSessionId"] != request_scope["editSessionId"]
        or scope["approvedSnapshotRef"]["id"]
        != request_scope["approvedPlanSnapshotId"]
        or scope["approvedSnapshotRef"]["contentHash"]
        != f"sha256:{request_scope['approvedPlanSnapshotHash']}"
        or scope["approvedWorkItemRef"]
        != request_scope["approvedWorkItemRef"]
        or scope["workerLeaseRef"] != request_scope["workerLeaseRef"]
        or scope["executionAttemptRef"]
        != request_scope["executionAttemptRef"]
    ):
        raise ValueError("private input staging lineage changed")
    exact_int(evidence["byteLength"], 1, MAXIMUM_SOURCE_BYTES, "staged bytes")
    exact_raw_sha(evidence["sha256"], "staged sha256")
    exact_int(evidence["width"], 1, 16_384, "staged width")
    exact_int(evidence["height"], 1, 16_384, "staged height")
    exact_int(evidence["decodedFrameCount"], 1, MAXIMUM_FRAMES, "staged frames")
    exact_int(
        evidence["selectedStartFrameInclusive"],
        0,
        MAXIMUM_FRAMES - 1,
        "staged first frame",
    )
    exact_int(
        evidence["selectedEndFrameInclusive"],
        0,
        MAXIMUM_FRAMES - 1,
        "staged last frame",
    )
    if (
        not isinstance(evidence["storageGeneration"], str)
        or re.fullmatch(r"[1-9][0-9]{0,30}", evidence["storageGeneration"])
        is None
    ):
        raise ValueError("staged storage generation is invalid")
    exact_raw_sha(evidence["storageEtagSha256"], "staged ETag digest")
    if (
        evidence["byteLength"] != source["byteLength"]
        or evidence["sha256"] != source["sha256"]
        or evidence["width"] != source["width"]
        or evidence["height"] != source["height"]
        or evidence["decodedFrameCount"] != source["decodedFrameCount"]
        or evidence["selectedStartFrameInclusive"]
        != source["selectedStartFrameInclusive"]
        or evidence["selectedEndFrameInclusive"]
        != source["selectedEndFrameInclusive"]
        or evidence["privateInvocationObjectRef"] != {
            "id": f"sam31-mask-proxy:{invocation_id}",
            "version": 1,
            "contentHash": f"sha256:{source['sha256']}",
        }
    ):
        raise ValueError("private staged input differs from runtime source")
    return evidence


def read_task(path: Path, invocation_id: str) -> dict[str, Any]:
    _length, _digest, contents = read_bounded_regular_file(
        path,
        MAXIMUM_TASK_BYTES,
        retain_bytes=True,
    )
    if contents is None:
        raise ValueError("fixed SAM 3.1 task is missing")
    try:
        value = json.loads(contents.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError("fixed SAM 3.1 task JSON is invalid") from error
    return validate_task(value, invocation_id)


def persist_create_only_response(value: dict[str, Any]) -> str:
    encoded = stable_json_bytes(value)
    if not encoded or len(encoded) > MAXIMUM_RESPONSE_BYTES:
        raise RuntimeError("SAM 3.1 response exceeded its fixed byte bound")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(RESPONSE_PATH, flags, 0o600)
    try:
        view = memoryview(encoded)
        while view:
            written = os.write(descriptor, view)
            if written <= 0:
                raise RuntimeError("SAM 3.1 response persistence stopped")
            view = view[written:]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    persisted_length, persisted_hash = file_sha256(
        RESPONSE_PATH,
        MAXIMUM_RESPONSE_BYTES,
    )
    if persisted_length != len(encoded) or persisted_hash != sha256_bytes(encoded):
        raise RuntimeError("SAM 3.1 response exact reread changed")
    return persisted_hash


def validate_request(value: Any) -> dict[str, Any]:
    request = exact_keys(
        value,
        {
            "schemaVersion",
            "operationId",
            "dispatchAdmissionRef",
            "dispatchAdmissionDigestSha256",
            "scope",
            "dispatch",
            "sourceMedia",
            "approvedPrompt",
            "modelArtifacts",
            "settings",
            "byteFreeRequest",
            "callerCodePathUrlCommandOrEnvironmentAccepted",
            "requestBindingSha256",
        },
        "request",
    )
    if (
        request["schemaVersion"] != REQUEST_VERSION
        or request["operationId"] != OPERATION_ID
        or request["byteFreeRequest"] is not True
        or request["callerCodePathUrlCommandOrEnvironmentAccepted"] is not False
    ):
        raise ValueError("request boundary is invalid")
    exact_ref(request["dispatchAdmissionRef"], "dispatch admission")
    exact_raw_sha(
        request["dispatchAdmissionDigestSha256"],
        "dispatch admission digest",
    )
    expected_binding = exact_raw_sha(
        request["requestBindingSha256"], "request binding"
    )
    payload = dict(request)
    payload.pop("requestBindingSha256")
    if sha256_bytes(stable_json_bytes(payload)) != expected_binding:
        raise ValueError("request binding is invalid")
    validate_scope(request["scope"])
    validate_dispatch(request["dispatch"])
    validate_source(request["sourceMedia"])
    validate_prompt(request["approvedPrompt"], request["sourceMedia"])
    validate_model_artifacts(request["modelArtifacts"])
    validate_settings(
        request["settings"], request["dispatch"]["accelerator"]
    )
    return request


def validate_scope(value: Any) -> None:
    scope = exact_keys(
        value,
        {
            "ownerUserId",
            "workspaceId",
            "projectId",
            "editSessionId",
            "editPlanId",
            "editPlanVersionId",
            "approvedPlanSnapshotId",
            "approvedPlanSnapshotHash",
            "outputId",
            "sceneId",
            "approvedWorkItemRef",
            "workerLeaseRef",
            "executionAttemptRef",
            "fundedCreditReservationRef",
            "masterTimingRef",
            "sourceBindingRef",
        },
        "scope",
    )
    for key in (
        "ownerUserId",
        "workspaceId",
        "projectId",
        "editSessionId",
        "editPlanId",
        "editPlanVersionId",
        "approvedPlanSnapshotId",
        "outputId",
        "sceneId",
    ):
        exact_id(scope[key], f"scope {key}")
    exact_raw_sha(scope["approvedPlanSnapshotHash"], "snapshot hash")
    for key in (
        "approvedWorkItemRef",
        "workerLeaseRef",
        "executionAttemptRef",
        "fundedCreditReservationRef",
        "masterTimingRef",
        "sourceBindingRef",
    ):
        exact_ref(scope[key], f"scope {key}")


def validate_dispatch(value: Any) -> None:
    dispatch = exact_keys(
        value,
        {
            "routeRole",
            "gpuProfileId",
            "accelerator",
            "attemptOrdinal",
            "priorAttemptDisposition",
            "priorAttemptDispositionRef",
            "currentPrimaryAndFallbackRateAuthoritiesReread",
            "exactPerToolEstimateApproved",
            "userTriggeredAfterApproval",
            "scaleFromZeroRequired",
            "scaleBackToZeroAfterTerminalAttemptRequired",
            "unknownPriorOutcomeMayRetryOrFallback",
            "cpuOnlyInferenceAllowed",
        },
        "dispatch",
    )
    primary = dispatch["routeRole"] == "a100_80gb_heavy_primary"
    fallback = dispatch["routeRole"] == "l4_heavy_fallback"
    if not primary and not fallback:
        raise ValueError("dispatch route is invalid")
    expected = (
        (
            "quality_a100_80gb_user_triggered_heavy_job_v1",
            "nvidia_a100_80gb",
            1,
        )
        if primary
        else (
            "quality_l4_user_triggered_heavy_fallback_job_v1",
            "nvidia_l4",
            2,
        )
    )
    if (
        dispatch["gpuProfileId"] != expected[0]
        or dispatch["accelerator"] != expected[1]
        or dispatch["attemptOrdinal"] != expected[2]
        or dispatch["currentPrimaryAndFallbackRateAuthoritiesReread"] is not True
        or dispatch["exactPerToolEstimateApproved"] is not True
        or dispatch["userTriggeredAfterApproval"] is not True
        or dispatch["scaleFromZeroRequired"] is not True
        or dispatch["scaleBackToZeroAfterTerminalAttemptRequired"] is not True
        or dispatch["unknownPriorOutcomeMayRetryOrFallback"] is not False
        or dispatch["cpuOnlyInferenceAllowed"] is not False
    ):
        raise ValueError("dispatch policy is invalid")
    if primary:
        if (
            dispatch["priorAttemptDisposition"] != "not_applicable_primary"
            or dispatch["priorAttemptDispositionRef"] is not None
        ):
            raise ValueError("primary attempt lineage is invalid")
    else:
        if dispatch["priorAttemptDisposition"] not in (
            "not_executed_retry_safe",
            "executed_failed_known_terminal",
        ):
            raise ValueError("fallback prior attempt is unsafe")
        exact_ref(
            dispatch["priorAttemptDispositionRef"],
            "fallback prior attempt disposition",
        )


def validate_source(value: Any) -> None:
    source = exact_keys(
        value,
        {
            "mediaForm",
            "finalizedSourceArtifactRef",
            "gpuPreparedMaskProxyArtifactRef",
            "exactSourceReadEvidenceRef",
            "ffprobeOrFrameDirectoryEvidenceRef",
            "sourceFrameRangeMappingRef",
            "proxyPixelGeometryQaRef",
            "byteLength",
            "sha256",
            "width",
            "height",
            "decodedFrameCount",
            "fpsNumerator",
            "fpsDenominator",
            "selectedStartFrameInclusive",
            "selectedEndFrameInclusive",
            "canonicalSourceStartFrameInclusive",
            "canonicalSourceEndFrameInclusive",
            "boundedChunkOverlapAndStitchPlanRef",
            "variableFrameRateAllowed",
            "callerPathOrUrlAccepted",
        },
        "source media",
    )
    if (
        source["mediaForm"] != "private_read_only_mp4"
        or source["variableFrameRateAllowed"] is not False
        or source["callerPathOrUrlAccepted"] is not False
    ):
        raise ValueError("source media policy is invalid")
    for key in (
        "finalizedSourceArtifactRef",
        "gpuPreparedMaskProxyArtifactRef",
        "exactSourceReadEvidenceRef",
        "ffprobeOrFrameDirectoryEvidenceRef",
        "sourceFrameRangeMappingRef",
        "proxyPixelGeometryQaRef",
        "boundedChunkOverlapAndStitchPlanRef",
    ):
        exact_ref(source[key], f"source {key}")
    exact_int(source["byteLength"], 1, MAXIMUM_SOURCE_BYTES, "source bytes")
    exact_raw_sha(source["sha256"], "source sha256")
    exact_int(source["width"], 1, 16_384, "source width")
    exact_int(source["height"], 1, 16_384, "source height")
    frame_count = exact_int(
        source["decodedFrameCount"], 1, MAXIMUM_FRAMES, "source frames"
    )
    exact_int(source["fpsNumerator"], 1, 240_000, "fps numerator")
    exact_int(source["fpsDenominator"], 1, 1_001_000, "fps denominator")
    local_start = exact_int(
        source["selectedStartFrameInclusive"], 0, MAXIMUM_FRAMES - 1,
        "local start frame",
    )
    local_end = exact_int(
        source["selectedEndFrameInclusive"], 0, MAXIMUM_FRAMES - 1,
        "local end frame",
    )
    canonical_start = exact_int(
        source["canonicalSourceStartFrameInclusive"], 0, 10**9,
        "canonical start frame",
    )
    canonical_end = exact_int(
        source["canonicalSourceEndFrameInclusive"], 0, 10**9,
        "canonical end frame",
    )
    if (
        local_start != 0
        or local_end != frame_count - 1
        or canonical_end - canonical_start + 1 != frame_count
    ):
        raise ValueError("source frame mapping is invalid")


def validate_prompt(value: Any, source: dict[str, Any]) -> None:
    prompt = exact_keys(
        value,
        {
            "promptType",
            "approvedSubjectText",
            "promptFrameIndex",
            "compiledIntentRef",
            "promptApprovalRef",
            "sourceFrameLineageRef",
            "rawUserChatIncluded",
            "executableTextIncluded",
        },
        "approved prompt",
    )
    text = prompt["approvedSubjectText"]
    if (
        prompt["promptType"] != "server_compiled_text_subject"
        or not isinstance(text, str)
        or not text.strip()
        or len(text.strip()) > 240
        or FORBIDDEN_TEXT.search(text) is not None
        or any(ord(character) < 32 or ord(character) == 127 for character in text)
        or prompt["promptFrameIndex"] != 0
        or prompt["rawUserChatIncluded"] is not False
        or prompt["executableTextIncluded"] is not False
    ):
        raise ValueError("approved prompt is invalid")
    frame = exact_int(
        prompt["promptFrameIndex"], 0, MAXIMUM_FRAMES - 1, "prompt frame"
    )
    if frame > source["selectedEndFrameInclusive"]:
        raise ValueError("prompt frame is outside the bounded source")
    for key in ("compiledIntentRef", "promptApprovalRef", "sourceFrameLineageRef"):
        exact_ref(prompt[key], f"prompt {key}")


def validate_model_artifacts(value: Any) -> None:
    artifacts = exact_keys(
        value,
        {
            "sourceCandidateRef",
            "privateArtifactIngestReceiptRef",
            "sourceArchiveRef",
            "sourceRevision",
            "sourceArchiveByteLength",
            "sourceArchiveSha256",
            "reeditproGpuDecodePatchSha256",
            "checkpointRef",
            "checkpointRepositoryRevision",
            "checkpointFileName",
            "checkpointByteLength",
            "checkpointSha256",
            "sourceCheckpointCompatibilityQualificationRef",
            "immutableImageReleaseRef",
            "immutableImageDigest",
            "humanTermsAcceptanceAndLegalReviewReread",
            "sourceAndCheckpointMalwareScanReread",
            "runtimeDownloadAllowed",
        },
        "model artifacts",
    )
    candidate = exact_keys(
        artifacts["sourceCandidateRef"],
        {"schemaVersion", "candidateHash"},
        "source candidate",
    )
    if candidate["schemaVersion"] != "canonical-sam3_1-source-runtime-candidate-v4":
        raise ValueError("source candidate version is invalid")
    exact_raw_sha(candidate["candidateHash"], "source candidate hash")
    for key in (
        "privateArtifactIngestReceiptRef",
        "sourceArchiveRef",
        "checkpointRef",
        "immutableImageReleaseRef",
    ):
        exact_ref(artifacts[key], f"model {key}")
    compatibility_ref = exact_keys(
        artifacts["sourceCheckpointCompatibilityQualificationRef"],
        {"id", "version", "schemaVersion", "contentHash"},
        "model source checkpoint qualification ref",
    )
    exact_ref(
        {
            "id": compatibility_ref["id"],
            "version": compatibility_ref["version"],
            "contentHash": compatibility_ref["contentHash"],
        },
        "model source checkpoint qualification ref",
    )
    compatibility_identity = (
        compatibility_ref["version"],
        compatibility_ref["schemaVersion"],
    )
    if (
        artifacts["sourceRevision"] != SOURCE_REVISION
        or artifacts["sourceArchiveByteLength"] != SOURCE_ARCHIVE_BYTE_LENGTH
        or artifacts["sourceArchiveSha256"] != SOURCE_ARCHIVE_SHA256
        or artifacts["sourceArchiveRef"]["contentHash"]
        != f"sha256:{SOURCE_ARCHIVE_SHA256}"
        or artifacts["reeditproGpuDecodePatchSha256"] != GPU_DECODE_PATCH_SHA256
        or artifacts["checkpointRepositoryRevision"] != CHECKPOINT_REVISION
        or artifacts["checkpointFileName"] != CHECKPOINT_FILE_NAME
        or artifacts["checkpointRef"]["contentHash"]
        != f"sha256:{artifacts['checkpointSha256']}"
        or artifacts["immutableImageReleaseRef"]["contentHash"]
        != artifacts["immutableImageDigest"]
        or compatibility_identity not in {
            (
                1,
                "canonical-sam3_1-source-checkpoint-compatibility-qualification-v1",
            ),
            (
                2,
                "canonical-sam3_1-source-checkpoint-compatibility-qualification-v2",
            ),
        }
        or artifacts["humanTermsAcceptanceAndLegalReviewReread"] is not True
        or artifacts["sourceAndCheckpointMalwareScanReread"] is not True
        or artifacts["runtimeDownloadAllowed"] is not False
    ):
        raise ValueError("model artifact identity is invalid")
    exact_int(
        artifacts["checkpointByteLength"], 1, MAXIMUM_CHECKPOINT_BYTES,
        "checkpoint bytes",
    )
    exact_raw_sha(artifacts["checkpointSha256"], "checkpoint sha256")
    exact_prefixed_sha(artifacts["immutableImageDigest"], "image digest")


def validate_settings(value: Any, requested_accelerator: str) -> None:
    settings = exact_keys(
        value,
        {
            "builder",
            "predictorVersion",
            "maximumTrackedObjectsProductCap",
            "multiplexBucketSize",
            "useFlashAttention3",
            "useRealValuedRope",
            "torchCompileEnabled",
            "warmupCompilationEnabled",
            "defaultOutputProbabilityThreshold",
            "asynchronousFrameLoading",
            "videoDecodeBackend",
            "gpuAcceleratedDecode",
            "cpuOpenCvOrPillowDecodeAllowed",
            "strictCheckpointLoadRequired",
            "cudaOutputTensorsRequired",
            "boundedCpuOutputSerializationOnly",
            "offloadVideoToCpu",
            "offloadStateToCpu",
            "gpuMemoryProfileId",
            "propagationDirection",
            "outputFormat",
            "sourceResolutionPreserved",
            "sourceFrameRangePreserved",
            "quantizationAllowed",
        },
        "settings",
    )
    expected = {
        "builder": "build_sam3_multiplex_video_predictor",
        "predictorVersion": "sam3.1",
        "maximumTrackedObjectsProductCap": 16,
        "multiplexBucketSize": 16,
        "useFlashAttention3": False,
        "useRealValuedRope": True,
        "torchCompileEnabled": False,
        "warmupCompilationEnabled": False,
        "defaultOutputProbabilityThreshold": 0.5,
        "asynchronousFrameLoading": True,
        "videoDecodeBackend": "torchcodec_0_10_cuda_nvdec",
        "gpuAcceleratedDecode": True,
        "cpuOpenCvOrPillowDecodeAllowed": False,
        "strictCheckpointLoadRequired": True,
        "cudaOutputTensorsRequired": True,
        "boundedCpuOutputSerializationOnly": True,
        "offloadVideoToCpu": False,
        "offloadStateToCpu": False,
        "gpuMemoryProfileId": (
            A100_GPU_MEMORY_PROFILE
            if requested_accelerator == "nvidia_a100_80gb"
            else L4_GPU_MEMORY_PROFILE
        ),
        "propagationDirection": "forward",
        "outputFormat": "lossless_grayscale_png_mask_sequence_v1",
        "sourceResolutionPreserved": True,
        "sourceFrameRangePreserved": True,
        "quantizationAllowed": False,
    }
    if settings != expected:
        raise ValueError("SAM 3.1 fixed settings changed")


def checkpoint_state_dict(checkpoint: Any) -> dict[str, Any]:
    if isinstance(checkpoint, dict) and isinstance(checkpoint.get("model"), dict):
        checkpoint = checkpoint["model"]
    if not isinstance(checkpoint, dict) or not checkpoint:
        raise RuntimeError("checkpoint state dictionary is invalid")
    return checkpoint


def normalize_checkpoint_key(key: str) -> str:
    if key.startswith("sam3_model."):
        return "detector." + key[len("sam3_model.") :]
    if key.startswith("sam2_predictor."):
        return "tracker." + key[len("sam2_predictor.") :]
    return key


def normalize_checkpoint_keys(checkpoint: Any) -> list[str]:
    state = checkpoint_state_dict(checkpoint)
    normalized: list[str] = []
    for key in state:
        if not isinstance(key, str):
            raise RuntimeError("checkpoint key is not text")
        normalized.append(normalize_checkpoint_key(key))
    if len(normalized) != len(set(normalized)):
        raise RuntimeError("checkpoint key normalization collided")
    return sorted(normalized)


def derive_real_rope_runtime_caches(
    torch: Any, checkpoint: Any
) -> list[str]:
    state = checkpoint_state_dict(checkpoint)
    bases: dict[int, str] = {}
    for key in state:
        if not isinstance(key, str):
            raise RuntimeError("checkpoint key is not text")
        match = DETECTOR_ROPE_CACHE_BASE.fullmatch(key)
        if match is None:
            continue
        block = int(match.group("block"))
        if block in bases:
            raise RuntimeError("checkpoint has duplicate detector RoPE cache block")
        bases[block] = key
    if tuple(sorted(bases)) != EXPECTED_DETECTOR_ROPE_BLOCKS:
        raise RuntimeError("checkpoint detector complex RoPE cache set changed")

    derived_keys: list[str] = []
    for block in EXPECTED_DETECTOR_ROPE_BLOCKS:
        base_key = bases[block]
        base = state[base_key]
        if (
            not torch.is_tensor(base)
            or not torch.is_complex(base)
            or base.device.type != "cpu"
            or base.dtype != torch.complex64
            or base.requires_grad
        ):
            raise RuntimeError("checkpoint detector RoPE cache is not complex")
        real_key = f"{base_key}_real"
        imag_key = f"{base_key}_imag"
        if real_key in state or imag_key in state:
            raise RuntimeError("checkpoint already contains derived real RoPE cache")
        real = base.real.contiguous().clone()
        imag = base.imag.contiguous().clone()
        if (
            real.shape != base.shape
            or imag.shape != base.shape
            or real.device.type != "cpu"
            or imag.device.type != "cpu"
            or real.dtype != torch.float32
            or imag.dtype != torch.float32
            or not torch.equal(real, base.real)
            or not torch.equal(imag, base.imag)
            or not torch.equal(torch.complex(real, imag), base)
        ):
            raise RuntimeError("deterministic real RoPE cache derivation changed")
        state[real_key] = real
        state[imag_key] = imag
        derived_keys.extend(
            [normalize_checkpoint_key(real_key), normalize_checkpoint_key(imag_key)]
        )
    if len(derived_keys) != 64 or len(set(derived_keys)) != 64:
        raise RuntimeError("derived real RoPE cache key set changed")
    return sorted(derived_keys)


def build_predictor_with_strict_rope_cache_derivation(torch: Any) -> Any:
    from sam3.model_builder import build_sam3_multiplex_video_predictor

    unsafe_globals = torch.serialization.get_unsafe_globals_in_checkpoint(
        str(CHECKPOINT_PATH)
    )
    if unsafe_globals:
        raise RuntimeError("checkpoint contains unsafe serialized globals")
    original_load = torch.load
    load_count = 0
    source_keys: list[str] = []
    augmented_keys: list[str] = []
    derived_keys: list[str] = []

    def observed_load(*args: Any, **kwargs: Any) -> Any:
        nonlocal load_count, source_keys, augmented_keys, derived_keys
        load_count += 1
        if (
            load_count != 1
            or not args
            or Path(args[0]) != CHECKPOINT_PATH
            or kwargs.get("weights_only") is not True
            or kwargs.get("map_location") != "cpu"
        ):
            raise RuntimeError("checkpoint load contract changed")
        loaded = original_load(*args, **kwargs)
        source_keys = normalize_checkpoint_keys(loaded)
        derived_keys = derive_real_rope_runtime_caches(torch, loaded)
        augmented_keys = normalize_checkpoint_keys(loaded)
        return loaded

    torch.load = observed_load
    try:
        predictor = build_sam3_multiplex_video_predictor(
            checkpoint_path=str(CHECKPOINT_PATH),
            max_num_objects=MAXIMUM_OBJECTS,
            multiplex_count=MAXIMUM_OBJECTS,
            use_fa3=False,
            use_rope_real=True,
            compile=False,
            warm_up=False,
            default_output_prob_thresh=0.5,
            # Preserve the admitted asynchronous frame-loading contract. The
            # worker explicitly joins and verifies this CUDA/NVDEC loader under
            # a bounded deadline before inference, so session start cannot race
            # the decoder evidence sampler or expose a partial frame store.
            async_loading_frames=True,
            gpu_accelerated_decode=True,
            strict_checkpoint_load=True,
            return_cuda_output_tensors=True,
        )
    finally:
        torch.load = original_load
    model_keys = sorted(predictor.model.state_dict().keys())
    if load_count != 1:
        raise RuntimeError("checkpoint was not loaded exactly once")
    if set(source_keys).intersection(derived_keys):
        raise RuntimeError("derived RoPE cache was present in source checkpoint")
    if sorted(source_keys + derived_keys) != augmented_keys:
        raise RuntimeError("checkpoint augmentation exceeded derived RoPE caches")
    if augmented_keys != model_keys:
        raise RuntimeError("strict checkpoint and model key sets differ")
    return predictor


def configure_gpu_memory_profile(
    predictor: Any,
    requested_accelerator: str,
) -> tuple[str, bool]:
    """Bind the official SAM 3.1 evaluation memory policy to the GPU route.

    L4 keeps frames, model state, accessible temporal memories, inference, and
    outputs on CUDA. It enables only the upstream forward-VOS trim that removes
    heavy non-conditioning outputs after they fall outside the model's exact
    num_maskmem window. A100 retains the upstream full-state policy.
    """
    model = getattr(predictor, "model", None)
    tracker = getattr(model, "tracker", None)
    if tracker is None:
        raise RuntimeError("SAM 3.1 tracker memory policy is unavailable")
    if (
        getattr(tracker, "forward_backbone_per_frame_for_eval", None) is not True
        or getattr(tracker, "offload_output_to_cpu_for_eval", None) is not False
        or getattr(tracker, "trim_past_non_cond_mem_for_eval", None) is not False
        or getattr(tracker, "num_maskmem", None) != 7
        or getattr(tracker, "memory_temporal_stride_for_eval", None) != 1
    ):
        raise RuntimeError("SAM 3.1 upstream GPU memory policy changed")
    if requested_accelerator == "nvidia_a100_80gb":
        return A100_GPU_MEMORY_PROFILE, False
    if requested_accelerator == "nvidia_l4":
        tracker.trim_past_non_cond_mem_for_eval = True
        if tracker.trim_past_non_cond_mem_for_eval is not True:
            raise RuntimeError("SAM 3.1 L4 GPU memory trim was not applied")
        return L4_GPU_MEMORY_PROFILE, True
    raise RuntimeError("SAM 3.1 GPU memory route is invalid")


def read_closed_receipt(
    path: Path,
    expected_ref: dict[str, Any],
) -> dict[str, Any]:
    _byte_length, _digest, contents = read_bounded_regular_file(
        path,
        1024 * 1024,
        retain_bytes=True,
    )
    if contents is None:
        raise ValueError("baked release receipt is missing")
    value = json.loads(contents.decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("source checkpoint qualification receipt is invalid")
    expected_ref = exact_keys(
        expected_ref,
        {"id", "version", "schemaVersion", "contentHash"},
        "expected source checkpoint qualification ref",
    )
    exact_ref(
        {
            "id": expected_ref["id"],
            "version": expected_ref["version"],
            "contentHash": expected_ref["contentHash"],
        },
        "expected source checkpoint qualification ref",
    )
    qualification_hash = exact_raw_sha(
        value.get("qualificationHash"),
        "source checkpoint qualification hash",
    )
    payload = dict(value)
    del payload["qualificationHash"]
    if (
        observed_canonical_json_bytes(value) != contents
        or sha256_bytes(observed_canonical_json_bytes(payload))
        != qualification_hash
        or expected_ref["contentHash"] != f"sha256:{qualification_hash}"
        or value.get("schemaVersion") != expected_ref["schemaVersion"]
        or value.get("qualificationId") != expected_ref["id"]
        or value.get("qualificationVersion") != expected_ref["version"]
    ):
        raise ValueError("baked release receipt digest changed")

    if value["schemaVersion"] == (
        "canonical-sam3_1-source-checkpoint-compatibility-qualification-v1"
    ):
        exact_keys(value, {
            "schemaVersion",
            "source",
            "evidenceClass",
            "status",
            "qualificationId",
            "qualificationVersion",
            "operationId",
            "candidateRef",
            "officialArtifactPublicationRef",
            "ingestReceiptRef",
            "termsAcceptanceRef",
            "sourceArchive",
            "checkpoint",
            "controlledObservation",
            "authority",
            "qualifiedAt",
            "qualificationHash",
        }, "source checkpoint qualification receipt")
        authority = exact_keys(value["authority"], {
            "qualificationEvidenceOnly",
            "securityLicenseAndCompatibilityQualified",
            "privateImageBuildReviewEligible",
            "imageBuildStarted",
            "runtimeDispatchAuthorized",
            "customerCreditsMutated",
            "customerBillingAuthorityGranted",
            "qaApproved",
            "publicDeliveryAuthorized",
            "productionReady",
        }, "source checkpoint qualification authority")
        if (
            value["source"]
            != "canonical_sam3_1_source_checkpoint_qualification_owner"
            or value["evidenceClass"] != "canonical_private_reread"
            or value["status"] != "qualified_for_private_image_build"
            or value["operationId"] != OPERATION_ID
            or authority != {
            "qualificationEvidenceOnly": True,
            "securityLicenseAndCompatibilityQualified": True,
            "privateImageBuildReviewEligible": True,
            "imageBuildStarted": False,
            "runtimeDispatchAuthorized": False,
            "customerCreditsMutated": False,
            "customerBillingAuthorityGranted": False,
            "qaApproved": False,
            "publicDeliveryAuthorized": False,
            "productionReady": False,
            }
        ):
            raise ValueError("baked release receipt authority changed")
        return value

    if value["schemaVersion"] != (
        "canonical-sam3_1-source-checkpoint-compatibility-qualification-v2"
    ):
        raise ValueError("baked release receipt version is unsupported")
    exact_keys(value, {
        "schemaVersion",
        "source",
        "evidenceClass",
        "status",
        "qualificationId",
        "qualificationVersion",
        "candidate",
        "ingestReceipt",
        "workerRequest",
        "workerResult",
        "admission",
        "execution",
        "terminalReconciliation",
        "providerUsage",
        "platformStop",
        "currentAccountRateAuthority",
        "qualificationCostReceipt",
        "securityComplianceClearance",
        "exactEvidenceRefs",
        "qualificationTruth",
        "authority",
        "qualifiedAt",
        "qualificationHash",
    }, "Vertex source checkpoint qualification receipt")
    evidence_refs = exact_keys(value["exactEvidenceRefs"], {
        "workerRequestRef",
        "workerResultRef",
        "admissionRef",
        "executionRef",
        "cloudTerminalObservationRef",
        "providerUsageEvidenceRef",
        "platformStopEvidenceRef",
        "currentAccountRateAuthorityRef",
        "qualificationCostReceiptRef",
        "securityComplianceClearanceRef",
    }, "Vertex qualification evidence refs")
    worker_request_ref = exact_keys(evidence_refs["workerRequestRef"], {
        "id", "version", "schemaVersion", "contentHash",
    }, "Vertex qualification worker request ref")
    worker_result_ref = exact_keys(evidence_refs["workerResultRef"], {
        "id", "version", "schemaVersion", "contentHash",
    }, "Vertex qualification worker result ref")
    for label, evidence_ref in evidence_refs.items():
        if label in {"workerRequestRef", "workerResultRef"}:
            exact_ref({
                "id": evidence_ref["id"],
                "version": evidence_ref["version"],
                "contentHash": evidence_ref["contentHash"],
            }, label)
        else:
            exact_ref(evidence_ref, label)
    qualification_truth = exact_keys(value["qualificationTruth"], {
        "officialSam31SourceAndCheckpointReread",
        "exactVertexRequestResultAdmissionExecutionAndTerminalReread",
        "exactA10080GbExecutionVerified",
        "actualCudaModelInferenceExecuted",
        "completeForwardPropagationExecuted",
        "deterministicRepeatedProbeVerified",
        "strictCheckpointLoadVerified",
        "networkEgressObserved",
        "cpuOnlyModelExecutionObserved",
        "cpuVideoDecodeFallbackObserved",
        "quantizationOrResolutionReductionUsed",
        "automaticRetryUsed",
        "persistentGpuResourceObserved",
        "activeA100GpuInstancesAfterObservation",
        "billingAccountEffectiveRateAndUsageReread",
        "cloudInvoiceReconciliationStillRequired",
        "legacyBatchRequestOrResultCastOrRelabelUsed",
    }, "Vertex qualification truth")
    authority = exact_keys(value["authority"], {
        "sourceCheckpointQualificationGranted",
        "privateImageBuildReviewEligible",
        "imageBuildStarted",
        "productionRuntimeDispatchAuthorized",
        "customerMediaProcessed",
        "customerCreditsMutated",
        "customerBillingAuthorityGranted",
        "qaApproved",
        "publicDeliveryAuthorized",
        "productionReady",
    }, "Vertex source checkpoint qualification authority")
    candidate = value["candidate"]
    if not isinstance(candidate, dict):
        raise ValueError("Vertex source candidate is invalid")
    if (
        value["source"]
        != "canonical_sam3_1_vertex_source_checkpoint_qualification_owner"
        or value["evidenceClass"] != "canonical_private_reread"
        or value["status"] != "qualified_for_private_image_build"
        or candidate.get("operationId") != OPERATION_ID
        or worker_request_ref["id"] != expected_ref["id"]
        or worker_request_ref["version"] != 2
        or worker_request_ref["schemaVersion"]
        != "canonical-sam3_1-source-checkpoint-qualification-worker-request-v2"
        or worker_result_ref["schemaVersion"]
        != "canonical-sam3_1-source-checkpoint-qualification-worker-result-v2"
        or qualification_truth != {
            "officialSam31SourceAndCheckpointReread": True,
            "exactVertexRequestResultAdmissionExecutionAndTerminalReread": True,
            "exactA10080GbExecutionVerified": True,
            "actualCudaModelInferenceExecuted": True,
            "completeForwardPropagationExecuted": True,
            "deterministicRepeatedProbeVerified": True,
            "strictCheckpointLoadVerified": True,
            "networkEgressObserved": False,
            "cpuOnlyModelExecutionObserved": False,
            "cpuVideoDecodeFallbackObserved": False,
            "quantizationOrResolutionReductionUsed": False,
            "automaticRetryUsed": False,
            "persistentGpuResourceObserved": False,
            "activeA100GpuInstancesAfterObservation": 0,
            "billingAccountEffectiveRateAndUsageReread": True,
            "cloudInvoiceReconciliationStillRequired": True,
            "legacyBatchRequestOrResultCastOrRelabelUsed": False,
        }
        or authority != {
            "sourceCheckpointQualificationGranted": True,
            "privateImageBuildReviewEligible": True,
            "imageBuildStarted": False,
            "productionRuntimeDispatchAuthorized": False,
            "customerMediaProcessed": False,
            "customerCreditsMutated": False,
            "customerBillingAuthorityGranted": False,
            "qaApproved": False,
            "publicDeliveryAuthorized": False,
            "productionReady": False,
        }
    ):
        raise ValueError("Vertex source checkpoint qualification changed")
    return value


def read_artifact_build_binding(
    path: Path,
    expected_ingest_receipt_hash: str,
    expected_qualification_ref: dict[str, Any],
) -> dict[str, Any]:
    _byte_length, _digest, contents = read_bounded_regular_file(
        path,
        1024 * 1024,
        retain_bytes=True,
    )
    if contents is None:
        raise ValueError("baked artifact build binding is missing")
    value = json.loads(contents.decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("artifact build binding is invalid")
    expected_qualification_ref = exact_keys(
        expected_qualification_ref,
        {"id", "version", "schemaVersion", "contentHash"},
        "expected source checkpoint qualification ref",
    )
    schema_version = value.get("schemaVersion")
    common_keys = {
            "schemaVersion",
            "source",
            "evidenceClass",
            "status",
            "operationId",
            "candidateRef",
            "ingestReceiptRef",
            "sourceCheckpointQualificationRef",
            "termsAcceptanceRef",
            "sourceArchive",
            "checkpoint",
            "privacyBoundary",
            "authority",
            "bindingHash",
    }
    if schema_version == "canonical-sam3_1-image-build-artifact-binding-v2":
        exact_keys(value, common_keys, "artifact build binding")
    elif schema_version == "canonical-sam3_1-image-build-artifact-binding-v3":
        exact_keys(value, common_keys | {
            "vertexQualificationEvidenceRefs",
            "qualificationTruth",
        }, "Vertex artifact build binding")
    else:
        raise ValueError("artifact build binding version is unsupported")
    binding_hash = exact_raw_sha(value["bindingHash"], "build binding hash")
    payload = dict(value)
    del payload["bindingHash"]
    if (
        observed_canonical_json_bytes(value) != contents
        or sha256_bytes(observed_canonical_json_bytes(payload)) != binding_hash
    ):
        raise ValueError("artifact build binding digest changed")
    ingest_ref = exact_keys(
        value["ingestReceiptRef"],
        {"id", "version", "schemaVersion", "contentHash"},
        "artifact ingest receipt ref",
    )
    exact_ref(
        {
            "id": ingest_ref["id"],
            "version": ingest_ref["version"],
            "contentHash": ingest_ref["contentHash"],
        },
        "artifact ingest receipt ref",
    )
    qualification_ref = exact_keys(
        value["sourceCheckpointQualificationRef"],
        {"id", "version", "schemaVersion", "contentHash"},
        "source checkpoint qualification ref",
    )
    exact_ref(
        {
            "id": qualification_ref["id"],
            "version": qualification_ref["version"],
            "contentHash": qualification_ref["contentHash"],
        },
        "source checkpoint qualification ref",
    )
    if (
        value["evidenceClass"] != "canonical_private_reread"
        or value["status"] != "private_artifacts_admitted"
        or value["operationId"] != OPERATION_ID
        or ingest_ref["schemaVersion"]
        != "canonical-sam3_1-private-artifact-ingest-receipt-v3"
        or ingest_ref["contentHash"]
        != f"sha256:{expected_ingest_receipt_hash}"
        or qualification_ref != expected_qualification_ref
    ):
        raise ValueError("artifact build binding identity changed")
    source_archive = exact_keys(
        value["sourceArchive"],
        {
            "repository",
            "revision",
            "artifactRef",
            "byteLength",
            "sha256",
            "licenseRef",
            "securityReviewRef",
            "malwareScanRef",
        },
        "artifact build source archive binding",
    )
    checkpoint = exact_keys(
        value["checkpoint"],
        {
            "repository",
            "revision",
            "fileName",
            "artifactRef",
            "manifestRef",
            "byteLength",
            "sha256",
            "licenseRef",
            "securityReviewRef",
            "malwareScanRef",
            "checkpointBytesIncludedInImageBuildCapsule",
            "checkpointRereadOnlyAtQualifiedRuntime",
        },
        "artifact build checkpoint binding",
    )
    privacy = exact_keys(
        value["privacyBoundary"],
        {
            "sourceOrCheckpointStorageCoordinateIncluded",
            "bucketObjectGenerationEtagIncluded",
            "checkpointBytesIncluded",
            "providerOrRepositoryTokenIncluded",
            "browserOrCallerDataIncluded",
            "opaqueEvidenceRefsOnly",
        },
        "artifact build privacy boundary",
    )
    authority_keys = {
            "sanitizedBuildBindingOnly",
            "privateArtifactIngestReread",
            "sourceCheckpointQualificationReread",
            "imageBuildAuthorized",
            "imageBuildStarted",
            "runtimeAuthorized",
            "checkpointRedistributionAuthorized",
            "qaApproved",
            "productionReady",
    }
    if schema_version == "canonical-sam3_1-image-build-artifact-binding-v3":
        authority_keys.add("customerCreditsMutated")
    authority = exact_keys(
        value["authority"], authority_keys, "artifact build authority"
    )
    expected_authority = {
        "sanitizedBuildBindingOnly": True,
        "privateArtifactIngestReread": True,
        "sourceCheckpointQualificationReread": True,
        "imageBuildAuthorized": False,
        "imageBuildStarted": False,
        "runtimeAuthorized": False,
        "checkpointRedistributionAuthorized": False,
        "qaApproved": False,
        "productionReady": False,
    }
    if schema_version == "canonical-sam3_1-image-build-artifact-binding-v3":
        expected_authority["customerCreditsMutated"] = False
    if (
        source_archive["repository"]
        != "https://github.com/facebookresearch/sam3.git"
        or source_archive["revision"] != SOURCE_REVISION
        or source_archive["byteLength"] != SOURCE_ARCHIVE_BYTE_LENGTH
        or source_archive["sha256"] != SOURCE_ARCHIVE_SHA256
        or checkpoint["repository"] != "facebook/sam3.1"
        or checkpoint["revision"] != CHECKPOINT_REVISION
        or checkpoint["fileName"] != CHECKPOINT_FILE_NAME
        or checkpoint["checkpointBytesIncludedInImageBuildCapsule"] is not False
        or checkpoint["checkpointRereadOnlyAtQualifiedRuntime"] is not True
        or privacy != {
            "sourceOrCheckpointStorageCoordinateIncluded": False,
            "bucketObjectGenerationEtagIncluded": False,
            "checkpointBytesIncluded": False,
            "providerOrRepositoryTokenIncluded": False,
            "browserOrCallerDataIncluded": False,
            "opaqueEvidenceRefsOnly": True,
        }
        or authority != expected_authority
    ):
        raise ValueError("artifact build privacy or authority boundary changed")
    if schema_version == "canonical-sam3_1-image-build-artifact-binding-v2":
        if (
            value["source"] != "canonical_sam3_1_image_build_artifact_owner"
            or qualification_ref["version"] != 1
            or qualification_ref["schemaVersion"] != (
                "canonical-sam3_1-source-checkpoint-compatibility-qualification-v1"
            )
        ):
            raise ValueError("historical artifact build binding changed")
    else:
        vertex_refs = exact_keys(value["vertexQualificationEvidenceRefs"], {
            "workerRequestRef",
            "workerResultRef",
            "admissionRef",
            "executionRef",
            "terminalReconciliationRef",
            "providerUsageEvidenceRef",
            "platformStopEvidenceRef",
            "currentAccountRateAuthorityRef",
            "qualificationCostReceiptRef",
            "securityComplianceClearanceRef",
        }, "Vertex artifact build evidence refs")
        for label, evidence_ref in vertex_refs.items():
            exact_ref(evidence_ref, label)
        qualification_truth = exact_keys(value["qualificationTruth"], {
            "exactVertexA100ExecutionReread",
            "actualCudaModelInferenceExecuted",
            "completeForwardPropagationExecuted",
            "deterministicRepeatedProbeVerified",
            "strictCheckpointLoadVerified",
            "cpuOnlySubstantiveExecutionObserved",
            "cpuVideoDecodeFallbackObserved",
            "legacyBatchCastOrRelabelUsed",
            "scaleFromZeroVerified",
            "accountEffectivePricingReread",
        }, "Vertex artifact build qualification truth")
        if (
            value["source"]
            != "canonical_sam3_1_vertex_image_build_artifact_owner"
            or qualification_ref["version"] != 2
            or qualification_ref["schemaVersion"] != (
                "canonical-sam3_1-source-checkpoint-compatibility-qualification-v2"
            )
            or vertex_refs["workerRequestRef"]["id"] != qualification_ref["id"]
            or vertex_refs["workerRequestRef"]["version"] != 2
            or qualification_truth != {
                "exactVertexA100ExecutionReread": True,
                "actualCudaModelInferenceExecuted": True,
                "completeForwardPropagationExecuted": True,
                "deterministicRepeatedProbeVerified": True,
                "strictCheckpointLoadVerified": True,
                "cpuOnlySubstantiveExecutionObserved": False,
                "cpuVideoDecodeFallbackObserved": False,
                "legacyBatchCastOrRelabelUsed": False,
                "scaleFromZeroVerified": True,
                "accountEffectivePricingReread": True,
            }
        ):
            raise ValueError("Vertex artifact build qualification changed")
    prohibited_keys = {
        "coordinate",
        "bucketName",
        "objectName",
        "generation",
        "etag",
        "accessToken",
        "refreshToken",
        "providerToken",
    }

    def reject_prohibited_keys(item: Any) -> None:
        if isinstance(item, dict):
            if prohibited_keys.intersection(item):
                raise ValueError("artifact build binding exposes private coordinates")
            for child in item.values():
                reject_prohibited_keys(child)
        elif isinstance(item, list):
            for child in item:
                reject_prohibited_keys(child)

    reject_prohibited_keys(value)
    return value


class _NvmlUtilization(ctypes.Structure):
    _fields_ = [
        ("gpu", ctypes.c_uint),
        ("memory", ctypes.c_uint),
    ]


class FixedNvmlBinding:
    """Minimal fixed NVML ABI used by the immutable GPU worker.

    The production image deliberately carries no runtime package installer.
    NVIDIA's container runtime supplies ``libnvidia-ml.so.1`` with the host
    driver.  Binding only the six fixed symbols used by this worker avoids an
    undeclared Python-package dependency while keeping every NVML call
    fail-closed and attributable to the loaded host driver.
    """

    def __init__(self) -> None:
        self._library = ctypes.CDLL(
            "libnvidia-ml.so.1",
            mode=getattr(ctypes, "RTLD_LOCAL", 0),
        )
        self._init = self._symbol("nvmlInit_v2")
        self._init.argtypes = []
        self._init.restype = ctypes.c_int
        self._shutdown = self._symbol("nvmlShutdown")
        self._shutdown.argtypes = []
        self._shutdown.restype = ctypes.c_int
        self._driver_version = self._symbol("nvmlSystemGetDriverVersion")
        self._driver_version.argtypes = [
            ctypes.POINTER(ctypes.c_char),
            ctypes.c_uint,
        ]
        self._driver_version.restype = ctypes.c_int
        self._handle_by_index = self._symbol("nvmlDeviceGetHandleByIndex_v2")
        self._handle_by_index.argtypes = [
            ctypes.c_uint,
            ctypes.POINTER(ctypes.c_void_p),
        ]
        self._handle_by_index.restype = ctypes.c_int
        self._utilization = self._symbol("nvmlDeviceGetUtilizationRates")
        self._utilization.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(_NvmlUtilization),
        ]
        self._utilization.restype = ctypes.c_int
        self._decoder_utilization = self._symbol(
            "nvmlDeviceGetDecoderUtilization"
        )
        self._decoder_utilization.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_uint),
            ctypes.POINTER(ctypes.c_uint),
        ]
        self._decoder_utilization.restype = ctypes.c_int

    def _symbol(self, name: str) -> Any:
        try:
            return getattr(self._library, name)
        except AttributeError as error:
            raise RuntimeError("nvml_symbol_resolution_failed") from error

    @staticmethod
    def _check(code: int, diagnostic: str) -> None:
        if int(code) != 0:
            raise RuntimeError(diagnostic)

    def initialize(self) -> None:
        self._check(self._init(), "nvml_initialization_failed")

    def shutdown(self) -> None:
        self._check(self._shutdown(), "nvml_shutdown_failed")

    def driver_version(self) -> bytes:
        value = ctypes.create_string_buffer(96)
        self._check(
            self._driver_version(value, ctypes.sizeof(value)),
            "nvml_driver_version_probe_failed",
        )
        return bytes(value.value)

    def device_handle(self) -> ctypes.c_void_p:
        handle = ctypes.c_void_p()
        self._check(
            self._handle_by_index(0, ctypes.byref(handle)),
            "nvml_device_handle_probe_failed",
        )
        if handle.value is None:
            raise RuntimeError("nvml_device_handle_probe_failed")
        return handle

    def gpu_utilization_percent(self, handle: ctypes.c_void_p) -> int:
        utilization = _NvmlUtilization()
        self._check(
            self._utilization(handle, ctypes.byref(utilization)),
            "nvml_gpu_utilization_probe_failed",
        )
        return int(utilization.gpu)

    def decoder_utilization_percent(self, handle: ctypes.c_void_p) -> int:
        utilization = ctypes.c_uint()
        sampling_period = ctypes.c_uint()
        self._check(
            self._decoder_utilization(
                handle,
                ctypes.byref(utilization),
                ctypes.byref(sampling_period),
            ),
            "nvml_decoder_utilization_probe_failed",
        )
        return int(utilization.value)


def load_fixed_nvml_binding() -> FixedNvmlBinding:
    try:
        return FixedNvmlBinding()
    except RuntimeError:
        raise
    except Exception as error:
        raise RuntimeError("nvml_library_load_failed") from error


class NvdecSampler:
    def __init__(self) -> None:
        self._stop = threading.Event()
        self._samples: list[int] = []
        self._error: Exception | None = None
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        def sample() -> None:
            try:
                nvml = load_fixed_nvml_binding()
                nvml.initialize()
                try:
                    handle = nvml.device_handle()
                    while not self._stop.is_set():
                        self._samples.append(
                            nvml.decoder_utilization_percent(handle)
                        )
                        self._stop.wait(0.02)
                finally:
                    nvml.shutdown()
            except Exception as error:  # evidence failure blocks the attempt
                self._error = error

        self._thread = threading.Thread(target=sample, daemon=True)
        self._thread.start()

    def stop_and_verify(self) -> int:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5)
        if self._error is not None or not self._samples or max(self._samples) <= 0:
            raise RuntimeError("NVDEC hardware utilization was not observed")
        return max(self._samples)


class GpuComputeSampler:
    def __init__(self) -> None:
        self._stop = threading.Event()
        self._samples: list[int] = []
        self._error: Exception | None = None
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        def sample() -> None:
            try:
                nvml = load_fixed_nvml_binding()
                nvml.initialize()
                try:
                    handle = nvml.device_handle()
                    while not self._stop.is_set():
                        self._samples.append(
                            nvml.gpu_utilization_percent(handle)
                        )
                        self._stop.wait(0.01)
                finally:
                    nvml.shutdown()
            except Exception as error:  # evidence failure blocks the attempt
                self._error = error

        self._thread = threading.Thread(target=sample, daemon=True)
        self._thread.start()

    def stop_and_verify(self) -> int:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5)
        if self._error is not None or not self._samples or max(self._samples) <= 0:
            raise RuntimeError("CUDA compute utilization was not observed")
        return max(self._samples)


def select_loaded_cuda_driver_library_path(
    observations: list[tuple[str, tuple[int, int]]],
) -> str:
    paths_by_file: dict[tuple[int, int], set[str]] = {}
    for path, file_identity in observations:
        paths_by_file.setdefault(file_identity, set()).add(path)
    if len(paths_by_file) != 1:
        raise RuntimeError("exactly one CUDA driver library file must be loaded")
    observed_paths = next(iter(paths_by_file.values()))
    return min(observed_paths, key=lambda value: value.encode("utf-16-be"))


def loaded_cuda_driver_library_path() -> str:
    observations: list[tuple[str, tuple[int, int]]] = []
    with Path("/proc/self/maps").open("r", encoding="utf-8") as maps:
        for line in maps:
            path = line.rstrip().split(maxsplit=5)[-1]
            if path.startswith("/") and "/libcuda.so" in path:
                try:
                    stat = os.stat(path)
                except OSError as error:
                    raise RuntimeError(
                        "loaded CUDA driver library cannot be identified"
                    ) from error
                observations.append((path, (stat.st_dev, stat.st_ino)))
    return select_loaded_cuda_driver_library_path(observations)


def validate_cuda_driver_library() -> dict[str, Any]:
    nvml = load_fixed_nvml_binding()
    guarded_cuda_probe("nvml_initialization_failed", nvml.initialize)
    try:
        observed = guarded_cuda_probe(
            "nvml_driver_version_probe_failed",
            nvml.driver_version,
        )
    finally:
        guarded_cuda_probe("nvml_shutdown_failed", nvml.shutdown)
    if isinstance(observed, bytes):
        observed = observed.decode("ascii", errors="strict")
    if not isinstance(observed, str) or not re.fullmatch(
        r"[0-9]+(?:\.[0-9]+){1,3}", observed
    ):
        raise RuntimeError("NVIDIA driver version evidence is malformed")
    entrypoint_observed = os.environ.get(
        "WEEDITPRO_OBSERVED_NVIDIA_DRIVER_VERSION"
    )
    mode = os.environ.get("WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE")
    if entrypoint_observed != observed:
        raise RuntimeError("entrypoint and NVML driver versions differ")
    major = int(observed.split(".", maxsplit=1)[0])
    expected_mode = "cuda_compat_12_8" if 535 <= major < 570 else (
        "host_driver" if major >= 570 else "unsupported"
    )
    if mode != expected_mode or expected_mode == "unsupported":
        raise RuntimeError("CUDA driver-library mode is not admitted")
    loaded_path = loaded_cuda_driver_library_path()
    forward_compatibility_loaded = loaded_path.startswith(
        f"{CUDA_FORWARD_COMPAT_PATH}/"
    )
    # NVIDIA's container runtime controls the host-library mount location. Vertex
    # has used both /usr/local/nvidia and distribution-native library roots. The
    # immutable image contains no non-compatibility libcuda, so host mode is
    # proven by one loaded underlying libcuda file outside the pinned CUDA 12.8
    # compatibility directory, not by a provider-specific mount-path spelling.
    host_driver_loaded = not forward_compatibility_loaded
    if (
        mode == "cuda_compat_12_8"
        and (not forward_compatibility_loaded or host_driver_loaded)
    ) or (
        mode == "host_driver"
        and (forward_compatibility_loaded or not host_driver_loaded)
    ):
        raise RuntimeError("loaded CUDA driver library does not match its mode")
    return {
        "observedNvidiaDriverVersion": observed,
        "cudaDriverLibraryMode": mode,
        "observedCudaDriverLibraryPathDigestSha256": sha256_bytes(
            loaded_path.encode("utf-8")
        ),
        "cudaForwardCompatibilityPackageSha256": (
            CUDA_FORWARD_COMPAT_PACKAGE_SHA256
        ),
        "cudaForwardCompatibilityLibraryLoaded": forward_compatibility_loaded,
        "hostCudaDriverLibraryLoaded": host_driver_loaded,
    }


def validate_gpu(torch_module: Any, requested: str) -> dict[str, Any]:
    if os.environ.get("WEEDITPRO_GPU_ACCELERATOR_CLASS") != requested:
        raise RuntimeError("launch accelerator and task accelerator differ")
    if not guarded_cuda_probe(
        "cuda_availability_probe_failed",
        torch_module.cuda.is_available,
    ):
        raise RuntimeError("CUDA bfloat16 GPU is unavailable")
    device_name = guarded_cuda_probe(
        "cuda_device_name_probe_failed",
        lambda: torch_module.cuda.get_device_name(0),
    )
    major, minor = guarded_cuda_probe(
        "cuda_device_capability_probe_failed",
        lambda: torch_module.cuda.get_device_capability(0),
    )
    total = guarded_cuda_probe(
        "cuda_device_properties_probe_failed",
        lambda: torch_module.cuda.get_device_properties(0).total_memory,
    )
    exact_class = (
        requested == "nvidia_a100_80gb"
        and "A100" in device_name.upper()
        and major == 8
        and minor == 0
        and total >= 75 * 1024**3
    ) or (
        requested == "nvidia_l4"
        and "L4" in device_name.upper()
        and major == 8
        and minor == 9
        and total >= 20 * 1024**3
    )
    if not exact_class:
        raise RuntimeError("observed GPU does not match the admitted route")
    if (
        torch_module.__version__ != EXPECTED_TORCH_VERSION
        or torch_module.version.cuda != EXPECTED_CUDA_VERSION
        or importlib.metadata.version("torchvision") != EXPECTED_TORCHVISION_VERSION
        or importlib.metadata.version("torchcodec") != EXPECTED_TORCHCODEC_VERSION
        or importlib.metadata.version("einops") != EXPECTED_EINOPS_VERSION
    ):
        raise RuntimeError("CUDA Python dependency closure changed")
    driver_evidence = validate_cuda_driver_library()
    return {
        "requestedAccelerator": requested,
        "observedDeviceNameDigestSha256": sha256_bytes(device_name.encode("utf-8")),
        "observedCudaRuntimeVersion": torch_module.version.cuda,
        "observedTorchVersion": torch_module.__version__,
        "observedTorchcodecVersion": "0.10.0",
        "observedComputeCapabilityMajor": major,
        "observedComputeCapabilityMinor": minor,
        "observedTotalDeviceMemoryBytes": total,
        "maximumObservedNvdecUtilizationPercent": 0,
        "maximumObservedGpuUtilizationPercent": 0,
        "cudaAvailable": True,
        "bfloat16AutocastUsed": False,
        "nvdecHardwareDecodeMeasured": False,
        "decodedFramesResidentOnCuda": False,
        "boundedCpuOutputSerializationUsed": True,
        "cudaKernelExecutionMeasured": False,
        "cpuOnlyInferenceUsed": False,
        **driver_evidence,
    }


def guarded_cuda_probe(diagnostic_message: str, operation: Any) -> Any:
    try:
        return operation()
    except Exception as error:
        raise RuntimeError(diagnostic_message) from error


def verify_cuda_bfloat16_operation(torch_module: Any) -> None:
    """Prove bfloat16 with a real CUDA kernel, not a helper heuristic.

    PyTorch's ``is_bf16_supported`` helper is an indirect capability heuristic
    and may itself fail while initializing a provider-specific CUDA runtime.
    The release gate needs stronger evidence anyway: two fixed bfloat16 CUDA
    matrices must execute, synchronize, and return a finite bfloat16 result on
    device zero before model loading is allowed.
    """

    def execute_probe() -> Any:
        left = torch_module.ones(
            (16, 16),
            dtype=torch_module.bfloat16,
            device="cuda:0",
        )
        right = torch_module.full(
            (16, 16),
            2,
            dtype=torch_module.bfloat16,
            device="cuda:0",
        )
        result = torch_module.matmul(left, right)
        torch_module.cuda.synchronize(0)
        return result

    result = guarded_cuda_probe(
        "cuda_bfloat16_kernel_probe_failed",
        execute_probe,
    )
    if (
        not torch_module.is_tensor(result)
        or getattr(result.device, "type", None) != "cuda"
        or result.dtype != torch_module.bfloat16
        or result.shape != (16, 16)
        or not bool(torch_module.isfinite(result).all().item())
        or float(result[0, 0].item()) != 32.0
    ):
        raise RuntimeError("CUDA bfloat16 kernel result is invalid")


def verify_bfloat16_autocast(torch_module: Any) -> None:
    if not torch_module.is_autocast_enabled("cuda"):
        raise RuntimeError("SAM 3.1 CUDA bfloat16 autocast was not entered")
    if torch_module.get_autocast_dtype("cuda") != torch_module.bfloat16:
        raise RuntimeError("SAM 3.1 CUDA autocast dtype changed")


def verify_gpu_frame_store(inference_state: dict[str, Any]) -> None:
    input_batch = inference_state.get("input_batch")
    image_batch = getattr(input_batch, "img_batch", None)
    frame_store = getattr(image_batch, "tensors", None)
    decoded_images = getattr(frame_store, "images", None)
    out_device = getattr(frame_store, "out_device", None)
    if (
        getattr(frame_store, "gpu_acceleration", None) is not True
        or getattr(frame_store, "offload_video_to_cpu", None) is not False
        or getattr(out_device, "type", None) != "cuda"
        or getattr(getattr(decoded_images, "device", None), "type", None) != "cuda"
        or getattr(frame_store, "all_frames_loaded", None) is not True
        or getattr(frame_store, "num_loaded_frames", None)
        != inference_state.get("num_frames")
    ):
        raise RuntimeError("SAM 3.1 decoded frame store is not completely CUDA-resident")


def await_complete_gpu_frame_store(inference_state: dict[str, Any]) -> None:
    input_batch = inference_state.get("input_batch")
    image_batch = getattr(input_batch, "img_batch", None)
    frame_store = getattr(image_batch, "tensors", None)
    async_thread = getattr(frame_store, "thread", None)
    if async_thread is not None:
        async_thread.join(timeout=MAXIMUM_ASYNC_FRAME_LOAD_WAIT_SECONDS)
        if async_thread.is_alive():
            raise RuntimeError("SAM 3.1 asynchronous GPU frame loading timed out")
    if getattr(frame_store, "exception", None) is not None:
        raise RuntimeError("SAM 3.1 asynchronous GPU frame loading failed")
    verify_gpu_frame_store(inference_state)


def copy_mask_for_persistence(
    mask: Any,
    torch_module: Any,
) -> Any:
    import numpy as np

    if (
        not torch_module.is_tensor(mask)
        or getattr(mask.device, "type", None) != "cuda"
        or mask.dtype != torch_module.bool
        or mask.ndim != 2
    ):
        raise RuntimeError("SAM 3.1 mask output shape or type changed")
    value = mask.detach().to(
        device="cpu",
        non_blocking=False,
    ).contiguous().numpy()
    if value.ndim != 2 or value.dtype != np.bool_:
        raise RuntimeError("SAM 3.1 bounded output serialization changed")
    return value


def persist_mask(
    value: Any,
    frame_index: int,
    object_id: int,
) -> dict[str, Any]:
    import numpy as np
    from PIL import Image

    if value.ndim != 2 or value.dtype != np.bool_:
        raise RuntimeError("SAM 3.1 bounded output serialization changed")
    file_name = f"frame-{frame_index:06d}-object-{object_id:06d}.png"
    path = PRIVATE_OUTPUT_ROOT / file_name
    image = Image.fromarray(value.astype(np.uint8) * 255, mode="L")
    encoded = io.BytesIO()
    image.save(encoded, format="PNG", optimize=False, compress_level=9)
    payload = encoded.getvalue()
    if not payload or len(payload) > 512 * 1024 * 1024:
        raise RuntimeError("SAM 3.1 mask PNG exceeded its fixed byte bound")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags, 0o600)
    try:
        view = memoryview(payload)
        while view:
            written = os.write(descriptor, view)
            if written <= 0:
                raise RuntimeError("SAM 3.1 mask persistence stopped")
            view = view[written:]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    byte_length, digest = file_sha256(path, 512 * 1024 * 1024)
    if byte_length != len(payload) or digest != sha256_bytes(payload):
        raise RuntimeError("SAM 3.1 persisted mask bytes changed")
    return {
        "frameIndex": frame_index,
        "objectId": object_id,
        "relativeFileName": file_name,
        "width": int(value.shape[1]),
        "height": int(value.shape[0]),
        "byteLength": byte_length,
        "sha256": digest,
    }


def exclusive_phase_nanoseconds(
    enclosing_elapsed_nanoseconds: int,
    nested_elapsed_nanoseconds: int,
) -> int:
    """Remove a measured nested phase without double-counting its duration."""
    if (
        isinstance(enclosing_elapsed_nanoseconds, bool)
        or not isinstance(enclosing_elapsed_nanoseconds, int)
        or isinstance(nested_elapsed_nanoseconds, bool)
        or not isinstance(nested_elapsed_nanoseconds, int)
        or enclosing_elapsed_nanoseconds < 0
        or nested_elapsed_nanoseconds < 0
        or nested_elapsed_nanoseconds > enclosing_elapsed_nanoseconds
    ):
        raise RuntimeError("SAM 3.1 phase timing accounting changed")
    return enclosing_elapsed_nanoseconds - nested_elapsed_nanoseconds


def execute(request: dict[str, Any]) -> dict[str, Any]:
    global stage
    stage = "cuda_admission"
    try:
        import torch
    except Exception as error:
        raise RuntimeError("pytorch_cuda_import_failed") from error

    if not guarded_cuda_probe(
        "cuda_availability_probe_failed",
        torch.cuda.is_available,
    ):
        raise RuntimeError("CUDA bfloat16 GPU is unavailable")
    verify_cuda_bfloat16_operation(torch)
    with torch.autocast(
        device_type="cuda",
        dtype=torch.bfloat16,
        enabled=True,
        cache_enabled=False,
    ):
        verify_bfloat16_autocast(torch)
        return execute_inside_bfloat16_autocast(request, torch)


def execute_inside_bfloat16_autocast(
    request: dict[str, Any],
    torch: Any,
) -> dict[str, Any]:
    global stage
    started = time.monotonic_ns()
    stage = "artifact_verification"
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        raise RuntimeError("SAM 3.1 runner must be non-root")
    source_length, source_hash = file_sha256(SOURCE_PROXY_PATH, MAXIMUM_SOURCE_BYTES)
    if (
        source_length != request["sourceMedia"]["byteLength"]
        or source_hash != request["sourceMedia"]["sha256"]
    ):
        raise RuntimeError("GPU mask proxy bytes changed")
    checkpoint_length, checkpoint_hash_before = file_sha256(
        CHECKPOINT_PATH, MAXIMUM_CHECKPOINT_BYTES
    )
    if (
        checkpoint_length != request["modelArtifacts"]["checkpointByteLength"]
        or checkpoint_hash_before != request["modelArtifacts"]["checkpointSha256"]
    ):
        raise RuntimeError("SAM 3.1 checkpoint bytes changed")
    ingest_receipt_hash = request["modelArtifacts"][
        "privateArtifactIngestReceiptRef"
    ][
        "contentHash"
    ].removeprefix("sha256:")
    compatibility_ref = request["modelArtifacts"][
        "sourceCheckpointCompatibilityQualificationRef"
    ]
    read_artifact_build_binding(
        ARTIFACT_BUILD_BINDING_PATH,
        ingest_receipt_hash,
        compatibility_ref,
    )
    read_closed_receipt(COMPATIBILITY_RECEIPT_PATH, compatibility_ref)

    stage = "cuda_admission"
    gpu_evidence = validate_gpu(torch, request["dispatch"]["accelerator"])
    verify_ffmpeg_nvdec_runtime()
    install_torchcodec_gpu_decode_guard()
    torch.cuda.reset_peak_memory_stats(0)
    cuda_start = torch.cuda.Event(enable_timing=True)
    cuda_end = torch.cuda.Event(enable_timing=True)

    stage = "model_load"
    model_load_started = time.monotonic_ns()
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    with contextlib.redirect_stdout(captured_stdout), contextlib.redirect_stderr(
        captured_stderr
    ):
        predictor = build_predictor_with_strict_rope_cache_derivation(torch)
        install_sam31_multiplex_session_compatibility_guard(predictor)
        memory_profile_id, memory_trimmed = configure_gpu_memory_profile(
            predictor, request["dispatch"]["accelerator"]
        )
    verify_bfloat16_autocast(torch)
    gpu_evidence["bfloat16AutocastUsed"] = True
    gpu_evidence["gpuMemoryProfileId"] = memory_profile_id
    gpu_evidence["pastNonConditioningMemoryTrimmedOnGpu"] = memory_trimmed
    build_log = captured_stdout.getvalue() + captured_stderr.getvalue()
    if "Missing keys" in build_log or "Unexpected keys" in build_log:
        raise RuntimeError("pinned source/checkpoint compatibility changed")
    model_load_ms = (time.monotonic_ns() - model_load_started) // 1_000_000

    stage = "session_start"
    decoder_sampler = NvdecSampler()
    decoder_sampler.start()
    session_response = predictor.handle_request(
        {
            "type": "start_session",
            "resource_path": str(SOURCE_PROXY_PATH),
            "offload_video_to_cpu": False,
            "offload_state_to_cpu": False,
        }
    )
    session_id = session_response["session_id"]
    inference_state = predictor._all_inference_states[session_id]["state"]
    await_complete_gpu_frame_store(inference_state)
    maximum_nvdec_utilization = decoder_sampler.stop_and_verify()
    if (
        inference_state["num_frames"] != request["sourceMedia"]["decodedFrameCount"]
        or inference_state["orig_width"] != request["sourceMedia"]["width"]
        or inference_state["orig_height"] != request["sourceMedia"]["height"]
    ):
        raise RuntimeError("GPU-decoded source geometry or frame count changed")

    stage = "prompt"
    prompt_started = time.monotonic_ns()
    compute_sampler = GpuComputeSampler()
    compute_sampler.start()
    cuda_start.record()
    predictor.handle_request(
        {
            "type": "add_prompt",
            "session_id": session_id,
            "frame_index": request["approvedPrompt"]["promptFrameIndex"],
            "text": request["approvedPrompt"]["approvedSubjectText"],
            "output_prob_thresh": 0.5,
        }
    )
    prompt_ms = (time.monotonic_ns() - prompt_started) // 1_000_000

    stage = "output_persistence"
    PRIVATE_OUTPUT_ROOT.mkdir(mode=0o700, parents=False, exist_ok=False)
    frame_object_records: dict[int, list[dict[str, Any]]] = {}
    mask_records_by_key: dict[tuple[int, int], dict[str, Any]] = {}
    distinct_object_ids: set[int] = set()
    propagation_started = time.monotonic_ns()
    persistence_ns = 0
    stage = "propagation"
    pending: deque[tuple[
        tuple[int, int], concurrent.futures.Future[dict[str, Any]]
    ]] = deque()
    with concurrent.futures.ThreadPoolExecutor(
        max_workers=OUTPUT_PERSISTENCE_WORKERS,
        thread_name_prefix="sam31-mask-persistence",
    ) as persistence_pool:
        for response in predictor.handle_stream_request(
            {
                "type": "propagate_in_video",
                "session_id": session_id,
                "propagation_direction": "forward",
                "start_frame_index": request["approvedPrompt"]["promptFrameIndex"],
                "max_frame_num_to_track": request["sourceMedia"]["decodedFrameCount"],
                "output_prob_thresh": 0.5,
            }
        ):
            frame_index = int(response["frame_index"])
            if (
                frame_index < 0
                or frame_index >= request["sourceMedia"]["decodedFrameCount"]
            ):
                raise RuntimeError("SAM 3.1 emitted an out-of-scope frame")
            if frame_index in frame_object_records:
                raise RuntimeError("SAM 3.1 emitted a duplicate frame")
            outputs = response["outputs"]
            object_ids = outputs["out_obj_ids"].tolist()
            boxes = outputs["out_boxes_xywh"].tolist()
            masks = outputs["out_binary_masks"]
            if not (len(object_ids) == len(boxes) == len(masks)):
                raise RuntimeError("SAM 3.1 output arrays lost alignment")
            object_records: list[dict[str, Any]] = []
            persist_started = time.monotonic_ns()
            for object_id_value, box, mask in zip(object_ids, boxes, masks):
                object_id = exact_int(
                    int(object_id_value), 0, 2**31 - 1, "object id"
                )
                if len(box) != 4 or any(
                    isinstance(component, bool)
                    or not isinstance(component, (int, float))
                    or not math.isfinite(component)
                    or component < 0
                    or component > 1
                    for component in box
                ):
                    raise RuntimeError("SAM 3.1 normalized box is invalid")
                key = (frame_index, object_id)
                if key in mask_records_by_key or any(
                    pending_key == key for pending_key, _future in pending
                ):
                    raise RuntimeError("SAM 3.1 emitted a duplicate mask")
                while len(pending) >= MAXIMUM_PENDING_MASK_PERSISTENCE_TASKS:
                    completed_key, completed_future = pending.popleft()
                    mask_records_by_key[completed_key] = completed_future.result()
                value = copy_mask_for_persistence(mask, torch)
                future = persistence_pool.submit(
                    persist_mask,
                    value,
                    frame_index,
                    object_id,
                )
                pending.append((key, future))
                distinct_object_ids.add(object_id)
                object_records.append({
                    "objectId": object_id,
                    "normalizedBoxXywh": [float(component) for component in box],
                })
            persistence_ns += time.monotonic_ns() - persist_started
            frame_object_records[frame_index] = object_records
        drain_started = time.monotonic_ns()
        while pending:
            completed_key, completed_future = pending.popleft()
            mask_records_by_key[completed_key] = completed_future.result()
        persistence_ns += time.monotonic_ns() - drain_started
    propagation_elapsed_ns = time.monotonic_ns() - propagation_started
    exclusive_propagation_ns = exclusive_phase_nanoseconds(
        propagation_elapsed_ns,
        persistence_ns,
    )
    propagation_ms = exclusive_propagation_ns // 1_000_000
    output_persistence_ms = persistence_ns // 1_000_000
    cuda_end.record()
    torch.cuda.synchronize(0)
    cuda_inference_ms = max(1, round(cuda_start.elapsed_time(cuda_end)))
    maximum_gpu_utilization = compute_sampler.stop_and_verify()
    gpu_evidence["maximumObservedNvdecUtilizationPercent"] = (
        maximum_nvdec_utilization
    )
    gpu_evidence["maximumObservedGpuUtilizationPercent"] = (
        maximum_gpu_utilization
    )
    verify_gpu_frame_store(inference_state)
    if not GPU_DECODE_BACKEND_OBSERVATIONS:
        raise RuntimeError("SAM 3.1 observed no CUDA/NVDEC video decode")
    gpu_evidence["nvdecHardwareDecodeMeasured"] = True
    gpu_evidence["decodedFramesResidentOnCuda"] = True
    gpu_evidence["cudaKernelExecutionMeasured"] = True

    expected_frames = set(range(request["sourceMedia"]["decodedFrameCount"]))
    if set(frame_object_records.keys()) != expected_frames or not mask_records_by_key:
        raise RuntimeError("SAM 3.1 did not produce complete bounded frame coverage")
    if len(distinct_object_ids) > MAXIMUM_OBJECTS:
        raise RuntimeError("SAM 3.1 exceeded the object product cap")

    frame_records: dict[int, dict[str, Any]] = {}
    for frame_index, objects in frame_object_records.items():
        frame_payload = {"frameIndex": frame_index, "objects": []}
        for object_record in objects:
            object_id = object_record["objectId"]
            mask_record = mask_records_by_key.get((frame_index, object_id))
            if mask_record is None:
                raise RuntimeError("SAM 3.1 persisted mask is missing")
            frame_payload["objects"].append({
                **object_record,
                "maskSha256": mask_record["sha256"],
            })
        frame_records[frame_index] = frame_payload
    mask_records = sorted(
        mask_records_by_key.values(),
        key=lambda item: (item["frameIndex"], item["objectId"]),
    )

    stage = "output_persistence"
    manifest = {
        "schemaVersion": "canonical-sam3_1-mask-sequence-manifest-v1",
        "operationId": OPERATION_ID,
        "requestBindingSha256": request["requestBindingSha256"],
        "sourceFrameRangeMappingRef": request["sourceMedia"][
            "sourceFrameRangeMappingRef"
        ],
        "width": request["sourceMedia"]["width"],
        "height": request["sourceMedia"]["height"],
        "firstFrameIndex": 0,
        "lastFrameIndex": request["sourceMedia"]["decodedFrameCount"] - 1,
        "frames": [frame_records[index] for index in sorted(frame_records.keys())],
        "masks": mask_records,
    }
    manifest_bytes = stable_json_bytes(manifest)
    with MANIFEST_PATH.open("xb") as handle:
        handle.write(manifest_bytes)
        handle.flush()
        os.fsync(handle.fileno())
    manifest_length, manifest_hash = file_sha256(MANIFEST_PATH, 64 * 1024 * 1024)
    output_bytes = manifest_length + sum(item["byteLength"] for item in mask_records)

    predictor.handle_request(
        {"type": "close_session", "session_id": session_id, "run_gc_collect": True}
    )
    stage = "artifact_reread"
    checkpoint_length_after, checkpoint_hash_after = file_sha256(
        CHECKPOINT_PATH, MAXIMUM_CHECKPOINT_BYTES
    )
    source_length_after, source_hash_after = file_sha256(
        SOURCE_PROXY_PATH, MAXIMUM_SOURCE_BYTES
    )
    if (
        checkpoint_length_after != checkpoint_length
        or checkpoint_hash_after != checkpoint_hash_before
        or source_length_after != source_length
        or source_hash_after != source_hash
    ):
        raise RuntimeError("SAM 3.1 input artifacts changed during inference")

    stage = "completed"
    wall_ms = max(1, (time.monotonic_ns() - started) // 1_000_000)
    measured_phase_ms = (
        model_load_ms
        + prompt_ms
        + propagation_ms
        + output_persistence_ms
    )
    if measured_phase_ms > wall_ms:
        raise RuntimeError("SAM 3.1 phase timing accounting changed")
    manifest_id = (
        "sam31-mask-manifest:"
        + request["scope"]["executionAttemptRef"]["id"]
    )[:240]
    response_payload = {
        "schemaVersion": RESPONSE_VERSION,
        "operationId": OPERATION_ID,
        "requestBindingSha256": request["requestBindingSha256"],
        "dispatchAdmissionDigestSha256": request[
            "dispatchAdmissionDigestSha256"
        ],
        "status": "completed",
        "terminalStage": "completed",
        "gpuEvidence": gpu_evidence,
        "runtimeMeasurement": {
            "wallTimeMilliseconds": wall_ms,
            "modelLoadMilliseconds": int(model_load_ms),
            "promptMilliseconds": int(prompt_ms),
            "propagationMilliseconds": int(propagation_ms),
            "outputPersistenceMilliseconds": int(output_persistence_ms),
            "cudaEventInferenceMilliseconds": cuda_inference_ms,
            "peakCudaAllocatedBytes": int(torch.cuda.max_memory_allocated(0)),
            "peakCudaReservedBytes": int(torch.cuda.max_memory_reserved(0)),
            "outputFileCount": len(mask_records) + 1,
            "outputByteLength": output_bytes,
        },
        "outputSummary": {
            "manifestRef": {
                "id": manifest_id,
                "version": 1,
                "contentHash": f"sha256:{manifest_hash}",
            },
            "manifestSha256": manifest_hash,
            "firstFrameIndex": 0,
            "lastFrameIndex": request["sourceMedia"]["decodedFrameCount"] - 1,
            "propagatedFrameCount": request["sourceMedia"]["decodedFrameCount"],
            "distinctObjectIds": sorted(distinct_object_ids),
            "losslessMaskPngCount": len(mask_records),
            "normalizedBoxRecordCount": sum(
                len(item["objects"]) for item in frame_records.values()
            ),
            "allMasksMatchSourceDimensions": all(
                item["width"] == request["sourceMedia"]["width"]
                and item["height"] == request["sourceMedia"]["height"]
                for item in mask_records
            ),
            "allFramesWithinApprovedInterval": True,
            "createOnlyPrivatePersistence": True,
            "exactPrivateRereadPending": True,
        },
        "failureCode": "none",
        "modelSourceAndCheckpointHashesVerifiedBeforeAndAfter": True,
        "sourceCheckpointCompatibilityQualificationReread": True,
        "serverCostReceiptIncluded": False,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "publicDeliveryAuthorized": False,
        "productionAuthorityGranted": False,
    }
    response_payload["responseBindingSha256"] = sha256_bytes(
        stable_json_bytes(response_payload)
    )
    return response_payload


def failure_response(request: dict[str, Any] | None, error: Exception) -> dict[str, Any]:
    failure_code = {
        "request_validation": "request_rejected",
        "artifact_verification": "artifact_mismatch",
        "cuda_admission": "gpu_mismatch",
        "model_load": "model_load_failed",
        "session_start": "inference_failed",
        "prompt": "inference_failed",
        "propagation": "inference_failed",
        "output_persistence": "output_failed",
        "artifact_reread": "artifact_mismatch",
    }.get(stage, "inference_failed")
    del error
    payload = {
        "schemaVersion": RESPONSE_VERSION,
        "operationId": OPERATION_ID,
        "requestBindingSha256": (
            request["requestBindingSha256"] if request is not None else "0" * 64
        ),
        "dispatchAdmissionDigestSha256": (
            request["dispatchAdmissionDigestSha256"]
            if request is not None
            else "0" * 64
        ),
        "status": "failed",
        "terminalStage": stage if stage in {
            "request_validation",
            "artifact_verification",
            "cuda_admission",
            "model_load",
            "session_start",
            "prompt",
            "propagation",
            "output_persistence",
            "artifact_reread",
        } else "request_validation",
        "gpuEvidence": None,
        "runtimeMeasurement": None,
        "outputSummary": None,
        "failureCode": failure_code,
        "modelSourceAndCheckpointHashesVerifiedBeforeAndAfter": False,
        "sourceCheckpointCompatibilityQualificationReread": False,
        "serverCostReceiptIncluded": False,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "publicDeliveryAuthorized": False,
        "productionAuthorityGranted": False,
    }
    payload["responseBindingSha256"] = sha256_bytes(stable_json_bytes(payload))
    return payload


def failure_diagnostic_code(error: Exception) -> str:
    if stage == "cuda_admission" and isinstance(error, ImportError):
        return "cuda_dependency_import_failed"
    if type(error).__name__ == "OutOfMemoryError":
        return "cuda_out_of_memory"
    allowed = {
        "launch accelerator and task accelerator differ": "accelerator_binding_mismatch",
        "CUDA bfloat16 GPU is unavailable": "cuda_bfloat16_unavailable",
        "observed GPU does not match the admitted route": "accelerator_identity_mismatch",
        "CUDA Python dependency closure changed": "cuda_python_closure_mismatch",
        "NVIDIA driver version evidence is malformed": "driver_version_malformed",
        "entrypoint and NVML driver versions differ": "driver_version_reread_mismatch",
        "CUDA driver-library mode is not admitted": "driver_mode_mismatch",
        "loaded CUDA driver library cannot be identified": "driver_file_unidentifiable",
        "exactly one CUDA driver library file must be loaded": "driver_file_count_mismatch",
        "loaded CUDA driver library does not match its mode": "driver_file_mode_mismatch",
        "runtime FFmpeg NVDEC closure changed": "ffmpeg_nvdec_closure_mismatch",
        "TorchCodec GPU decode guard was installed twice": "decode_guard_duplicate",
        "NVDEC hardware utilization was not observed": (
            "nvdec_utilization_not_observed"
        ),
        "pytorch_cuda_import_failed": "pytorch_cuda_import_failed",
        "cuda_availability_probe_failed": "cuda_availability_probe_failed",
        "cuda_device_name_probe_failed": "cuda_device_name_probe_failed",
        "cuda_device_capability_probe_failed": "cuda_device_capability_probe_failed",
        "cuda_device_properties_probe_failed": "cuda_device_properties_probe_failed",
        "nvml_initialization_failed": "nvml_initialization_failed",
        "nvml_library_load_failed": "nvml_library_load_failed",
        "nvml_symbol_resolution_failed": "nvml_symbol_resolution_failed",
        "nvml_driver_version_probe_failed": "nvml_driver_version_probe_failed",
        "nvml_device_handle_probe_failed": "nvml_device_handle_probe_failed",
        "nvml_gpu_utilization_probe_failed": "nvml_gpu_utilization_probe_failed",
        "nvml_decoder_utilization_probe_failed": (
            "nvml_decoder_utilization_probe_failed"
        ),
        "nvml_shutdown_failed": "nvml_shutdown_failed",
        "cuda_bfloat16_kernel_probe_failed": "cuda_bfloat16_kernel_probe_failed",
        "CUDA bfloat16 kernel result is invalid": "cuda_bfloat16_kernel_result_invalid",
        "SAM 3.1 CUDA bfloat16 autocast was not entered": "cuda_autocast_not_entered",
        "SAM 3.1 CUDA autocast dtype changed": "cuda_autocast_dtype_mismatch",
        "SAM 3.1 asynchronous GPU frame loading timed out": (
            "gpu_frame_loading_timeout"
        ),
        "SAM 3.1 asynchronous GPU frame loading failed": (
            "gpu_frame_loading_failed"
        ),
        "SAM 3.1 tracker memory policy is unavailable": (
            "gpu_memory_policy_unavailable"
        ),
        "SAM 3.1 upstream GPU memory policy changed": (
            "gpu_memory_policy_mismatch"
        ),
        "SAM 3.1 L4 GPU memory trim was not applied": (
            "l4_gpu_memory_trim_not_applied"
        ),
    }
    return allowed.get(str(error), "unclassified_fail_closed")


def main() -> int:
    global stage
    request_value: dict[str, Any] | None = None
    invocation_id = "invalid-invocation"
    try:
        invocation_id = exact_id(
            os.environ.get("REEDITPRO_GPU_INVOCATION_ID"),
            "GPU invocation identity",
        )
        accelerator_class = exact_id(
            os.environ.get("WEEDITPRO_GPU_ACCELERATOR_CLASS"),
            "GPU accelerator class",
        )
        configure_execution_mounts(accelerator_class)
        task_path = configure_invocation_paths(invocation_id)
        task = read_task(task_path, invocation_id)
        request_value = task["runtimeRequest"]
        response = execute(request_value)
        exit_code = 0
    except Exception as error:
        response = failure_response(request_value, error)
        diagnostic = {
            "schemaVersion": "canonical-sam3_1-gpu-worker-diagnostic-v1",
            "terminalStage": response["terminalStage"],
            "diagnosticCode": failure_diagnostic_code(error),
            "rawExceptionTextPersisted": False,
        }
        sys.stderr.buffer.write(stable_json_bytes(diagnostic))
        sys.stderr.buffer.write(b"\n")
        sys.stderr.buffer.flush()
        exit_code = 1
    response_hash: str | None = None
    try:
        response_hash = persist_create_only_response(response)
    except Exception:
        exit_code = 1
    marker = {
        "schemaVersion": "canonical-sam3_1-gpu-worker-exit-v1",
        "status": response["status"],
        "responseSha256": response_hash,
        "responsePersisted": response_hash is not None,
    }
    encoded = stable_json_bytes(marker)
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.write(b"\n")
    sys.stdout.buffer.flush()
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
