"""Fixed private SAM2 video-mask runner.

The process accepts exactly one JSON request on stdin. All media, model, and
output paths are fixed by the operation package. The JSON response contains
only digests, sizes, bounded measurements, and lineage.
"""

from __future__ import annotations

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
import tempfile


REQUEST_VERSION = "canonical-sam2-gpu-runtime-request-v1"
RESPONSE_VERSION = "canonical-sam2-gpu-runtime-response-v1"
OPERATION_ID = "tool.sam2.segment_and_track_subject.v1"
SOURCE_VIDEO_PATH = Path("/mnt/reeditpro/private-input/source.mp4")
MODEL_DIRECTORY = Path(
    "/mnt/reeditpro/model-artifacts/sam2-hiera-small"
)
CHECKPOINT_PATH = MODEL_DIRECTORY / "sam2.1_hiera_small.pt"
PRIVATE_OUTPUT_DIRECTORY = Path("/mnt/reeditpro/private-output")
MASK_OUTPUT_PATH = PRIVATE_OUTPUT_DIRECTORY / "mask-sequence.mkv"
ANALYSIS_OUTPUT_PATH = PRIVATE_OUTPUT_DIRECTORY / "tracking-analysis.json"
QA_OUTPUT_PATH = PRIVATE_OUTPUT_DIRECTORY / "mask-qa-measurement.json"
SAM2_SITE_PACKAGE = Path(
    "/usr/local/lib/python3.10/dist-packages/sam2"
)
SAM2_DIST_INFO = Path(
    "/usr/local/lib/python3.10/dist-packages/sam_2-1.0.dist-info"
)
SAM2_CONFIG_PATH = (
    SAM2_SITE_PACKAGE
    / "configs"
    / "sam2.1"
    / "sam2.1_hiera_s.yaml"
)
SAM2_LICENSE_PATH = SAM2_DIST_INFO / "licenses" / "LICENSE"
SAM2_DIRECT_URL_PATH = SAM2_DIST_INFO / "direct_url.json"
SAM2_HYDRA_CONFIG = "configs/sam2.1/sam2.1_hiera_s.yaml"

MAXIMUM_REQUEST_BYTES = 131_072
MAXIMUM_SOURCE_BYTES = (4 * 1_024 * 1_024 * 1_024) - 65_536
MAXIMUM_SOURCE_DIMENSION = 8_192
MAXIMUM_SOURCE_FRAMES = 18_000
MAXIMUM_SOURCE_DURATION_MILLISECONDS = 600_000
MAXIMUM_RAW_MASK_SPOOL_BYTES = 4_294_901_760
MAXIMUM_MASK_OUTPUT_BYTES = 4_294_901_760
MAXIMUM_EVIDENCE_BYTES = 1_048_576
MAXIMUM_FFMPEG_CAPTURE_BYTES = 65_536
EXPECTED_UID = 65_532
EXPECTED_GID = 65_532

DIGEST_PATTERN = re.compile(r"^[a-f0-9]{64}$")
SAFE_ID_PATTERN = re.compile(
    r"^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$"
)

SOURCE_REVISION = (
    "2b90b9f5ceec907a1c18123530e92e794ad901a4"
)
DIRECT_URL_SHA256 = (
    "fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f"
)
CONFIG_SHA256 = (
    "0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55"
)
LICENSE_SHA256 = (
    "c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4"
)
CHECKPOINT_FILE = {
    "canonicalOrder": 0,
    "slotId": "sam2_checkpoint",
    "fileName": "sam2.1_hiera_small.pt",
    "artifactId": "meta-sam2.1-hiera-small-checkpoint",
    "revision": "ee5bba1d82bb8749febdf90f45e84b687142ba03",
    "modelFamily": "sam2.1-hiera-small",
    "byteLength": 184_416_285,
    "contentSha256":
        "6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38",
}
SAM2_DISTRIBUTION_VERSION = "1.0"
TORCH_VERSION = "2.5.1+cu124"
TORCHVISION_VERSION = "0.20.1+cu124"
CUDA_BUILD = "12.4"
stage = "REQUEST_VALIDATION_FAILED"


def stable_json_bytes(value: object) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1_048_576)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def exact_object(value: object, keys: list[str], label: str) -> dict:
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f"{label} contains unsupported fields")
    return value


def exact_digest(value: object, label: str) -> str:
    if not isinstance(value, str) or not DIGEST_PATTERN.fullmatch(value):
        raise ValueError(f"{label} is invalid")
    return value


