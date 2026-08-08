#!/usr/bin/env python3
"""Fixed A100-only SAM 3.1 source/checkpoint qualification worker.

This image is never a customer runtime. It consumes one server-created,
request-bound private fixture and the exact gated checkpoint, loads the
checkpoint exactly once through Meta's pinned Object Multiplex builder, and
runs three complete deterministic CUDA probes. It performs no download and
accepts no command, path, URL, model, module, or prompt from a caller.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
from datetime import datetime
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import time
from typing import Any


REQUEST_VERSION = (
    "canonical-sam3_1-source-checkpoint-qualification-worker-request-v2"
)
RESULT_VERSION = (
    "canonical-sam3_1-source-checkpoint-qualification-worker-result-v2"
)
OPERATION_ID = "tool.sam3_1.segment_and_track_subject.v1"
CANDIDATE_VERSION = "canonical-sam3_1-source-runtime-candidate-v4"
INGEST_VERSION = "canonical-sam3_1-private-artifact-ingest-receipt-v3"
BASE_IMAGE_DIGEST = (
    "sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca"
)
SOURCE_REVISION = "96914d2425f90a64f45ca977c2b5165418099543"
SOURCE_SHA256 = (
    "5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a"
)
PATCHED_SOURCE_SHA256 = (
    "b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb"
)
PATCH_SHA256 = (
    "daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca"
)
CHECKPOINT_REVISION = "daa63191845a41281374e725f4c9e51c7a824460"
CHECKPOINT_FILE = "sam3.1_multiplex.pt"

EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
MAX_REQUEST_BYTES = 512 * 1024
MAX_RESULT_BYTES = 512 * 1024
MAX_CHECKPOINT_BYTES = 5_000_000_000
MAX_FIXTURE_BYTES = 64 * 1024 * 1024
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
GPU_DECODE_BACKEND_OBSERVATIONS: list[str] = []
REAL_ROPE_CACHE_DERIVATION_POLICY = (
    "sam3_1_real_rope_cache_from_complex_buffer_v1"
)
DETECTOR_ROPE_CACHE_BASE = re.compile(
    r"^(?:sam3_model|detector)\.backbone\.vision_backbone\.trunk\."
    r"blocks\.(?P<block>[0-9]+)\.attn\.freqs_cis$"
)
EXPECTED_DETECTOR_ROPE_BLOCKS = tuple(range(32))

ATTEMPT_ID = os.environ.get("WEEDITPRO_GPU_INVOCATION_ID", "")
if SAFE_ID.fullmatch(ATTEMPT_ID) is None or ".." in ATTEMPT_ID:
    raise RuntimeError("server-owned Vertex qualification attempt is invalid")
ATTEMPT_DIGEST_SHA256 = hashlib.sha256(json.dumps(
    ATTEMPT_ID,
    sort_keys=True,
    separators=(",", ":"),
    ensure_ascii=False,
    allow_nan=False,
).encode("utf-8")).hexdigest()
QUALIFICATION_MOUNT = Path(
    "/gcs/reeditpro-production-sam31-qualification-private/private/sam3_1/"
    "source-checkpoint-qualification/v2/attempts"
) / ATTEMPT_DIGEST_SHA256
REQUEST_PATH = QUALIFICATION_MOUNT / "request/request.json"
CHECKPOINT_PATH = QUALIFICATION_MOUNT / "checkpoint/sam3.1_multiplex.pt"
FIXTURE_PATH = QUALIFICATION_MOUNT / "fixture/probe-person.mp4"
RESULT_PATH = QUALIFICATION_MOUNT / "result/result.json"
SOURCE_ARCHIVE_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/sam3-source.tar"
)
PATCHED_SOURCE_ARCHIVE_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/sam3-patched-source.tar"
)
PATCH_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/0001-reeditpro-gpu-decode.patch"
)
PATCH_RECEIPT_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/"
    "source-patch-application-receipt.json"
)
DEPENDENCY_LOCK_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/requirements.lock.txt"
)
DEPENDENCY_RECEIPT_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/"
    "dependency-closure-receipt.json"
)
WHEEL_MANIFEST_HASH_PATH = Path(
    "/opt/reeditpro/sam3_1/qualification-artifacts/wheel-manifest.sha256"
)

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
        raise RuntimeError("qualification FFmpeg NVDEC closure changed")


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


def stable_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def read_regular_file(
    path: Path,
    maximum_bytes: int,
    *,
    retain: bool = False,
) -> tuple[int, str, bytes | None]:
    if path.is_symlink():
        raise ValueError("qualification artifact symlinks are forbidden")
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags)
    digest = hashlib.sha256()
    chunks: list[bytes] | None = [] if retain else None
    observed = 0
    try:
        initial = os.fstat(descriptor)
        if (
            not stat.S_ISREG(initial.st_mode)
            or initial.st_size <= 0
            or initial.st_size > maximum_bytes
        ):
            raise ValueError("qualification artifact size or type is invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum_bytes:
                raise ValueError("qualification artifact exceeded its byte bound")
            digest.update(chunk)
            if chunks is not None:
                chunks.append(chunk)
        final = os.fstat(descriptor)
        if (
            observed != initial.st_size
            or final.st_dev != initial.st_dev
            or final.st_ino != initial.st_ino
            or final.st_size != initial.st_size
            or final.st_mtime_ns != initial.st_mtime_ns
        ):
            raise ValueError("qualification artifact changed during reread")
        return observed, digest.hexdigest(), (
            b"".join(chunks) if chunks is not None else None
        )
    finally:
        os.close(descriptor)


def file_sha256(path: Path, maximum_bytes: int) -> tuple[int, str]:
    length, digest, _ = read_regular_file(path, maximum_bytes)
    return length, digest


def exact_dict(value: Any, keys: set[str], label: str) -> dict[str, Any]:
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


def exact_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or RAW_SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def validate_ref(value: Any, label: str, *, version: int | None = None) -> dict[str, Any]:
    record = exact_dict(value, {"id", "version", "contentHash"}, label)
    exact_id(record["id"], f"{label} id")
    if (
        not isinstance(record["version"], int)
        or isinstance(record["version"], bool)
        or record["version"] < 1
        or (version is not None and record["version"] != version)
        or not isinstance(record["contentHash"], str)
        or PREFIXED_SHA256.fullmatch(record["contentHash"]) is None
    ):
        raise ValueError(f"{label} is invalid")
    return record


def read_request() -> dict[str, Any]:
    _, _, payload = read_regular_file(
        REQUEST_PATH,
        MAX_REQUEST_BYTES,
        retain=True,
    )
    if payload is None:
        raise ValueError("qualification request is unavailable")
    request = json.loads(payload.decode("utf-8"))
    keys = {
        "schemaVersion", "source", "evidenceClass", "qualificationId",
        "qualificationVersion", "attemptId", "attemptDigestSha256",
        "historicalPackageRequestRef",
        "operationId", "candidateRef",
        "officialArtifactPublicationRef", "ingestReceiptRef", "sourceArchive",
        "qualificationImage",
        "patchedSourceArchive", "checkpoint", "dependencyClosure",
        "sourceCodeSecurityReviewRef", "deterministicProbeFixture", "runtime",
        "authority", "issuedAt", "requestHash",
    }
    exact_dict(request, keys, "qualification request")
    request_hash = exact_sha(request.pop("requestHash"), "request hash")
    if sha256_bytes(stable_json_bytes(request)) != request_hash:
        raise ValueError("qualification request hash changed")
    request["requestHash"] = request_hash
    validate_request(request)
    return request


def validate_request(request: dict[str, Any]) -> None:
    if (
        request["schemaVersion"] != REQUEST_VERSION
        or request["source"]
        != "canonical_server_sam3_1_source_checkpoint_qualification_owner"
        or request["evidenceClass"] != "canonical_private_reread"
        or request["qualificationVersion"] != 2
        or request["operationId"] != OPERATION_ID
        or request["attemptId"] != ATTEMPT_ID
        or request["attemptDigestSha256"] != ATTEMPT_DIGEST_SHA256
    ):
        raise ValueError("qualification request identity changed")
    exact_id(request["qualificationId"], "qualification id")
    historical = exact_dict(
        request["historicalPackageRequestRef"],
        {"id", "version", "schemaVersion", "contentHash"},
        "historical package request ref",
    )
    if (
        historical["id"] != request["qualificationId"]
        or historical["version"] != 1
        or historical["schemaVersion"]
        != "canonical-sam3_1-source-checkpoint-qualification-worker-request-v1"
        or not isinstance(historical["contentHash"], str)
        or PREFIXED_SHA256.fullmatch(historical["contentHash"]) is None
    ):
        raise ValueError("historical package request lineage changed")
    try:
        issued_at = datetime.fromisoformat(request["issuedAt"])
    except (TypeError, ValueError) as error:
        raise ValueError("qualification issuedAt is invalid") from error
    if issued_at.tzinfo is None:
        raise ValueError("qualification issuedAt requires an offset")
    candidate = exact_dict(
        request["candidateRef"],
        {"schemaVersion", "candidateHash"},
        "candidate ref",
    )
    if candidate["schemaVersion"] != CANDIDATE_VERSION:
        raise ValueError("qualification candidate version changed")
    exact_sha(candidate["candidateHash"], "candidate hash")
    publication = exact_dict(
        request["officialArtifactPublicationRef"],
        {"id", "version", "schemaVersion", "contentHash"},
        "official artifact publication ref",
    )
    exact_id(publication["id"], "official artifact publication id")
    if (
        publication["version"] != 1
        or publication["schemaVersion"]
        != "canonical-sam3_1-official-artifact-publication-receipt-v1"
        or not isinstance(publication["contentHash"], str)
        or PREFIXED_SHA256.fullmatch(publication["contentHash"]) is None
    ):
        raise ValueError("official artifact publication ref changed")
    ingest = request["ingestReceiptRef"]
    exact_dict(
        ingest,
        {"id", "version", "schemaVersion", "contentHash"},
        "ingest receipt ref",
    )
    exact_id(ingest["id"], "ingest receipt id")
    if (
        ingest["version"] != 1
        or ingest["schemaVersion"] != INGEST_VERSION
        or not isinstance(ingest["contentHash"], str)
        or PREFIXED_SHA256.fullmatch(ingest["contentHash"]) is None
    ):
        raise ValueError("ingest receipt ref changed")
    image = exact_dict(
        request["qualificationImage"],
        {
            "artifactRef", "immutableImageDigest", "supplyChainReleaseRef",
            "dockerfileSourceRef", "entrypointSourceRef", "runnerSourceRef",
        },
        "qualification image",
    )
    validate_ref(image["artifactRef"], "qualification image artifact ref")
    if (
        not isinstance(image["immutableImageDigest"], str)
        or PREFIXED_SHA256.fullmatch(image["immutableImageDigest"]) is None
        or image["artifactRef"]["contentHash"]
        != image["immutableImageDigest"]
    ):
        raise ValueError("qualification image digest changed")
    validate_ref(
        image["supplyChainReleaseRef"],
        "qualification image supply-chain release ref",
    )
    validate_ref(image["dockerfileSourceRef"], "qualification Dockerfile ref")
    validate_ref(image["entrypointSourceRef"], "qualification entrypoint ref")
    validate_ref(image["runnerSourceRef"], "qualification runner ref")
    source = exact_dict(
        request["sourceArchive"],
        {"revision", "byteLength", "sha256", "artifactRef"},
        "source archive",
    )
    if (
        source["revision"] != SOURCE_REVISION
        or source["byteLength"] != 73_605_120
        or source["sha256"] != SOURCE_SHA256
    ):
        raise ValueError("source archive identity changed")
    validate_ref(source["artifactRef"], "source archive ref")
    patched = exact_dict(
        request["patchedSourceArchive"],
        {
            "byteLength", "sha256", "artifactRef",
            "patchApplicationReceiptRef", "patchSha256",
        },
        "patched source archive",
    )
    if (
        patched["byteLength"] != 73_605_120
        or patched["sha256"] != PATCHED_SOURCE_SHA256
        or patched["patchSha256"] != PATCH_SHA256
    ):
        raise ValueError("patched source identity changed")
    validate_ref(patched["artifactRef"], "patched source ref")
    validate_ref(
        patched["patchApplicationReceiptRef"],
        "patch application receipt ref",
    )
    checkpoint = exact_dict(
        request["checkpoint"],
        {
            "repositoryRevision", "fileName", "byteLength", "sha256",
            "artifactRef", "manifestRef", "weightsOnlyInspectionRef",
        },
        "checkpoint",
    )
    if (
        checkpoint["repositoryRevision"] != CHECKPOINT_REVISION
        or checkpoint["fileName"] != CHECKPOINT_FILE
        or not isinstance(checkpoint["byteLength"], int)
        or isinstance(checkpoint["byteLength"], bool)
        or checkpoint["byteLength"] < 3_000_000_000
        or checkpoint["byteLength"] > MAX_CHECKPOINT_BYTES
    ):
        raise ValueError("checkpoint identity changed")
    exact_sha(checkpoint["sha256"], "checkpoint sha256")
    validate_ref(checkpoint["artifactRef"], "checkpoint artifact ref")
    validate_ref(checkpoint["manifestRef"], "checkpoint manifest ref")
    validate_ref(
        checkpoint["weightsOnlyInspectionRef"],
        "checkpoint weights-only inspection ref",
    )
    closure = exact_dict(
        request["dependencyClosure"],
        {"artifactRef", "lockSha256", "receiptSha256", "wheelManifestSha256"},
        "dependency closure",
    )
    validate_ref(closure["artifactRef"], "dependency closure ref")
    exact_sha(closure["lockSha256"], "dependency lock sha256")
    exact_sha(closure["receiptSha256"], "dependency receipt sha256")
    exact_sha(closure["wheelManifestSha256"], "wheel manifest sha256")
    validate_ref(
        request["sourceCodeSecurityReviewRef"],
        "source code security review ref",
    )
    fixture = exact_dict(
        request["deterministicProbeFixture"],
        {
            "artifactRef", "byteLength", "sha256", "mediaType", "width",
            "height", "frameCount", "promptFrameIndex", "fixedTextPrompt",
        },
        "probe fixture",
    )
    validate_ref(fixture["artifactRef"], "probe fixture ref")
    if (
        fixture["mediaType"] != "video/mp4"
        or fixture["promptFrameIndex"] != 0
        or fixture["fixedTextPrompt"] != "person"
        or not isinstance(fixture["frameCount"], int)
        or isinstance(fixture["frameCount"], bool)
        or fixture["frameCount"] < 2
        or fixture["frameCount"] > 64
        or not isinstance(fixture["byteLength"], int)
        or isinstance(fixture["byteLength"], bool)
        or fixture["byteLength"] < 1
        or fixture["byteLength"] > MAX_FIXTURE_BYTES
        or not isinstance(fixture["width"], int)
        or isinstance(fixture["width"], bool)
        or fixture["width"] < 1
        or fixture["width"] > 4096
        or not isinstance(fixture["height"], int)
        or isinstance(fixture["height"], bool)
        or fixture["height"] < 1
        or fixture["height"] > 4096
    ):
        raise ValueError("probe fixture policy changed")
    exact_sha(fixture["sha256"], "probe fixture sha256")
    if fixture["artifactRef"]["contentHash"] != f"sha256:{fixture['sha256']}":
        raise ValueError("probe fixture ref lost exact bytes")
    if (
        source["artifactRef"]["contentHash"] != f"sha256:{source['sha256']}"
        or patched["artifactRef"]["contentHash"]
        != f"sha256:{patched['sha256']}"
        or checkpoint["artifactRef"]["contentHash"]
        != f"sha256:{checkpoint['sha256']}"
    ):
        raise ValueError("qualification artifact refs lost exact bytes")
    runtime = request["runtime"]
    if runtime != {
        "routeId": "a100_80gb_heavy_primary",
        "executionTarget": "google_cloud_vertex_custom_job_a2_ultra",
        "customJobParent": "projects/reeditpro/locations/us-central1",
        "machineType": "a2-ultragpu-1g",
        "accelerator": "nvidia_a100_80gb",
        "vertexAcceleratorType": "NVIDIA_A100_80GB",
        "allocatedGpuCount": 1,
        "replicaCount": 1,
        "baseImageDigest": BASE_IMAGE_DIGEST,
        "pythonVersion": "3.12",
        "torchVersion": "2.10.0+cu128",
        "torchvisionVersion": "0.25.0+cu128",
        "torchcodecVersion": "0.10.0",
        "torchcodecCudaWheelVersion": "0.10.0+cu128",
        "einopsVersion": "0.8.2",
        "pycocotoolsVersion": "2.0.11",
        "ffmpegVersion": "8.0.3",
        "ffmpegNvdecAndCuvidRequired": True,
        "cpuVideoDecodeFallbackAllowed": False,
        "cudaVersion": "12.8",
        "fixedBuilder": "build_sam3_multiplex_video_predictor",
        "maximumTrackedObjects": 16,
        "multiplexCount": 16,
        "useFlashAttention3": False,
        "useRealValuedRope": True,
        "torchCompileEnabled": False,
        "warmupCompilationEnabled": False,
        "strictCheckpointLoadRequired": True,
        "repeatedProbeRunCount": 3,
        "bfloat16AutocastRequired": True,
        "cudaOutputTensorsRequired": True,
        "privateArtifactTransport": (
            "vertex_ai_cloud_storage_fuse_fixed_attempt_scope"
        ),
        "privateArtifactBucket": (
            "reeditpro-production-sam31-qualification-private"
        ),
        "attemptScopeDerivedOnlyFromServerAttemptId": True,
        "networkEgressAllowed": False,
        "runtimeDownloadAllowed": False,
        "developerMachineExecutionAllowed": False,
        "persistentResourceAllowed": False,
        "automaticRetryAllowed": False,
        "minimumIdleInstances": 0,
        "callerCommandModuleClassModelPathUrlOrEnvironmentAccepted": False,
    }:
        raise ValueError("qualification runtime policy changed")
    authority = request["authority"]
    if authority != {
        "sourceCheckpointQualificationOnly": True,
        "legacyBatchRequestCastOrRelabelAllowed": False,
        "imageBuildStarted": False,
        "productionRuntimeDispatchAuthorized": False,
        "customerCreditsMutated": False,
        "customerBillingAuthorityGranted": False,
        "qaApproved": False,
        "publicDeliveryAuthorized": False,
        "productionReady": False,
    }:
        raise ValueError("qualification authority changed")


def verify_artifacts(request: dict[str, Any]) -> tuple[int, str]:
    source_length, source_hash = file_sha256(
        SOURCE_ARCHIVE_PATH, 80 * 1024 * 1024
    )
    patched_length, patched_hash = file_sha256(
        PATCHED_SOURCE_ARCHIVE_PATH, 80 * 1024 * 1024
    )
    _, patch_hash = file_sha256(PATCH_PATH, 1024 * 1024)
    _, patch_receipt_hash = file_sha256(PATCH_RECEIPT_PATH, 1024 * 1024)
    _, dependency_lock_hash = file_sha256(DEPENDENCY_LOCK_PATH, 16 * 1024 * 1024)
    _, dependency_receipt_hash = file_sha256(
        DEPENDENCY_RECEIPT_PATH, 16 * 1024 * 1024
    )
    _, _, wheel_manifest_payload = read_regular_file(
        WHEEL_MANIFEST_HASH_PATH, 256, retain=True
    )
    if wheel_manifest_payload is None:
        raise RuntimeError("qualification wheel manifest hash is unavailable")
    wheel_manifest_hash = wheel_manifest_payload.decode("ascii").strip()
    exact_sha(wheel_manifest_hash, "installed wheel manifest hash")
    source = request["sourceArchive"]
    patched = request["patchedSourceArchive"]
    closure = request["dependencyClosure"]
    if (
        source_length != source["byteLength"]
        or source_hash != source["sha256"]
        or patched_length != patched["byteLength"]
        or patched_hash != patched["sha256"]
        or patch_hash != patched["patchSha256"]
        or patch_receipt_hash
        != patched["patchApplicationReceiptRef"]["contentHash"].removeprefix(
            "sha256:"
        )
        or dependency_lock_hash != closure["lockSha256"]
        or dependency_receipt_hash != closure["receiptSha256"]
        or wheel_manifest_hash != closure["wheelManifestSha256"]
    ):
        raise RuntimeError("qualification build artifacts changed")
    checkpoint_length, checkpoint_hash = file_sha256(
        CHECKPOINT_PATH, MAX_CHECKPOINT_BYTES
    )
    fixture_length, fixture_hash = file_sha256(FIXTURE_PATH, MAX_FIXTURE_BYTES)
    if (
        checkpoint_length != request["checkpoint"]["byteLength"]
        or checkpoint_hash != request["checkpoint"]["sha256"]
        or fixture_length != request["deterministicProbeFixture"]["byteLength"]
        or fixture_hash != request["deterministicProbeFixture"]["sha256"]
    ):
        raise RuntimeError("qualification mounted artifacts changed")
    return checkpoint_length, checkpoint_hash


def key_set_digest(keys: list[str]) -> str:
    return sha256_bytes(stable_json_bytes(sorted(keys)))


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
    checkpoint = checkpoint_state_dict(checkpoint)
    normalized = []
    for key in checkpoint.keys():
        if not isinstance(key, str):
            raise RuntimeError("checkpoint key is not text")
        normalized.append(normalize_checkpoint_key(key))
    if len(set(normalized)) != len(normalized):
        raise RuntimeError("checkpoint key normalization collided")
    return sorted(normalized)


def derive_real_rope_runtime_caches(
    torch: Any, checkpoint: Any
) -> tuple[list[str], int]:
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
    return sorted(derived_keys), len(bases)


def load_predictor_once(
    torch: Any,
) -> tuple[Any, list[str], list[str], list[str], list[str], int]:
    from sam3.model_builder import build_sam3_multiplex_video_predictor

    unsafe_globals = torch.serialization.get_unsafe_globals_in_checkpoint(
        str(CHECKPOINT_PATH)
    )
    if unsafe_globals:
        raise RuntimeError("checkpoint contains unsafe serialized globals")
    original_load = torch.load
    load_count = 0
    source_checkpoint_keys: list[str] = []
    checkpoint_keys: list[str] = []
    derived_keys: list[str] = []
    source_complex_rope_buffer_count = 0

    def observed_load(*args: Any, **kwargs: Any) -> Any:
        nonlocal load_count, source_checkpoint_keys, checkpoint_keys
        nonlocal derived_keys, source_complex_rope_buffer_count
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
        source_checkpoint_keys = normalize_checkpoint_keys(loaded)
        derived_keys, source_complex_rope_buffer_count = (
            derive_real_rope_runtime_caches(torch, loaded)
        )
        checkpoint_keys = normalize_checkpoint_keys(loaded)
        return loaded

    torch.load = observed_load
    try:
        predictor = build_sam3_multiplex_video_predictor(
            checkpoint_path=str(CHECKPOINT_PATH),
            max_num_objects=16,
            multiplex_count=16,
            use_fa3=False,
            use_rope_real=True,
            compile=False,
            warm_up=False,
            default_output_prob_thresh=0.5,
            async_loading_frames=True,
            gpu_accelerated_decode=True,
            strict_checkpoint_load=True,
            return_cuda_output_tensors=True,
        )
        install_sam31_multiplex_session_compatibility_guard(predictor)
    finally:
        torch.load = original_load
    if load_count != 1:
        raise RuntimeError("checkpoint was not loaded exactly once")
    model_keys = sorted(predictor.model.state_dict().keys())
    if checkpoint_keys != model_keys:
        raise RuntimeError("strict checkpoint and model key sets differ")
    if set(source_checkpoint_keys).intersection(derived_keys):
        raise RuntimeError("derived RoPE cache was present in source checkpoint")
    if sorted(source_checkpoint_keys + derived_keys) != checkpoint_keys:
        raise RuntimeError("checkpoint augmentation exceeded derived RoPE caches")
    return (
        predictor,
        source_checkpoint_keys,
        checkpoint_keys,
        model_keys,
        derived_keys,
        source_complex_rope_buffer_count,
    )


def run_probe(
    predictor: Any,
    torch: Any,
    request: dict[str, Any],
    ordinal: int,
) -> dict[str, Any]:
    started = time.monotonic_ns()
    cuda_start = torch.cuda.Event(enable_timing=True)
    cuda_end = torch.cuda.Event(enable_timing=True)
    session_id: str | None = None
    frames: list[dict[str, Any]] = []
    object_ids: set[int] = set()
    try:
        response = predictor.handle_request(
            {
                "type": "start_session",
                "resource_path": str(FIXTURE_PATH),
                "offload_video_to_cpu": False,
                "offload_state_to_cpu": False,
            }
        )
        session_id = response["session_id"]
        cuda_start.record()
        predictor.handle_request(
            {
                "type": "add_prompt",
                "session_id": session_id,
                "frame_index": 0,
                "text": "person",
                "output_prob_thresh": 0.5,
            }
        )
        for item in predictor.handle_stream_request(
            {
                "type": "propagate_in_video",
                "session_id": session_id,
                "propagation_direction": "forward",
                "start_frame_index": 0,
                "max_frame_num_to_track": request[
                    "deterministicProbeFixture"
                ]["frameCount"],
                "output_prob_thresh": 0.5,
            }
        ):
            frame_index = int(item["frame_index"])
            outputs = item["outputs"]
            ids = outputs["out_obj_ids"]
            boxes = outputs["out_boxes_xywh"]
            masks = outputs["out_binary_masks"]
            if (
                not torch.is_tensor(ids)
                or not torch.is_tensor(boxes)
                or not torch.is_tensor(masks)
                or masks.device.type != "cuda"
                or masks.dtype != torch.bool
                or masks.ndim != 3
                or len(ids) != len(boxes)
                or len(ids) != len(masks)
            ):
                raise RuntimeError("qualification output tensor contract changed")
            frame_objects = []
            for index in range(len(ids)):
                object_id = int(ids[index].item())
                object_ids.add(object_id)
                mask_bytes = (
                    masks[index]
                    .detach()
                    .to(device="cpu", non_blocking=False)
                    .contiguous()
                    .numpy()
                    .tobytes(order="C")
                )
                frame_objects.append(
                    {
                        "objectId": object_id,
                        "boxXywh": [float(value) for value in boxes[index].tolist()],
                        "maskSha256": sha256_bytes(mask_bytes),
                    }
                )
            frames.append(
                {"frameIndex": frame_index, "objects": frame_objects}
            )
        cuda_end.record()
        torch.cuda.synchronize(0)
        cuda_ms = max(1, round(cuda_start.elapsed_time(cuda_end)))
    finally:
        if session_id is not None:
            predictor.handle_request(
                {
                    "type": "close_session",
                    "session_id": session_id,
                    "run_gc_collect": True,
                }
            )
    expected_frames = request["deterministicProbeFixture"]["frameCount"]
    if (
        len(frames) != expected_frames
        or [frame["frameIndex"] for frame in frames] != list(range(expected_frames))
        or not object_ids
        or len(object_ids) > 16
    ):
        raise RuntimeError("qualification probe coverage changed")
    digest = sha256_bytes(stable_json_bytes(frames))
    wall_ms = max(1, (time.monotonic_ns() - started) // 1_000_000)
    return {
        "runOrdinal": ordinal,
        "sessionStarted": True,
        "promptAdded": True,
        "completeForwardPropagationExecuted": True,
        "sessionClosed": True,
        "emittedFrameCount": len(frames),
        "emittedObjectCount": len(object_ids),
        "outputMaskShapeMatchedProbeFrames": True,
        "outputObjectIdsMatchedProbePrompt": True,
        "outputMasksWereCudaTensorsBeforeDigest": True,
        "outputDigestSha256": digest,
        "wallTimeMilliseconds": int(wall_ms),
        "cudaInferenceMilliseconds": int(cuda_ms),
    }


def execute(request: dict[str, Any]) -> dict[str, Any]:
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        raise RuntimeError("qualification worker must run as fixed non-root")
    checkpoint_length, checkpoint_hash = verify_artifacts(request)
    import torch
    import torchvision
    import torchcodec

    if (
        sys.version_info[:2] != (3, 12)
        or torch.__version__ != "2.10.0+cu128"
        or torchvision.__version__ != "0.25.0+cu128"
        or importlib.metadata.version("torchcodec") != "0.10.0+cu128"
        or importlib.metadata.version("einops") != "0.8.2"
        or torch.version.cuda != "12.8"
        or not torch.cuda.is_available()
        or not torch.cuda.is_bf16_supported()
        or torch.cuda.device_count() != 1
    ):
        raise RuntimeError("qualification CUDA dependency closure changed")
    properties = torch.cuda.get_device_properties(0)
    if "A100" not in properties.name or properties.total_memory < 79_000_000_000:
        raise RuntimeError("qualification requires one A100 80 GB GPU")
    verify_ffmpeg_nvdec_runtime()
    install_torchcodec_gpu_decode_guard()
    torch.use_deterministic_algorithms(True)
    torch.backends.cuda.matmul.allow_tf32 = False
    torch.backends.cudnn.allow_tf32 = False
    with torch.inference_mode(), torch.autocast(
        device_type="cuda",
        dtype=torch.bfloat16,
        enabled=True,
        cache_enabled=False,
    ):
        (
            predictor,
            source_checkpoint_keys,
            checkpoint_keys,
            model_keys,
            derived_rope_cache_keys,
            source_complex_rope_buffer_count,
        ) = load_predictor_once(torch)
        runs = [run_probe(predictor, torch, request, ordinal) for ordinal in range(1, 4)]
    digests = {run["outputDigestSha256"] for run in runs}
    if len(digests) != 1:
        raise RuntimeError("qualification probe output was not deterministic")
    if not GPU_DECODE_BACKEND_OBSERVATIONS:
        raise RuntimeError("qualification observed no CUDA/NVDEC video decode")
    checkpoint_length_after, checkpoint_hash_after = file_sha256(
        CHECKPOINT_PATH, MAX_CHECKPOINT_BYTES
    )
    if (
        checkpoint_length_after != checkpoint_length
        or checkpoint_hash_after != checkpoint_hash
    ):
        raise RuntimeError("checkpoint changed during qualification")
    completed_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    payload = {
        "schemaVersion": RESULT_VERSION,
        "source": (
            "fixed_sam3_1_vertex_a100_source_checkpoint_qualification_worker"
        ),
        "evidenceClass": "canonical_private_reread",
        "qualificationId": request["qualificationId"],
        "qualificationVersion": 2,
        "attemptId": ATTEMPT_ID,
        "attemptDigestSha256": ATTEMPT_DIGEST_SHA256,
        "operationId": OPERATION_ID,
        "requestRef": {
            "id": request["qualificationId"],
            "version": 2,
            "schemaVersion": REQUEST_VERSION,
            "contentHash": f"sha256:{request['requestHash']}",
        },
        "candidateRef": request["candidateRef"],
        "ingestReceiptRef": request["ingestReceiptRef"],
        "qualificationImage": {
            "artifactRef": request["qualificationImage"]["artifactRef"],
            "immutableImageDigest": request["qualificationImage"][
                "immutableImageDigest"
            ],
            "supplyChainReleaseRef": request["qualificationImage"][
                "supplyChainReleaseRef"
            ],
        },
        "artifactVerification": {
            "exactSourceArchiveReread": True,
            "exactPatchedSourceArchiveReread": True,
            "exactCheckpointRereadBeforeAndAfter": True,
            "exactDependencyWheelAndNativeClosureReread": True,
            "sourcePatchApplicationReceiptReread": True,
            "deterministicProbeFixtureReread": True,
            "weightsOnlyCheckpointInspectionExecuted": True,
            "unsafeCheckpointGlobalCount": 0,
        },
        "runtime": {
            "routeId": "a100_80gb_heavy_primary",
            "executionTarget": "google_cloud_vertex_custom_job_a2_ultra",
            "machineType": "a2-ultragpu-1g",
            "accelerator": "nvidia_a100_80gb",
            "allocatedGpuCount": 1,
            "observedGpuName": properties.name,
            "observedGpuTotalMemoryBytes": int(properties.total_memory),
            "baseImageDigest": BASE_IMAGE_DIGEST,
            "pythonVersion": "3.12",
            "torchVersion": torch.__version__,
            "torchvisionVersion": torchvision.__version__,
            "torchcodecVersion": "0.10.0",
            "torchcodecCudaWheelVersion": importlib.metadata.version(
                "torchcodec"
            ),
            "einopsVersion": importlib.metadata.version("einops"),
            "pycocotoolsVersion": importlib.metadata.version("pycocotools"),
            "ffmpegVersion": "8.0.3",
            "ffmpegNvdecAndCuvidAvailable": True,
            "gpuVideoDecodeBackendStatusVerified": True,
            "cpuVideoDecodeFallbackObserved": False,
            "cudaVersion": torch.version.cuda,
            "fixedBuilder": "build_sam3_multiplex_video_predictor",
            "privateArtifactTransport": (
                "vertex_ai_cloud_storage_fuse_fixed_attempt_scope"
            ),
            "exactAttemptScopeDerivedFromServerAttemptId": True,
            "requestCheckpointAndFixtureRereadFromPrivateGenerationBoundScope": (
                True
            ),
            "resultCreatedOnceInExactPrivateAttemptScope": True,
            "networkEgressObserved": False,
            "developerMachineExecutionObserved": False,
            "cpuOnlyModelExecutionObserved": False,
            "quantizationOrResolutionReductionUsed": False,
            "providerInferenceExecuted": False,
            "bfloat16AutocastExecuted": True,
            "persistentResourceObserved": False,
        },
        "strictLoad": {
            "fixedBuilderImportedFromPinnedSource": True,
            "fixedBuilderCalledExactlyOnce": True,
            "checkpointLoadedExactlyOnce": True,
            "strictCheckpointLoadRequested": True,
            "missingCheckpointKeyCount": 0,
            "unexpectedCheckpointKeyCount": 0,
            "sourceCheckpointKeyCount": len(source_checkpoint_keys),
            "sourceCheckpointKeySetSha256": key_set_digest(
                source_checkpoint_keys
            ),
            "deterministicRuntimeBufferDerivationPolicy": (
                REAL_ROPE_CACHE_DERIVATION_POLICY
            ),
            "sourceComplexRopeBufferCount": source_complex_rope_buffer_count,
            "derivedRuntimeBufferKeyCount": len(derived_rope_cache_keys),
            "derivedRuntimeBufferKeySetSha256": key_set_digest(
                derived_rope_cache_keys
            ),
            "derivedRuntimeBufferValuesMatchedSourceComplexBuffers": True,
            "sourceCheckpointFileMutated": False,
            "learnedParameterOrCheckpointWeightSynthesized": False,
            "checkpointKeyCount": len(checkpoint_keys),
            "modelStateKeyCount": len(model_keys),
            "checkpointKeySetSha256": key_set_digest(checkpoint_keys),
            "modelStateKeySetSha256": key_set_digest(model_keys),
            "checkpointAndModelKeySetsExact": True,
        },
        "deterministicRuns": runs,
        "deterministicOutputDigestSha256": next(iter(digests)),
        "deterministicOutputDigestMatchedEveryRun": True,
        "actualCudaModelInferenceExecuted": True,
        "completedAt": completed_at,
        "authority": {
            "qualificationEvidenceOnly": True,
            "legacyBatchResultCastOrRelabelAllowed": False,
            "imageBuildStarted": False,
            "productionRuntimeDispatchAuthorized": False,
            "customerCreditsMutated": False,
            "customerBillingAuthorityGranted": False,
            "qaApproved": False,
            "publicDeliveryAuthorized": False,
            "productionReady": False,
        },
    }
    return {**payload, "resultHash": sha256_bytes(stable_json_bytes(payload))}


def write_result(result: dict[str, Any]) -> None:
    payload = stable_json_bytes(result)
    if len(payload) > MAX_RESULT_BYTES:
        raise RuntimeError("qualification result exceeded its byte bound")
    if RESULT_PATH.parent.is_symlink() or not RESULT_PATH.parent.is_dir():
        raise RuntimeError("qualification result directory is unavailable")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(RESULT_PATH, flags, 0o600)
    try:
        view = memoryview(payload)
        while view:
            written = os.write(descriptor, view)
            if written <= 0:
                raise RuntimeError("qualification result write stopped")
            view = view[written:]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def main() -> None:
    if len(sys.argv) != 1 or os.environ.get("PYTHONPATH"):
        raise RuntimeError("qualification worker accepts no arguments or PYTHONPATH")
    request = read_request()
    write_result(execute(request))


if __name__ == "__main__":
    main()
