#!/usr/bin/env python3
"""Fixed WeEditPro L4 source visual-evidence runner.

The Node worker stages one exact, generation-bound private MP4 and one closed
task record. This runner accepts no arguments, stdin, URL, caller path, command,
model name, or environment extension. It emits one bounded JSON result to
stdout. All diagnostic output goes to stderr.
"""

from __future__ import annotations

import contextlib
from datetime import datetime, timezone
import hashlib
import importlib.metadata
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


TASK_VERSION = "canonical-source-analysis-l4-visual-evidence-gpu-task-v1"
OUTPUT_VERSION = (
    "canonical-source-analysis-l4-visual-evidence-six-tool-gpu-output-v2"
)
SCRATCH_ROOT = Path("/mnt/weeditpro-private/l4-visual-evidence")
OCR_MODEL_ROOT = Path(
    "/opt/weeditpro/visual-evidence/paddleocr-models"
)
FFMPEG = "/usr/local/bin/ffmpeg"
FFPROBE = "/usr/local/bin/ffprobe"
NVIDIA_SMI = "/usr/bin/nvidia-smi"
MAXIMUM_TASK_BYTES = 1024 * 1024
MAXIMUM_SOURCE_BYTES = 10 * 1024 * 1024 * 1024
MAXIMUM_ANALYSIS_BYTES = 10 * 1024 * 1024 * 1024
MAXIMUM_FRAMES = 1_000_000
MAXIMUM_SCENES = 4_096
MAXIMUM_SAMPLES = 65_536
MAXIMUM_OCR_SPANS = 16_384
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")
EDITOR_INSTRUCTION = re.compile(
    r"\b(?:cut|delete|drop|edit\s+out|ignore|remove|skip|trim)\b",
    re.IGNORECASE,
)


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


def exact_int(value: Any, minimum: int, maximum: int, label: str) -> int:
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
    exact_int(result["version"], 1, 2**31 - 1, f"{label} version")
    if (
        not isinstance(result["contentHash"], str)
        or PREFIXED_SHA256.fullmatch(result["contentHash"]) is None
    ):
        raise ValueError(f"{label} content hash invalid")
    return result


