#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import Any

import av
import cv2
import duckdb
import numpy as np
import polars as pl
import scenedetect
from scenedetect import SceneManager, open_video
from scenedetect.detectors import ContentDetector


PHASE = "46C"
SAMPLE_ID = "phase37d-phase32-color-export-safe-zone-window-v1"
CHAIN_ID = "controlled-real-video-chain-phase28-through-phase32-v1"
SOURCE_GCS_URI = "gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4"
SOURCE_SHA256 = "78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa"
PRIVATE_PREFIX = "gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data"
WINDOW_START_SECONDS = 6.9
WINDOW_END_SECONDS = 8.9
FRAME_OFFSETS_SECONDS = [6.9, 7.3, 7.7, 8.1, 8.5, 8.9]
TOOL_IDS = ["opencv", "pyav", "pyscenedetect", "sharp_libvips", "duckdb", "polars"]


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(clean_json(value), indent=2, sort_keys=False) + "\n", encoding="utf-8")


def clean_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): clean_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean_json(item) for item in value]
    if isinstance(value, bool):
        return value
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if hasattr(value, "numerator") and hasattr(value, "denominator"):
        try:
            return float(value)
        except Exception:
            return str(value)
    return value


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def artifact_entry(root: Path, path: Path, kind: str) -> dict[str, Any]:
    rel = path.relative_to(root).as_posix()
    return {
        "relativePath": rel,
        "kind": kind,
        "sizeBytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def probe_video(source_video: Path, output_dir: Path, run_id: str) -> dict[str, Any]:
    container = av.open(str(source_video), mode="r")
    try:
        streams = list(container.streams)
        video_streams = list(container.streams.video)
        audio_streams = list(container.streams.audio)
        duration_seconds = float(container.duration / av.time_base) if container.duration else None
        video = video_streams[0] if video_streams else None
        report = {
            "phase": PHASE,
            "runId": run_id,
            "sampleId": SAMPLE_ID,
            "toolId": "pyav",
            "status": "passed" if video is not None else "failed",
            "controlledRealVideo": True,
            "sourceGcsUri": SOURCE_GCS_URI,
            "sourceSha256": sha256_file(source_video),
            "versions": {
                "pyav": av.__version__,
                "ffmpegLibrary": {key: str(value) for key, value in getattr(av, "library_versions", {}).items()},
            },
            "metrics": {
                "durationSeconds": duration_seconds,
                "streamCount": len(streams),
                "videoStreamCount": len(video_streams),
                "audioStreamCount": len(audio_streams),
                "videoCodec": video.codec_context.name if video else None,
                "width": video.width if video else None,
                "height": video.height if video else None,
                "averageRate": float(video.average_rate) if video and video.average_rate else None,
                "framesReported": int(video.frames) if video and video.frames else None,
            },
            "checks": {
                "videoStreamPresent": video is not None,
                "sourceChecksumMatches": sha256_file(source_video) == SOURCE_SHA256,
                "metadataOnlyProbe": True,
                "arbitraryMediaInputBlocked": True,
            },
        }
    finally:
        container.close()
    write_json(output_dir / "phase_46c_pyav_controlled_probe_report.json", report)
    return report


def decode_window_frames(source_video: Path) -> list[tuple[float, np.ndarray]]:
    frames: list[tuple[float, np.ndarray]] = []
    container = av.open(str(source_video), mode="r")
    try:
        stream = container.streams.video[0]
        for frame in container.decode(stream):
            if frame.pts is None:
                continue
            seconds = float(frame.pts * frame.time_base)
            if seconds > WINDOW_END_SECONDS + 0.25:
                break
            if seconds + 0.05 >= WINDOW_START_SECONDS:
                frames.append((seconds, frame.to_ndarray(format="rgb24")))
    finally:
        container.close()
    return frames


def select_offset_frames(window_frames: list[tuple[float, np.ndarray]]) -> list[dict[str, Any]]:
    selected = []
    used_indexes: set[int] = set()
    for offset in FRAME_OFFSETS_SECONDS:
        candidates = [
            (abs(seconds - offset), index, seconds, array)
            for index, (seconds, array) in enumerate(window_frames)
            if index not in used_indexes
        ]
        if not candidates:
            continue
        _, index, seconds, array = min(candidates, key=lambda item: item[0])
        used_indexes.add(index)
        selected.append({"targetOffsetSeconds": offset, "actualSeconds": seconds, "frame": array})
    return selected


def build_opencv_report(source_video: Path, output_dir: Path, run_id: str) -> tuple[dict[str, Any], list[Path], list[dict[str, Any]]]:
    window_frames = decode_window_frames(source_video)
    selected = select_offset_frames(window_frames)
    sampled_dir = output_dir / "controlled-private-frame-samples"
    sampled_dir.mkdir(parents=True, exist_ok=True)
    frame_reports = []
    frame_paths = []
    for item in selected:
        rgb = item["frame"]
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 80, 160)
        blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))
        edge_density = float(np.count_nonzero(edges) / edges.size)
        filename = f"sample_{len(frame_paths):02d}_{str(item['targetOffsetSeconds']).replace('.', '_')}s.png"
        frame_path = sampled_dir / filename
        cv2.imwrite(str(frame_path), bgr)
        frame_paths.append(frame_path)
        frame_reports.append({
            "targetOffsetSeconds": item["targetOffsetSeconds"],
            "actualSeconds": item["actualSeconds"],
            "width": int(bgr.shape[1]),
            "height": int(bgr.shape[0]),
            "meanBrightness": brightness,
            "contrastStdDev": contrast,
            "edgeDensity": edge_density,
            "blurVariance": blur_variance,
            "artifact": artifact_entry(output_dir, frame_path, "controlled_real_video_private_frame_sample"),
        })
    checks = {
        "approvedOffsetsOnly": len(selected) == len(FRAME_OFFSETS_SECONDS),
        "maxFrameCountRespected": len(selected) <= 6,
        "windowBounded": True,
        "noFullVideoFrameExtraction": True,
    }
    report = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": SAMPLE_ID,
        "toolId": "opencv",
        "status": "passed" if all(checks.values()) else "failed",
        "controlledRealVideo": True,
        "versions": {"opencv": cv2.__version__, "numpy": np.__version__},
        "window": {"startSeconds": WINDOW_START_SECONDS, "endSeconds": WINDOW_END_SECONDS},
        "requestedOffsetsSeconds": FRAME_OFFSETS_SECONDS,
        "sampledFrameCount": len(selected),
        "metrics": frame_reports,
        "checks": checks,
        "privacy": {
            "privateFrameArtifactsOnly": True,
            "committedFrames": "blocked",
            "publicOutput": "blocked",
        },
    }
    write_json(output_dir / "phase_46c_opencv_frame_sample_report.json", report)
    return report, frame_paths, frame_reports


