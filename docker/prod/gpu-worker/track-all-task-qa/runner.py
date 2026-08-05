#!/usr/bin/env python3
"""Fixed CUDA-only Track All mask QA worker.

The worker accepts one server-created task at a fixed private mount, rereads
the exact SAM 3.1 mask manifest and every requested PNG, performs substantive
measurements with Torch/Kornia CUDA, cross-checks every mask with OpenCV CUDA,
and creates one response. It has no caller-selected path, command, model, URL,
or runtime download surface.
"""

from __future__ import annotations

import hashlib
from io import BytesIO
import json
import math
import os
import re
import stat
import sys
import threading
import time
from pathlib import Path
from typing import Any


REQUEST_VERSION = "canonical-track-all-sam3_1-l4-task-qa-worker-request-v2"
RESPONSE_VERSION = "canonical-track-all-sam3_1-l4-task-qa-worker-response-v2"
OPERATION_ID = "tool.kornia.refine_mask.v1"
EXPECTED_UID = 65532
EXPECTED_GID = 65532
MAXIMUM_MANIFEST_BYTES = 64 * 1024 * 1024
MAXIMUM_MASK_BYTES = 512 * 1024 * 1024
MAXIMUM_RESPONSE_BYTES = 16 * 1024 * 1024
MAXIMUM_SUBJECTS = 16
MAXIMUM_FRAMES = 240
MAXIMUM_PIXELS = 67_108_864
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")

L4_INVOCATION_ROOT: Path
SAM31_INVOCATION_ROOT: Path
TASK_QA_ROOT: Path
TASK_PATH: Path
MANIFEST_PATH: Path
MASK_ROOT: Path
RESPONSE_PATH: Path
stage = "request_validation"


def stable_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def exact_object(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value.keys()) != keys:
        raise ValueError(f"{label} has an invalid closed shape")
    return value


def exact_id(value: Any, label: str) -> str:
    if (
        not isinstance(value, str)
        or not SAFE_ID.fullmatch(value)
        or ".." in value
    ):
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


def exact_bool(value: Any, expected: bool, label: str) -> bool:
    if value is not expected:
        raise ValueError(f"{label} is invalid")
    return expected


def exact_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SHA256.fullmatch(value):
        raise ValueError(f"{label} is invalid")
    return value


def exact_ref(value: Any, label: str) -> dict[str, Any]:
    ref = exact_object(value, {"id", "version", "contentHash"}, label)
    exact_id(ref["id"], f"{label} id")
    exact_int(ref["version"], 1, 2**53 - 1, f"{label} version")
    if (
        not isinstance(ref["contentHash"], str)
        or not PREFIXED_SHA256.fullmatch(ref["contentHash"])
    ):
        raise ValueError(f"{label} content hash is invalid")
    return ref


def exact_frame_range(value: Any, label: str) -> dict[str, int]:
    frame_range = exact_object(value, {"startFrame", "endFrameExclusive"}, label)
    start = exact_int(frame_range["startFrame"], 0, 2**53 - 1, f"{label} start")
    end = exact_int(frame_range["endFrameExclusive"], 1, 2**53 - 1, f"{label} end")
    if end <= start or end - start > MAXIMUM_FRAMES:
        raise ValueError(f"{label} is empty or exceeds its bound")
    return {"startFrame": start, "endFrameExclusive": end}


def validate_subject(value: Any, source_mapping_ref: dict[str, Any]) -> dict[str, Any]:
    subject = exact_object(
        value,
        {
            "subjectRequestId", "subjectEvidenceId", "subjectRole",
            "maskObjectId", "canonicalFrameRange", "maskFrameRange",
            "trackManifestRef", "anchorManifestRef", "sourceFrameMappingRef",
            "outputFrameDigestSha256",
        },
        "subject binding",
    )
    exact_id(subject["subjectRequestId"], "subject request id")
    exact_id(subject["subjectEvidenceId"], "subject evidence id")
    if subject["subjectRole"] not in {
        "primary_speaker", "secondary_speaker", "hand", "product",
        "important_object", "environmental_surface",
    }:
        raise ValueError("subject role is invalid")
    exact_int(subject["maskObjectId"], 0, 2**31 - 1, "mask object id")
    canonical_range = exact_frame_range(
        subject["canonicalFrameRange"], "canonical subject frame range"
    )
    mask_range = exact_frame_range(subject["maskFrameRange"], "mask subject frame range")
    if (
        canonical_range["endFrameExclusive"] - canonical_range["startFrame"]
        != mask_range["endFrameExclusive"] - mask_range["startFrame"]
    ):
        raise ValueError("canonical and mask subject frame counts differ")
    exact_ref(subject["trackManifestRef"], "track manifest ref")
    if subject["anchorManifestRef"] is not None:
        exact_ref(subject["anchorManifestRef"], "anchor manifest ref")
    if exact_ref(subject["sourceFrameMappingRef"], "source frame mapping ref") != source_mapping_ref:
        raise ValueError("subject source-frame mapping changed")
    exact_sha(subject["outputFrameDigestSha256"], "output frame digest")
    return subject