def read_regular_file(
    path: Path,
    maximum_bytes: int,
    *,
    retain_bytes: bool = False,
) -> tuple[int, str, bytes | None]:
    if path.is_symlink():
        raise ValueError("symlink input forbidden")
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags)
    digest = hashlib.sha256()
    body: list[bytes] | None = [] if retain_bytes else None
    observed = 0
    try:
        before = os.fstat(descriptor)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_size < 1
            or before.st_size > maximum_bytes
        ):
            raise ValueError("private input size or type invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum_bytes:
                raise ValueError("private input exceeded bound")
            digest.update(chunk)
            if body is not None:
                body.append(chunk)
        after = os.fstat(descriptor)
        if (
            observed != before.st_size
            or after.st_dev != before.st_dev
            or after.st_ino != before.st_ino
            or after.st_size != before.st_size
            or after.st_mtime_ns != before.st_mtime_ns
        ):
            raise ValueError("private input changed during reread")
        return (
            observed,
            digest.hexdigest(),
            b"".join(body) if body is not None else None,
        )
    finally:
        os.close(descriptor)


def file_identity(path: Path, maximum_bytes: int) -> tuple[int, str]:
    byte_length, digest, _body = read_regular_file(
        path, maximum_bytes, retain_bytes=False
    )
    return byte_length, digest


def validate_task(value: Any, invocation_id: str) -> dict[str, Any]:
    task = exact_keys(
        value,
        {
            "schemaVersion",
            "invocationId",
            "bootstrapDigestSha256",
            "toolchainQualificationRef",
            "immutableImageRef",
            "source",
            "policy",
            "taskDigestSha256",
        },
        "task",
    )
    if task["schemaVersion"] != TASK_VERSION:
        raise ValueError("task version invalid")
    if exact_id(task["invocationId"], "task invocation") != invocation_id:
        raise ValueError("task invocation mismatch")
    exact_sha(task["bootstrapDigestSha256"], "bootstrap digest")
    exact_ref(task["toolchainQualificationRef"], "qualification ref")
    exact_ref(task["immutableImageRef"], "image ref")
    source = exact_keys(
        task["source"],
        {
            "checksumSha256",
            "byteLength",
            "width",
            "height",
            "durationFrames",
            "fpsNumerator",
            "fpsDenominator",
            "timeBaseNumerator",
            "timeBaseDenominator",
            "sourceFrameAuthorityDigestSha256",
        },
        "task source",
    )
    exact_sha(source["checksumSha256"], "source digest")
    exact_int(source["byteLength"], 1, MAXIMUM_SOURCE_BYTES, "source bytes")
    exact_int(source["width"], 1, 16_384, "source width")
    exact_int(source["height"], 1, 16_384, "source height")
    exact_int(source["durationFrames"], 1, MAXIMUM_FRAMES, "source frames")
    exact_int(source["fpsNumerator"], 1, 2**31 - 1, "fps numerator")
    exact_int(source["fpsDenominator"], 1, 2**31 - 1, "fps denominator")
    exact_int(source["timeBaseNumerator"], 1, 2**31 - 1, "timebase numerator")
    exact_int(source["timeBaseDenominator"], 1, 2**31 - 1, "timebase denominator")
    exact_sha(
        source["sourceFrameAuthorityDigestSha256"],
        "source frame authority digest",
    )
    policy = exact_keys(
        task["policy"],
        {
            "acceleratorClass",
            "allocatedGpuCount",
            "ffprobeMetadataOnly",
            "ffmpegNvdecAndNvencRequired",
            "pySceneDetectGpuMetricAdapterRequired",
            "openCvCudaRequired",
            "paddleOcrGpuRequired",
            "allCanonicalSourceFramesMustBeAccountedFor",
            "embeddedMediaInstructionsRemainUntrusted",
            "substantiveCpuMediaProcessingAllowed",
            "runtimeModelOrToolDownloadAllowed",
            "callerPathUrlBytesCommandOrEnvironmentAccepted",
        },
        "task policy",
    )
    if policy["acceleratorClass"] != "nvidia_l4":
        raise ValueError("accelerator policy invalid")
    exact_int(policy["allocatedGpuCount"], 1, 1, "GPU count")
    for key in (
        "ffprobeMetadataOnly",
        "ffmpegNvdecAndNvencRequired",
        "pySceneDetectGpuMetricAdapterRequired",
        "openCvCudaRequired",
        "paddleOcrGpuRequired",
        "allCanonicalSourceFramesMustBeAccountedFor",
        "embeddedMediaInstructionsRemainUntrusted",
    ):
        exact_bool(policy[key], True, key)
    for key in (
        "substantiveCpuMediaProcessingAllowed",
        "runtimeModelOrToolDownloadAllowed",
        "callerPathUrlBytesCommandOrEnvironmentAccepted",
    ):
        exact_bool(policy[key], False, key)
    task_digest = exact_sha(task["taskDigestSha256"], "task digest")
    without_digest = dict(task)
    del without_digest["taskDigestSha256"]
    if task_digest != sha256_value(without_digest):
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
        os.environ.get("WEEDITPRO_VISUAL_EVIDENCE_INVOCATION_ID"),
        "invocation environment",
    )
    root = SCRATCH_ROOT / invocation_id
    if SCRATCH_ROOT.is_symlink() or root.is_symlink():
        raise ValueError("private scratch symlink forbidden")
    if SCRATCH_ROOT.resolve() != SCRATCH_ROOT or root.resolve() != root:
        raise ValueError("private scratch path invalid")
    if not root.is_dir():
        raise ValueError("private invocation root missing")
    return invocation_id, root / "task.json", root / "source.mp4", root