def exact_id(value: object, label: str) -> str:
    if (
        not isinstance(value, str)
        or not SAFE_ID_PATTERN.fullmatch(value)
        or ".." in value
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_integer(
    value: object,
    minimum: int,
    maximum: int,
    label: str,
) -> int:
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < minimum
        or value > maximum
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_number(
    value: object,
    minimum: float,
    maximum: float,
    label: str,
) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or value < minimum
        or value > maximum
    ):
        raise ValueError(f"{label} is invalid")
    return float(value)


def validate_prompt(value: object, source: dict) -> dict:
    base_keys = [
        "promptPacketVersion",
        "promptPacketClass",
        "subjectSelectionId",
        "sourceArtifactId",
        "sourceArtifactSha256",
        "sourceFrameIndex",
        "sourceFrameWidth",
        "sourceFrameHeight",
        "coordinateSpace",
        "subjectCount",
        "approvedSubjectLabelIncluded",
        "rawChatIncluded",
        "rawMediaIncluded",
        "promptMode",
        "boundingBox",
        "points",
        "promptDigestSha256",
    ]
    prompt = exact_object(value, base_keys, "subject prompt")
    if (
        prompt["promptPacketVersion"]
        != "canonical-sam2-subject-prompt-packet-v1"
        or prompt["promptPacketClass"]
        != "server_compiled_normalized_subject_selection"
        or prompt["sourceArtifactId"] != source["artifactId"]
        or prompt["sourceArtifactSha256"] != source["contentSha256"]
        or prompt["sourceFrameWidth"] != source["width"]
        or prompt["sourceFrameHeight"] != source["height"]
        or prompt["coordinateSpace"] != "normalized_source_frame"
        or prompt["subjectCount"] != 1
        or prompt["approvedSubjectLabelIncluded"] is not False
        or prompt["rawChatIncluded"] is not False
        or prompt["rawMediaIncluded"] is not False
    ):
        raise ValueError("subject prompt lineage changed")
    exact_id(prompt["subjectSelectionId"], "subject selection")
    exact_integer(
        prompt["sourceFrameIndex"],
        0,
        source["frameCount"] - 1,
        "subject prompt frame",
    )
    mode = prompt["promptMode"]
    if mode == "box":
        if prompt["points"] != []:
            raise ValueError("box prompt contains points")
        box = exact_object(
            prompt["boundingBox"],
            ["x", "y", "width", "height"],
            "bounding box",
        )
        x = exact_number(box["x"], 0, 1, "box x")
        y = exact_number(box["y"], 0, 1, "box y")
        width = exact_number(box["width"], 0.001, 1, "box width")
        height = exact_number(
            box["height"], 0.001, 1, "box height"
        )
        if x + width > 1 or y + height > 1:
            raise ValueError("bounding box exceeds source frame")
    elif mode == "points":
        if prompt["boundingBox"] is not None:
            raise ValueError("point prompt contains a box")
        points = prompt["points"]
        if not isinstance(points, list) or not 1 <= len(points) <= 32:
            raise ValueError("point prompt count is invalid")
        identities: set[str] = set()
        foreground_count = 0
        for point_value in points:
            point = exact_object(
                point_value,
                ["x", "y", "label"],
                "subject point",
            )
            x = exact_number(point["x"], 0, 1, "point x")
            y = exact_number(point["y"], 0, 1, "point y")
            label = point["label"]
            if label not in ("foreground", "background"):
                raise ValueError("point label is invalid")
            if label == "foreground":
                foreground_count += 1
            identity = f"{x:.6f}:{y:.6f}:{label}"
            if identity in identities:
                raise ValueError("subject points must be unique")
            identities.add(identity)
        if foreground_count < 1:
            raise ValueError("point prompt needs a foreground point")
    else:
        raise ValueError("subject prompt mode is unsupported")
    prompt_digest = exact_digest(
        prompt["promptDigestSha256"],
        "subject prompt digest",
    )
    prompt_without_digest = {
        key: nested
        for key, nested in prompt.items()
        if key != "promptDigestSha256"
    }
    if prompt_digest != sha256_bytes(
        stable_json_bytes(prompt_without_digest)
    ):
        raise ValueError("subject prompt digest changed")
    return prompt