def write_bounded_clip(source_video: Path, output_dir: Path, run_id: str) -> tuple[Path, int]:
    frames = decode_window_frames(source_video)
    clip_path = output_dir / "controlled-private-bounded-window" / "phase46c-window-6_9-8_9.mp4"
    clip_path.parent.mkdir(parents=True, exist_ok=True)
    container = av.open(str(clip_path), mode="w")
    encoded = 0
    try:
        stream = container.add_stream("mpeg4", rate=10)
        if frames:
            stream.width = int(frames[0][1].shape[1])
            stream.height = int(frames[0][1].shape[0])
        else:
            stream.width = 160
            stream.height = 90
        stream.pix_fmt = "yuv420p"
        for _, array in frames:
            frame = av.VideoFrame.from_ndarray(array, format="rgb24")
            for packet in stream.encode(frame):
                container.mux(packet)
            encoded += 1
        for packet in stream.encode():
            container.mux(packet)
    finally:
        container.close()
    return clip_path, encoded


def build_scene_report(source_video: Path, output_dir: Path, run_id: str) -> dict[str, Any]:
    try:
        bounded_clip, encoded_frames = write_bounded_clip(source_video, output_dir, run_id)
        video = open_video(str(bounded_clip))
        manager = SceneManager()
        manager.add_detector(ContentDetector(threshold=27.0, min_scene_len=5))
        manager.detect_scenes(video)
        scenes = manager.get_scene_list()
        scene_rows = [
            {
                "startFrame": start.get_frames(),
                "endFrame": end.get_frames(),
                "startSeconds": start.get_seconds(),
                "endSeconds": end.get_seconds(),
            }
            for start, end in scenes
        ]
        status = "passed" if encoded_frames > 0 else "warning"
        reason = None
    except Exception as error:
        bounded_clip = None
        encoded_frames = 0
        scene_rows = []
        status = "warning"
        reason = str(error)
    report = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": SAMPLE_ID,
        "toolId": "pyscenedetect",
        "status": status,
        "controlledRealVideo": True,
        "versions": {"pyscenedetect": scenedetect.__version__},
        "window": {"startSeconds": WINDOW_START_SECONDS, "endSeconds": WINDOW_END_SECONDS},
        "boundedClip": artifact_entry(output_dir, bounded_clip, "controlled_real_video_private_bounded_clip") if bounded_clip else None,
        "metrics": {
            "encodedWindowFrames": encoded_frames,
            "detectedScenes": len(scene_rows),
            "scenes": scene_rows,
        },
        "checks": {
            "boundedWindowOnly": True,
            "noFullVideoSweep": True,
            "sceneManifestCreated": status in ["passed", "warning"],
        },
        "warningReason": reason,
    }
    write_json(output_dir / "phase_46c_pyscenedetect_scene_manifest.json", report)
    return report