def validate_request(value: Any, l4_invocation_id: str) -> dict[str, Any]:
    request = exact_object(
        value,
        {
            "schemaVersion", "operationId", "l4InvocationId",
            "sam31InvocationId", "sam31TaskRef",
            "sam31RuntimeRequestBindingSha256",
            "sam31RuntimeResultAdmissionRef", "sam31MaskManifestRef",
            "l4ExecutionEnvelopeRef", "approvedWorkItemRef", "workerLeaseRef",
            "executionAttemptRef", "sourceFrameMappingRef",
            "confirmedOutputFrameRef", "sourceWidth", "sourceHeight",
            "maskFrameRange", "expectedMaskManifestByteLength",
            "expectedMaskManifestSha256", "expectedMaskPngCount", "subjects",
            "executionPolicy", "byteFreeRequest",
            "callerPathUrlCommandCodeOrEnvironmentAccepted",
            "browserOrCallerMeasurementAccepted", "requestBindingSha256",
        },
        "task QA request",
    )
    if request["schemaVersion"] != REQUEST_VERSION or request["operationId"] != OPERATION_ID:
        raise ValueError("task QA request identity changed")
    if exact_id(request["l4InvocationId"], "L4 invocation id") != l4_invocation_id:
        raise ValueError("task QA L4 invocation differs from the environment")
    sam31_invocation_id = exact_id(
        request["sam31InvocationId"], "SAM 3.1 invocation id"
    )
    if sam31_invocation_id == l4_invocation_id:
        raise ValueError("L4 and SAM 3.1 invocation identities were collapsed")
    for key in (
        "sam31TaskRef", "sam31RuntimeResultAdmissionRef", "sam31MaskManifestRef",
        "l4ExecutionEnvelopeRef", "approvedWorkItemRef", "workerLeaseRef",
        "executionAttemptRef", "sourceFrameMappingRef", "confirmedOutputFrameRef",
    ):
        exact_ref(request[key], key)
    if request["l4ExecutionEnvelopeRef"]["id"] != l4_invocation_id:
        raise ValueError("L4 execution envelope and invocation differ")
    exact_sha(
        request["sam31RuntimeRequestBindingSha256"],
        "SAM 3.1 runtime-request binding",
    )
    width = exact_int(request["sourceWidth"], 1, 16_384, "source width")
    height = exact_int(request["sourceHeight"], 1, 16_384, "source height")
    if width * height > 67_108_864:
        raise ValueError("source pixel count exceeds its bound")
    frame_range = exact_frame_range(request["maskFrameRange"], "mask frame range")
    manifest_length = exact_int(
        request["expectedMaskManifestByteLength"], 1,
        MAXIMUM_MANIFEST_BYTES, "mask manifest length",
    )
    del manifest_length
    manifest_hash = exact_sha(
        request["expectedMaskManifestSha256"], "mask manifest hash"
    )
    if request["sam31MaskManifestRef"]["contentHash"] != f"sha256:{manifest_hash}":
        raise ValueError("mask manifest ref differs from its expected hash")
    subjects = request["subjects"]
    if not isinstance(subjects, list) or not 1 <= len(subjects) <= MAXIMUM_SUBJECTS:
        raise ValueError("subject set is invalid")
    subjects = [
        validate_subject(subject, request["sourceFrameMappingRef"])
        for subject in subjects
    ]
    keys = {
        (subject["subjectRequestId"], subject["subjectEvidenceId"], subject["maskObjectId"])
        for subject in subjects
    }
    object_ids = {subject["maskObjectId"] for subject in subjects}
    if len(keys) != len(subjects) or len(object_ids) != len(subjects):
        raise ValueError("subject bindings are duplicated")
    for subject in subjects:
        if subject["maskFrameRange"] != frame_range:
            raise ValueError("subject mask frame range changed")
        if (
            subject["outputFrameDigestSha256"]
            != request["confirmedOutputFrameRef"]["contentHash"][7:]
        ):
            raise ValueError("subject output-frame authority changed")
    if frame_range["startFrame"] != 0 or frame_range["endFrameExclusive"] > MAXIMUM_FRAMES:
        raise ValueError("mask frame range is not canonical proxy-relative time")
    expected_count = (frame_range["endFrameExclusive"] - frame_range["startFrame"]) * len(subjects)
    if exact_int(request["expectedMaskPngCount"], 1, MAXIMUM_SUBJECTS * MAXIMUM_FRAMES, "mask PNG count") != expected_count:
        raise ValueError("mask PNG count differs from the complete subject range")
    policy = exact_object(
        request["executionPolicy"],
        {
            "routeId", "gpuProfileId", "accelerator", "korniaVersion",
            "torchVersion", "cudaRuntimeVersion", "morphologyKernelSize",
            "binaryThreshold", "everyManifestMaskMustBeReread",
            "everyRequestedFrameAndSubjectMustBeMeasured",
            "korniaCudaSubstantiveMeasurementRequired",
            "opencvCudaEveryMaskCrosscheckRequired",
            "cpuDecodeAndBoundedSerializationOnly",
            "cpuOnlySubstantiveMaskQaAllowed", "runtimeDownloadAllowed",
            "automaticRetryAfterUnknownOutcomeAllowed",
        },
        "execution policy",
    )
    expected_policy = {
        "routeId": "l4_standard_primary",
        "gpuProfileId": "quality_l4_user_triggered_standard_media_job_v1",
        "accelerator": "nvidia_l4",
        "korniaVersion": "0.8.3",
        "torchVersion": "2.10.0+cu128",
        "cudaRuntimeVersion": "12.8",
        "morphologyKernelSize": 3,
        "binaryThreshold": 127,
        "everyManifestMaskMustBeReread": True,
        "everyRequestedFrameAndSubjectMustBeMeasured": True,
        "korniaCudaSubstantiveMeasurementRequired": True,
        "opencvCudaEveryMaskCrosscheckRequired": True,
        "cpuDecodeAndBoundedSerializationOnly": True,
        "cpuOnlySubstantiveMaskQaAllowed": False,
        "runtimeDownloadAllowed": False,
        "automaticRetryAfterUnknownOutcomeAllowed": False,
    }
    if policy != expected_policy:
        raise ValueError("task QA execution policy changed")
    exact_bool(request["byteFreeRequest"], True, "byte-free request")
    exact_bool(request["callerPathUrlCommandCodeOrEnvironmentAccepted"], False, "caller execution input")
    exact_bool(request["browserOrCallerMeasurementAccepted"], False, "browser measurement")
    binding = exact_sha(request["requestBindingSha256"], "request binding")
    payload = dict(request)
    del payload["requestBindingSha256"]
    if binding != sha256_bytes(stable_json_bytes(payload)):
        raise ValueError("task QA request binding changed")
    return request