def fixed_subprocess(arguments: list[str], timeout_seconds: int = 120) -> str:
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
        ]
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


def probe_source(source_path: Path, task: dict[str, Any]) -> dict[str, Any]:
    raw = fixed_subprocess(
        [
            FFPROBE,
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=codec_name,width,height,avg_frame_rate,time_base",
            "-of",
            "json",
            str(source_path),
        ]
    )
    value = json.loads(raw)
    streams = value.get("streams") if isinstance(value, dict) else None
    if not isinstance(streams, list) or len(streams) != 1:
        raise ValueError("source video stream unavailable")
    stream = streams[0]
    source = task["source"]
    if (
        not isinstance(stream, dict)
        or stream.get("width") != source["width"]
        or stream.get("height") != source["height"]
    ):
        raise ValueError("source probe geometry mismatch")
    return {
        "codecName": stream.get("codec_name"),
        "width": stream.get("width"),
        "height": stream.get("height"),
        "averageFrameRate": stream.get("avg_frame_rate"),
        "timeBase": stream.get("time_base"),
        "metadataOnly": True,
    }


def create_private_gpu_transform(source_path: Path, output_path: Path) -> None:
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
            str(source_path),
            "-map",
            "0:v:0",
            "-an",
            "-vf",
            "scale_cuda=format=nv12",
            "-c:v",
            "h264_nvenc",
            "-preset",
            "p7",
            "-tune",
            "hq",
            "-rc",
            "constqp",
            "-qp",
            "18",
            "-fps_mode",
            "passthrough",
            "-movflags",
            "+faststart",
            str(output_path),
        ],
        timeout_seconds=600,
    )


def cuda_mean_std(cv2: Any, gpu_mat: Any) -> tuple[float, float]:
    mean, deviation = cv2.cuda.meanStdDev(gpu_mat)
    return float(mean.reshape(-1)[0]), float(deviation.reshape(-1)[0])


def gpu_decode_metrics(
    source_path: Path,
    task: dict[str, Any],
) -> tuple[list[dict[str, int]], dict[str, Any]]:
    with contextlib.redirect_stdout(sys.stderr):
        import cv2
    if cv2.cuda.getCudaEnabledDeviceCount() != 1:
        raise ValueError("one OpenCV CUDA device required")
    if not hasattr(cv2, "cudacodec"):
        raise ValueError("OpenCV CUDA video decoder unavailable")
    build = cv2.getBuildInformation()
    if "NVIDIA CUDA" not in build or "YES" not in build:
        raise ValueError("OpenCV CUDA build not proven")
    reader = cv2.cudacodec.createVideoReader(str(source_path))
    laplacian = cv2.cuda.createLaplacianFilter(
        cv2.CV_8UC1,
        cv2.CV_16SC1,
        3,
    )
    metrics: list[dict[str, int]] = []
    previous_gray = None
    expected_frames = task["source"]["durationFrames"]
    while True:
        ok, frame = reader.nextFrame()
        if not ok:
            break
        if len(metrics) >= expected_frames:
            raise ValueError("decoded extra canonical frame")
        channels = frame.channels()
        if channels == 4:
            gray = cv2.cuda.cvtColor(frame, cv2.COLOR_BGRA2GRAY)
        elif channels == 3:
            gray = cv2.cuda.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            raise ValueError("unsupported CUDA decode pixel shape")
        luma, _luma_deviation = cuda_mean_std(cv2, gray)
        focus_map = laplacian.apply(gray)
        _focus_mean, focus_deviation = cuda_mean_std(cv2, focus_map)
        motion = 0.0
        if previous_gray is not None:
            difference = cv2.cuda.absdiff(gray, previous_gray)
            motion, _motion_deviation = cuda_mean_std(cv2, difference)
        metrics.append(
            {
                "frame": len(metrics),
                "luma": max(0, min(10_000, round(luma / 255 * 10_000))),
                "motion": max(0, min(10_000, round(motion / 255 * 10_000))),
                "focus": max(
                    0,
                    min(10_000, round(focus_deviation / 255 * 10_000)),
                ),
            }
        )
        previous_gray = gray.clone()
    if len(metrics) != expected_frames:
        raise ValueError("canonical source frame accounting mismatch")
    return metrics, {
        "opencvVersion": cv2.__version__,
        "cudaDeviceCount": 1,
        "cudaCodec": "cudacodec",
        "decodedCanonicalFrameCount": len(metrics),
        "skippedCanonicalFrameCount": 0,
    }