def validate_request(value: object) -> dict:
    request = exact_object(
        value,
        [
            "schemaVersion",
            "operationId",
            "admissionDigestSha256",
            "dispatch",
            "source",
            "subjectPromptArtifact",
            "subjectPrompt",
            "modelArtifacts",
            "settings",
            "requestBindingSha256",
        ],
        "request",
    )
    if (
        request["schemaVersion"] != REQUEST_VERSION
        or request["operationId"] != OPERATION_ID
    ):
        raise ValueError("request identity is unsupported")
    exact_digest(
        request["admissionDigestSha256"],
        "admission digest",
    )
    dispatch = exact_object(
        request["dispatch"],
        [
            "dispatchIntentId",
            "dispatchBindingHash",
            "attemptPlanHash",
            "runtimeRegion",
        ],
        "dispatch",
    )
    exact_id(dispatch["dispatchIntentId"], "dispatch intent")
    exact_digest(dispatch["dispatchBindingHash"], "dispatch binding")
    exact_digest(dispatch["attemptPlanHash"], "attempt plan")
    if dispatch["runtimeRegion"] != "europe-west1":
        raise ValueError("runtime region is not admitted")
    source = exact_object(
        request["source"],
        [
            "artifactId",
            "contentSha256",
            "byteLength",
            "contentType",
            "width",
            "height",
            "frameCount",
            "fpsNumerator",
            "fpsDenominator",
            "durationMilliseconds",
            "sourceExpectationDigestSha256",
        ],
        "source",
    )
    exact_id(source["artifactId"], "source artifact")
    exact_digest(source["contentSha256"], "source digest")
    exact_digest(
        source["sourceExpectationDigestSha256"],
        "source expectation digest",
    )
    exact_integer(
        source["byteLength"],
        1,
        MAXIMUM_SOURCE_BYTES,
        "source byte length",
    )
    width = exact_integer(
        source["width"], 16, MAXIMUM_SOURCE_DIMENSION, "source width"
    )
    height = exact_integer(
        source["height"],
        16,
        MAXIMUM_SOURCE_DIMENSION,
        "source height",
    )
    frame_count = exact_integer(
        source["frameCount"],
        2,
        MAXIMUM_SOURCE_FRAMES,
        "source frame count",
    )
    exact_integer(
        source["fpsNumerator"], 1, 240_000, "source FPS numerator"
    )
    exact_integer(
        source["fpsDenominator"], 1, 10_000, "source FPS denominator"
    )
    exact_integer(
        source["durationMilliseconds"],
        1,
        MAXIMUM_SOURCE_DURATION_MILLISECONDS,
        "source duration",
    )
    if (
        source["contentType"] != "video/mp4"
        or width * height * frame_count
        > MAXIMUM_RAW_MASK_SPOOL_BYTES
    ):
        raise ValueError("source video exceeds the fixed mask spool")
    prompt = validate_prompt(request["subjectPrompt"], source)
    prompt_artifact = exact_object(
        request["subjectPromptArtifact"],
        [
            "artifactId",
            "contentSha256",
            "byteLength",
            "contentType",
            "canonicalJsonEncoding",
        ],
        "subject prompt artifact",
    )
    exact_id(prompt_artifact["artifactId"], "prompt artifact")
    prompt_bytes = stable_json_bytes(prompt)
    if (
        prompt_artifact["contentType"] != "application/json"
        or prompt_artifact["canonicalJsonEncoding"]
        != "stable_authority_json_utf8_no_bom"
        or prompt_artifact["byteLength"] != len(prompt_bytes)
        or prompt_artifact["contentSha256"]
        != sha256_bytes(prompt_bytes)
    ):
        raise ValueError("prompt artifact binding changed")
    if request["modelArtifacts"] != [CHECKPOINT_FILE]:
        raise ValueError("model artifact set is unsupported")
    settings = exact_object(
        request["settings"],
        [
            "device",
            "modelConfigPath",
            "confidenceThreshold",
            "maximumSubjects",
            "frameStride",
            "preserveContactObjects",
            "subjectPromptProfile",
            "subjectPromptSha256",
            "outputMode",
            "runtimeDownloadAllowed",
            "networkFetchAllowed",
        ],
        "settings",
    )
    exact_number(
        settings["confidenceThreshold"],
        0.01,
        0.99,
        "confidence threshold",
    )
    if (
        settings["device"] != "cuda"
        or settings["modelConfigPath"] != SAM2_HYDRA_CONFIG
        or settings["maximumSubjects"] != 1
        or settings["frameStride"] != 1
        or not isinstance(settings["preserveContactObjects"], bool)
        or settings["subjectPromptProfile"]
        != "normalized_box_or_points_v1"
        or settings["subjectPromptSha256"]
        != prompt_artifact["contentSha256"]
        or settings["outputMode"]
        != "gray8_ffv1_matroska_mask_sequence_v1"
        or settings["runtimeDownloadAllowed"] is not False
        or settings["networkFetchAllowed"] is not False
    ):
        raise ValueError("runtime settings are unsupported")
    request_binding = exact_digest(
        request["requestBindingSha256"],
        "request binding",
    )
    request_without_binding = {
        key: nested
        for key, nested in request.items()
        if key != "requestBindingSha256"
    }
    if request_binding != sha256_bytes(
        stable_json_bytes(request_without_binding)
    ):
        raise ValueError("runtime request binding changed")
    return request