def configure_l4_paths(l4_invocation_id: str) -> None:
    global L4_INVOCATION_ROOT, TASK_QA_ROOT, TASK_PATH, RESPONSE_PATH
    base = Path("/mnt/reeditpro/private/canonical-professional-gpu/sam3_1/v1/invocations")
    L4_INVOCATION_ROOT = base / l4_invocation_id
    TASK_QA_ROOT = L4_INVOCATION_ROOT / "task-qa"
    TASK_PATH = TASK_QA_ROOT / "task.json"
    RESPONSE_PATH = TASK_QA_ROOT / "response.json"
    for path in (L4_INVOCATION_ROOT, TASK_QA_ROOT):
        if path.is_symlink() or not path.is_dir():
            raise RuntimeError("fixed task QA private mount layout is unavailable")
    if RESPONSE_PATH.exists() or RESPONSE_PATH.is_symlink():
        raise RuntimeError("task QA response already exists")


def configure_sam31_input_paths(sam31_invocation_id: str) -> None:
    global SAM31_INVOCATION_ROOT, MANIFEST_PATH, MASK_ROOT
    base = Path("/mnt/reeditpro/private/canonical-professional-gpu/sam3_1/v1/invocations")
    SAM31_INVOCATION_ROOT = base / sam31_invocation_id
    MASK_ROOT = SAM31_INVOCATION_ROOT / "output"
    MANIFEST_PATH = MASK_ROOT / "mask-manifest.json"
    for path in (SAM31_INVOCATION_ROOT, MASK_ROOT):
        if path.is_symlink() or not path.is_dir():
            raise RuntimeError("fixed SAM 3.1 private output layout is unavailable")


def read_bounded(path: Path, maximum: int) -> bytes:
    descriptor = os.open(
        path,
        os.O_RDONLY
        | getattr(os, "O_CLOEXEC", 0)
        | getattr(os, "O_NOFOLLOW", 0),
    )
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode) or not 1 <= before.st_size <= maximum:
            raise RuntimeError("private input byte bound or type failed")
        chunks: list[bytes] = []
        observed = 0
        while True:
            chunk = os.read(descriptor, min(1024 * 1024, maximum + 1 - observed))
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum:
                raise RuntimeError("private input byte bound failed")
            chunks.append(chunk)
        after = os.fstat(descriptor)
        if (
            before.st_dev != after.st_dev
            or before.st_ino != after.st_ino
            or before.st_size != after.st_size
            or before.st_mtime_ns != after.st_mtime_ns
            or observed != before.st_size
        ):
            raise RuntimeError("private input changed during exact reread")
        return b"".join(chunks)
    finally:
        os.close(descriptor)


def read_task(l4_invocation_id: str) -> dict[str, Any]:
    encoded = read_bounded(TASK_PATH, MAXIMUM_RESPONSE_BYTES)
    value = json.loads(encoded.decode("utf-8"))
    task = exact_object(value, {"runtimeRequest"}, "task QA task")
    return validate_request(task["runtimeRequest"], l4_invocation_id)


def validate_manifest(value: Any, request: dict[str, Any]) -> dict[str, Any]:
    manifest = exact_object(
        value,
        {
            "schemaVersion", "operationId", "requestBindingSha256",
            "sourceFrameRangeMappingRef", "width", "height", "firstFrameIndex",
            "lastFrameIndex", "frames", "masks",
        },
        "SAM mask manifest",
    )
    if (
        manifest["schemaVersion"] != "canonical-sam3_1-mask-sequence-manifest-v1"
        or manifest["operationId"] != "tool.sam3_1.segment_and_track_subject.v1"
        or manifest["requestBindingSha256"]
        != request["sam31RuntimeRequestBindingSha256"]
        or manifest["sourceFrameRangeMappingRef"] != request["sourceFrameMappingRef"]
        or manifest["width"] != request["sourceWidth"]
        or manifest["height"] != request["sourceHeight"]
    ):
        raise ValueError("SAM mask manifest lineage or geometry changed")
    mask_range = request["maskFrameRange"]
    if (
        manifest["firstFrameIndex"] != mask_range["startFrame"]
        or manifest["lastFrameIndex"] != mask_range["endFrameExclusive"] - 1
    ):
        raise ValueError("SAM mask manifest range changed")
    if not isinstance(manifest["frames"], list) or not isinstance(manifest["masks"], list):
        raise ValueError("SAM mask manifest arrays are invalid")
    return manifest


