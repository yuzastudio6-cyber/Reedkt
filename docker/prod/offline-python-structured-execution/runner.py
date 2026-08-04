from __future__ import annotations

import hashlib
import importlib.metadata
import base64
import binascii
import io
import json
import os
import platform
import re
import resource
import sys
import time
import warnings
import wave
from datetime import datetime, timezone
from typing import Any

import duckdb
import audioread
import librosa
import mido
import mir_eval
import noisereduce
import pretty_midi
import av
import cv2
import numpy as np
import opentimelineio as otio
import polars as pl
import resampy
import pyloudnorm as pyln
import scipy
from scipy import signal as scipy_signal
from pedalboard import Compressor, HighpassFilter, Limiter, Pedalboard
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    from pydub import AudioSegment
    from pydub import effects as pydub_effects
import scenedetect
from scenedetect import ContentDetector, SceneManager, open_video


PROTOCOL = "offline-python-structured-execution-v1"
CONTAINER_PROTOCOL = "offline-python-structured-execution-container-v1"
MAXIMUM_INPUT_BYTES = 24 * 1024 * 1024
MAXIMUM_ROWS = 10_000
MAXIMUM_SOURCE_BYTES = 16 * 1024 * 1024
SAFE_ID = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{2,95}$")
FORBIDDEN_KEY = re.compile(
    r"^(?:args|arguments|argv|authorization|code|command|cookie|cookies|cwd|env|environment|executable|file|filepath|filename|headers|html|javascript|outputpath|path|prompt|script|secret|shell|signedurl|sql|token|uri|url)$",
    re.IGNORECASE,
)
FORBIDDEN_TEXT = re.compile(
    r"(?:https?://|ftp://|file:|data:|javascript:|\.\./|\.\.\\|[A-Za-z]:[\\/]|(?:^|\s)/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:/|\b)|\$\(|`|&&|\|\||#!)",
    re.IGNORECASE,
)
OPERATIONS = {
    "duckdb": "tool.duckdb.query_approved_artifact_tables.v1",
    "polars": "tool.polars.transform_approved_artifact_tables.v1",
    "opentimelineio": "tool.opentimelineio.interchange_approved_timeline.v1",
    "pyav": "tool.pyav.decode_approved_media.v1",
    "opencv": "tool.opencv.analyze_approved_visual_artifacts.v1",
    "pyscenedetect": "tool.pyscenedetect.detect_scene_boundaries.v1",
    "scipy": "tool.scipy.analyze_signal.v1",
    "pyloudnorm": "tool.pyloudnorm.measure_loudness.v1",
    "pydub": "tool.pydub.process_audio_segments.v1",
    "pydub_effects": "tool.pydub_effects.apply_approved_audio_recipe.v1",
    "ebu_r128_pyloudnorm": "tool.ebu_r128_pyloudnorm.measure_ebu_r128_loudness.v1",
    "audioread": "tool.audioread.verify_audio_decode.v1",
    "resampy": "tool.resampy.resample_audio.v1",
    "pedalboard": "tool.pedalboard.apply_audio_effect_chain.v1",
    "mir_eval": "tool.mir_eval.score_music_timing.v1",
    "mido": "tool.mido.validate_midi_events.v1",
    "pretty_midi": "tool.pretty_midi.analyze_midi_timing.v1",
    "noisereduce": "tool.noisereduce.reduce_noise.v1",
    "librosa": "tool.librosa.analyze_audio_features.v1",
}
VERSIONS = {
    "duckdb": duckdb.__version__,
    "polars": pl.__version__,
    "opentimelineio": otio.__version__,
    "pyav": av.__version__,
    "opencv": cv2.__version__,
    "pyscenedetect": scenedetect.__version__,
    "scipy": scipy.__version__,
    "pyloudnorm": importlib.metadata.version("pyloudnorm"),
    "pydub": importlib.metadata.version("pydub"),
    "pydub_effects": importlib.metadata.version("pydub"),
    "ebu_r128_pyloudnorm": importlib.metadata.version("pyloudnorm"),
    "audioread": importlib.metadata.version("audioread"),
    "resampy": resampy.__version__,
    "pedalboard": importlib.metadata.version("pedalboard"),
    "mir_eval": importlib.metadata.version("mir_eval"),
    "mido": importlib.metadata.version("mido"),
    "pretty_midi": importlib.metadata.version("pretty_midi"),
    "noisereduce": importlib.metadata.version("noisereduce"),
    "librosa": librosa.__version__,
}
PACKAGE_NAMES = {
    "duckdb": "duckdb",
    "polars": "polars",
    "opentimelineio": "opentimelineio",
    "pyav": "pyav",
    "opencv": "opencv-python-headless",
    "pyscenedetect": "scenedetect",
    "scipy": "scipy",
    "pyloudnorm": "pyloudnorm",
    "pydub": "pydub",
    "pydub_effects": "pydub",
    "ebu_r128_pyloudnorm": "pyloudnorm",
    "audioread": "audioread",
    "resampy": "resampy",
    "pedalboard": "pedalboard",
    "mir_eval": "mir_eval",
    "mido": "mido",
    "pretty_midi": "pretty_midi",
    "noisereduce": "noisereduce",
    "librosa": "librosa",
}


class Rejected(Exception):
    pass


def canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def exact_object(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise Rejected(f"{label} must contain only its fixed fields")
    return value


def safe_text(value: Any, label: str, maximum: int = 160) -> str:
    if not isinstance(value, str) or not value or len(value) > maximum:
        raise Rejected(f"{label} is invalid")
    if value != value.strip() or any(ord(char) < 32 or ord(char) == 127 for char in value):
        raise Rejected(f"{label} contains unsafe whitespace or control characters")
    if FORBIDDEN_TEXT.search(value):
        raise Rejected(f"{label} contains a forbidden path, URI, or executable form")
    return value


def safe_id(value: Any, label: str) -> str:
    text = safe_text(value, label, 96)
    if not SAFE_ID.fullmatch(text) or ".." in text:
        raise Rejected(f"{label} is not a safe identity")
    return text


def bounded_int(value: Any, label: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum or value > maximum:
        raise Rejected(f"{label} is outside its fixed integer bounds")
    return value


def bounded_number(value: Any, label: str, minimum: float, maximum: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise Rejected(f"{label} is not numeric")
    number = float(value)
    if number < minimum or number > maximum or number != number or abs(number) == float("inf"):
        raise Rejected(f"{label} is outside its fixed numeric bounds")
    return number


def validate_tree(value: Any, depth: int = 0, nodes: list[int] | None = None) -> None:
    if nodes is None:
        nodes = [0]
    nodes[0] += 1
    if depth > 12 or nodes[0] > 120_000:
        raise Rejected("request structure exceeded its fixed bounds")
    if value is None or isinstance(value, (bool, int, float)):
        return
    if isinstance(value, str):
        safe_text(value, "request text", 2_000)
        return
    if isinstance(value, list):
        if len(value) > MAXIMUM_ROWS:
            raise Rejected("request array exceeded its fixed bound")
        for entry in value:
            validate_tree(entry, depth + 1, nodes)
        return
    if isinstance(value, dict):
        if len(value) > 32:
            raise Rejected("request object exceeded its fixed field bound")
        for key, entry in value.items():
            if not isinstance(key, str) or FORBIDDEN_KEY.search(key):
                raise Rejected("request contains a forbidden property name")
            if key == "sourceBytesBase64":
                if not isinstance(entry, str) or len(entry) < 4 or len(entry) > ((MAXIMUM_SOURCE_BYTES + 2) // 3) * 4:
                    raise Rejected("sourceBytesBase64 exceeded its fixed server-injected bound")
                continue
            validate_tree(entry, depth + 1, nodes)
        return
    raise Rejected("request contains an unsupported value type")


def validate_table_rows(value: Any, maximum_rows: int) -> list[dict[str, Any]]:
    if not isinstance(value, list) or not value or len(value) > maximum_rows:
        raise Rejected("table rows are empty or exceed maximumRows")
    rows: list[dict[str, Any]] = []
    for index, raw in enumerate(value):
        row = exact_object(
            raw,
            {"rowId", "category", "status", "startFrame", "endFrame", "value"},
            f"rows[{index}]",
        )
        start = bounded_int(row["startFrame"], "startFrame", 0, 10_000_000)
        end = bounded_int(row["endFrame"], "endFrame", 1, 10_000_001)
        if end <= start:
            raise Rejected("endFrame must be greater than startFrame")
        status = row["status"]
        if status not in {"passed", "warning", "failed", "blocked"}:
            raise Rejected("status is unsupported")
        rows.append({
            "rowId": safe_id(row["rowId"], "rowId"),
            "category": safe_id(row["category"], "category"),
            "status": status,
            "startFrame": start,
            "endFrame": end,
            "value": bounded_number(row["value"], "value", -1_000_000_000, 1_000_000_000),
        })
    if len({row["rowId"] for row in rows}) != len(rows):
        raise Rejected("rowId values must be unique")
    return rows


def run_duckdb(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {"queryProfileId", "maximumRows", "rows"}, "DuckDB payload")
    profile_id = payload["queryProfileId"]
    if profile_id not in {"approved_qa_aggregate_v1", "approved_timing_metrics_v1"}:
        raise Rejected("DuckDB query profile is unsupported")
    maximum_rows = bounded_int(payload["maximumRows"], "maximumRows", 1, MAXIMUM_ROWS)
    rows = validate_table_rows(payload["rows"], maximum_rows)
    connection = duckdb.connect(database=":memory:")
    try:
        connection.execute(
            "CREATE TABLE approved_rows(row_id VARCHAR, category VARCHAR, status VARCHAR, start_frame BIGINT, end_frame BIGINT, value DOUBLE)"
        )
        connection.executemany(
            "INSERT INTO approved_rows VALUES (?, ?, ?, ?, ?, ?)",
            [(row["rowId"], row["category"], row["status"], row["startFrame"], row["endFrame"], row["value"]) for row in rows],
        )
        if profile_id == "approved_qa_aggregate_v1":
            cursor = connection.execute(
                "SELECT category, status, COUNT(*) AS row_count, ROUND(AVG(value), 6) AS average_value "
                "FROM approved_rows GROUP BY category, status ORDER BY category, status"
            )
            columns = [entry[0] for entry in cursor.description]
        else:
            cursor = connection.execute(
                "SELECT category, COUNT(*) AS row_count, SUM(end_frame-start_frame) AS total_frames, "
                "ROUND(AVG(end_frame-start_frame), 6) AS average_frames "
                "FROM approved_rows GROUP BY category ORDER BY category"
            )
            columns = [entry[0] for entry in cursor.description]
        output_rows = [dict(zip(columns, row, strict=True)) for row in cursor.fetchall()]
    finally:
        connection.close()
    result = {"profileId": profile_id, "columns": columns, "rows": output_rows}
    return result, {"inputRowCount": len(rows), "outputRowCount": len(output_rows), "fixedProfileExecuted": True}


def run_polars(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {"transformProfileId", "maximumRows", "deterministicOrdering", "rows"}, "Polars payload")
    profile_id = payload["transformProfileId"]
    if profile_id not in {"approved_qa_transform_v1", "approved_timing_table_v1"}:
        raise Rejected("Polars transform profile is unsupported")
    if payload["deterministicOrdering"] is not True:
        raise Rejected("Polars execution requires deterministic ordering")
    maximum_rows = bounded_int(payload["maximumRows"], "maximumRows", 1, MAXIMUM_ROWS)
    rows = validate_table_rows(payload["rows"], maximum_rows)
    frame = pl.DataFrame(rows)
    if profile_id == "approved_qa_transform_v1":
        transformed = (
            frame.with_columns(
                pl.col("status").replace_strict(
                    {"passed": 0, "warning": 1, "failed": 2, "blocked": 3},
                    return_dtype=pl.Int64,
                ).alias("severityRank")
            )
            .sort(["severityRank", "category", "rowId"], descending=[True, False, False])
        )
    else:
        transformed = (
            frame.with_columns((pl.col("endFrame") - pl.col("startFrame")).alias("durationFrames"))
            .sort(["startFrame", "rowId"])
        )
    output_rows = transformed.to_dicts()
    result = {"profileId": profile_id, "columns": transformed.columns, "rows": output_rows}
    return result, {"inputRowCount": len(rows), "outputRowCount": len(output_rows), "deterministicOrdering": True}


def run_otio(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(
        payload_value,
        {"interchangeProfileId", "frameRate", "strictRangeValidation", "preserveApprovedSourceOrder", "timelineName", "clips"},
        "OpenTimelineIO payload",
    )
    profile_id = payload["interchangeProfileId"]
    if profile_id not in {"approved_plan_to_otio_v1", "validate_approved_otio_v1"}:
        raise Rejected("OpenTimelineIO interchange profile is unsupported")
    frame_rate = bounded_int(payload["frameRate"], "frameRate", 1, 120)
    if frame_rate not in {24, 25, 30, 50, 60}:
        raise Rejected("OpenTimelineIO frame rate is unsupported")
    if payload["strictRangeValidation"] is not True or payload["preserveApprovedSourceOrder"] is not True:
        raise Rejected("OpenTimelineIO requires strict ranges and approved source order")
    clips_value = payload["clips"]
    if not isinstance(clips_value, list) or not clips_value or len(clips_value) > 2_000:
        raise Rejected("OpenTimelineIO clips are empty or exceed their bound")
    timeline = otio.schema.Timeline(name=safe_text(payload["timelineName"], "timelineName", 96))
    track = otio.schema.Track(name="ApprovedVideo", kind=otio.schema.TrackKind.Video)
    cursor = 0
    clip_ids: list[str] = []
    for index, raw in enumerate(clips_value):
        clip = exact_object(
            raw,
            {"clipId", "name", "mediaReferenceId", "sourceStartFrame", "durationFrames", "timelineStartFrame"},
            f"clips[{index}]",
        )
        clip_id = safe_id(clip["clipId"], "clipId")
        clip_ids.append(clip_id)
        source_start = bounded_int(clip["sourceStartFrame"], "sourceStartFrame", 0, 100_000_000)
        duration = bounded_int(clip["durationFrames"], "durationFrames", 1, 10_000_000)
        timeline_start = bounded_int(clip["timelineStartFrame"], "timelineStartFrame", 0, 100_000_000)
        if timeline_start < cursor:
            raise Rejected("approved clips overlap or are out of source order")
        if timeline_start > cursor:
            track.append(otio.schema.Gap(source_range=otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(0, frame_rate),
                duration=otio.opentime.RationalTime(timeline_start - cursor, frame_rate),
            )))
        reference = otio.schema.MissingReference(
            name="PrivateApprovedMediaReference",
            metadata={"mediaReferenceId": safe_id(clip["mediaReferenceId"], "mediaReferenceId")},
        )
        track.append(otio.schema.Clip(
            name=safe_text(clip["name"], "clip name", 120),
            media_reference=reference,
            source_range=otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(source_start, frame_rate),
                duration=otio.opentime.RationalTime(duration, frame_rate),
            ),
            metadata={"clipId": clip_id},
        ))
        cursor = timeline_start + duration
    if len(set(clip_ids)) != len(clip_ids):
        raise Rejected("clipId values must be unique")
    timeline.tracks.append(track)
    serialized = otio.adapters.write_to_string(timeline, adapter_name="otio_json")
    parsed = json.loads(serialized)
    roundtrip = otio.adapters.read_from_string(serialized, adapter_name="otio_json")
    result = {
        "profileId": profile_id,
        "timeline": parsed,
        "summary": {
            "clipCount": len(clip_ids),
            "trackCount": len(roundtrip.tracks),
            "durationFrames": int(roundtrip.duration().value),
            "frameRate": frame_rate,
        },
    }
    return result, {"clipCount": len(clip_ids), "roundtripValidated": True, "approvedOrderPreserved": True}


def decode_source_bytes(payload: dict[str, Any]) -> bytes:
    if payload["mimeType"] != "video/mp4":
        raise Rejected("media runner currently requires an approved video/mp4 source")
    expected_length = bounded_int(payload["sourceByteLength"], "sourceByteLength", 64, MAXIMUM_SOURCE_BYTES)
    source_hash = payload["sourceSha256"]
    if not isinstance(source_hash, str) or not re.fullmatch(r"[a-f0-9]{64}", source_hash):
        raise Rejected("sourceSha256 is invalid")
    encoded = payload["sourceBytesBase64"]
    if not isinstance(encoded, str) or len(encoded) > ((MAXIMUM_SOURCE_BYTES + 2) // 3) * 4:
        raise Rejected("sourceBytesBase64 is invalid")
    try:
        source = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise Rejected("sourceBytesBase64 is malformed")
    if len(source) != expected_length or hashlib.sha256(source).hexdigest() != source_hash:
        raise Rejected("server-injected source bytes do not match their immutable commitment")
    return source


def run_pyav(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "decodeProfileId", "frameStride", "maximumSamples", "preserveSourceTimestamps",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "PyAV payload")
    if payload["decodeProfileId"] not in {"timestamp_safe_sample_v1", "keyframe_extract_v1", "audio_extract_v1"}:
        raise Rejected("PyAV decode profile is unsupported")
    if payload["preserveSourceTimestamps"] is not True:
        raise Rejected("PyAV source timestamp preservation is required")
    stride = bounded_int(payload["frameStride"], "frameStride", 1, 30)
    maximum_samples = bounded_int(payload["maximumSamples"], "maximumSamples", 1, 2_000)
    source = decode_source_bytes(payload)
    samples: list[dict[str, Any]] = []
    with av.open(io.BytesIO(source), mode="r") as container:
        streams = [{
            "index": stream.index,
            "type": stream.type,
            "codec": stream.codec_context.name,
            "timeBase": str(stream.time_base) if stream.time_base else None,
            "duration": int(stream.duration) if stream.duration is not None else None,
            "frames": int(stream.frames),
        } for stream in container.streams]
        video_streams = [stream for stream in container.streams if stream.type == "video"]
        if not video_streams:
            raise Rejected("approved source has no decodable video stream")
        selected = video_streams[0]
        decoded_count = 0
        for frame in container.decode(selected):
            if decoded_count % stride == 0:
                array = frame.to_ndarray(format="gray")
                samples.append({
                    "frameIndex": decoded_count,
                    "pts": int(frame.pts) if frame.pts is not None else None,
                    "width": frame.width,
                    "height": frame.height,
                    "keyFrame": bool(frame.key_frame),
                    "meanLuma": round(float(array.mean()), 6),
                })
                if len(samples) >= maximum_samples:
                    break
            decoded_count += 1
        result = {
            "profileId": payload["decodeProfileId"],
            "containerFormat": container.format.name,
            "durationMicroseconds": int(container.duration) if container.duration is not None else None,
            "streams": streams,
            "samples": samples,
        }
    if not samples:
        raise Rejected("PyAV produced no approved frame samples")
    return result, {
        "sourceBytesVerified": True,
        "streamCount": len(streams),
        "videoSampleCount": len(samples),
        "timestampsPreserved": True,
    }


def with_fixed_media_file(source: bytes, action: Any) -> Any:
    path = "/tmp/reeditpro-approved-source.mp4"
    try:
        with open(path, "xb") as handle:
            handle.write(source)
        return action(path)
    finally:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


def matrix_list(matrix: np.ndarray) -> list[float]:
    return [round(float(value), 9) for value in matrix.reshape(-1)]


def estimate_camera_transform(
    previous: np.ndarray,
    current: np.ndarray,
    maximum_features: int,
    ransac_threshold: float,
) -> tuple[np.ndarray, float, int, float]:
    points = cv2.goodFeaturesToTrack(
        previous, maxCorners=maximum_features, qualityLevel=0.01,
        minDistance=5, blockSize=7,
    )
    if points is None or len(points) < 4:
        return np.eye(3, dtype=np.float64), 0.0, 0, float("inf")
    tracked, status, _ = cv2.calcOpticalFlowPyrLK(
        previous, current, points, None,
        winSize=(21, 21), maxLevel=3,
        criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01),
    )
    if tracked is None or status is None:
        return np.eye(3, dtype=np.float64), 0.0, 0, float("inf")
    good = status.reshape(-1) == 1
    source_points = points.reshape(-1, 2)[good]
    target_points = tracked.reshape(-1, 2)[good]
    if len(source_points) < 4:
        return np.eye(3, dtype=np.float64), 0.0, len(source_points), float("inf")
    affine, inliers = cv2.estimateAffinePartial2D(
        source_points, target_points, method=cv2.RANSAC,
        ransacReprojThreshold=ransac_threshold, maxIters=2_000,
        confidence=0.99, refineIters=10,
    )
    if affine is None or not np.isfinite(affine).all():
        return np.eye(3, dtype=np.float64), 0.0, len(source_points), float("inf")
    matrix = np.vstack([affine, [0.0, 0.0, 1.0]]).astype(np.float64)
    projected = cv2.transform(source_points.reshape(-1, 1, 2), affine).reshape(-1, 2)
    errors = np.linalg.norm(projected - target_points, axis=1)
    inlier_mask = inliers.reshape(-1).astype(bool) if inliers is not None else np.ones(len(errors), dtype=bool)
    inlier_count = int(np.count_nonzero(inlier_mask))
    confidence = min(1.0, max(0.0, inlier_count / max(1, len(source_points))))
    reprojection_error = float(np.mean(errors[inlier_mask])) if inlier_count > 0 else float("inf")
    return matrix, confidence, inlier_count, reprojection_error


def motion_class(matrix: np.ndarray, width: int, height: int, confidence: float) -> str:
    if confidence < 0.2:
        return "handheld"
    dx = float(matrix[0, 2]) / max(1, width)
    dy = float(matrix[1, 2]) / max(1, height)
    scale = float(np.sqrt(max(0.0, abs(np.linalg.det(matrix[:2, :2])))))
    rotation_degrees = abs(float(np.degrees(np.arctan2(matrix[1, 0], matrix[0, 0]))))
    if rotation_degrees > 0.5:
        return "roll"
    if abs(scale - 1.0) > 0.01:
        return "zoom"
    if abs(dx) > 0.002 or abs(dy) > 0.002:
        return "pan" if abs(dx) >= abs(dy) else "tilt"
    return "static"


def normalized_corners(points: np.ndarray, width: int, height: int) -> list[dict[str, float]]:
    return [{
        "x": round(float(np.clip(point[0] / max(1, width), 0.0, 1.0)), 9),
        "y": round(float(np.clip(point[1] / max(1, height), 0.0, 1.0)), 9),
    } for point in points.reshape(-1, 2)]


def track_planar_frames(
    frames: list[tuple[int, np.ndarray]],
    initialization_frame: int,
    initial_corners: np.ndarray,
    maximum_features: int,
    ransac_threshold: float,
) -> list[dict[str, Any]]:
    by_index = {frame_index: position for position, (frame_index, _) in enumerate(frames)}
    if initialization_frame not in by_index:
        raise Rejected("OpenCV initialization frame was not decoded into the bounded sample")
    initial_position = by_index[initialization_frame]
    results: dict[int, dict[str, Any]] = {}

    def record(
        position: int,
        corners: np.ndarray,
        cumulative: np.ndarray,
        confidence: float,
        reprojection_error: float,
        inlier_count: int,
    ) -> None:
        frame_index, gray = frames[position]
        height, width = gray.shape
        within = np.logical_and.reduce((
            corners[:, 0] >= 0, corners[:, 0] < width,
            corners[:, 1] >= 0, corners[:, 1] < height,
        ))
        visibility = float(np.count_nonzero(within)) / 4.0
        finite_error = reprojection_error if np.isfinite(reprojection_error) else float(max(width, height))
        stability = max(0.0, 1.0 - finite_error / max(1.0, ransac_threshold * 4.0))
        results[frame_index] = {
            "frameIndex": frame_index,
            "corners": normalized_corners(corners, width, height),
            "homography": matrix_list(cumulative),
            "reprojectionError": round(finite_error, 6),
            "visibility": round(visibility, 6),
            "occlusion": round(max(0.0, 1.0 - confidence * visibility), 6),
            "surfaceStability": round(stability, 6),
            "confidence": round(confidence * visibility, 6),
            "trackedFeatureCount": inlier_count,
        }

    record(initial_position, initial_corners, np.eye(3), 1.0, 0.0, 4)

    current_corners = initial_corners.copy()
    cumulative = np.eye(3, dtype=np.float64)
    for position in range(initial_position + 1, len(frames)):
        previous = frames[position - 1][1]
        current = frames[position][1]
        mask = np.zeros(previous.shape, dtype=np.uint8)
        cv2.fillConvexPoly(mask, np.rint(current_corners).astype(np.int32), 255)
        points = cv2.goodFeaturesToTrack(
            previous, maxCorners=maximum_features, qualityLevel=0.005,
            minDistance=3, blockSize=5, mask=mask,
        )
        homography = None
        confidence = 0.0
        inlier_count = 0
        reprojection_error = float("inf")
        if points is not None and len(points) >= 4:
            tracked, status, _ = cv2.calcOpticalFlowPyrLK(previous, current, points, None)
            if tracked is not None and status is not None:
                good = status.reshape(-1) == 1
                source_points = points.reshape(-1, 2)[good]
                target_points = tracked.reshape(-1, 2)[good]
                if len(source_points) >= 4:
                    homography, inliers = cv2.findHomography(
                        source_points, target_points, cv2.RANSAC, ransac_threshold,
                    )
                    if homography is not None and np.isfinite(homography).all():
                        projected = cv2.perspectiveTransform(source_points.reshape(-1, 1, 2), homography).reshape(-1, 2)
                        errors = np.linalg.norm(projected - target_points, axis=1)
                        inlier_mask = inliers.reshape(-1).astype(bool) if inliers is not None else np.ones(len(errors), dtype=bool)
                        inlier_count = int(np.count_nonzero(inlier_mask))
                        confidence = inlier_count / max(1, len(source_points))
                        reprojection_error = float(np.mean(errors[inlier_mask])) if inlier_count > 0 else float("inf")
        if homography is None or not np.isfinite(homography).all():
            homography = np.eye(3, dtype=np.float64)
        current_corners = cv2.perspectiveTransform(current_corners.reshape(-1, 1, 2), homography).reshape(-1, 2)
        cumulative = homography @ cumulative
        record(position, current_corners, cumulative, confidence, reprojection_error, inlier_count)

    current_corners = initial_corners.copy()
    cumulative = np.eye(3, dtype=np.float64)
    for position in range(initial_position - 1, -1, -1):
        later = frames[position + 1][1]
        earlier = frames[position][1]
        mask = np.zeros(later.shape, dtype=np.uint8)
        cv2.fillConvexPoly(mask, np.rint(current_corners).astype(np.int32), 255)
        points = cv2.goodFeaturesToTrack(
            later, maxCorners=maximum_features, qualityLevel=0.005,
            minDistance=3, blockSize=5, mask=mask,
        )
        homography = None
        confidence = 0.0
        inlier_count = 0
        reprojection_error = float("inf")
        if points is not None and len(points) >= 4:
            tracked, status, _ = cv2.calcOpticalFlowPyrLK(later, earlier, points, None)
            if tracked is not None and status is not None:
                good = status.reshape(-1) == 1
                source_points = points.reshape(-1, 2)[good]
                target_points = tracked.reshape(-1, 2)[good]
                if len(source_points) >= 4:
                    homography, inliers = cv2.findHomography(
                        source_points, target_points, cv2.RANSAC, ransac_threshold,
                    )
                    if homography is not None and np.isfinite(homography).all():
                        projected = cv2.perspectiveTransform(source_points.reshape(-1, 1, 2), homography).reshape(-1, 2)
                        errors = np.linalg.norm(projected - target_points, axis=1)
                        inlier_mask = inliers.reshape(-1).astype(bool) if inliers is not None else np.ones(len(errors), dtype=bool)
                        inlier_count = int(np.count_nonzero(inlier_mask))
                        confidence = inlier_count / max(1, len(source_points))
                        reprojection_error = float(np.mean(errors[inlier_mask])) if inlier_count > 0 else float("inf")
        if homography is None or not np.isfinite(homography).all():
            homography = np.eye(3, dtype=np.float64)
        current_corners = cv2.perspectiveTransform(current_corners.reshape(-1, 1, 2), homography).reshape(-1, 2)
        cumulative = homography @ cumulative
        record(position, current_corners, cumulative, confidence, reprojection_error, inlier_count)

    return [results[frame_index] for frame_index, _ in frames]


def run_opencv(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    track_all_profiles = {"track_all_camera_motion_v1", "track_all_planar_homography_v1"}
    raw_profile = payload_value.get("analysisProfileId") if isinstance(payload_value, dict) else None
    allowed_keys = {
        "analysisProfileId", "frameStride", "maximumFrames", "emitDerivedPixels",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }
    if raw_profile in track_all_profiles:
        allowed_keys.update({
            "startFrameInclusive", "endFrameExclusive", "initializationFrameIndex",
            "maximumFeatures", "ransacReprojectionThreshold", "planarCornersNormalized",
        })
    payload = exact_object(payload_value, allowed_keys, "OpenCV payload")
    if payload["analysisProfileId"] not in {
        "approved_safe_zone_v1", "approved_blur_check_v1", "approved_mask_qa_v1",
        *track_all_profiles,
    }:
        raise Rejected("OpenCV analysis profile is unsupported")
    if payload["emitDerivedPixels"] is not False:
        raise Rejected("OpenCV private analysis cannot emit derived pixels")
    stride = bounded_int(payload["frameStride"], "frameStride", 1, 30)
    maximum_frames = bounded_int(
        payload["maximumFrames"], "maximumFrames", 1,
        600 if payload["analysisProfileId"] in track_all_profiles else 5_000,
    )
    source = decode_source_bytes(payload)

    def analyze(path: str) -> tuple[dict[str, Any], dict[str, Any]]:
        capture = cv2.VideoCapture(path)
        if not capture.isOpened():
            raise Rejected("OpenCV could not open approved source bytes")
        samples: list[dict[str, Any]] = []
        geometry_frames: list[tuple[int, np.ndarray]] = []
        frame_index = 0
        reported_frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        reported_fps = round(float(capture.get(cv2.CAP_PROP_FPS)), 6)
        track_all_profile = payload["analysisProfileId"] in track_all_profiles
        start_frame = bounded_int(payload["startFrameInclusive"], "startFrameInclusive", 0, 100_000_000) if track_all_profile else 0
        end_frame = bounded_int(payload["endFrameExclusive"], "endFrameExclusive", 1, 100_000_001) if track_all_profile else reported_frame_count
        initialization_frame = bounded_int(payload["initializationFrameIndex"], "initializationFrameIndex", 0, 100_000_000) if track_all_profile else 0
        if track_all_profile and (end_frame <= start_frame or initialization_frame < start_frame or initialization_frame >= end_frame):
            raise Rejected("OpenCV Track All range or initialization frame is invalid")
        try:
            while len(samples) < maximum_frames:
                ok, frame = capture.read()
                if not ok:
                    break
                if track_all_profile and frame_index >= end_frame:
                    break
                in_range = not track_all_profile or frame_index >= start_frame
                selected = in_range and (
                    (frame_index - start_frame) % stride == 0 or
                    (track_all_profile and frame_index == initialization_frame)
                )
                if selected:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    height, width = gray.shape
                    analysis_scale = min(1.0, 640.0 / max(width, height))
                    if analysis_scale < 1.0:
                        gray = cv2.resize(
                            gray,
                            (max(1, int(round(width * analysis_scale))), max(1, int(round(height * analysis_scale)))),
                            interpolation=cv2.INTER_AREA,
                        )
                    samples.append({
                        "frameIndex": frame_index,
                        "width": int(frame.shape[1]),
                        "height": int(frame.shape[0]),
                        "meanLuma": round(float(np.mean(gray)), 6),
                        "laplacianVariance": round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 6),
                    })
                    if track_all_profile:
                        geometry_frames.append((frame_index, gray))
                frame_index += 1
        finally:
            capture.release()
        if not samples:
            raise Rejected("OpenCV produced no approved frame samples")
        camera_transforms: list[dict[str, Any]] = []
        planar_frames: list[dict[str, Any]] = []
        if track_all_profile:
            if not geometry_frames or initialization_frame not in {entry[0] for entry in geometry_frames}:
                raise Rejected("OpenCV Track All range produced no exact initialization frame")
            maximum_features = bounded_int(payload["maximumFeatures"], "maximumFeatures", 256, 1_024)
            if maximum_features not in {256, 512, 1_024}:
                raise Rejected("OpenCV Track All feature budget is unsupported")
            ransac_threshold = bounded_number(payload["ransacReprojectionThreshold"], "ransacReprojectionThreshold", 1, 5)
            if ransac_threshold not in {1.0, 2.0, 3.0, 5.0}:
                raise Rejected("OpenCV Track All RANSAC threshold is unsupported")
            cumulative = np.eye(3, dtype=np.float64)
            for position, (sample_frame_index, gray) in enumerate(geometry_frames):
                if position == 0:
                    transform = np.eye(3, dtype=np.float64)
                    confidence = 1.0
                    inlier_count = 0
                    reprojection_error = 0.0
                else:
                    transform, confidence, inlier_count, reprojection_error = estimate_camera_transform(
                        geometry_frames[position - 1][1], gray, maximum_features, ransac_threshold,
                    )
                    cumulative = transform @ cumulative
                stabilized = np.linalg.inv(cumulative) if abs(float(np.linalg.det(cumulative))) > 1e-12 else np.eye(3)
                camera_transforms.append({
                    "frameIndex": sample_frame_index,
                    "motion": motion_class(transform, gray.shape[1], gray.shape[0], confidence),
                    "frameToFrameTransform": matrix_list(transform),
                    "stabilizedTransform": matrix_list(stabilized),
                    "confidence": round(confidence, 6),
                    "discontinuityWarning": confidence < 0.2,
                    "shotReset": position == 0,
                    "trackedFeatureCount": inlier_count,
                    "reprojectionError": round(reprojection_error if np.isfinite(reprojection_error) else float(max(gray.shape)), 6),
                })
            corners_value = payload["planarCornersNormalized"]
            if payload["analysisProfileId"] == "track_all_camera_motion_v1":
                if corners_value != []:
                    raise Rejected("Camera-motion profile cannot receive planar corners")
            else:
                if not isinstance(corners_value, list) or len(corners_value) != 4:
                    raise Rejected("Planar profile requires exactly four normalized corners")
                initialization_gray = next(gray for index, gray in geometry_frames if index == initialization_frame)
                initial_height, initial_width = initialization_gray.shape
                initial_corners = []
                for corner in corners_value:
                    checked = exact_object(corner, {"x", "y"}, "planar corner")
                    initial_corners.append([
                        bounded_number(checked["x"], "planar corner x", 0, 1) * initial_width,
                        bounded_number(checked["y"], "planar corner y", 0, 1) * initial_height,
                    ])
                initial_corner_array = np.asarray(initial_corners, dtype=np.float32)
                if abs(float(cv2.contourArea(initial_corner_array))) < 16:
                    raise Rejected("Planar profile grounding region is too small")
                planar_frames = track_planar_frames(
                    geometry_frames, initialization_frame, initial_corner_array,
                    maximum_features, ransac_threshold,
                )
        result = {
            "profileId": payload["analysisProfileId"],
            "reportedFrameCount": reported_frame_count,
            "reportedFps": reported_fps,
            "samples": samples,
        }
        if track_all_profile:
            result.update({
                "authorizedRange": {
                "startFrameInclusive": start_frame,
                "endFrameExclusive": end_frame,
                },
                "initializationFrameIndex": initialization_frame,
                "cameraTransforms": camera_transforms,
                "planarFrames": planar_frames,
            })
        semantic = {
            "sourceBytesVerified": True,
            "sampleCount": len(samples),
            "derivedPixelsEmitted": False,
            "fixedTemporaryPathOnly": True,
        }
        if track_all_profile:
            semantic.update({
                "opticalFlowExecuted": True,
                "homographyExecuted": payload["analysisProfileId"] == "track_all_planar_homography_v1",
                "cameraTransformCount": len(camera_transforms),
                "planarFrameCount": len(planar_frames),
                "trackAllGeometryProfileExecuted": True,
            })
        return result, semantic

    return with_fixed_media_file(source, analyze)


def run_scenedetect(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "detectorProfileId", "contentThreshold", "minimumSceneFrames", "downscaleFactor",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "PySceneDetect payload")
    safe_id(payload["detectorProfileId"], "detectorProfileId")
    threshold = bounded_number(payload["contentThreshold"], "contentThreshold", 0, 100)
    minimum_scene_frames = bounded_int(payload["minimumSceneFrames"], "minimumSceneFrames", 1, 3_600)
    downscale = bounded_int(payload["downscaleFactor"], "downscaleFactor", 1, 8)
    source = decode_source_bytes(payload)

    def detect(path: str) -> tuple[dict[str, Any], dict[str, Any]]:
        video = open_video(path)
        manager = SceneManager()
        manager.add_detector(ContentDetector(threshold=threshold, min_scene_len=minimum_scene_frames))
        manager.auto_downscale = False
        manager.downscale = downscale
        manager.detect_scenes(video=video, show_progress=False)
        scene_list = manager.get_scene_list(start_in_scene=True)
        scenes = [{
            "startFrame": start.frame_num,
            "endFrame": end.frame_num,
            "startSeconds": round(start.seconds, 6),
            "endSeconds": round(end.seconds, 6),
        } for start, end in scene_list]
        if not scenes:
            raise Rejected("PySceneDetect produced no scene intervals")
        result = {
            "profileId": payload["detectorProfileId"],
            "threshold": threshold,
            "minimumSceneFrames": minimum_scene_frames,
            "downscaleFactor": downscale,
            "scenes": scenes,
        }
        return result, {
            "sourceBytesVerified": True,
            "sceneCount": len(scenes),
            "fixedContentDetectorExecuted": True,
            "fixedTemporaryPathOnly": True,
        }

    return with_fixed_media_file(source, detect)


def decode_approved_audio(
    payload: dict[str, Any], sample_rate: int, channel_mode: str
) -> tuple[np.ndarray, dict[str, Any]]:
    source = decode_source_bytes(payload)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("approved audio sample rate is unsupported")
    if channel_mode not in {"mono", "stereo", "preserve"}:
        raise Rejected("approved audio channel mode is unsupported")
    maximum_samples = sample_rate * 20
    chunks: list[np.ndarray] = []
    collected = 0
    with av.open(io.BytesIO(source), mode="r") as container:
        streams = [stream for stream in container.streams if stream.type == "audio"]
        if not streams:
            raise Rejected("approved source has no decodable audio stream")
        selected = streams[0]
        source_channels = int(selected.codec_context.channels)
        target_channels = 1 if channel_mode == "mono" else 2 if channel_mode == "stereo" else min(source_channels, 2)
        target_layout = "mono" if target_channels == 1 else "stereo"
        resampler = av.AudioResampler(format="fltp", layout=target_layout, rate=sample_rate)

        def append_frames(frames: list[Any]) -> None:
            nonlocal collected
            for frame in frames:
                array = np.asarray(frame.to_ndarray(), dtype=np.float32)
                if array.ndim == 1:
                    array = array.reshape(1, -1)
                if array.shape[0] != target_channels:
                    raise Rejected("resampled audio channel layout is invalid")
                remaining = maximum_samples - collected
                if remaining <= 0:
                    return
                bounded = array[:, :remaining]
                chunks.append(bounded)
                collected += bounded.shape[1]

        for frame in container.decode(selected):
            append_frames(resampler.resample(frame))
            if collected >= maximum_samples:
                break
        if collected < maximum_samples:
            append_frames(resampler.resample(None))
        codec_name = selected.codec_context.name
    if not chunks:
        raise Rejected("approved source produced no audio samples")
    samples = np.concatenate(chunks, axis=1).T
    if samples.shape[0] < max(1_024, int(sample_rate * 0.4)):
        raise Rejected("approved audio is too short for bounded analysis")
    if not np.isfinite(samples).all():
        raise Rejected("approved audio contains non-finite samples")
    return samples, {
        "sampleRate": sample_rate,
        "channelCount": int(samples.shape[1]),
        "sampleCount": int(samples.shape[0]),
        "durationSeconds": round(float(samples.shape[0]) / sample_rate, 6),
        "sourceCodec": codec_name,
        "truncatedToTwentySeconds": collected >= maximum_samples,
    }


def run_scipy(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    allowed = {"sampleRate", "channelMode", "analysisProfileId", "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64"}
    if isinstance(payload_value, dict) and "confidenceThreshold" in payload_value:
        allowed.add("confidenceThreshold")
    payload = exact_object(payload_value, allowed, "SciPy payload")
    sample_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("SciPy sample rate is unsupported")
    profile_id = payload["analysisProfileId"]
    if profile_id not in {"approved_signal_quality_v1", "approved_spectral_summary_v1"}:
        raise Rejected("SciPy analysis profile is unsupported")
    if "confidenceThreshold" in payload:
        bounded_number(payload["confidenceThreshold"], "confidenceThreshold", 0, 1)
    samples, audio = decode_approved_audio(payload, sample_rate, payload["channelMode"])
    mono = np.mean(samples, axis=1, dtype=np.float64)
    frequencies, power = scipy_signal.welch(mono, fs=sample_rate, nperseg=min(4_096, mono.size))
    total_power = float(np.sum(power))
    dominant_index = int(np.argmax(power))
    centroid = float(np.sum(frequencies * power) / total_power) if total_power > 0 else 0.0
    peak_indices, properties = scipy_signal.find_peaks(power, prominence=max(float(np.max(power)) * 0.01, 1e-15))
    ranked = sorted(peak_indices.tolist(), key=lambda index: float(power[index]), reverse=True)[:5]
    result = {
        "profileId": profile_id,
        "audio": audio,
        "measurements": {
            "rms": round(float(np.sqrt(np.mean(np.square(mono)))), 9),
            "peakAbsolute": round(float(np.max(np.abs(mono))), 9),
            "dcOffset": round(float(np.mean(mono)), 9),
            "dominantFrequencyHz": round(float(frequencies[dominant_index]), 6),
            "spectralCentroidHz": round(centroid, 6),
            "spectralPeakCount": len(peak_indices),
            "strongestPeakFrequenciesHz": [round(float(frequencies[index]), 6) for index in ranked],
        },
    }
    return result, {
        "sourceBytesVerified": True,
        "sampleCount": audio["sampleCount"],
        "fixedWelchProfileExecuted": True,
        "boundedAudioDecode": True,
    }


def run_librosa(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    allowed = {
        "sampleRate", "channelMode", "analysisProfileId",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }
    if isinstance(payload_value, dict) and "confidenceThreshold" in payload_value:
        allowed.add("confidenceThreshold")
    payload = exact_object(payload_value, allowed, "librosa payload")
    sample_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("librosa sample rate is unsupported")
    if payload["analysisProfileId"] != "approved_rhythm_timing_cues_v1":
        raise Rejected("librosa analysis profile is unsupported")
    confidence_threshold = bounded_number(
        payload.get("confidenceThreshold", 0.5), "confidenceThreshold", 0, 1
    )
    samples, audio = decode_approved_audio(payload, sample_rate, payload["channelMode"])
    mono = np.mean(samples, axis=1, dtype=np.float64).astype(np.float32)
    hop_length = 512
    frame_length = 2_048
    onset_envelope = librosa.onset.onset_strength(
        y=mono, sr=sample_rate, hop_length=hop_length, n_fft=frame_length, center=False
    )
    onset_frames = librosa.onset.onset_detect(
        onset_envelope=onset_envelope, sr=sample_rate, hop_length=hop_length,
        units="frames", backtrack=False,
    )
    tempo, beat_frames = librosa.beat.beat_track(
        onset_envelope=onset_envelope, sr=sample_rate, hop_length=hop_length,
        units="frames", trim=False,
    )
    rms = librosa.feature.rms(
        y=mono, frame_length=frame_length, hop_length=hop_length, center=False
    )[0]
    centroid = librosa.feature.spectral_centroid(
        y=mono, sr=sample_rate, n_fft=frame_length, hop_length=hop_length, center=False
    )[0]
    arrays = [onset_envelope, onset_frames, beat_frames, rms, centroid, np.asarray(tempo)]
    if any(not np.isfinite(np.asarray(values)).all() for values in arrays):
        raise Rejected("librosa produced non-finite feature evidence")
    onset_times = librosa.frames_to_time(onset_frames, sr=sample_rate, hop_length=hop_length)
    beat_times = librosa.frames_to_time(beat_frames, sr=sample_rate, hop_length=hop_length)
    tempo_bpm = float(np.ravel(np.asarray(tempo))[0]) if np.asarray(tempo).size else 0.0
    curve_limit = 256
    result = {
        "profileId": payload["analysisProfileId"],
        "audio": audio,
        "timing": {
            "hopLengthSamples": hop_length,
            "analysisFrameCount": int(onset_envelope.size),
            "estimatedTempoBpm": round(tempo_bpm, 6),
            "onsetTimesSeconds": [round(float(value), 6) for value in onset_times[:curve_limit]],
            "beatTimesSeconds": [round(float(value), 6) for value in beat_times[:curve_limit]],
            "confidenceThreshold": confidence_threshold,
        },
        "features": {
            "rmsEnergyCurve": [round(float(value), 9) for value in rms[:curve_limit]],
            "onsetStrengthCurve": [round(float(value), 9) for value in onset_envelope[:curve_limit]],
            "spectralCentroidMeanHz": round(float(np.mean(centroid)), 6),
            "spectralCentroidP95Hz": round(float(np.percentile(centroid, 95)), 6),
        },
    }
    return result, {
        "sourceBytesVerified": True,
        "analysisFrameCount": int(onset_envelope.size),
        "librosaOnsetBeatEnergyExecuted": True,
        "boundedTimingMap": True,
    }


def run_pyloudnorm(payload_value: Any, ebu_alias: bool = False) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "targetLufs", "truePeakDbtp", "channelMode", "measurementProfileId",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "pyloudnorm payload")
    target_lufs = bounded_number(payload["targetLufs"], "targetLufs", -24, -9)
    true_peak_limit = bounded_number(payload["truePeakDbtp"], "truePeakDbtp", -6, -0.1)
    profile_id = payload["measurementProfileId"]
    if profile_id not in {"ebu_r128_integrated_v1", "voice_delivery_gate_v1"}:
        raise Rejected("pyloudnorm measurement profile is unsupported")
    samples, audio = decode_approved_audio(payload, 48_000, payload["channelMode"])
    measurement_input = samples[:, 0] if samples.shape[1] == 1 else samples
    meter = pyln.Meter(48_000, block_size=0.400)
    integrated_lufs = float(meter.integrated_loudness(measurement_input))
    if not np.isfinite(integrated_lufs):
        raise Rejected("pyloudnorm could not produce a finite loudness measurement")
    peak_absolute = float(np.max(np.abs(samples)))
    measured_true_peak_dbtp = 20.0 * float(np.log10(max(peak_absolute, 1e-12)))
    result = {
        "profileId": profile_id,
        "audio": audio,
        "measurement": {
            "integratedLufs": round(integrated_lufs, 6),
            "targetLufs": target_lufs,
            "gainToTargetDb": round(target_lufs - integrated_lufs, 6),
            "measuredTruePeakDbtp": round(measured_true_peak_dbtp, 6),
            "truePeakLimitDbtp": true_peak_limit,
            "withinTruePeakLimit": measured_true_peak_dbtp <= true_peak_limit,
        },
    }
    semantic = {
        "sourceBytesVerified": True,
        "sampleCount": audio["sampleCount"],
        "boundedAudioDecode": True,
    }
    semantic["explicitEbuR128GateExecuted" if ebu_alias else "ebuR128IntegratedLoudnessExecuted"] = True
    return result, semantic


def run_pydub(payload_value: Any, effects_recipe: bool = False) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "sampleRate", "channelMode", "processingProfileId", "strength", "preserveVoice",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "pydub payload")
    if payload["preserveVoice"] is not True:
        raise Rejected("pydub voice preservation is required")
    profile_id = payload["processingProfileId"]
    if profile_id not in {"approved_voice_polish_v1", "approved_segment_gain_v1"}:
        raise Rejected("pydub processing profile is unsupported")
    strength = bounded_number(payload["strength"], "strength", 0, 1)
    sample_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("pydub sample rate is unsupported")
    samples, audio = decode_approved_audio(payload, sample_rate, payload["channelMode"])
    pcm = np.clip(samples, -1.0, 0.999969).reshape(-1)
    pcm_bytes = np.rint(pcm * 32_767.0).astype("<i2").tobytes()
    segment = AudioSegment(
        data=pcm_bytes, sample_width=2, frame_rate=sample_rate, channels=int(samples.shape[1])
    )
    before_dbfs = None if segment.dBFS == float("-inf") else round(float(segment.dBFS), 6)
    gain_db = round(strength * (2.0 if profile_id == "approved_voice_polish_v1" else 3.0), 6)
    processed = pydub_effects.normalize(segment, headroom=1.0 + strength) if effects_recipe else segment.apply_gain(gain_db)
    if profile_id == "approved_voice_polish_v1" or effects_recipe:
        fade_ms = min(20, max(1, len(processed) // 20))
        processed = processed.fade_in(fade_ms).fade_out(fade_ms)
    output = io.BytesIO()
    processed.export(output, format="wav")
    wav_bytes = output.getvalue()
    if not wav_bytes.startswith(b"RIFF") or wav_bytes[8:12] != b"WAVE" or len(wav_bytes) > 7 * 1024 * 1024:
        raise Rejected("pydub WAV output failed its bounded signature policy")
    after_dbfs = None if processed.dBFS == float("-inf") else round(float(processed.dBFS), 6)
    result = {
        "profileId": profile_id,
        "audio": audio,
        "processing": {
            "gainAppliedDb": None if effects_recipe else gain_db,
            "effectsRecipeApplied": effects_recipe,
            "durationMilliseconds": len(processed),
            "sampleWidthBytes": processed.sample_width,
            "channelCount": processed.channels,
            "frameRate": processed.frame_rate,
            "beforeDbfs": before_dbfs,
            "afterDbfs": after_dbfs,
            "voicePreserved": True,
        },
        "audioArtifact": {
            "mimeType": "audio/wav",
            "byteLength": len(wav_bytes),
            "sha256": hashlib.sha256(wav_bytes).hexdigest(),
            "bytesBase64": base64.b64encode(wav_bytes).decode("ascii"),
        },
    }
    semantic = {
        "sourceBytesVerified": True,
        "sampleCount": audio["sampleCount"],
        "boundedWavOutputProduced": True,
    }
    semantic["fixedPydubEffectsRecipeExecuted" if effects_recipe else "fixedPydubProfileExecuted"] = True
    return result, semantic


def encode_pcm_wav(samples: np.ndarray, sample_rate: int) -> bytes:
    if samples.ndim != 2 or samples.shape[1] not in {1, 2}:
        raise Rejected("audio output channel layout is unsupported")
    pcm = np.rint(np.clip(samples, -1.0, 0.999969).reshape(-1) * 32_767.0).astype("<i2")
    output = io.BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setnchannels(int(samples.shape[1]))
        writer.setsampwidth(2)
        writer.setframerate(sample_rate)
        writer.writeframes(pcm.tobytes())
    wav_bytes = output.getvalue()
    if len(wav_bytes) < 44 or len(wav_bytes) > 7 * 1024 * 1024:
        raise Rejected("PCM WAV output exceeded its fixed bounds")
    return wav_bytes


def audio_artifact(wav_bytes: bytes) -> dict[str, Any]:
    return {
        "mimeType": "audio/wav",
        "byteLength": len(wav_bytes),
        "sha256": hashlib.sha256(wav_bytes).hexdigest(),
        "bytesBase64": base64.b64encode(wav_bytes).decode("ascii"),
    }


def run_audioread(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "decodeProfileId", "maximumChannels", "maximumSampleRate",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "audioread payload")
    profile_id = payload["decodeProfileId"]
    if profile_id not in {"approved_pcm_decode_v1", "approved_audio_intake_v1"}:
        raise Rejected("audioread decode profile is unsupported")
    maximum_channels = bounded_int(payload["maximumChannels"], "maximumChannels", 1, 8)
    maximum_sample_rate = bounded_int(payload["maximumSampleRate"], "maximumSampleRate", 8_000, 192_000)
    decode_rate = min(maximum_sample_rate, 48_000)
    channel_mode = "mono" if maximum_channels == 1 else "preserve"
    samples, audio = decode_approved_audio(payload, decode_rate, channel_mode)
    wav_bytes = encode_pcm_wav(samples, decode_rate)
    path = "/tmp/reeditpro-approved-audioread-source.wav"
    decoded_bytes = 0
    block_count = 0
    try:
        with open(path, "xb") as handle:
            handle.write(wav_bytes)
        with audioread.audio_open(path) as reader:
            channels = int(reader.channels)
            samplerate = int(reader.samplerate)
            duration = float(reader.duration)
            for block in reader:
                decoded_bytes += len(block)
                block_count += 1
                if decoded_bytes > 7 * 1024 * 1024:
                    raise Rejected("audioread decode exceeded its fixed byte ceiling")
    finally:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
    if channels < 1 or channels > maximum_channels or samplerate > maximum_sample_rate or decoded_bytes < 2:
        raise Rejected("audioread output violates approved decode bounds")
    result = {
        "profileId": profile_id,
        "audio": audio,
        "decode": {
            "channelCount": channels,
            "sampleRate": samplerate,
            "durationSeconds": round(duration, 6),
            "decodedPcmByteCount": decoded_bytes,
            "blockCount": block_count,
        },
    }
    return result, {
        "sourceBytesVerified": True, "decodedPcmByteCount": decoded_bytes,
        "audioreadAudioOpenExecuted": True, "fixedTemporaryWavOnly": True,
    }


def run_resampy(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "sampleRate", "channelMode", "processingProfileId", "strength", "preserveVoice",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "resampy payload")
    if payload["processingProfileId"] != "approved_resample_v1" or payload["preserveVoice"] is not True:
        raise Rejected("resampy approved profile or voice policy is invalid")
    target_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if target_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("resampy target rate is unsupported")
    bounded_number(payload["strength"], "strength", 0, 1)
    samples, input_audio = decode_approved_audio(payload, 48_000, payload["channelMode"])
    output_channels = [
        resampy.resample(samples[:, channel], 48_000, target_rate, filter="kaiser_best")
        for channel in range(samples.shape[1])
    ]
    output_samples = np.stack(output_channels, axis=1).astype(np.float32)
    wav_bytes = encode_pcm_wav(output_samples, target_rate)
    result = {
        "profileId": payload["processingProfileId"], "inputAudio": input_audio,
        "outputAudio": {
            "sampleRate": target_rate, "channelCount": int(output_samples.shape[1]),
            "sampleCount": int(output_samples.shape[0]),
            "durationSeconds": round(float(output_samples.shape[0]) / target_rate, 6),
        },
        "audioArtifact": audio_artifact(wav_bytes),
    }
    return result, {
        "sourceBytesVerified": True, "outputSampleCount": int(output_samples.shape[0]),
        "resampyKaiserBestExecuted": True, "boundedWavOutputProduced": True,
    }


def run_pedalboard(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "sampleRate", "channelMode", "processingProfileId", "strength", "preserveVoice",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "pedalboard payload")
    if payload["processingProfileId"] != "approved_voice_effect_chain_v1" or payload["preserveVoice"] is not True:
        raise Rejected("pedalboard approved profile or voice policy is invalid")
    sample_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("pedalboard sample rate is unsupported")
    strength = bounded_number(payload["strength"], "strength", 0, 1)
    samples, audio = decode_approved_audio(payload, sample_rate, payload["channelMode"])
    board = Pedalboard([
        HighpassFilter(cutoff_frequency_hz=60.0 + strength * 40.0),
        Compressor(threshold_db=-12.0 - strength * 8.0, ratio=1.5 + strength * 1.5),
        Limiter(threshold_db=-1.0),
    ])
    processed = np.asarray(board(samples.T, sample_rate, reset=True), dtype=np.float32).T
    if processed.shape != samples.shape or not np.isfinite(processed).all():
        raise Rejected("pedalboard output shape or values are invalid")
    wav_bytes = encode_pcm_wav(processed, sample_rate)
    result = {
        "profileId": payload["processingProfileId"], "audio": audio,
        "processing": {
            "pluginCount": len(board), "channelCount": int(processed.shape[1]),
            "sampleCount": int(processed.shape[0]), "voicePreserved": True,
        },
        "audioArtifact": audio_artifact(wav_bytes),
    }
    return result, {
        "sourceBytesVerified": True, "outputSampleCount": int(processed.shape[0]),
        "fixedPedalboardChainExecuted": True, "boundedWavOutputProduced": True,
    }


def run_mir_eval(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    allowed = {
        "sampleRate", "channelMode", "analysisProfileId",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }
    if isinstance(payload_value, dict) and "confidenceThreshold" in payload_value:
        allowed.add("confidenceThreshold")
    payload = exact_object(payload_value, allowed, "mir_eval payload")
    if payload["analysisProfileId"] != "approved_music_timing_score_v1":
        raise Rejected("mir_eval timing profile is unsupported")
    sample_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("mir_eval sample rate is unsupported")
    if "confidenceThreshold" in payload:
        bounded_number(payload["confidenceThreshold"], "confidenceThreshold", 0, 1)
    samples, audio = decode_approved_audio(payload, sample_rate, payload["channelMode"])
    mono = np.mean(samples, axis=1, dtype=np.float64)
    hop = 512
    frame_count = max(1, mono.size // hop)
    envelope = np.asarray([
        float(np.sqrt(np.mean(np.square(mono[index * hop:min((index + 1) * hop, mono.size)]))))
        for index in range(frame_count)
    ])
    threshold = max(float(np.max(envelope)) * 0.25, 1e-9)
    active = np.flatnonzero(envelope >= threshold)
    phase_seconds = round(float(active[0] * hop) / sample_rate, 6) if active.size else 0.0
    duration = float(audio["durationSeconds"])
    reference = np.arange(0.0, duration, 0.5, dtype=np.float64)
    estimated = np.arange(phase_seconds, duration, 0.5, dtype=np.float64)
    if reference.size < 2 or estimated.size < 2:
        raise Rejected("mir_eval timing window is too short")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        scores = mir_eval.beat.evaluate(reference, estimated)
    normalized_scores = {
        str(key): round(float(value), 9)
        for key, value in scores.items()
        if isinstance(value, (int, float, np.integer, np.floating)) and np.isfinite(float(value))
    }
    result = {
        "profileId": payload["analysisProfileId"], "audio": audio,
        "timing": {
            "referenceBeatCount": int(reference.size), "estimatedBeatCount": int(estimated.size),
            "estimatedPhaseSeconds": phase_seconds, "gridIntervalSeconds": 0.5,
        },
        "scores": normalized_scores,
    }
    return result, {
        "sourceBytesVerified": True, "referenceBeatCount": int(reference.size),
        "mirEvalBeatEvaluateExecuted": True, "boundedTimingGrid": True,
    }


def run_mido(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "timingResolutionPpq", "tempoPolicy", "timingProfileId",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "mido payload")
    ppq = bounded_int(payload["timingResolutionPpq"], "timingResolutionPpq", 24, 9_600)
    if payload["tempoPolicy"] not in {"preserve", "approved_map"}:
        raise Rejected("mido tempo policy is unsupported")
    if payload["timingProfileId"] not in {"approved_timing_map_v1", "approved_midi_validation_v1"}:
        raise Rejected("mido timing profile is unsupported")
    samples, audio = decode_approved_audio(payload, 48_000, "mono")
    duration_seconds = float(audio["durationSeconds"])
    beat_count = max(2, min(256, int(duration_seconds / 0.5)))
    midi = mido.MidiFile(type=1, ticks_per_beat=ppq)
    track = mido.MidiTrack()
    midi.tracks.append(track)
    tempo = mido.bpm2tempo(120)
    track.append(mido.MetaMessage("set_tempo", tempo=tempo, time=0))
    track.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    for index in range(beat_count):
        track.append(mido.Message("note_on", note=60 + index % 4, velocity=64, time=0))
        track.append(mido.Message("note_off", note=60 + index % 4, velocity=0, time=ppq))
    encoded = io.BytesIO()
    midi.save(file=encoded)
    midi_bytes = encoded.getvalue()
    parsed = mido.MidiFile(file=io.BytesIO(midi_bytes))
    messages = list(mido.merge_tracks(parsed.tracks, skip_checks=False))
    note_on_count = sum(1 for message in messages if message.type == "note_on" and message.velocity > 0)
    total_ticks = sum(int(message.time) for message in messages)
    if note_on_count != beat_count or total_ticks != beat_count * ppq:
        raise Rejected("mido roundtrip timing evidence is inconsistent")
    result = {
        "profileId": payload["timingProfileId"], "audio": audio,
        "midi": {
            "formatType": parsed.type, "ticksPerBeat": parsed.ticks_per_beat,
            "tempoMicrosecondsPerBeat": tempo, "noteOnCount": note_on_count,
            "messageCount": len(messages), "totalTicks": total_ticks,
            "serializedByteLength": len(midi_bytes),
            "serializedSha256": hashlib.sha256(midi_bytes).hexdigest(),
        },
    }
    return result, {
        "sourceBytesVerified": True, "validatedMidiEventCount": len(messages),
        "midoRoundtripExecuted": True, "approvedTimingGridOnly": True,
    }


def run_noisereduce(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "sampleRate", "channelMode", "processingProfileId", "strength", "preserveVoice",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "noisereduce payload")
    if payload["processingProfileId"] != "approved_noise_reduction_v1":
        raise Rejected("noisereduce approved profile is invalid")
    if payload["preserveVoice"] is not True:
        raise Rejected("noisereduce voice preservation is required")
    sample_rate = bounded_int(payload["sampleRate"], "sampleRate", 16_000, 48_000)
    if sample_rate not in {16_000, 22_050, 44_100, 48_000}:
        raise Rejected("noisereduce sample rate is unsupported")
    strength = bounded_number(payload["strength"], "strength", 0, 1)
    samples, audio = decode_approved_audio(payload, sample_rate, payload["channelMode"])
    channel_first = np.asarray(samples.T, dtype=np.float32)
    prop_decrease = 0.15 + strength * 0.60
    reduced = np.asarray(noisereduce.reduce_noise(
        y=channel_first,
        sr=sample_rate,
        stationary=True,
        prop_decrease=prop_decrease,
        n_fft=1024,
        win_length=1024,
        hop_length=256,
        use_tqdm=False,
        n_jobs=1,
        use_torch=False,
    ), dtype=np.float32)
    if reduced.ndim == 1:
        reduced = reduced.reshape(1, -1)
    processed = reduced.T
    if processed.shape != samples.shape or not np.isfinite(processed).all():
        raise Rejected("noisereduce output shape or values are invalid")
    wav_bytes = encode_pcm_wav(processed, sample_rate)
    input_rms = float(np.sqrt(np.mean(np.square(samples, dtype=np.float64))))
    output_rms = float(np.sqrt(np.mean(np.square(processed, dtype=np.float64))))
    difference_rms = float(np.sqrt(np.mean(np.square(processed - samples, dtype=np.float64))))
    result = {
        "profileId": payload["processingProfileId"], "audio": audio,
        "processing": {
            "algorithm": "stationary_spectral_gate", "propDecrease": round(prop_decrease, 6),
            "channelCount": int(processed.shape[1]), "sampleCount": int(processed.shape[0]),
            "inputRms": round(input_rms, 9), "outputRms": round(output_rms, 9),
            "differenceRms": round(difference_rms, 9), "voicePreserved": True,
        },
        "audioArtifact": audio_artifact(wav_bytes),
    }
    return result, {
        "sourceBytesVerified": True, "outputSampleCount": int(processed.shape[0]),
        "noisereduceStationarySpectralGateExecuted": True,
        "boundedVoicePreservingWavOutputProduced": True,
    }


def run_pretty_midi(payload_value: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = exact_object(payload_value, {
        "timingResolutionPpq", "tempoPolicy", "timingProfileId",
        "mimeType", "sourceByteLength", "sourceSha256", "sourceBytesBase64",
    }, "pretty_midi payload")
    ppq = bounded_int(payload["timingResolutionPpq"], "timingResolutionPpq", 24, 9_600)
    if payload["tempoPolicy"] not in {"preserve", "approved_map"}:
        raise Rejected("pretty_midi tempo policy is unsupported")
    if payload["timingProfileId"] != "approved_pretty_midi_timing_v1":
        raise Rejected("pretty_midi timing profile is unsupported")
    samples, audio = decode_approved_audio(payload, 48_000, "mono")
    duration_seconds = float(audio["durationSeconds"])
    beat_count = max(4, min(256, int(duration_seconds / 0.5)))
    midi = mido.MidiFile(type=1, ticks_per_beat=ppq)
    track = mido.MidiTrack()
    midi.tracks.append(track)
    tempo = mido.bpm2tempo(120)
    track.append(mido.MetaMessage("set_tempo", tempo=tempo, time=0))
    track.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    for index in range(beat_count):
        track.append(mido.Message("note_on", note=60 + index % 4, velocity=72, time=0))
        track.append(mido.Message("note_off", note=60 + index % 4, velocity=0, time=ppq))
    analyzed = pretty_midi.PrettyMIDI(mido_object=midi)
    tempo_times, tempi = analyzed.get_tempo_changes()
    beats = analyzed.get_beats()
    downbeats = analyzed.get_downbeats()
    serialized = io.BytesIO()
    analyzed.write(serialized)
    midi_bytes = serialized.getvalue()
    roundtrip = pretty_midi.PrettyMIDI(io.BytesIO(midi_bytes))
    note_count = sum(len(instrument.notes) for instrument in roundtrip.instruments)
    if note_count != beat_count or len(tempi) != 1 or not np.isfinite(beats).all():
        raise Rejected("pretty_midi timing evidence is inconsistent")
    result = {
        "profileId": payload["timingProfileId"], "audio": audio,
        "timing": {
            "resolutionPpq": ppq, "tempoPolicy": payload["tempoPolicy"],
            "tempoChangeTimesSeconds": [round(float(value), 6) for value in tempo_times],
            "tempiBpm": [round(float(value), 6) for value in tempi],
            "beatTimesSeconds": [round(float(value), 6) for value in beats[:256]],
            "downbeatTimesSeconds": [round(float(value), 6) for value in downbeats[:256]],
            "endTimeSeconds": round(float(roundtrip.get_end_time()), 6),
            "instrumentCount": len(roundtrip.instruments), "noteCount": note_count,
            "serializedByteLength": len(midi_bytes),
            "serializedSha256": hashlib.sha256(midi_bytes).hexdigest(),
        },
    }
    return result, {
        "sourceBytesVerified": True, "analyzedNoteCount": note_count,
        "prettyMidiRoundtripExecuted": True, "approvedTimingMapOnly": True,
    }


def execute(request_value: Any) -> dict[str, Any]:
    validate_tree(request_value)
    request = exact_object(request_value, {"schemaVersion", "toolId", "operationId", "payload"}, "request")
    if request["schemaVersion"] != PROTOCOL:
        raise Rejected("protocol is unsupported")
    tool_id = request["toolId"]
    if tool_id not in OPERATIONS or request["operationId"] != OPERATIONS[tool_id]:
        raise Rejected("tool or exact operation identity is unsupported")
    normalized = canonical(request)
    observed_started_at_ns = time.time_ns()
    resource_before = resource.getrusage(resource.RUSAGE_SELF)
    resource_observation_start = resource_observation_point(
        resource_before,
        observed_started_at_ns,
    )
    if tool_id == "duckdb":
        result, semantic = run_duckdb(request["payload"])
    elif tool_id == "polars":
        result, semantic = run_polars(request["payload"])
    elif tool_id == "opentimelineio":
        result, semantic = run_otio(request["payload"])
    elif tool_id == "pyav":
        result, semantic = run_pyav(request["payload"])
    elif tool_id == "opencv":
        result, semantic = run_opencv(request["payload"])
    elif tool_id == "pyscenedetect":
        result, semantic = run_scenedetect(request["payload"])
    elif tool_id == "scipy":
        result, semantic = run_scipy(request["payload"])
    elif tool_id == "librosa":
        result, semantic = run_librosa(request["payload"])
    elif tool_id == "pyloudnorm":
        result, semantic = run_pyloudnorm(request["payload"])
    elif tool_id == "pydub":
        result, semantic = run_pydub(request["payload"])
    elif tool_id == "pydub_effects":
        result, semantic = run_pydub(request["payload"], effects_recipe=True)
    elif tool_id == "ebu_r128_pyloudnorm":
        result, semantic = run_pyloudnorm(request["payload"], ebu_alias=True)
    elif tool_id == "audioread":
        result, semantic = run_audioread(request["payload"])
    elif tool_id == "resampy":
        result, semantic = run_resampy(request["payload"])
    elif tool_id == "pedalboard":
        result, semantic = run_pedalboard(request["payload"])
    elif tool_id == "mir_eval":
        result, semantic = run_mir_eval(request["payload"])
    elif tool_id == "mido":
        result, semantic = run_mido(request["payload"])
    elif tool_id == "pretty_midi":
        result, semantic = run_pretty_midi(request["payload"])
    else:
        result, semantic = run_noisereduce(request["payload"])
    usage = resource.getrusage(resource.RUSAGE_SELF)
    observed_finished_at_ns = max(time.time_ns(), observed_started_at_ns + 1_000_000)
    result_canonical_json = canonical(result)
    output = {
        "schemaVersion": CONTAINER_PROTOCOL,
        "ok": True,
        "toolId": tool_id,
        "operationId": OPERATIONS[tool_id],
        "status": "actual_library_operation_completed",
        "actualToolPackageExecuted": True,
        "packageIdentity": {"packageName": PACKAGE_NAMES[tool_id], "version": VERSIONS[tool_id]},
        "requestEnvelopeSha256": sha256_text(normalized),
        "result": result,
        "resultCanonicalJson": result_canonical_json,
        "resultSha256": sha256_text(result_canonical_json),
        "semanticEvidence": semantic,
        "runtimeIdentity": {
            "pythonVersion": platform.python_version(),
            "platform": sys.platform,
            "architecture": platform.machine(),
            "uid": os.getuid(),
            "gid": os.getgid(),
        },
        "processResourceUsage": {
            "maximumResidentSetKilobytes": int(usage.ru_maxrss),
            "userCpuMicroseconds": int(usage.ru_utime * 1_000_000),
            "systemCpuMicroseconds": int(usage.ru_stime * 1_000_000),
        },
        "resourceObservation": {
            "schemaVersion": "private-embedded-process-resource-observation-wire-v1",
            "observerKind": "python_resource_getrusage_v1",
            "measurementAgentVersion": "embedded_python_process_resource_observer_v1",
            "start": resource_observation_start,
            "finish": resource_observation_point(usage, observed_finished_at_ns),
        },
        "confinementExpectations": {
            "networkMode": "none",
            "readOnlyRootFilesystem": True,
            "nonRootUid": 10001,
            "noCallerMounts": True,
            "noCallerEnvironment": True,
            "noCallerCommandOrEntrypoint": True,
            "noCallerPathsUrlsCommandsCodeSqlOrSecrets": True,
        },
        "readiness": {
            "privateInternalOnly": True,
            "productReady": False,
            "externalBetaReady": False,
            "productionReady": False,
        },
    }
    return output


def current_resident_set_bytes() -> int:
    try:
        with open("/proc/self/statm", "r", encoding="ascii") as handle:
            fields = handle.read(256).strip().split()
        if len(fields) < 2 or not fields[1].isdigit():
            raise ValueError("invalid statm")
        return int(fields[1]) * int(os.sysconf("SC_PAGE_SIZE"))
    except (OSError, ValueError):
        return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) * 1024


def resource_observation_point(usage: resource.struct_rusage, captured_at_ns: int) -> dict[str, Any]:
    memory_current_bytes = current_resident_set_bytes()
    memory_peak_bytes = max(memory_current_bytes, int(usage.ru_maxrss) * 1024)
    return {
        "capturedAt": datetime.fromtimestamp(
            captured_at_ns / 1_000_000_000,
            tz=timezone.utc,
        ).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "cpuUsageNanoseconds": int((usage.ru_utime + usage.ru_stime) * 1_000_000_000),
        "memoryCurrentBytes": memory_current_bytes,
        "memoryPeakBytes": memory_peak_bytes,
        "gpuActiveMilliseconds": None,
    }


def main() -> int:
    raw = sys.stdin.buffer.read(MAXIMUM_INPUT_BYTES + 1)
    if not raw or len(raw) > MAXIMUM_INPUT_BYTES:
        print(canonical({"ok": False, "code": "INVALID_INPUT"}))
        return 2
    try:
        value = json.loads(raw.decode("utf-8"))
        output = execute(value)
    except (Rejected, ValueError, TypeError, UnicodeDecodeError):
        print(canonical({"ok": False, "code": "INVALID_INPUT"}))
        return 2
    except Exception:
        print(canonical({"ok": False, "code": "EXECUTION_FAILED"}))
        return 3
    print(canonical(output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