def assert_regular_file(
    path: Path,
    expected_bytes: int,
    expected_sha256: str,
    label: str,
) -> None:
    metadata = path.lstat()
    if (
        not stat.S_ISREG(metadata.st_mode)
        or stat.S_ISLNK(metadata.st_mode)
        or metadata.st_size != expected_bytes
        or file_sha256(path) != expected_sha256
    ):
        raise ValueError(f"{label} identity changed")


def validate_fixed_environment() -> None:
    if (
        len(sys.argv) != 1
        or os.getuid() != EXPECTED_UID
        or os.getgid() != EXPECTED_GID
        or os.access("/", os.W_OK)
        or os.environ.get("HF_HUB_OFFLINE") != "1"
        or os.environ.get("TRANSFORMERS_OFFLINE") != "1"
        or os.environ.get("CUDA_VISIBLE_DEVICES") != "0"
        or os.environ.get("PYTHONDONTWRITEBYTECODE") != "1"
    ):
        raise ValueError("runtime confinement preflight failed")
    denied_environment = (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
    )
    if any(os.environ.get(key) for key in denied_environment):
        raise ValueError("network proxy environment is forbidden")


def validate_source_and_model(request: dict) -> None:
    source = request["source"]
    assert_regular_file(
        SOURCE_VIDEO_PATH,
        source["byteLength"],
        source["contentSha256"],
        "source video",
    )
    directory_metadata = MODEL_DIRECTORY.lstat()
    if (
        not stat.S_ISDIR(directory_metadata.st_mode)
        or stat.S_ISLNK(directory_metadata.st_mode)
        or sorted(path.name for path in MODEL_DIRECTORY.iterdir())
        != [CHECKPOINT_FILE["fileName"]]
    ):
        raise ValueError("model directory is invalid")
    assert_regular_file(
        CHECKPOINT_PATH,
        CHECKPOINT_FILE["byteLength"],
        CHECKPOINT_FILE["contentSha256"],
        "SAM2 checkpoint",
    )
    output_metadata = PRIVATE_OUTPUT_DIRECTORY.lstat()
    if (
        not stat.S_ISDIR(output_metadata.st_mode)
        or stat.S_ISLNK(output_metadata.st_mode)
        or any(PRIVATE_OUTPUT_DIRECTORY.iterdir())
    ):
        raise ValueError("private output directory must begin empty")


def run_json_command(command: list[str], label: str) -> dict:
    result = subprocess.run(
        command,
        check=False,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=fixed_subprocess_environment(),
        timeout=120,
    )
    if (
        result.returncode != 0
        or len(result.stdout) < 2
        or len(result.stdout) > MAXIMUM_FFMPEG_CAPTURE_BYTES
        or len(result.stderr) > MAXIMUM_FFMPEG_CAPTURE_BYTES
    ):
        raise ValueError(f"{label} failed")
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise ValueError(f"{label} returned invalid JSON") from error
    if not isinstance(value, dict):
        raise ValueError(f"{label} returned invalid data")
    return value


def fixed_subprocess_environment() -> dict[str, str]:
    return {
        "PATH": (
            "/usr/local/sbin:/usr/local/bin:/usr/sbin:"
            "/usr/bin:/sbin:/bin"
        ),
        "HOME": "/tmp",
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "NO_PROXY": "*",
        "no_proxy": "*",
    }


def validate_source_media(request: dict) -> None:
    source = request["source"]
    probe = run_json_command(
        [
            "/usr/bin/ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-count_frames",
            "-show_entries",
            (
                "stream=codec_type,width,height,avg_frame_rate,"
                "nb_read_frames:format=duration"
            ),
            "-of",
            "json",
            str(SOURCE_VIDEO_PATH),
        ],
        "source media probe",
    )
    streams = probe.get("streams")
    if not isinstance(streams, list) or len(streams) != 1:
        raise ValueError("source video stream set is invalid")
    stream = streams[0]
    expected_rate = (
        f"{source['fpsNumerator']}/{source['fpsDenominator']}"
    )
    if (
        not isinstance(stream, dict)
        or stream.get("codec_type") != "video"
        or stream.get("width") != source["width"]
        or stream.get("height") != source["height"]
        or stream.get("avg_frame_rate") != expected_rate
        or int(stream.get("nb_read_frames", "-1"))
        != source["frameCount"]
    ):
        raise ValueError("source video metadata changed")