def load_manifest(request: dict[str, Any]) -> tuple[dict[str, Any], bytes]:
    encoded = read_bounded(MANIFEST_PATH, MAXIMUM_MANIFEST_BYTES)
    if (
        len(encoded) != request["expectedMaskManifestByteLength"]
        or sha256_bytes(encoded) != request["expectedMaskManifestSha256"]
    ):
        raise RuntimeError("SAM mask manifest bytes changed")
    return validate_manifest(json.loads(encoded.decode("utf-8")), request), encoded


def validate_cuda_driver_library() -> dict[str, str]:
    from pynvml import nvmlInit, nvmlShutdown, nvmlSystemGetDriverVersion

    nvmlInit()
    try:
        observed = nvmlSystemGetDriverVersion()
    finally:
        nvmlShutdown()
    if isinstance(observed, bytes):
        observed = observed.decode("ascii", errors="strict")
    if not isinstance(observed, str) or not re.fullmatch(r"[0-9]+(?:\.[0-9]+){1,3}", observed):
        raise RuntimeError("NVIDIA driver version is malformed")
    mode = os.environ.get("WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE")
    if os.environ.get("WEEDITPRO_OBSERVED_NVIDIA_DRIVER_VERSION") != observed:
        raise RuntimeError("entrypoint and runtime NVIDIA versions differ")
    major = int(observed.split(".", maxsplit=1)[0])
    expected_mode = "cuda_compat_12_8" if 535 <= major < 570 else (
        "host_driver" if major >= 570 else "unsupported"
    )
    if mode != expected_mode or expected_mode == "unsupported":
        raise RuntimeError("CUDA driver-library mode is unsupported")
    paths: set[str] = set()
    with Path("/proc/self/maps").open("r", encoding="utf-8") as maps:
        for line in maps:
            path = line.rstrip().split(maxsplit=5)[-1]
            if path.startswith("/") and "/libcuda.so" in path:
                paths.add(path)
    if len(paths) != 1:
        raise RuntimeError("exactly one CUDA driver library must be loaded")
    return {
        "observedNvidiaDriverVersion": observed,
        "cudaDriverLibraryMode": expected_mode,
        "observedCudaDriverLibraryPathDigestSha256": sha256_bytes(next(iter(paths)).encode()),
    }


class GpuSampler:
    def __init__(self) -> None:
        self.stop = threading.Event()
        self.samples: list[int] = []
        self.error: Exception | None = None
        self.thread: threading.Thread | None = None

    def start(self) -> None:
        def sample() -> None:
            try:
                from pynvml import (
                    nvmlDeviceGetHandleByIndex, nvmlDeviceGetUtilizationRates,
                    nvmlInit, nvmlShutdown,
                )
                nvmlInit()
                try:
                    handle = nvmlDeviceGetHandleByIndex(0)
                    while not self.stop.is_set():
                        self.samples.append(int(nvmlDeviceGetUtilizationRates(handle).gpu))
                        self.stop.wait(0.01)
                finally:
                    nvmlShutdown()
            except Exception as error:
                self.error = error
        self.thread = threading.Thread(target=sample, daemon=True)
        self.thread.start()

    def finish(self) -> int:
        self.stop.set()
        if self.thread is not None:
            self.thread.join(timeout=5)
        if self.error is not None or not self.samples or max(self.samples) <= 0:
            raise RuntimeError("GPU utilization evidence is unavailable")
        return max(self.samples)


def admit_l4(torch: Any, cv2: Any, kornia: Any) -> dict[str, Any]:
    if (
        not torch.cuda.is_available()
        or torch.__version__ != "2.10.0+cu128"
        or torch.version.cuda != "12.8"
        or kornia.__version__ != "0.8.3"
    ):
        raise RuntimeError("pinned CUDA/Kornia runtime changed")
    if os.environ.get("WEEDITPRO_GPU_ACCELERATOR_CLASS") != "nvidia_l4":
        raise RuntimeError("task QA requires the exact L4 accelerator class")
    name = torch.cuda.get_device_name(0)
    properties = torch.cuda.get_device_properties(0)
    if (
        "L4" not in name.upper()
        or (properties.major, properties.minor) != (8, 9)
        or properties.total_memory < 20 * 1024**3
        or properties.total_memory > 30 * 1024**3
    ):
        raise RuntimeError("observed CUDA device is not the qualified NVIDIA L4")
    if cv2.cuda.getCudaEnabledDeviceCount() != 1:
        raise RuntimeError("OpenCV CUDA did not observe exactly one L4")
    cv2.cuda.setDevice(0)
    driver = validate_cuda_driver_library()
    return {
        "requestedAccelerator": "nvidia_l4",
        "observedDeviceNameDigestSha256": sha256_bytes(name.encode("utf-8")),
        **driver,
        "observedCudaRuntimeVersion": "12.8",
        "observedTorchVersion": torch.__version__,
        "observedKorniaVersion": kornia.__version__,
        "observedOpenCvVersion": cv2.__version__,
        "observedComputeCapabilityMajor": properties.major,
        "observedComputeCapabilityMinor": properties.minor,
        "observedTotalDeviceMemoryBytes": properties.total_memory,
        "maximumObservedGpuUtilizationPercent": 0,
        "cudaAvailable": True,
        "exactL4DeviceObserved": True,
        "korniaCudaTensorExecutionObserved": True,
        "opencvCudaDeviceCount": 1,
        "opencvCudaEveryMaskCrosschecked": True,
        "torchCudaKernelCount": 0,
        "opencvCudaKernelCount": 0,
        "cpuOnlySubstantiveMaskQaUsed": False,
    }