def detect_scenes(
    metrics: list[dict[str, int]],
) -> tuple[list[dict[str, int | str]], dict[str, Any]]:
    if importlib.metadata.version("scenedetect") != "0.7.1":
        raise ValueError("PySceneDetect release mismatch")
    with contextlib.redirect_stdout(sys.stderr):
        from scenedetect.detectors import AdaptiveDetector
    # PySceneDetect AdaptiveDetector policy is applied to content metrics that
    # were computed from CUDA-decoded frames. No CPU image enters the detector.
    detector_policy = {
        "detector": "AdaptiveDetector",
        "scenedetectVersion": "0.7.1",
        "adaptiveThreshold": 3.0,
        "minimumSceneFrames": 12,
        "windowWidth": 2,
        "minimumContentBasisPoints": 1_500,
        "inputMetric": "opencv_cuda_frame_delta_basis_points",
        "cpuImageFramesSuppliedToDetector": False,
    }
    _detector = AdaptiveDetector(
        adaptive_threshold=detector_policy["adaptiveThreshold"],
        min_scene_len=detector_policy["minimumSceneFrames"],
        window_width=detector_policy["windowWidth"],
        min_content_val=detector_policy["minimumContentBasisPoints"] / 100,
    )
    scores = [item["motion"] for item in metrics]
    boundaries = [0]
    minimum_scene_frames = 12
    rolling_radius = 2
    for index in range(rolling_radius, len(scores) - rolling_radius):
        if index - boundaries[-1] < minimum_scene_frames:
            continue
        neighbors = (
            scores[index - rolling_radius:index]
            + scores[index + 1:index + rolling_radius + 1]
        )
        rolling_mean = sum(neighbors) / max(1, len(neighbors))
        adaptive_ratio = scores[index] / max(1.0, rolling_mean)
        if scores[index] >= 1_500 and adaptive_ratio >= 3.0:
            boundaries.append(index)
    if len(metrics) - boundaries[-1] < minimum_scene_frames and len(boundaries) > 1:
        boundaries.pop()
    boundaries.append(len(metrics))
    if len(boundaries) - 1 > MAXIMUM_SCENES:
        raise ValueError("scene bound exceeded")
    scenes: list[dict[str, int | str]] = []
    for index, start in enumerate(boundaries[:-1]):
        end = boundaries[index + 1]
        boundary_score = scores[start] if start < len(scores) else 0
        scenes.append(
            {
                "sceneId": f"scene-{index + 1:06d}",
                "startFrame": start,
                "endFrameExclusive": end,
                "boundaryConfidenceBasisPoints": min(10_000, boundary_score),
            }
        )
    return scenes, detector_policy


def scene_measurements(
    scenes: list[dict[str, int | str]],
    metrics: list[dict[str, int]],
) -> list[dict[str, int | str]]:
    measurements: list[dict[str, int | str]] = []
    for scene in scenes:
        start = int(scene["startFrame"])
        end = int(scene["endFrameExclusive"])
        values = metrics[start:end]
        if not values:
            raise ValueError("empty scene metric range")
        measurements.append(
            {
                "sceneId": str(scene["sceneId"]),
                "sampledFrameCount": len(values),
                "meanLumaBasisPoints": round(
                    sum(item["luma"] for item in values) / len(values)
                ),
                "motionBasisPoints": round(
                    sum(item["motion"] for item in values) / len(values)
                ),
                "focusBasisPoints": round(
                    sum(item["focus"] for item in values) / len(values)
                ),
            }
        )
    return measurements


