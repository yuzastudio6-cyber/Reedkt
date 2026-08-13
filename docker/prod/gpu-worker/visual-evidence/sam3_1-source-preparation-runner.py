#!/usr/bin/env python3
"""Fixed WeEditPro L4 SAM 3.1 qualification-source preparation runner.

The canonical Node worker stages one immutable private source object and one
closed task. This runner accepts no arguments, stdin, URL, caller path,
command, model, or environment extension. Pixel decode and encode are fixed to
CUDA NVDEC/NVENC. FFprobe is metadata-only. The output is a bounded JSON
manifest; media stays inside the private invocation directory for the Node
owner to create-only publish and exact-reread.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import time
from typing import Any


TASK_VERSION = "canonical-sam3_1-eight-minute-source-gpu-task-v1"
OUTPUT_VERSION = "canonical-sam3_1-eight-minute-source-gpu-output-v1"
SCRATCH_ROOT = Path("/mnt/weeditpro-private/l4-visual-evidence")
FFMPEG = "/usr/local/bin/ffmpeg"
FFPROBE = "/usr/local/bin/ffprobe"
NVIDIA_SMI = "/usr/bin/nvidia-smi"
SOURCE_FRAMES = 11_520
SOURCE_SLICE_FRAMES = 384
CHUNK_FRAMES = 240
CHUNK_STRIDE = 239
CHUNK_COUNT = 49
WIDTH = 3_840
HEIGHT = 2_160
FPS = 24
MAXIMUM_TASK_BYTES = 1024 * 1024
MAXIMUM_SOURCE_BYTES = 10 * 1024 * 1024 * 1024
MAXIMUM_CHUNK_BYTES = 2 * 1024 * 1024 * 1024
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")


def stable_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def sha256_value(value: Any) -> str:
    return hashlib.sha256(stable_json_bytes(value)).hexdigest()


def exact_keys(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ValueError(f"{label} shape invalid")
    return value


def exact_bool(value: Any, expected: bool, label: str) -> bool:
    if value is not expected:
        raise ValueError(f"{label} invalid")
    return value


def exact_int(value: Any, expected: int, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value != expected:
        raise ValueError(f"{label} invalid")
    return value


def bounded_int(value: Any, minimum: int, maximum: int, label: str) -> int:
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < minimum
        or value > maximum
    ):
        raise ValueError(f"{label} invalid")
    return value


def exact_id(value: Any, label: str) -> str:
    if (
        not isinstance(value, str)
        or SAFE_ID.fullmatch(value) is None
        or ".." in value
    ):
        raise ValueError(f"{label} invalid")
    return value


def exact_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or RAW_SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} invalid")
    return value


def exact_ref(value: Any, label: str) -> dict[str, Any]:
    result = exact_keys(value, {"id", "version", "contentHash"}, label)
    exact_id(result["id"], f"{label} id")
    bounded_int(result["version"], 1, 2**31 - 1, f"{label} version")
    if (
        not isinstance(result["contentHash"], str)
        or PREFIXED_SHA256.fullmatch(result["contentHash"]) is None
    ):
        raise ValueError(f"{label} content hash invalid")
    return result


def read_regular_file(path: Path, maximum_bytes: int) -> tuple[int, str]:
    if path.is_symlink():
        raise ValueError("symlink input forbidden")
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags)
    digest = hashlib.sha256()
    observed = 0
    try:
        before = os.fstat(descriptor)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_size < 1
            or before.st_size > maximum_bytes
        ):
            raise ValueError("private file size or type invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum_bytes:
                raise ValueError("private file exceeded bound")
            digest.update(chunk)
        after = os.fstat(descriptor)
        if (
            observed != before.st_size
            or after.st_dev != before.st_dev
            or after.st_ino != before.st_ino
            or after.st_size != before.st_size
            or after.st_mtime_ns != before.st_mtime_ns
        ):
            raise ValueError("private file changed during reread")
        return observed, digest.hexdigest()
    finally:
        os.close(descriptor)


def validate_task(value: Any, invocation_id: str) -> dict[str, Any]:
    task = exact_keys(
        value,
        {
            "schemaVersion",
            "invocationId",
            "qualificationSourceId",
            "qualificationSourcePlanRef",
            "dispatchAdmissionRef",
            "immutableImageRef",
            "toolchainQualificationRef",
            "source",
            "sequence",
            "chunks",
            "policy",
            "taskDigestSha256",
        },
        "task",
    )
    if task["schemaVersion"] != TASK_VERSION:
        raise ValueError("task version invalid")
    if exact_id(task["invocationId"], "invocation") != invocation_id:
        raise ValueError("task invocation mismatch")
    exact_id(task["qualificationSourceId"], "qualification source")
    exact_ref(task["qualificationSourcePlanRef"], "source plan ref")
    exact_ref(task["dispatchAdmissionRef"], "dispatch admission ref")
    exact_ref(task["immutableImageRef"], "immutable image ref")
    exact_ref(task["toolchainQualificationRef"], "toolchain ref")
    source = exact_keys(
        task["source"],
        {
            "sha256",
            "byteLength",
            "width",
            "height",
            "decodedFrameCount",
            "fpsNumerator",
            "fpsDenominator",
            "sliceStartFrameInclusive",
            "sliceEndFrameInclusive",
        },
        "source",
    )
    exact_sha(source["sha256"], "source sha256")
    bounded_int(source["byteLength"], 1, MAXIMUM_SOURCE_BYTES, "source bytes")
    exact_int(source["width"], WIDTH, "source width")
    exact_int(source["height"], HEIGHT, "source height")
    exact_int(source["decodedFrameCount"], 386, "source frames")
    exact_int(source["fpsNumerator"], FPS, "source fps numerator")
    exact_int(source["fpsDenominator"], 1, "source fps denominator")
    exact_int(source["sliceStartFrameInclusive"], 0, "slice start")
    exact_int(
        source["sliceEndFrameInclusive"],
        SOURCE_SLICE_FRAMES - 1,
        "slice end",
    )
    sequence = exact_keys(
        task["sequence"],
        {"sourceFrameCount", "sourceDurationMilliseconds", "repetitionCount"},
        "sequence",
    )
    exact_int(sequence["sourceFrameCount"], SOURCE_FRAMES, "sequence frames")
    exact_int(
        sequence["sourceDurationMilliseconds"],
        480_000,
        "sequence duration",
    )
    exact_int(sequence["repetitionCount"], 30, "repetition count")
    chunks = task["chunks"]
    if not isinstance(chunks, list) or len(chunks) != CHUNK_COUNT:
        raise ValueError("chunk geometry count invalid")
    for index, untrusted in enumerate(chunks):
        chunk = exact_keys(
            untrusted,
            {
                "chunkOrdinal",
                "canonicalStartFrameInclusive",
                "canonicalEndFrameInclusive",
                "overlapWithPreviousFrames",
            },
            "chunk",
        )
        start = index * CHUNK_STRIDE
        end = min(SOURCE_FRAMES - 1, start + CHUNK_FRAMES - 1)
        exact_int(chunk["chunkOrdinal"], index + 1, "chunk ordinal")
        exact_int(chunk["canonicalStartFrameInclusive"], start, "chunk start")
        exact_int(chunk["canonicalEndFrameInclusive"], end, "chunk end")
        exact_int(
            chunk["overlapWithPreviousFrames"],
            0 if index == 0 else 1,
            "chunk overlap",
        )
    policy = exact_keys(
        task["policy"],
        {
            "acceleratorClass",
            "allocatedGpuCount",
            "ffprobeMetadataOnly",
            "ffmpegNvdecAndNvencRequired",
            "sourceAudioRemoved",
            "sourceResolutionReductionAllowed",
            "fullSourceResolutionPreserved",
            "hardwareEncodedQualificationProxy",
            "sourcePixelExactnessClaimAllowed",
            "losslessEncodingClaimAllowed",
            "substantiveCpuMediaProcessingAllowed",
            "runtimeModelOrToolDownloadAllowed",
            "callerPathUrlBytesCommandOrEnvironmentAccepted",
        },
        "policy",
    )
    if policy["acceleratorClass"] != "nvidia_l4":
        raise ValueError("accelerator policy invalid")
    exact_int(policy["allocatedGpuCount"], 1, "GPU count")
    for key in (
        "ffprobeMetadataOnly",
        "ffmpegNvdecAndNvencRequired",
        "sourceAudioRemoved",
        "fullSourceResolutionPreserved",
        "hardwareEncodedQualificationProxy",
    ):
        exact_bool(policy[key], True, key)
    for key in (
        "sourceResolutionReductionAllowed",
        "sourcePixelExactnessClaimAllowed",
        "losslessEncodingClaimAllowed",
        "substantiveCpuMediaProcessingAllowed",
        "runtimeModelOrToolDownloadAllowed",
        "callerPathUrlBytesCommandOrEnvironmentAccepted",
    ):
        exact_bool(policy[key], False, key)
    digest = exact_sha(task["taskDigestSha256"], "task digest")
    without_digest = dict(task)
    del without_digest["taskDigestSha256"]
    if digest != sha256_value(without_digest):
        raise ValueError("task digest mismatch")
    return task


def fixed_invocation() -> tuple[str, Path, Path, Path]:
    if os.getuid() != 65_532 or os.getgid() != 65_532:
        raise ValueError("non-root WeEditPro runtime identity required")
    if set(os.environ).intersection(
        {
            "WEEDITPRO_INPUT_PATH",
            "WEEDITPRO_INPUT_URL",
            "WEEDITPRO_COMMAND",
            "WEEDITPRO_MODEL",
        }
    ):
        raise ValueError("caller-controlled runtime field forbidden")
    invocation_id = exact_id(
        os.environ.get("WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID"),
        "invocation environment",
    )
    root = SCRATCH_ROOT / invocation_id
    if SCRATCH_ROOT.is_symlink() or root.is_symlink():
        raise ValueError("private scratch symlink forbidden")
    if SCRATCH_ROOT.resolve() != SCRATCH_ROOT or root.resolve() != root:
        raise ValueError("private scratch path invalid")
    if not root.is_dir():
        raise ValueError("private invocation root missing")
    return invocation_id, root / "task.json", root / "source.mov", root


def fixed_subprocess(arguments: list[str], timeout_seconds: int) -> str:
    result = subprocess.run(
        arguments,
        check=False,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout_seconds,
        env={
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "HOME": "/nonexistent",
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            "CUDA_VISIBLE_DEVICES": "0",
            "NVIDIA_VISIBLE_DEVICES": "0",
            "NVIDIA_DRIVER_CAPABILITIES": "compute,utility,video",
            "LD_LIBRARY_PATH": (
                "/usr/local/cuda/lib64:/usr/local/cuda/compat:"
                "/usr/local/nvidia/lib64:/usr/local/nvidia/lib"
            ),
        },
        text=True,
    )
    if result.returncode != 0:
        raise ValueError("fixed native tool failed")
    return result.stdout


def verify_l4_device() -> dict[str, Any]:
    output = fixed_subprocess(
        [
            NVIDIA_SMI,
            "--query-gpu=name,uuid,driver_version,pci.bus_id",
            "--format=csv,noheader,nounits",
        ],
        30,
    ).strip()
    rows = [row.strip() for row in output.splitlines() if row.strip()]
    if len(rows) != 1:
        raise ValueError("exactly one GPU required")
    fields = [field.strip() for field in rows[0].split(",")]
    if len(fields) != 4 or fields[0] != "NVIDIA L4":
        raise ValueError("qualified NVIDIA L4 required")
    return {
        "acceleratorClass": "nvidia_l4",
        "deviceName": fields[0],
        "deviceUuid": fields[1],
        "driverVersion": fields[2],
        "pciBusId": fields[3],
        "allocatedGpuCount": 1,
    }


def probe_video(path: Path, expected_frames: int) -> dict[str, Any]:
    raw = fixed_subprocess(
        [
            FFPROBE,
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-count_frames",
            "-show_entries",
            (
                "stream=codec_name,width,height,pix_fmt,avg_frame_rate,"
                "nb_read_frames,color_range,color_space,color_transfer,"
                "color_primaries"
            ),
            "-of",
            "json",
            str(path),
        ],
        120,
    )
    value = json.loads(raw)
    streams = value.get("streams") if isinstance(value, dict) else None
    if not isinstance(streams, list) or len(streams) != 1:
        raise ValueError("prepared video stream unavailable")
    stream = streams[0]
    if (
        not isinstance(stream, dict)
        or stream.get("codec_name") != "h264"
        or stream.get("width") != WIDTH
        or stream.get("height") != HEIGHT
        or stream.get("pix_fmt") != "yuv420p"
        or stream.get("avg_frame_rate") != "24/1"
        or int(stream.get("nb_read_frames", "-1")) != expected_frames
        or stream.get("color_space") != "bt709"
        or stream.get("color_transfer") != "bt709"
        or stream.get("color_primaries") != "bt709"
    ):
        raise ValueError("prepared video technical identity changed")
    return {
        "codecName": "h264",
        "width": WIDTH,
        "height": HEIGHT,
        "pixelFormat": "yuv420p",
        "averageFrameRate": "24/1",
        "decodedFrameCount": expected_frames,
        "colorRange": stream.get("color_range"),
        "colorSpace": "bt709",
        "colorTransfer": "bt709",
        "colorPrimaries": "bt709",
        "metadataOnly": True,
    }


def create_base(source: Path, output: Path) -> None:
    fixed_subprocess(
        [
            FFMPEG,
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-n",
            "-hwaccel",
            "cuda",
            "-hwaccel_output_format",
            "cuda",
            "-i",
            str(source),
            "-map",
            "0:v:0",
            "-an",
            "-frames:v",
            str(SOURCE_SLICE_FRAMES),
            "-vf",
            f"scale_cuda={WIDTH}:{HEIGHT}:format=nv12",
            "-c:v",
            "h264_nvenc",
            "-preset",
            "p7",
            "-tune",
            "hq",
            "-rc",
            "constqp",
            "-qp",
            "20",
            "-g",
            str(FPS),
            "-bf",
            "0",
            "-fps_mode",
            "passthrough",
            "-pix_fmt",
            "yuv420p",
            "-color_range",
            "tv",
            "-colorspace",
            "bt709",
            "-color_trc",
            "bt709",
            "-color_primaries",
            "bt709",
            "-movflags",
            "+faststart",
            str(output),
        ],
        900,
    )


def write_concat_file(path: Path, base_path: Path) -> None:
    if path.exists():
        raise ValueError("concat file already exists")
    # The fixed private path is Node-created and contains only SAFE_ID data.
    body = "".join(f"file '{base_path.name}'\n" for _index in range(2))
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0),
        0o600,
    )
    try:
        os.write(descriptor, body.encode("utf-8"))
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def create_chunk(
    concat_path: Path,
    output: Path,
    canonical_start: int,
    frame_count: int,
) -> None:
    local_start = canonical_start % SOURCE_SLICE_FRAMES
    fixed_subprocess(
        [
            FFMPEG,
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-n",
            "-hwaccel",
            "cuda",
            "-hwaccel_output_format",
            "cuda",
            "-ss",
            f"{local_start / FPS:.9f}",
            "-f",
            "concat",
            "-safe",
            "1",
            "-i",
            str(concat_path),
            "-map",
            "0:v:0",
            "-an",
            "-frames:v",
            str(frame_count),
            "-vf",
            f"scale_cuda={WIDTH}:{HEIGHT}:format=nv12",
            "-c:v",
            "h264_nvenc",
            "-preset",
            "p7",
            "-tune",
            "hq",
            "-rc",
            "constqp",
            "-qp",
            "20",
            "-g",
            str(FPS),
            "-bf",
            "0",
            "-fps_mode",
            "passthrough",
            "-pix_fmt",
            "yuv420p",
            "-color_range",
            "tv",
            "-colorspace",
            "bt709",
            "-color_trc",
            "bt709",
            "-color_primaries",
            "bt709",
            "-movflags",
            "+faststart",
            str(output),
        ],
        900,
    )


def run() -> dict[str, Any]:
    started_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    started = time.monotonic_ns()
    invocation_id, task_path, source_path, root = fixed_invocation()
    task_length, _task_sha = read_regular_file(task_path, MAXIMUM_TASK_BYTES)
    if task_length < 2:
        raise ValueError("task missing")
    with task_path.open("r", encoding="utf-8") as handle:
        task = validate_task(json.load(handle), invocation_id)
    source_length, source_sha = read_regular_file(
        source_path,
        MAXIMUM_SOURCE_BYTES,
    )
    if (
        source_length != task["source"]["byteLength"]
        or source_sha != task["source"]["sha256"]
    ):
        raise ValueError("exact source bytes changed")
    device = verify_l4_device()
    source_probe = probe_video(source_path, 386)
    output_root = root / "outputs"
    output_root.mkdir(mode=0o700)
    base_path = root / "base-384.mp4"
    create_base(source_path, base_path)
    base_probe = probe_video(base_path, SOURCE_SLICE_FRAMES)
    base_length, base_sha = read_regular_file(base_path, MAXIMUM_CHUNK_BYTES)
    concat_path = root / "base-repeat-two.ffconcat"
    write_concat_file(concat_path, base_path)
    chunks: list[dict[str, Any]] = []
    for chunk in task["chunks"]:
        ordinal = int(chunk["chunkOrdinal"])
        start = int(chunk["canonicalStartFrameInclusive"])
        end = int(chunk["canonicalEndFrameInclusive"])
        frame_count = end - start + 1
        file_name = f"chunk-{ordinal:03d}.mp4"
        output_path = output_root / file_name
        create_chunk(concat_path, output_path, start, frame_count)
        probe = probe_video(output_path, frame_count)
        byte_length, chunk_sha = read_regular_file(
            output_path,
            MAXIMUM_CHUNK_BYTES,
        )
        chunks.append(
            {
                "chunkOrdinal": ordinal,
                "canonicalStartFrameInclusive": start,
                "canonicalEndFrameInclusive": end,
                "overlapWithPreviousFrames": int(
                    chunk["overlapWithPreviousFrames"]
                ),
                "fileName": file_name,
                "byteLength": byte_length,
                "sha256": chunk_sha,
                "decodedFrameCount": frame_count,
                "sourceModuloStartFrameInclusive": start % SOURCE_SLICE_FRAMES,
                "sourceModuloEndFrameInclusive": end % SOURCE_SLICE_FRAMES,
                "wrapsSourceSliceBoundary": (
                    start // SOURCE_SLICE_FRAMES != end // SOURCE_SLICE_FRAMES
                ),
                "ffprobe": probe,
            }
        )
    completed_at = datetime.now(timezone.utc).isoformat().replace(
        "+00:00", "Z"
    )
    result_without_digest = {
        "schemaVersion": OUTPUT_VERSION,
        "source": "fixed_weeditpro_l4_sam3_1_source_preparation_runner",
        "invocationId": invocation_id,
        "qualificationSourceId": task["qualificationSourceId"],
        "qualificationSourcePlanRef": task["qualificationSourcePlanRef"],
        "dispatchAdmissionRef": task["dispatchAdmissionRef"],
        "immutableImageRef": task["immutableImageRef"],
        "toolchainQualificationRef": task["toolchainQualificationRef"],
        "taskDigestSha256": task["taskDigestSha256"],
        "sourceObjectSha256": source_sha,
        "sourceObjectByteLength": source_length,
        "sourceProbe": source_probe,
        "baseSlice": {
            "byteLength": base_length,
            "sha256": base_sha,
            "decodedFrameCount": SOURCE_SLICE_FRAMES,
            "ffprobe": base_probe,
        },
        "device": device,
        "chunks": chunks,
        "preparedChunkCount": len(chunks),
        "exactChunkCount": CHUNK_COUNT,
        "sourceFrameCount": SOURCE_FRAMES,
        "sourceDurationMilliseconds": 480_000,
        "gpuDecodeProfile": "ffmpeg_cuda_nvdec_fixed_v1",
        "gpuEncodeProfile": "h264_nvenc_p7_hq_constqp20_bt709_fixed_v1",
        "sourceAudioRemoved": True,
        "fullSourceResolutionPreserved": True,
        "sourcePixelExactnessClaimed": False,
        "losslessEncodingClaimed": False,
        "substantiveCpuMediaProcessingUsed": False,
        "ffprobeMetadataOnly": True,
        "runtimeModelOrToolDownloadPerformed": False,
        "callerPathUrlBytesCommandOrEnvironmentAccepted": False,
        "terminalCloudRunExecutionClaimed": False,
        "scaleBackToZeroClaimedByWorker": False,
        "accountEffectiveCostClaimedByWorker": False,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "publicDeliveryAuthorized": False,
        "productionAuthorityGranted": False,
        "startedAt": started_at,
        "completedAt": completed_at,
        "workerWallDurationMilliseconds": max(
            0, math.ceil((time.monotonic_ns() - started) / 1_000_000)
        ),
    }
    return {
        **result_without_digest,
        "resultDigestSha256": sha256_value(result_without_digest),
    }


def main() -> int:
    try:
        result = run()
        sys.stdout.write(stable_json_bytes(result).decode("utf-8") + "\n")
        return 0
    except Exception as error:  # noqa: BLE001 - closed process boundary
        sys.stderr.write(
            stable_json_bytes(
                {
                    "ok": False,
                    "errorClass": type(error).__name__,
                    "fixedRunnerFailed": True,
                    "providerOutcome": "not_applicable",
                    "customerCreditsMutated": False,
                    "productionAuthorityGranted": False,
                }
            ).decode("utf-8")
            + "\n"
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