def decode_mask(record: dict[str, Any], request: dict[str, Any], np: Any) -> tuple[Any, bytes]:
    record = exact_object(
        record,
        {"frameIndex", "objectId", "relativeFileName", "width", "height", "byteLength", "sha256"},
        "SAM mask record",
    )
    frame_index = exact_int(record["frameIndex"], 0, MAXIMUM_FRAMES - 1, "mask frame")
    object_id = exact_int(record["objectId"], 0, 2**31 - 1, "mask object")
    expected_name = f"frame-{frame_index:06d}-object-{object_id:06d}.png"
    if record["relativeFileName"] != expected_name:
        raise RuntimeError("SAM mask filename is not canonical")
    if record["width"] != request["sourceWidth"] or record["height"] != request["sourceHeight"]:
        raise RuntimeError("SAM mask geometry changed")
    expected_length = exact_int(record["byteLength"], 1, MAXIMUM_MASK_BYTES, "mask byte length")
    expected_hash = exact_sha(record["sha256"], "mask hash")
    encoded = read_bounded(MASK_ROOT / expected_name, MAXIMUM_MASK_BYTES)
    if len(encoded) != expected_length or sha256_bytes(encoded) != expected_hash:
        raise RuntimeError("SAM mask PNG bytes changed")
    from PIL import Image, ImageFile

    ImageFile.LOAD_TRUNCATED_IMAGES = False
    Image.MAX_IMAGE_PIXELS = MAXIMUM_PIXELS
    with Image.open(BytesIO(encoded)) as decoded:
        if (
            decoded.format != "PNG"
            or decoded.mode != "L"
            or getattr(decoded, "n_frames", 1) != 1
            or decoded.size != (request["sourceWidth"], request["sourceHeight"])
        ):
            raise RuntimeError("SAM mask PNG encoding or geometry changed")
        decoded.load()
        image = np.asarray(decoded, dtype=np.uint8).copy()
    if image.shape != (request["sourceHeight"], request["sourceWidth"]) or image.dtype != np.uint8:
        raise RuntimeError("SAM mask PNG decode changed")
    unique = np.unique(image)
    if unique.size > 2 or any(int(value) not in {0, 255} for value in unique):
        raise RuntimeError("SAM mask PNG is not binary grayscale")
    return image, encoded


def basis(value: Any, torch: Any) -> int:
    scalar = float(value.detach().item() if torch.is_tensor(value) else value)
    if not math.isfinite(scalar):
        raise RuntimeError("task QA metric is non-finite")
    return max(0, min(10_000, round(scalar * 10_000)))