def validate_runtime_source() -> tuple[object, object, object]:
    for path, expected in (
        (SAM2_CONFIG_PATH, CONFIG_SHA256),
        (SAM2_LICENSE_PATH, LICENSE_SHA256),
        (SAM2_DIRECT_URL_PATH, DIRECT_URL_SHA256),
    ):
        if not path.is_file() or file_sha256(path) != expected:
            raise ValueError("SAM2 source identity changed")
    direct_url = json.loads(SAM2_DIRECT_URL_PATH.read_text("utf-8"))
    vcs = direct_url.get("vcs_info")
    if (
        direct_url.get("url")
        != "https://github.com/facebookresearch/sam2.git"
        or not isinstance(vcs, dict)
        or vcs.get("vcs") != "git"
        or vcs.get("commit_id") != SOURCE_REVISION
        or vcs.get("requested_revision") != SOURCE_REVISION
    ):
        raise ValueError("SAM2 source revision changed")
    from sam2.build_sam import build_sam2_video_predictor
    import numpy
    import torch
    import torchvision

    if (
        importlib.metadata.version("sam-2")
        != SAM2_DISTRIBUTION_VERSION
        or importlib.metadata.version("torch") != TORCH_VERSION
        or importlib.metadata.version("torchvision")
        != TORCHVISION_VERSION
        or torch.__version__ != TORCH_VERSION
        or torchvision.__version__ != TORCHVISION_VERSION
        or torch.version.cuda != CUDA_BUILD
        or not torch.cuda.is_available()
        or torch.cuda.device_count() != 1
        or "L4" not in torch.cuda.get_device_name(0)
    ):
        raise ValueError("SAM2 CUDA runtime identity changed")
    return build_sam2_video_predictor, numpy, torch


def prompt_arguments(
    prompt: dict,
    numpy: object,
) -> dict[str, object]:
    width = prompt["sourceFrameWidth"]
    height = prompt["sourceFrameHeight"]
    if prompt["promptMode"] == "box":
        box = prompt["boundingBox"]
        return {
            "box": numpy.array(
                [
                    box["x"] * width,
                    box["y"] * height,
                    (box["x"] + box["width"]) * width,
                    (box["y"] + box["height"]) * height,
                ],
                dtype=numpy.float32,
            )
        }
    points = numpy.array(
        [
            [point["x"] * width, point["y"] * height]
            for point in prompt["points"]
        ],
        dtype=numpy.float32,
    )
    labels = numpy.array(
        [
            1 if point["label"] == "foreground" else 0
            for point in prompt["points"]
        ],
        dtype=numpy.int32,
    )
    return {"points": points, "labels": labels}


def infer_masks(
    request: dict,
    build_predictor: object,
    numpy: object,
    torch: object,
    spool_path: Path,
) -> None:
    source = request["source"]
    prompt = request["subjectPrompt"]
    predictor = build_predictor(
        SAM2_HYDRA_CONFIG,
        str(CHECKPOINT_PATH),
        device="cuda",
        mode="eval",
        apply_postprocessing=True,
    )
    if file_sha256(CHECKPOINT_PATH) != CHECKPOINT_FILE["contentSha256"]:
        raise ValueError("checkpoint changed while loading")
    state = predictor.init_state(
        video_path=str(SOURCE_VIDEO_PATH),
        offload_video_to_cpu=True,
        offload_state_to_cpu=False,
        async_loading_frames=False,
    )
    if (
        state.get("num_frames") != source["frameCount"]
        or state.get("video_width") != source["width"]
        or state.get("video_height") != source["height"]
    ):
        raise ValueError("SAM2 decoded source identity changed")
    prompt_frame = prompt["sourceFrameIndex"]
    predictor.add_new_points_or_box(
        inference_state=state,
        frame_idx=prompt_frame,
        obj_id=1,
        clear_old_points=True,
        normalize_coords=True,
        **prompt_arguments(prompt, numpy),
    )
    pixel_count = source["width"] * source["height"]
    observed_frames: set[int] = set()
    descriptor = os.open(
        spool_path,
        os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
        0o600,
    )
    try:
        os.ftruncate(descriptor, pixel_count * source["frameCount"])

        def store_mask(
            frame_index: int,
            object_ids: object,
            mask_logits: object,
        ) -> None:
            if (
                frame_index in observed_frames
                or list(object_ids) != [1]
                or tuple(mask_logits.shape)[0:2] != (1, 1)
                or tuple(mask_logits.shape)[-2:]
                != (source["height"], source["width"])
            ):
                raise ValueError("SAM2 mask frame identity changed")
            probability = torch.sigmoid(mask_logits[0, 0])
            mask = (
                probability
                >= request["settings"]["confidenceThreshold"]
            ).to(dtype=torch.uint8).mul_(255).cpu().numpy()
            payload = mask.tobytes(order="C")
            if len(payload) != pixel_count:
                raise ValueError("SAM2 mask byte length changed")
            written = os.pwrite(
                descriptor,
                payload,
                frame_index * pixel_count,
            )
            if written != pixel_count:
                raise ValueError("SAM2 mask spool write failed")
            observed_frames.add(frame_index)

        with torch.inference_mode(), torch.autocast(
            device_type="cuda",
            dtype=torch.float16,
        ):
            for result in predictor.propagate_in_video(
                state,
                start_frame_idx=prompt_frame,
                reverse=False,
            ):
                store_mask(*result)
            if prompt_frame > 0:
                for result in predictor.propagate_in_video(
                    state,
                    start_frame_idx=prompt_frame,
                    reverse=True,
                ):
                    if result[0] < prompt_frame:
                        store_mask(*result)
        if observed_frames != set(range(source["frameCount"])):
            raise ValueError("SAM2 did not produce every source frame")
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
        try:
            predictor.reset_state(state)
        finally:
            del state
            del predictor
            torch.cuda.empty_cache()
    if file_sha256(CHECKPOINT_PATH) != CHECKPOINT_FILE["contentSha256"]:
        raise ValueError("checkpoint changed after inference")