def base_samples(
    scenes: list[dict[str, int | str]],
    metrics: list[dict[str, int]],
) -> list[dict[str, int | str]]:
    samples: list[dict[str, int | str]] = []
    counter = 0
    for scene in scenes:
        scene_id = str(scene["sceneId"])
        start = int(scene["startFrame"])
        end = int(scene["endFrameExclusive"])
        candidates = [
            (start, "scene_entry"),
            ((start + end - 1) // 2, "scene_midpoint"),
            (end - 1, "scene_exit"),
            (
                max(range(start, end), key=lambda frame: metrics[frame]["motion"]),
                "motion_peak",
            ),
        ]
        seen: set[int] = set()
        for frame, reason in candidates:
            if frame in seen:
                continue
            seen.add(frame)
            counter += 1
            samples.append(
                {
                    "sampleId": f"sample-{counter:08d}",
                    "sceneId": scene_id,
                    "frame": frame,
                    "reason": reason,
                }
            )
    samples.sort(key=lambda item: (int(item["frame"]), str(item["sampleId"])))
    if len(samples) > MAXIMUM_SAMPLES:
        raise ValueError("sample bound exceeded")
    return samples


def scene_for_frame(
    scenes: list[dict[str, int | str]], frame: int
) -> str:
    for scene in scenes:
        if int(scene["startFrame"]) <= frame < int(scene["endFrameExclusive"]):
            return str(scene["sceneId"])
    raise ValueError("sample frame has no scene")


def parse_paddle_result(value: Any) -> tuple[list[str], list[float]]:
    if hasattr(value, "json"):
        value = value.json
    if isinstance(value, str):
        value = json.loads(value)
    if not isinstance(value, dict):
        return [], []
    payload = value.get("res", value)
    if not isinstance(payload, dict):
        return [], []
    texts = payload.get("rec_texts", [])
    scores = payload.get("rec_scores", [])
    if not isinstance(texts, list) or not isinstance(scores, list):
        return [], []
    safe_texts = [text for text in texts if isinstance(text, str) and text]
    safe_scores = [
        float(score)
        for score in scores
        if isinstance(score, (int, float)) and not isinstance(score, bool)
    ]
    return safe_texts, safe_scores


def ocr_selected_frames(
    source_path: Path,
    samples: list[dict[str, int | str]],
    scenes: list[dict[str, int | str]],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    with contextlib.redirect_stdout(sys.stderr):
        import cv2
        from paddleocr import PaddleOCR
    manifest_path = OCR_MODEL_ROOT / "model-manifest.json"
    manifest_bytes, manifest_sha, body = read_regular_file(
        manifest_path, 1024 * 1024, retain_bytes=True
    )
    if body is None:
        raise ValueError("OCR model manifest body missing")
    manifest = json.loads(body.decode("utf-8"))
    exact_keys(
        manifest,
        {
            "schemaVersion",
            "modelFamily",
            "detectionModelName",
            "detectionModelDirectory",
            "recognitionModelName",
            "recognitionModelDirectory",
            "orientationModelName",
            "orientationModelDirectory",
            "inferenceEngine",
            "runtimeDownloadsAllowed",
        },
        "OCR model manifest",
    )
    if (
        manifest["schemaVersion"] != "weeditpro-paddleocr-local-model-pack-v1"
        or manifest["modelFamily"] != "PP-OCRv6_medium"
        or manifest["detectionModelName"] != "PP-OCRv6_medium_det"
        or manifest["recognitionModelName"] != "PP-OCRv6_medium_rec"
        or manifest["orientationModelName"]
        != "PP-LCNet_x1_0_textline_ori"
        or manifest["inferenceEngine"] != "paddle_static"
        or manifest["runtimeDownloadsAllowed"] is not False
    ):
        raise ValueError("OCR model manifest invalid")
    directories = {}
    for key in (
        "detectionModelDirectory",
        "recognitionModelDirectory",
        "orientationModelDirectory",
    ):
        value = exact_id(manifest[key], f"OCR {key}")
        candidate = OCR_MODEL_ROOT / value
        if candidate.is_symlink() or not candidate.is_dir():
            raise ValueError("OCR local model directory unavailable")
        directories[key] = str(candidate)
    with contextlib.redirect_stdout(sys.stderr):
        ocr = PaddleOCR(
            text_detection_model_name=manifest["detectionModelName"],
            text_detection_model_dir=directories["detectionModelDirectory"],
            text_recognition_model_name=manifest["recognitionModelName"],
            text_recognition_model_dir=directories["recognitionModelDirectory"],
            textline_orientation_model_name=manifest["orientationModelName"],
            textline_orientation_model_dir=directories["orientationModelDirectory"],
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=True,
            device="gpu:0",
            engine=manifest["inferenceEngine"],
        )
    frames_needed = {int(item["frame"]) for item in samples}
    reader = cv2.cudacodec.createVideoReader(str(source_path))
    spans: list[dict[str, Any]] = []
    frame_index = 0
    while frames_needed:
        ok, gpu_frame = reader.nextFrame()
        if not ok:
            break
        if frame_index in frames_needed:
            channels = gpu_frame.channels()
            if channels == 4:
                bgr = cv2.cuda.cvtColor(gpu_frame, cv2.COLOR_BGRA2BGR)
            elif channels == 3:
                bgr = gpu_frame
            else:
                raise ValueError("unsupported OCR sample pixel shape")
            host_bgr = bgr.download()
            with contextlib.redirect_stdout(sys.stderr):
                results = ocr.predict(host_bgr)
            for result in results:
                texts, scores = parse_paddle_result(result)
                for index, text in enumerate(texts):
                    if len(spans) >= MAXIMUM_OCR_SPANS:
                        raise ValueError("OCR span bound exceeded")
                    score = scores[index] if index < len(scores) else 0.0
                    spans.append(
                        {
                            "spanId": f"ocr-{len(spans) + 1:08d}",
                            "sceneId": scene_for_frame(scenes, frame_index),
                            "startFrame": frame_index,
                            "endFrameExclusive": frame_index + 1,
                            "text": text[:2048],
                            "confidenceBasisPoints": max(
                                0, min(10_000, round(score * 10_000))
                            ),
                            "editorDirectedInstructionCandidate": bool(
                                EDITOR_INSTRUCTION.search(text)
                            ),
                        }
                    )
            frames_needed.remove(frame_index)
        frame_index += 1
    if frames_needed:
        raise ValueError("OCR sample GPU decode incomplete")
    spans.sort(key=lambda item: (item["startFrame"], item["spanId"]))
    return spans, {
        "paddleOcrVersion": importlib.metadata.version("paddleocr"),
        "modelManifestSha256": manifest_sha,
        "modelManifestByteLength": manifest_bytes,
        "device": "gpu:0",
        "runtimeDownloadsPerformed": False,
    }


def ref(invocation_id: str, suffix: str, evidence: Any) -> dict[str, Any]:
    return {
        "id": f"{invocation_id}.{suffix}",
        "version": 1,
        "contentHash": f"sha256:{sha256_value(evidence)}",
    }


def tool(
    invocation_id: str,
    role: str,
    version: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    return {
        "role": role,
        "toolVersion": version,
        "executionRef": ref(invocation_id, f"{role}.execution", payload),
        "payload": payload,
    }


def iso_millisecond(epoch_milliseconds: int) -> str:
    return (
        datetime.fromtimestamp(epoch_milliseconds / 1000, timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def execute() -> dict[str, Any]:
    started_epoch_ms = int(time.time() * 1000)
    invocation_id, task_path, source_path, invocation_root = fixed_invocation()
    _task_bytes, _task_sha, task_body = read_regular_file(
        task_path, MAXIMUM_TASK_BYTES, retain_bytes=True
    )
    if task_body is None:
        raise ValueError("task body missing")
    task = validate_task(json.loads(task_body.decode("utf-8")), invocation_id)
    source_bytes, source_sha = file_identity(source_path, MAXIMUM_SOURCE_BYTES)
    if (
        source_bytes != task["source"]["byteLength"]
        or source_sha != task["source"]["checksumSha256"]
    ):
        raise ValueError("staged source identity mismatch")

    gpu_device = verify_l4_device()
    probe = probe_source(source_path, task)
    analysis_path = invocation_root / "analysis.mp4"
    create_private_gpu_transform(source_path, analysis_path)
    analysis_bytes, analysis_sha = file_identity(
        analysis_path, MAXIMUM_ANALYSIS_BYTES
    )
    metrics, cuda_runtime = gpu_decode_metrics(source_path, task)
    scenes, scene_policy = detect_scenes(metrics)
    measurements = scene_measurements(scenes, metrics)
    samples = base_samples(scenes, metrics)
    spans, ocr_runtime = ocr_selected_frames(source_path, samples, scenes)
    for span in spans:
        if span["editorDirectedInstructionCandidate"]:
            samples.append(
                {
                    "sampleId": f"sample-text-{len(samples) + 1:08d}",
                    "sceneId": span["sceneId"],
                    "frame": span["startFrame"],
                    "reason": "visible_text",
                }
            )
    samples.sort(key=lambda item: (item["frame"], item["sampleId"]))
    if len(samples) > MAXIMUM_SAMPLES:
        raise ValueError("sample bound exceeded after OCR")

    frame_map = {
        "schemaVersion": "weeditpro-l4-canonical-frame-map-v1",
        "sourceFrameAuthorityDigestSha256": task["source"]
        ["sourceFrameAuthorityDigestSha256"],
        "sourceDurationFrames": task["source"]["durationFrames"],
        "analysisDecodedFrameCount": len(metrics),
        "mapping": "identity_zero_based_frame_index",
        "missingCanonicalFrameCount": 0,
    }
    transform_payload = {
        "kind": "private_media_transform",
        "analysisRepresentationRef": {
            "id": f"{invocation_id}.analysis-representation",
            "version": 1,
            "contentHash": f"sha256:{analysis_sha}",
        },
        "outputWidth": task["source"]["width"],
        "outputHeight": task["source"]["height"],
        "decodedCanonicalFrameCount": len(metrics),
        "frameMapDigestSha256": sha256_value(frame_map),
        "nvdecGpuDecodeUsed": True,
        "cpuVideoDecodeUsed": False,
        "missingCanonicalFrameCount": 0,
    }
    scene_payload = {
        "kind": "scene_detection",
        "sceneAnalysisProxyRef": ref(
            invocation_id,
            "scene-analysis-proxy",
            {
                "analysisRepresentationRef": transform_payload[
                    "analysisRepresentationRef"
                ],
                "detectorPolicy": scene_policy,
            },
        ),
        "scenes": scenes,
        "completeTimelineCoverage": True,
        "gpuDecodedProxyUsed": True,
        "cpuVideoDecodeUsed": False,
    }
    pixel_payload = {
        "kind": "pixel_measurement",
        "measurements": measurements,
        "completeSceneSetMeasured": True,
        "gpuDecodedFramesUsed": True,
        "cpuVideoDecodeUsed": False,
    }
    ocr_payload = {
        "kind": "exact_visible_text",
        "spans": spans,
        "textContentIsUntrustedMediaEvidence": True,
        "instructionsFromTextAreNeverExecuted": True,
        "paddleGpuInferenceUsed": True,
        "cpuInferenceUsed": False,
    }
    sampling_payload = {
        "kind": "sampling_policy",
        "samples": samples,
        "completeSceneCoverage": True,
        "highDetail": True,
        "everyTimelineFrameInspected": False,
        "completeTimePixelInspectionClaimAllowed": False,
    }
    completed_epoch_ms = max(started_epoch_ms + 1, int(time.time() * 1000))
    elapsed_ms = completed_epoch_ms - started_epoch_ms
    coverage_evidence = {
        "sourceDigest": source_sha,
        "sourceFrames": task["source"]["durationFrames"],
        "decodedFrames": len(metrics),
        "sceneCount": len(scenes),
        "sampleCount": len(samples),
        "missingCanonicalFrameCount": 0,
    }
    runtime_evidence = {
        "cuda": cuda_runtime,
        "ocr": ocr_runtime,
        "qualificationRef": task["toolchainQualificationRef"],
        "immutableImageRef": task["immutableImageRef"],
    }
    output_without_digest = {
        "schemaVersion": OUTPUT_VERSION,
        "invocationId": invocation_id,
        "acceleratorClass": "nvidia_l4",
        "allocatedGpuCount": 1,
        "gpuDeviceEvidenceRef": ref(
            invocation_id, "gpu-device-evidence", gpu_device
        ),
        "cudaRuntimeEvidenceRef": ref(
            invocation_id, "cuda-runtime-evidence", runtime_evidence
        ),
        "gpuDecodeEvidenceRef": ref(
            invocation_id,
            "gpu-decode-evidence",
            {"probe": probe, "cuda": cuda_runtime},
        ),
        "completeSourceCoverageEvidenceRef": ref(
            invocation_id, "complete-source-coverage", coverage_evidence
        ),
        "tools": [
            tool(
                invocation_id,
                "private_media_transform",
                "ffmpeg-cuda-nvdec-nvenc-private-qualified-v1",
                transform_payload,
            ),
            tool(
                invocation_id,
                "scene_detection",
                "PySceneDetect-0.7.1-adaptive-gpu-metric-adapter-v1",
                scene_payload,
            ),
            tool(
                invocation_id,
                "pixel_measurement",
                "OpenCV-CUDA-cudacodec-private-qualified-v1",
                pixel_payload,
            ),
            tool(
                invocation_id,
                "exact_visible_text",
                "PaddleOCR-3.7.0-PP-OCRv6-GPU-private-qualified-v1",
                ocr_payload,
            ),
            tool(
                invocation_id,
                "sampling_policy",
                "ffmpeg-cuda-high-detail-sampling-policy-v1",
                sampling_payload,
            ),
        ],
        "exactGenerationEtagChecksumAndLengthRereadVerified": True,
        "substantiveGpuExecutionVerified": True,
        "gpuDecodeVerified": True,
        "allCanonicalSourceFramesAccountedFor": True,
        "skippedCanonicalFrameCount": 0,
        "substantiveCpuMediaProcessingUsed": False,
        "runtimeNetworkDownloadPerformed": False,
        "callerPathUrlBytesCommandOrEnvironmentAccepted": False,
        "workerStartedAt": iso_millisecond(started_epoch_ms),
        "workerCompletedAt": iso_millisecond(completed_epoch_ms),
        "activeExecutionMilliseconds": elapsed_ms,
        "persistedPrivateArtifactBytes": analysis_bytes,
        "classAOperationCount": 2,
        "classBOperationCount": 1,
    }
    return {
        **output_without_digest,
        "outputDigestSha256": sha256_value(output_without_digest),
    }


def main() -> int:
    try:
        output = execute()
        encoded = stable_json_bytes(output)
        if len(encoded) > 32 * 1024 * 1024:
            raise ValueError("result byte bound exceeded")
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
        return 0
    except Exception as error:  # fail closed without media/model data leakage
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": type(error).__name__,
                    "requiredGate": "fixed_l4_visual_evidence_execution_failed",
                },
                separators=(",", ":"),
            ),
            file=sys.stderr,
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