def execute(request: dict[str, Any]) -> dict[str, Any]:
    global stage
    started = time.monotonic_ns()
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        raise RuntimeError("task QA runner must be non-root")

    stage = "manifest_reread"
    manifest, manifest_bytes = load_manifest(request)
    manifest_masks = manifest["masks"]
    manifest_frames = manifest["frames"]
    if len(manifest_masks) != request["expectedMaskPngCount"]:
        raise RuntimeError("manifest does not contain the complete requested mask set")

    stage = "cuda_admission"
    import cv2
    import kornia
    import numpy as np
    import torch

    gpu = admit_l4(torch, cv2, kornia)
    torch.cuda.reset_peak_memory_stats(0)
    sampler = GpuSampler()
    sampler.start()

    stage = "mask_reread"
    mask_by_key: dict[tuple[int, int], tuple[Any, bytes, dict[str, Any]]] = {}
    total_png_bytes = 0
    decode_started = time.monotonic_ns()
    for record_value in manifest_masks:
        record = exact_object(
            record_value,
            {"frameIndex", "objectId", "relativeFileName", "width", "height", "byteLength", "sha256"},
            "SAM mask record",
        )
        key = (record["frameIndex"], record["objectId"])
        if key in mask_by_key:
            raise RuntimeError("SAM mask manifest contains a duplicate mask")
        image, encoded = decode_mask(record, request, np)
        mask_by_key[key] = (image, encoded, record)
        total_png_bytes += len(encoded)
    decode_upload_ms = max(0, (time.monotonic_ns() - decode_started) // 1_000_000)

    frame_boxes: dict[tuple[int, int], list[float]] = {}
    for frame_value in manifest_frames:
        frame = exact_object(frame_value, {"frameIndex", "objects"}, "SAM frame record")
        frame_index = exact_int(frame["frameIndex"], 0, MAXIMUM_FRAMES - 1, "frame index")
        if not isinstance(frame["objects"], list):
            raise RuntimeError("SAM frame objects are invalid")
        for object_value in frame["objects"]:
            item = exact_object(object_value, {"objectId", "normalizedBoxXywh", "maskSha256"}, "SAM object record")
            object_id = exact_int(item["objectId"], 0, 2**31 - 1, "object id")
            box = item["normalizedBoxXywh"]
            if (
                not isinstance(box, list) or len(box) != 4
                or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or v < 0 or v > 1 for v in box)
            ):
                raise RuntimeError("SAM normalized object box is invalid")
            if (frame_index, object_id) in frame_boxes:
                raise RuntimeError("SAM frame contains a duplicate object")
            frame_boxes[(frame_index, object_id)] = [float(v) for v in box]
            mask = mask_by_key.get((frame_index, object_id))
            if mask is None or mask[2]["sha256"] != item["maskSha256"]:
                raise RuntimeError("SAM frame and mask records differ")

    requested_keys: set[tuple[int, int]] = set()
    measurements: list[dict[str, Any]] = []
    torch_kernel_count = 0
    opencv_kernel_count = 0
    stage = "kornia_cuda_measurement"
    kornia_started = time.monotonic_ns()
    opencv_elapsed_ns = 0
    kornia_evidence: list[dict[str, Any]] = []
    opencv_evidence: list[dict[str, Any]] = []

    for subject in request["subjects"]:
        object_id = subject["maskObjectId"]
        start = subject["maskFrameRange"]["startFrame"]
        end = subject["maskFrameRange"]["endFrameExclusive"]
        arrays: list[Any] = []
        ordered_records: list[dict[str, Any]] = []
        for frame_index in range(start, end):
            key = (frame_index, object_id)
            if key in requested_keys or key not in mask_by_key:
                raise RuntimeError("requested mask is missing or duplicated")
            requested_keys.add(key)
            image, _encoded, record = mask_by_key[key]
            arrays.append(image)
            ordered_records.append({
                "frameIndex": frame_index,
                "objectId": object_id,
                "sha256": record["sha256"],
                "byteLength": record["byteLength"],
            })

        stack_np = np.stack(arrays, axis=0)
        tensor = torch.from_numpy(stack_np).to(device="cuda", dtype=torch.float32).unsqueeze(1) / 255.0
        binary = tensor > 0.5
        kernel = torch.ones((3, 3), device="cuda", dtype=torch.float32)
        cuda_start = torch.cuda.Event(enable_timing=True)
        cuda_end = torch.cuda.Event(enable_timing=True)
        cuda_start.record()
        closed = kornia.morphology.closing(binary.float(), kernel) > 0.5
        eroded = kornia.morphology.erosion(binary.float(), kernel) > 0.5
        dilated = kornia.morphology.dilation(binary.float(), kernel) > 0.5
        closed_eroded = kornia.morphology.erosion(closed.float(), kernel) > 0.5
        closed_dilated = kornia.morphology.dilation(closed.float(), kernel) > 0.5
        area = binary.sum(dim=(1, 2, 3), dtype=torch.float64)
        closed_area = closed.sum(dim=(1, 2, 3), dtype=torch.float64)
        if len(arrays) > 1:
            intersections = (binary[1:] & binary[:-1]).sum(dim=(1, 2, 3), dtype=torch.float64)
            unions = (binary[1:] | binary[:-1]).sum(dim=(1, 2, 3), dtype=torch.float64).clamp_min(1)
            iou = intersections / unions
            flicker = (area[1:] - area[:-1]).abs() / torch.maximum(area[1:], area[:-1]).clamp_min(1)
        else:
            iou = torch.ones((1,), device="cuda", dtype=torch.float64)
            flicker = torch.zeros((1,), device="cuda", dtype=torch.float64)
        y = torch.arange(request["sourceHeight"], device="cuda", dtype=torch.float64).view(1, 1, -1, 1)
        x = torch.arange(request["sourceWidth"], device="cuda", dtype=torch.float64).view(1, 1, 1, -1)
        safe_area = area.clamp_min(1).view(-1, 1, 1, 1)
        centers_x = (binary.to(torch.float64) * x).sum(dim=(1, 2, 3)) / safe_area.flatten()
        centers_y = (binary.to(torch.float64) * y).sum(dim=(1, 2, 3)) / safe_area.flatten()
        diagonal = math.hypot(request["sourceWidth"], request["sourceHeight"])
        if len(arrays) > 1:
            shifts = torch.sqrt((centers_x[1:] - centers_x[:-1]) ** 2 + (centers_y[1:] - centers_y[:-1]) ** 2) / diagonal
        else:
            shifts = torch.zeros((1,), device="cuda", dtype=torch.float64)
        boundary = dilated ^ eroded
        closed_boundary = closed_dilated ^ closed_eroded
        boundary_disagreement = (boundary ^ closed_boundary).sum(dim=(1, 2, 3), dtype=torch.float64) / (boundary | closed_boundary).sum(dim=(1, 2, 3), dtype=torch.float64).clamp_min(1)
        cuda_end.record()
        torch.cuda.synchronize(0)
        kornia_cuda_ms = max(1, round(cuda_start.elapsed_time(cuda_end)))
        torch_kernel_count += 5

        coverage_values: list[float] = []
        identity_swaps = 0
        lost_anchors = 0
        for offset, frame_index in enumerate(range(start, end)):
            box = frame_boxes.get((frame_index, object_id))
            active = int(area[offset].item())
            if box is None or active == 0:
                lost_anchors += 1
                coverage_values.append(0.0)
                continue
            box_area = max(1.0, box[2] * request["sourceWidth"] * box[3] * request["sourceHeight"])
            coverage_values.append(min(1.0, active / box_area))
            cx = float(centers_x[offset].item()) / request["sourceWidth"]
            cy = float(centers_y[offset].item()) / request["sourceHeight"]
            if not (box[0] <= cx <= box[0] + box[2] and box[1] <= cy <= box[1] + box[3]):
                identity_swaps += 1

        stage = "opencv_cuda_crosscheck"
        opencv_started = time.monotonic_ns()
        for offset, image in enumerate(arrays):
            gpu_mat = cv2.cuda_GpuMat()
            gpu_mat.upload(image)
            threshold_result = cv2.cuda.threshold(gpu_mat, 127, 255, cv2.THRESH_BINARY)
            binary_gpu = threshold_result[1] if isinstance(threshold_result, tuple) else threshold_result
            cross_count = int(cv2.cuda.countNonZero(binary_gpu))
            expected_count = int(area[offset].item())
            if cross_count != expected_count:
                raise RuntimeError("OpenCV CUDA and Kornia CUDA mask counts differ")
            opencv_kernel_count += 2
            opencv_evidence.append({
                "frameIndex": start + offset,
                "objectId": object_id,
                "activePixelCount": cross_count,
            })
        opencv_elapsed_ns += time.monotonic_ns() - opencv_started

        measurement = {
            "subjectRequestId": subject["subjectRequestId"],
            "subjectEvidenceId": subject["subjectEvidenceId"],
            "maskObjectId": object_id,
            "measuredFrameCount": len(arrays),
            "expectedFrameCount": end - start,
            "emptyMaskFrameCount": int((area == 0).sum().item()),
            "fullFrameMaskCount": int((area == request["sourceWidth"] * request["sourceHeight"]).sum().item()),
            "minimumBinaryIntersectionOverUnionBasisPoints": basis(iou.min(), torch),
            "maximumNormalizedCentroidShiftBasisPoints": basis(shifts.max(), torch),
            "maximumBoundaryDisagreementBasisPoints": basis(boundary_disagreement.max(), torch),
            "maximumAlphaFlickerBasisPoints": basis(flicker.max(), torch),
            "minimumEdgeQualityBasisPoints": 10_000 - basis(boundary_disagreement.max(), torch),
            "minimumSubjectCoverageBasisPoints": max(0, min(10_000, round(min(coverage_values) * 10_000))),
            "identitySwapCount": identity_swaps,
            "lostAnchorFrameCount": lost_anchors,
            "firstMaskFrameIndex": start,
            "lastMaskFrameIndex": end - 1,
            "maskPngCount": len(arrays),
            "maskPngByteLength": sum(record["byteLength"] for record in ordered_records),
            "orderedMaskSetDigestSha256": sha256_bytes(stable_json_bytes(ordered_records)),
            "completeRequestedRangeCoverage": True,
        }
        measurements.append(measurement)
        kornia_evidence.append({
            "subjectEvidenceId": subject["subjectEvidenceId"],
            "maskObjectId": object_id,
            "korniaCudaMilliseconds": kornia_cuda_ms,
            "closedMaskActivePixelDigestSha256": sha256_bytes(stable_json_bytes([int(value) for value in closed_area.tolist()])),
        })
        stage = "kornia_cuda_measurement"

    if requested_keys != set(mask_by_key.keys()):
        raise RuntimeError("manifest contains an unrequested frame or object")
    maximum_utilization = sampler.finish()
    gpu["maximumObservedGpuUtilizationPercent"] = maximum_utilization
    gpu["torchCudaKernelCount"] = torch_kernel_count
    gpu["opencvCudaKernelCount"] = opencv_kernel_count
    if torch_kernel_count <= 0 or opencv_kernel_count != request["expectedMaskPngCount"] * 2:
        raise RuntimeError("CUDA kernel accounting is incomplete")

    stage = "output_persistence"
    input_evidence = {
        "manifestByteLength": len(manifest_bytes),
        "manifestSha256": sha256_bytes(manifest_bytes),
        "manifestRefExactMatch": True,
        "manifestRequestBindingExactMatch": True,
        "maskPngCount": len(mask_by_key),
        "maskPngByteLength": total_png_bytes,
        "everyManifestMaskPngRereadAndHashed": True,
        "everyRequestedFrameAndSubjectPresentExactlyOnce": True,
        "everyMaskMatchesSourceGeometry": True,
        "everyMaskIsBinaryGrayscalePng": True,
        "unrequestedManifestObjectOrFrameAccepted": False,
    }
    stage = "completed"
    return {
        "schemaVersion": RESPONSE_VERSION,
        "operationId": OPERATION_ID,
        "l4InvocationId": request["l4InvocationId"],
        "sam31InvocationId": request["sam31InvocationId"],
        "requestBindingSha256": request["requestBindingSha256"],
        "status": "completed",
        "terminalStage": "completed",
        "gpuEvidence": gpu,
        "inputEvidence": input_evidence,
        "runtimeMeasurement": {
            "wallTimeMilliseconds": max(1, (time.monotonic_ns() - started) // 1_000_000),
            "decodeAndUploadMilliseconds": int(decode_upload_ms),
            "korniaCudaMilliseconds": max(1, (time.monotonic_ns() - kornia_started - opencv_elapsed_ns) // 1_000_000),
            "opencvCudaCrosscheckMilliseconds": max(1, opencv_elapsed_ns // 1_000_000),
            "peakCudaAllocatedBytes": int(torch.cuda.max_memory_allocated(0)),
            "peakCudaReservedBytes": int(torch.cuda.max_memory_reserved(0)),
        },
        "outputSummary": {
            "subjectMeasurements": measurements,
            "korniaCudaExecutionDigestSha256": sha256_bytes(stable_json_bytes(kornia_evidence)),
            "opencvCudaCrosscheckExecutionDigestSha256": sha256_bytes(stable_json_bytes(opencv_evidence)),
            "completeRequestedFrameAndSubjectCoverage": True,
            "sampledOrRepresentativeOnlyMeasurementAccepted": False,
            "exactMaskManifestAndEveryMaskPngReread": True,
        },
        "failureCode": "none",
        "privateCreateOnlyWorkerOutput": True,
        "runtimeDownloadPerformed": False,
        "cpuOnlySubstantiveMaskQaUsed": False,
        "serverCostReceiptIncluded": False,
        "customerCreditsMutated": False,
        "qaApprovalGranted": False,
        "assetManifestMutated": False,
        "publicDeliveryAuthorized": False,
        "productionAuthorityGranted": False,
    }


def failure_response(
    request: dict[str, Any] | None,
    l4_invocation_id: str | None,
) -> dict[str, Any]:
    failure_code = {
        "request_validation": "request_rejected",
        "manifest_reread": "manifest_mismatch",
        "cuda_admission": "gpu_mismatch",
        "mask_reread": "mask_mismatch",
        "kornia_cuda_measurement": "kornia_cuda_failed",
        "opencv_cuda_crosscheck": "opencv_cuda_failed",
        "output_persistence": "output_failed",
    }.get(stage, "output_failed")
    return {
        "schemaVersion": RESPONSE_VERSION,
        "operationId": OPERATION_ID,
        "l4InvocationId": (
            request["l4InvocationId"] if request is not None
            else l4_invocation_id or "unknown-l4-invocation"
        ),
        "sam31InvocationId": (
            request["sam31InvocationId"] if request is not None
            else "unknown-sam31-invocation"
        ),
        "requestBindingSha256": request["requestBindingSha256"] if request is not None else "0" * 64,
        "status": "failed",
        "terminalStage": stage if stage in {
            "request_validation", "manifest_reread", "cuda_admission",
            "mask_reread", "kornia_cuda_measurement",
            "opencv_cuda_crosscheck", "output_persistence",
        } else "request_validation",
        "gpuEvidence": None,
        "inputEvidence": None,
        "runtimeMeasurement": None,
        "outputSummary": None,
        "failureCode": failure_code,
        "privateCreateOnlyWorkerOutput": False,
        "runtimeDownloadPerformed": False,
        "cpuOnlySubstantiveMaskQaUsed": False,
        "serverCostReceiptIncluded": False,
        "customerCreditsMutated": False,
        "qaApprovalGranted": False,
        "assetManifestMutated": False,
        "publicDeliveryAuthorized": False,
        "productionAuthorityGranted": False,
    }


def persist_response(payload: dict[str, Any]) -> str:
    payload["responseBindingSha256"] = sha256_bytes(stable_json_bytes(payload))
    encoded = stable_json_bytes(payload)
    if len(encoded) > MAXIMUM_RESPONSE_BYTES:
        raise RuntimeError("task QA response exceeds its bound")
    descriptor = os.open(
        RESPONSE_PATH,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0),
        0o600,
    )
    try:
        view = memoryview(encoded)
        while view:
            written = os.write(descriptor, view)
            if written <= 0:
                raise RuntimeError("task QA response persistence stopped")
            view = view[written:]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    reread = read_bounded(RESPONSE_PATH, MAXIMUM_RESPONSE_BYTES)
    if reread != encoded:
        raise RuntimeError("task QA response reread changed")
    return sha256_bytes(encoded)


def main() -> int:
    request: dict[str, Any] | None = None
    l4_invocation_id: str | None = None
    try:
        l4_invocation_id = exact_id(
            os.environ.get("REEDITPRO_GPU_INVOCATION_ID"), "GPU invocation id"
        )
        configure_l4_paths(l4_invocation_id)
        request = read_task(l4_invocation_id)
        configure_sam31_input_paths(request["sam31InvocationId"])
        response = execute(request)
        exit_code = 0
    except Exception:
        response = failure_response(request, l4_invocation_id)
        exit_code = 1
    response_hash: str | None = None
    try:
        response_hash = persist_response(response)
    except Exception:
        exit_code = 1
    marker = {
        "schemaVersion": "canonical-track-all-sam3_1-l4-task-qa-worker-exit-v2",
        "status": response["status"],
        "responseSha256": response_hash,
        "responsePersisted": response_hash is not None,
    }
    sys.stdout.buffer.write(stable_json_bytes(marker) + b"\n")
    sys.stdout.buffer.flush()
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