def encode_and_measure_masks(
    request: dict,
    numpy: object,
    spool_path: Path,
) -> dict[str, object]:
    source = request["source"]
    pixel_count = source["width"] * source["height"]
    command = [
        "/usr/bin/ffmpeg",
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-n",
        "-f",
        "rawvideo",
        "-pixel_format",
        "gray",
        "-video_size",
        f"{source['width']}x{source['height']}",
        "-framerate",
        f"{source['fpsNumerator']}/{source['fpsDenominator']}",
        "-i",
        "pipe:0",
        "-an",
        "-map_metadata",
        "-1",
        "-c:v",
        "ffv1",
        "-level",
        "3",
        "-g",
        "1",
        "-pix_fmt",
        "gray",
        "-f",
        "matroska",
        str(MASK_OUTPUT_PATH),
    ]
    process = subprocess.Popen(
        command,
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        env=fixed_subprocess_environment(),
    )
    if process.stdin is None or process.stderr is None:
        process.kill()
        raise ValueError("FFmpeg mask encoder pipes unavailable")
    active_frames = 0
    minimum_coverage = 1.0
    maximum_coverage = 0.0
    coverage_sum = 0.0
    temporal_iou_sum = 0.0
    temporal_iou_count = 0
    centroid_motion_sum = 0.0
    previous_mask = None
    previous_centroid = None
    with spool_path.open("rb") as spool:
        for _frame_index in range(source["frameCount"]):
            payload = spool.read(pixel_count)
            if len(payload) != pixel_count:
                process.kill()
                raise ValueError("mask spool frame is truncated")
            process.stdin.write(payload)
            mask = numpy.frombuffer(payload, dtype=numpy.uint8) > 0
            selected_count = int(mask.sum())
            coverage = selected_count / pixel_count
            coverage_sum += coverage
            minimum_coverage = min(minimum_coverage, coverage)
            maximum_coverage = max(maximum_coverage, coverage)
            if selected_count > 0:
                active_frames += 1
                ys, xs = numpy.nonzero(mask)
                centroid = (
                    float(xs.mean()) / source["width"],
                    float(ys.mean()) / source["height"],
                )
                if previous_centroid is not None:
                    centroid_motion_sum += math.dist(
                        centroid,
                        previous_centroid,
                    )
                previous_centroid = centroid
            if previous_mask is not None:
                union = int(numpy.logical_or(previous_mask, mask).sum())
                intersection = int(
                    numpy.logical_and(previous_mask, mask).sum()
                )
                temporal_iou_sum += (
                    1.0 if union == 0 else intersection / union
                )
                temporal_iou_count += 1
            previous_mask = mask.copy()
        if spool.read(1):
            process.kill()
            raise ValueError("mask spool contains extra bytes")
    process.stdin.close()
    stderr = process.stderr.read(MAXIMUM_FFMPEG_CAPTURE_BYTES + 1)
    exit_code = process.wait(timeout=600)
    if (
        exit_code != 0
        or len(stderr) > MAXIMUM_FFMPEG_CAPTURE_BYTES
    ):
        raise ValueError("FFmpeg mask encoding failed")
    output_metadata = MASK_OUTPUT_PATH.lstat()
    if (
        not stat.S_ISREG(output_metadata.st_mode)
        or stat.S_ISLNK(output_metadata.st_mode)
        or output_metadata.st_size < 1
        or output_metadata.st_size > MAXIMUM_MASK_OUTPUT_BYTES
    ):
        raise ValueError("mask sequence output is invalid")
    return {
        "activeFrameCount": active_frames,
        "minimumCoveragePpm": round(minimum_coverage * 1_000_000),
        "maximumCoveragePpm": round(maximum_coverage * 1_000_000),
        "meanCoveragePpm": round(
            coverage_sum / source["frameCount"] * 1_000_000
        ),
        "meanTemporalIouPpm": round(
            (
                temporal_iou_sum / temporal_iou_count
                if temporal_iou_count
                else 1
            )
            * 1_000_000
        ),
        "centroidMotionPpm": round(
            centroid_motion_sum * 1_000_000
        ),
    }