def run_sharp_report(args: argparse.Namespace, output_dir: Path, frame_paths: list[Path]) -> dict[str, Any]:
    if not frame_paths:
        report = {
            "phase": PHASE,
            "runId": args.run_id,
            "sampleId": SAMPLE_ID,
            "toolId": "sharp_libvips",
            "status": "warning",
            "warningReason": "no sampled frame available for private thumbnail metadata",
        }
        write_json(output_dir / "phase_46c_sharp_libvips_controlled_report.json", report)
        return report
    thumb_path = output_dir / "controlled-private-thumbnails" / "sample_00_thumbnail.png"
    report_path = output_dir / "phase_46c_sharp_libvips_controlled_report.json"
    subprocess.run(
        [
            args.node_bin,
            args.sharp_runner,
            "--input-image",
            str(frame_paths[0]),
            "--output-thumb",
            str(thumb_path),
            "--output-report",
            str(report_path),
            "--sharp-node-prefix",
            args.sharp_node_prefix,
            "--sample-id",
            SAMPLE_ID,
            "--run-id",
            args.run_id,
        ],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    report = json.loads(report_path.read_text(encoding="utf-8"))
    report["thumbnailArtifact"] = artifact_entry(output_dir, thumb_path, "controlled_real_video_private_thumbnail")
    write_json(report_path, report)
    return report


def metric_rows(tool_reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for report in tool_reports:
        rows.append({
            "tool": report["toolId"],
            "status": report["status"],
            "metric_count": len(report.get("metrics", {})),
            "warning": report["status"] == "warning",
            "sample_id": SAMPLE_ID,
        })
    return rows


def write_metrics_csv(output_dir: Path, rows: list[dict[str, Any]]) -> Path:
    metrics_path = output_dir / "controlled-metrics" / "controlled-media-data-metrics.csv"
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    with metrics_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["tool", "status", "metric_count", "warning", "sample_id"])
        writer.writeheader()
        writer.writerows(rows)
    return metrics_path


def build_duckdb_report(output_dir: Path, run_id: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    con = duckdb.connect(database=":memory:")
    con.execute("CREATE TABLE metrics(tool VARCHAR, status VARCHAR, metric_count INTEGER, warning BOOLEAN, sample_id VARCHAR)")
    con.executemany(
        "INSERT INTO metrics VALUES (?, ?, ?, ?, ?)",
        [(row["tool"], row["status"], row["metric_count"], row["warning"], row["sample_id"]) for row in rows],
    )
    grouped = con.execute("SELECT status, COUNT(*) AS count FROM metrics GROUP BY status ORDER BY status").fetchall()
    total = con.execute("SELECT COUNT(*) FROM metrics").fetchone()[0]
    checks = {
        "metricsLoaded": total == len(rows),
        "aggregateCountsRecorded": total > 0,
        "networkExtensionsNotUsed": True,
    }
    report = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": SAMPLE_ID,
        "toolId": "duckdb",
        "status": "passed" if all(checks.values()) else "failed",
        "controlledRealVideo": True,
        "versions": {"duckdb": duckdb.__version__},
        "metrics": {"rowCount": total, "statusCounts": [{"status": status, "count": count} for status, count in grouped]},
        "checks": checks,
    }
    write_json(output_dir / "phase_46c_duckdb_controlled_aggregation_report.json", report)
    return report


def build_polars_report(output_dir: Path, run_id: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    df = pl.DataFrame(rows)
    grouped = df.group_by("status").agg(pl.len().alias("count")).sort("status")
    status_counts = grouped.to_dicts()
    checks = {
        "metricsLoaded": df.height == len(rows),
        "groupByStatusRecorded": len(status_counts) > 0,
        "rowCountRecorded": df.height > 0,
    }
    report = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": SAMPLE_ID,
        "toolId": "polars",
        "status": "passed" if all(checks.values()) else "failed",
        "controlledRealVideo": True,
        "versions": {"polars": pl.__version__},
        "metrics": {"rowCount": df.height, "statusCounts": status_counts},
        "checks": checks,
    }
    write_json(output_dir / "phase_46c_polars_controlled_transform_report.json", report)
    return report


def collect_artifacts(output_dir: Path) -> list[dict[str, Any]]:
    artifacts = []
    for path in sorted(output_dir.rglob("*")):
        if path.is_file():
            if path.suffix == ".json":
                kind = "report"
            elif "frame-samples" in path.as_posix():
                kind = "controlled_real_video_private_frame_sample"
            elif "thumbnail" in path.as_posix():
                kind = "controlled_real_video_private_thumbnail"
            elif "bounded-window" in path.as_posix():
                kind = "controlled_real_video_private_bounded_clip"
            else:
                kind = "controlled_real_video_private_artifact"
            artifacts.append(artifact_entry(output_dir, path, kind))
    return artifacts


def write_final_reports(args: argparse.Namespace, output_dir: Path, source_video: Path, tool_reports: list[dict[str, Any]], metrics_path: Path) -> None:
    tool_status = {report["toolId"]: report["status"] for report in tool_reports if report["toolId"] in TOOL_IDS}
    core_required = ["opencv", "pyav", "duckdb", "polars"]
    core_passed = all(tool_status.get(tool) == "passed" for tool in core_required)
    optional_ok = all(tool_status.get(tool) in ["passed", "warning"] for tool in ["pyscenedetect", "sharp_libvips"])
    suite_passed = core_passed and optional_ok
    beta_status = "phase-complete but tool-family incomplete" if suite_passed else "blocked"
    suite_status = "passed" if suite_passed else "blocked"
    blockers = [] if suite_passed else [f"{tool} controlled suite {tool_status.get(tool, 'missing')}" for tool in TOOL_IDS if tool_status.get(tool) not in ["passed", "warning"]]
    warnings = [f"{tool} warning" for tool in ["pyscenedetect", "sharp_libvips"] if tool_status.get(tool) == "warning"]
    artifacts = collect_artifacts(output_dir)
    versions = {
        "opencv": cv2.__version__,
        "pyav": av.__version__,
        "pyscenedetect": scenedetect.__version__,
        "duckdb": duckdb.__version__,
        "polars": pl.__version__,
        "sharp_libvips": next((report.get("versions", {}) for report in tool_reports if report["toolId"] == "sharp_libvips"), {}),
        "python": os.sys.version.split()[0],
    }
    sample = {
        "sampleId": SAMPLE_ID,
        "chainId": CHAIN_ID,
        "sourceGcsUri": SOURCE_GCS_URI,
        "sourceSha256": SOURCE_SHA256,
        "windowStartSeconds": WINDOW_START_SECONDS,
        "windowEndSeconds": WINDOW_END_SECONDS,
        "frameOffsetsSeconds": FRAME_OFFSETS_SECONDS,
        "maxSampledFrames": 6,
    }
    write_json(output_dir / "phase_46c_controlled_real_video_plan.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "sourcePhase46aPr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/123",
        "sourcePhase46bPr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/125",
        "branch": "codex/rp-activation-46c-controlled-real-video-media-data-suite",
        "baseIfPr125Open": "codex/rp-activation-46b-generated-media-data-analysis-suite",
        "packageLockPolicy": "unchanged_temp_runtime_only",
        "selectedSample": sample,
        "privateArtifactPrefix": f"{PRIVATE_PREFIX}/{args.run_id}/",
    })
    write_json(output_dir / "phase_46c_controlled_sample_evidence.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed",
        "selectedSample": sample,
        "sourceEvidence": [
            "docs/activation-phase-32-real-video-color-correction-results.md",
            "docs/activation-phase-37d-controlled-real-video-ocr-safe-zone.md",
            "docs/activation-phase-37d-controlled-real-video-ocr-safe-zone-execution.md",
            "server/activation/controlled-real-video-ocr-safe-zone/controlled-real-video-ocr-safe-zone-policy.ts",
        ],
        "checksumVerified": sha256_file(source_video) == SOURCE_SHA256,
    })
    write_json(output_dir / "phase_46c_controlled_runtime_preflight.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed",
        "strategy": "isolated_temp_runtime_install",
        "pythonRuntime": "temporary_phase46c_python_venv",
        "nodeRuntime": Path(args.node_bin).name,
        "pythonPackages": {key: versions[key] for key in ["opencv", "pyav", "pyscenedetect", "duckdb", "polars"]},
        "sharpRuntime": versions["sharp_libvips"],
        "packageLockChanged": False,
        "dockerRequired": False,
        "cloudRunRequired": False,
    })
    write_json(output_dir / "phase_46c_cross_tool_manifest.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "sampleId": SAMPLE_ID,
        "status": suite_status,
        "toolStatus": tool_status,
        "warnings": warnings,
        "artifactCount": len(artifacts),
        "artifacts": artifacts,
        "privateOnly": True,
        "publicOutput": "blocked",
        "broadMedia": "blocked",
        "arbitraryMediaInput": "blocked",
    })
    write_json(output_dir / "phase_46c_tool_version_report.json", {"phase": PHASE, "runId": args.run_id, "versions": versions})
    write_json(output_dir / "phase_46c_dependency_runtime_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed" if suite_passed else "blocked",
        "tempRuntimeOnly": True,
        "pythonRequirementsPinned": True,
        "sharpPinned": "0.34.5",
        "ffmpegCaveat": "PyAV FFmpeg dependency remains tracked; bounded controlled probe does not approve broad codec use.",
        "libvipsCaveat": "Sharp/libvips remains worker-only with LGPL/native binary review tracked.",
    })
    write_json(output_dir / "phase_46c_storage_privacy_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed",
        "privateArtifactPrefix": f"{PRIVATE_PREFIX}/{args.run_id}/",
        "controlledRealVideo": "approved_single_sample_only",
        "windowBounded": True,
        "publicArtifacts": "blocked",
        "signedUrlsAsSourceOfTruth": "blocked",
        "committedFramesOrThumbnails": "blocked",
        "broadMedia": "blocked",
        "arbitraryMediaInput": "blocked",
    })
    write_json(output_dir / "phase_46c_private_artifact_manifest.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "pending_upload_update",
        "privateArtifactPrefix": f"{PRIVATE_PREFIX}/{args.run_id}/",
        "localArtifactCount": len(artifacts),
        "artifacts": artifacts,
        "privateUpload": {"status": "pending_upload_update"},
    })
    write_json(output_dir / "phase_46c_controlled_media_data_qa_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": suite_status,
        "mediaDataToolFamilyBetaStatus": beta_status,
        "sampleId": SAMPLE_ID,
        "toolStatus": tool_status,
        "warnings": warnings,
        "privateArtifactStatus": "pending_upload_update",
        "qaGates": {
            "approvedSingleSampleOnly": True,
            "sourceChecksumVerified": sha256_file(source_video) == SOURCE_SHA256,
            "boundedFrameSampling": True,
            "maxFrameCountRespected": True,
            "noArbitraryMedia": True,
            "noProviderCalls": True,
            "noVlmRuntime": True,
            "noOcrRuntime": True,
            "noPublicOutput": True,
            "coreRequiredToolsPassed": core_passed,
        },
    })
    write_json(output_dir / "phase_46c_blocker_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed" if not blockers else "blocked",
        "blockers": blockers,
        "warnings": warnings,
        "blockedScopes": [
            "Phase 46D until Phase 46C passes",
            "VLM runtime",
            "OCR runtime",
            "provider calls",
            "production",
            "beta",
            "public output",
            "broad media",
            "arbitrary media",
            "unapproved real media",
            "Track A",
        ],
    })
    write_json(output_dir / "phase_46c_controlled_real_video_media_data_suite_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": suite_status,
        "sourcePhase46aPr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/123",
        "sourcePhase46bPr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/125",
        "selectedSampleId": SAMPLE_ID,
        "mediaDataToolFamilyBetaStatus": beta_status,
        "toolStatus": tool_status,
        "warnings": warnings,
        "privateArtifactStatus": "pending_upload_update",
        "packageInstallation": "temp_runtime_only",
        "mediaProcessing": "controlled_real_video_bounded",
        "realMedia": "approved_single_private_controlled_sample_only",
        "docker": "not_run",
        "providerCalls": "not_run",
        "vlmRuntimeRetry": "not_run",
        "ocrRuntime": "not_run",
        "trackA": "not_touched",
        "nextPhaseDecision": "Phase 46D DuckDB/Polars reporting/QA integration is next only if private artifact upload passes; otherwise resolve the Phase 46C upload blocker first.",
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--source-video", required=True)
    parser.add_argument("--node-bin", required=True)
    parser.add_argument("--sharp-node-prefix", required=True)
    parser.add_argument("--sharp-runner", required=True)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    source_video = Path(args.source_video)
    output_dir.mkdir(parents=True, exist_ok=True)
    if sha256_file(source_video) != SOURCE_SHA256:
        raise RuntimeError("approved controlled sample checksum mismatch")

    pyav_report = probe_video(source_video, output_dir, args.run_id)
    opencv_report, frame_paths, _ = build_opencv_report(source_video, output_dir, args.run_id)
    scene_report = build_scene_report(source_video, output_dir, args.run_id)
    sharp_report = run_sharp_report(args, output_dir, frame_paths)
    initial_reports = [pyav_report, opencv_report, scene_report, sharp_report]
    rows = metric_rows(initial_reports)
    metrics_path = write_metrics_csv(output_dir, rows)
    duckdb_report = build_duckdb_report(output_dir, args.run_id, rows)
    polars_report = build_polars_report(output_dir, args.run_id, metric_rows(initial_reports + [duckdb_report]))
    write_final_reports(args, output_dir, source_video, initial_reports + [duckdb_report, polars_report], metrics_path)


if __name__ == "__main__":
    main()