def validate_mask_media(request: dict) -> None:
    source = request["source"]
    probe = run_json_command(
        [
            "/usr/bin/ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-count_frames",
            "-show_entries",
            (
                "stream=codec_name,pix_fmt,width,height,"
                "avg_frame_rate,nb_read_frames"
            ),
            "-of",
            "json",
            str(MASK_OUTPUT_PATH),
        ],
        "mask media probe",
    )
    streams = probe.get("streams")
    if not isinstance(streams, list) or len(streams) != 1:
        raise ValueError("mask output stream set is invalid")
    stream = streams[0]
    if (
        not isinstance(stream, dict)
        or stream.get("codec_name") != "ffv1"
        or stream.get("pix_fmt") != "gray"
        or stream.get("width") != source["width"]
        or stream.get("height") != source["height"]
        or stream.get("avg_frame_rate")
        != f"{source['fpsNumerator']}/{source['fpsDenominator']}"
        or int(stream.get("nb_read_frames", "-1"))
        != source["frameCount"]
    ):
        raise ValueError("mask output media identity changed")


def write_exclusive_json(
    path: Path,
    value: object,
    maximum_bytes: int,
    label: str,
) -> bytes:
    payload = stable_json_bytes(value)
    if len(payload) < 2 or len(payload) > maximum_bytes:
        raise ValueError(f"{label} exceeds its output ceiling")
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
        0o600,
    )
    try:
        written = os.write(descriptor, payload)
        if written != len(payload):
            raise ValueError(f"{label} write was incomplete")
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    return payload


def execute(request: dict) -> dict:
    global stage
    stage = "CONFINEMENT_PREFLIGHT_FAILED"
    validate_fixed_environment()
    stage = "PRIVATE_INPUT_OR_MODEL_VALIDATION_FAILED"
    validate_source_and_model(request)
    validate_source_media(request)
    stage = "CUDA_RUNTIME_PREFLIGHT_FAILED"
    build_predictor, numpy, torch = validate_runtime_source()
    stage = "SAM2_INFERENCE_FAILED"
    with tempfile.TemporaryDirectory(
        prefix="reeditpro-sam2-",
        dir="/tmp",
    ) as temporary_directory:
        spool_path = Path(temporary_directory) / "mask-spool.gray"
        infer_masks(
            request,
            build_predictor,
            numpy,
            torch,
            spool_path,
        )
        stage = "MASK_OUTPUT_ENCODING_FAILED"
        measurements = encode_and_measure_masks(
            request,
            numpy,
            spool_path,
        )
    validate_mask_media(request)
    if measurements["activeFrameCount"] < 1:
        raise ValueError("SAM2 produced no active subject mask")
    analysis = {
        "schemaVersion": "sam2-tracking-analysis-report-json-v1",
        "operationId": OPERATION_ID,
        "admissionDigestSha256":
            request["admissionDigestSha256"],
        "requestBindingSha256": request["requestBindingSha256"],
        "sourceExpectationDigestSha256":
            request["source"]["sourceExpectationDigestSha256"],
        "subjectPromptSha256":
            request["subjectPromptArtifact"]["contentSha256"],
        "frameCount": request["source"]["frameCount"],
        "activeFrameCount": measurements["activeFrameCount"],
        "measurementOnly": True,
        "subjectIdentityDecisionIncluded": False,
        "rawPromptIncluded": False,
        "rawMediaIncluded": False,
    }
    qa = {
        "schemaVersion": "sam2-mask-qa-measurement-report-json-v1",
        "operationId": OPERATION_ID,
        "admissionDigestSha256":
            request["admissionDigestSha256"],
        "requestBindingSha256": request["requestBindingSha256"],
        **measurements,
        "preserveContactObjectsRequested":
            request["settings"]["preserveContactObjects"],
        "edgeQualityApprovalIncluded": False,
        "temporalStabilityApprovalIncluded": False,
        "subjectCoverageApprovalIncluded": False,
        "privateReviewApprovalIncluded": False,
        "measurementOnly": True,
    }
    analysis_bytes = write_exclusive_json(
        ANALYSIS_OUTPUT_PATH,
        analysis,
        MAXIMUM_EVIDENCE_BYTES,
        "tracking analysis",
    )
    qa_bytes = write_exclusive_json(
        QA_OUTPUT_PATH,
        qa,
        MAXIMUM_EVIDENCE_BYTES,
        "mask QA measurement",
    )
    stage = "OUTPUT_RECEIPT_FAILED"
    mask_metadata = MASK_OUTPUT_PATH.lstat()
    return {
        "schemaVersion": RESPONSE_VERSION,
        "ok": True,
        "status": "controlled_sam2_gpu_inference_completed",
        "operationId": OPERATION_ID,
        "admissionDigestSha256":
            request["admissionDigestSha256"],
        "requestBindingSha256": request["requestBindingSha256"],
        "dispatchIntentId":
            request["dispatch"]["dispatchIntentId"],
        "runtimeIdentity": {
            "sam2DistributionVersion": SAM2_DISTRIBUTION_VERSION,
            "sam2SourceRevision": SOURCE_REVISION,
            "sam2ConfigSha256": CONFIG_SHA256,
            "torchVersion": TORCH_VERSION,
            "torchvisionVersion": TORCHVISION_VERSION,
            "cudaBuild": CUDA_BUILD,
            "cudaDeviceCount": 1,
            "accelerator": "nvidia_l4",
            "device": "cuda",
            "runtimeRegion": request["dispatch"]["runtimeRegion"],
            "checkpointLoaded": True,
            "cpuFallbackDisabled": True,
        },
        "outputs": [
            {
                "canonicalOrder": 0,
                "artifactKind": "mask_sequence",
                "fileName": "mask-sequence.mkv",
                "contentType": "video/x-matroska",
                "encodingProfile":
                    "gray8_ffv1_matroska_mask_sequence_v1",
                "byteLength": mask_metadata.st_size,
                "contentSha256": file_sha256(MASK_OUTPUT_PATH),
                "width": request["source"]["width"],
                "height": request["source"]["height"],
                "frameCount": request["source"]["frameCount"],
                "fpsNumerator": request["source"]["fpsNumerator"],
                "fpsDenominator": request["source"]["fpsDenominator"],
                **measurements,
            },
            {
                "canonicalOrder": 1,
                "artifactKind": "analysis_report",
                "fileName": "tracking-analysis.json",
                "contentType": "application/json",
                "encodingProfile":
                    "sam2_tracking_analysis_report_json_v1",
                "byteLength": len(analysis_bytes),
                "contentSha256": sha256_bytes(analysis_bytes),
            },
            {
                "canonicalOrder": 2,
                "artifactKind": "qa_report",
                "fileName": "mask-qa-measurement.json",
                "contentType": "application/json",
                "encodingProfile":
                    "sam2_mask_qa_measurement_report_json_v1",
                "byteLength": len(qa_bytes),
                "contentSha256": sha256_bytes(qa_bytes),
            },
        ],
        "receiptBoundaries": {
            "outputBytesIncluded": False,
            "sourceBytesIncluded": False,
            "modelBytesIncluded": False,
            "promptCoordinatesIncluded": False,
            "pathsIncluded": False,
            "urlsIncluded": False,
            "credentialsIncluded": False,
            "cpuFallbackAllowed": False,
            "runtimeDownloadAllowed": False,
            "networkFetchAllowed": False,
            "artifactCommitAuthority": False,
            "qaPassAuthority": False,
            "customerCostAuthority": False,
            "productionReady": False,
        },
    }


def main() -> None:
    global stage
    payload = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(payload) < 2 or len(payload) > MAXIMUM_REQUEST_BYTES:
        raise ValueError("runtime request byte length is invalid")
    try:
        value = json.loads(payload)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError("runtime request JSON is invalid") from error
    request = validate_request(value)
    response = execute(request)
    stage = "COMPLETED"
    sys.stdout.buffer.write(stable_json_bytes(response) + b"\n")
    sys.stdout.buffer.flush()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        failure = {
            "ok": False,
            "operationId": OPERATION_ID,
            "stage": stage,
            "sensitiveDetailsIncluded": False,
        }
        sys.stderr.buffer.write(stable_json_bytes(failure) + b"\n")
        sys.stderr.buffer.flush()
        raise SystemExit(70)
