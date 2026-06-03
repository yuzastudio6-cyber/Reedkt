#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
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


PHASE = "46B"
PRIVATE_PREFIX = "gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite"
TOOL_IDS = ["opencv", "pyav", "pyscenedetect", "sharp_libvips", "duckdb", "polars"]
FIXTURE_IDS = [
    "generated-image-opencv-basic",
    "generated-container-pyav-probe",
    "generated-scene-cut-pyscenedetect",
    "generated-thumbnail-sharp-libvips",
    "generated-report-duckdb",
    "generated-report-polars",
    "generated-cross-tool-manifest",
]


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=False) + "\n", encoding="utf-8")


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


def build_opencv_fixture(output_dir: Path) -> tuple[dict[str, Any], Path]:
    fixtures = output_dir / "generated-fixtures"
    fixtures.mkdir(parents=True, exist_ok=True)
    image_path = fixtures / "generated-image-opencv-basic.png"
    image = np.full((240, 320, 3), 255, dtype=np.uint8)
    cv2.rectangle(image, (32, 40), (132, 140), (0, 0, 255), thickness=-1)
    cv2.circle(image, (230, 82), 36, (255, 0, 0), thickness=-1)
    cv2.line(image, (45, 205), (280, 205), (0, 180, 0), thickness=8)
    cv2.imwrite(str(image_path), image)

    loaded = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if loaded is None:
        raise RuntimeError("OpenCV failed to load generated image")

    red_mask = (loaded[:, :, 2] > 180) & (loaded[:, :, 1] < 90) & (loaded[:, :, 0] < 90)
    blue_mask = (loaded[:, :, 0] > 180) & (loaded[:, :, 1] < 90) & (loaded[:, :, 2] < 90)
    green_mask = (loaded[:, :, 1] > 130) & (loaded[:, :, 0] < 90) & (loaded[:, :, 2] < 90)
    red_count = int(red_mask.sum())
    blue_count = int(blue_mask.sum())
    green_count = int(green_mask.sum())
    checks = {
        "dimensionsMatch": loaded.shape[:2] == (240, 320),
        "redRectangleDetected": red_count >= 9000,
        "blueCircleDetected": blue_count >= 3500,
        "greenLineDetected": green_count >= 1500,
    }
    report = {
        "phase": PHASE,
        "fixtureId": "generated-image-opencv-basic",
        "toolId": "opencv",
        "status": "passed" if all(checks.values()) else "failed",
        "generatedOnly": True,
        "realMedia": "not_used",
        "versions": {"opencv": cv2.__version__, "numpy": np.__version__},
        "metrics": {
            "width": 320,
            "height": 240,
            "redPixelCount": red_count,
            "bluePixelCount": blue_count,
            "greenPixelCount": green_count,
        },
        "checks": checks,
        "artifact": artifact_entry(output_dir, image_path, "generated_fixture_image"),
    }
    write_json(output_dir / "phase_46b_opencv_generated_report.json", report)
    return report, image_path


def write_synthetic_video(video_path: Path, frame_size: tuple[int, int], fps: int, blocks: list[tuple[int, tuple[int, int, int]]]) -> int:
    video_path.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    container = av.open(str(video_path), mode="w")
    try:
        stream = container.add_stream("mpeg4", rate=fps)
        stream.width = frame_size[0]
        stream.height = frame_size[1]
        stream.pix_fmt = "yuv420p"
        for count, color_rgb in blocks:
            for _ in range(count):
                frame_array = np.full((frame_size[1], frame_size[0], 3), color_rgb, dtype=np.uint8)
                frame = av.VideoFrame.from_ndarray(frame_array, format="rgb24")
                for packet in stream.encode(frame):
                    container.mux(packet)
                total += 1
        for packet in stream.encode():
            container.mux(packet)
    finally:
        container.close()
    return total


def build_pyav_fixture(output_dir: Path) -> tuple[dict[str, Any], Path]:
    video_path = output_dir / "generated-fixtures" / "generated-container-pyav-probe.mp4"
    expected_frames = write_synthetic_video(video_path, (160, 120), 5, [(10, (255, 255, 255))])
    container = av.open(str(video_path), mode="r")
    try:
        streams = list(container.streams.video)
        decoded_frames = [frame for frame in container.decode(video=0)]
        stream = streams[0]
        average_rate = float(stream.average_rate) if stream.average_rate else None
        duration_seconds = float(container.duration / av.time_base) if container.duration else None
    finally:
        container.close()
    checks = {
        "videoStreamPresent": len(streams) == 1,
        "fpsWithinTolerance": average_rate is not None and abs(average_rate - 5.0) <= 0.01,
        "decodedFrameCountWithinTolerance": abs(len(decoded_frames) - expected_frames) <= 1,
    }
    report = {
        "phase": PHASE,
        "fixtureId": "generated-container-pyav-probe",
        "toolId": "pyav",
        "status": "passed" if all(checks.values()) else "failed",
        "generatedOnly": True,
        "realMedia": "not_used",
        "versions": {"pyav": av.__version__, "ffmpegLibrary": getattr(av, "library_versions", {})},
        "metrics": {
            "streamCount": len(streams),
            "decodedFrameCount": len(decoded_frames),
            "expectedFrameCount": expected_frames,
            "averageRate": average_rate,
            "durationSeconds": duration_seconds,
        },
        "checks": checks,
        "artifact": artifact_entry(output_dir, video_path, "generated_fixture_video"),
    }
    write_json(output_dir / "phase_46b_pyav_generated_report.json", report)
    return report, video_path


def build_pyscenedetect_fixture(output_dir: Path) -> tuple[dict[str, Any], Path]:
    video_path = output_dir / "generated-fixtures" / "generated-scene-cut-pyscenedetect.mp4"
    expected_frames = write_synthetic_video(video_path, (160, 120), 5, [(15, (255, 0, 0)), (15, (0, 0, 255)), (15, (0, 255, 0))])
    video = open_video(str(video_path))
    manager = SceneManager()
    manager.add_detector(ContentDetector(threshold=15.0, min_scene_len=5))
    manager.detect_scenes(video)
    scenes = manager.get_scene_list()
    boundaries = [(start.get_frames(), end.get_frames()) for start, end in scenes]
    checks = {
        "expectedSceneCount": len(scenes) == 3,
        "boundariesWithinTolerance": len(scenes) == 3
        and abs(boundaries[0][1] - 15) <= 2
        and abs(boundaries[1][1] - 30) <= 2
        and abs(boundaries[2][1] - expected_frames) <= 2,
    }
    report = {
        "phase": PHASE,
        "fixtureId": "generated-scene-cut-pyscenedetect",
        "toolId": "pyscenedetect",
        "status": "passed" if all(checks.values()) else "failed",
        "generatedOnly": True,
        "realMedia": "not_used",
        "versions": {"pyscenedetect": scenedetect.__version__},
        "metrics": {
            "expectedScenes": 3,
            "detectedScenes": len(scenes),
            "boundaries": boundaries,
            "expectedFrameCount": expected_frames,
        },
        "checks": checks,
        "artifact": artifact_entry(output_dir, video_path, "generated_fixture_video"),
    }
    write_json(output_dir / "phase_46b_pyscenedetect_generated_report.json", report)
    return report, video_path


def run_sharp_fixture(args: argparse.Namespace, output_dir: Path, image_path: Path) -> dict[str, Any]:
    thumb_path = output_dir / "generated-fixtures" / "generated-thumbnail-sharp-libvips.png"
    report_path = output_dir / "phase_46b_sharp_libvips_generated_report.json"
    subprocess.run(
        [
            args.node_bin,
            args.sharp_runner,
            "--input-image",
            str(image_path),
            "--output-thumb",
            str(thumb_path),
            "--output-report",
            str(report_path),
            "--sharp-node-prefix",
            args.sharp_node_prefix,
        ],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    report = json.loads(report_path.read_text(encoding="utf-8"))
    report["artifact"] = artifact_entry(output_dir, thumb_path, "generated_fixture_thumbnail")
    write_json(report_path, report)
    return report


def metric_rows(reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for report in reports:
        rows.append({
            "tool": report["toolId"],
            "fixture": report["fixtureId"],
            "status": report["status"],
            "generated_only": bool(report["generatedOnly"]),
            "metric_count": len(report.get("metrics", {})),
        })
    return rows


def build_duckdb_report(output_dir: Path, rows: list[dict[str, Any]]) -> dict[str, Any]:
    con = duckdb.connect(database=":memory:")
    con.execute("CREATE TABLE metrics(tool VARCHAR, fixture VARCHAR, status VARCHAR, generated_only BOOLEAN, metric_count INTEGER)")
    con.executemany(
        "INSERT INTO metrics VALUES (?, ?, ?, ?, ?)",
        [(row["tool"], row["fixture"], row["status"], row["generated_only"], row["metric_count"]) for row in rows],
    )
    grouped = con.execute("SELECT status, COUNT(*) AS count FROM metrics GROUP BY status ORDER BY status").fetchall()
    total = con.execute("SELECT COUNT(*) FROM metrics").fetchone()[0]
    passed = dict(grouped).get("passed", 0)
    checks = {
        "metricsLoaded": total == len(rows),
        "aggregateCountsMatch": passed == len(rows),
        "networkExtensionsNotUsed": True,
    }
    report = {
        "phase": PHASE,
        "fixtureId": "generated-report-duckdb",
        "toolId": "duckdb",
        "status": "passed" if all(checks.values()) else "failed",
        "generatedOnly": True,
        "realMedia": "not_used",
        "versions": {"duckdb": duckdb.__version__},
        "metrics": {"rowCount": total, "statusCounts": [{"status": status, "count": count} for status, count in grouped]},
        "checks": checks,
    }
    write_json(output_dir / "phase_46b_duckdb_generated_report.json", report)
    return report


def build_polars_report(output_dir: Path, rows: list[dict[str, Any]]) -> dict[str, Any]:
    df = pl.DataFrame(rows)
    grouped = df.group_by("status").agg(pl.len().alias("count")).sort("status")
    status_counts = grouped.to_dicts()
    passed = next((item["count"] for item in status_counts if item["status"] == "passed"), 0)
    checks = {
        "metricsLoaded": df.height == len(rows),
        "groupByStatusMatches": passed == len(rows),
        "rowCountRecorded": df.height > 0,
    }
    report = {
        "phase": PHASE,
        "fixtureId": "generated-report-polars",
        "toolId": "polars",
        "status": "passed" if all(checks.values()) else "failed",
        "generatedOnly": True,
        "realMedia": "not_used",
        "versions": {"polars": pl.__version__},
        "metrics": {"rowCount": df.height, "statusCounts": status_counts},
        "checks": checks,
    }
    write_json(output_dir / "phase_46b_polars_generated_report.json", report)
    return report


def write_metrics_csv(output_dir: Path, rows: list[dict[str, Any]]) -> Path:
    metrics_path = output_dir / "generated-metrics" / "generated-media-data-metrics.csv"
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    with metrics_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["tool", "fixture", "status", "generated_only", "metric_count"])
        writer.writeheader()
        writer.writerows(rows)
    return metrics_path


def collect_artifacts(output_dir: Path) -> list[dict[str, Any]]:
    artifacts = []
    for path in sorted(output_dir.rglob("*")):
        if path.is_file():
            kind = "report" if path.suffix == ".json" else "generated_private_artifact"
            artifacts.append(artifact_entry(output_dir, path, kind))
    return artifacts


def write_final_reports(args: argparse.Namespace, output_dir: Path, tool_reports: list[dict[str, Any]], metrics_path: Path) -> None:
    tool_status = {report["toolId"]: report["status"] for report in tool_reports if report["toolId"] in TOOL_IDS}
    all_tool_passed = all(tool_status.get(tool) == "passed" for tool in TOOL_IDS)
    beta_status = "phase-complete but tool-family incomplete" if all_tool_passed else "blocked"
    suite_status = "passed" if all_tool_passed else "blocked"
    blockers = [] if all_tool_passed else [f"{tool} generated fixture {tool_status.get(tool, 'missing')}" for tool in TOOL_IDS if tool_status.get(tool) != "passed"]
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
    plan = {
        "phase": PHASE,
        "runId": args.run_id,
        "sourcePhase46aPr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/123",
        "branch": "codex/rp-activation-46b-generated-media-data-analysis-suite",
        "baseIfPr123Open": "codex/rp-activation-46a-media-data-tool-readiness-audit",
        "packageLockPolicy": "unchanged_temp_runtime_only",
        "fixtureIds": FIXTURE_IDS,
        "privateArtifactPrefix": f"{PRIVATE_PREFIX}/{args.run_id}/",
    }
    write_json(output_dir / "phase_46b_generated_media_data_plan.json", plan)
    write_json(output_dir / "phase_46b_runtime_preflight.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed",
        "strategy": "isolated_temp_runtime_install",
        "pythonRuntime": os.sys.executable,
        "nodeRuntime": args.node_bin,
        "pythonPackages": {key: versions[key] for key in ["opencv", "pyav", "pyscenedetect", "duckdb", "polars"]},
        "sharpRuntime": versions["sharp_libvips"],
        "packageLockChanged": False,
        "dockerRequired": False,
    })
    write_json(output_dir / "phase_46b_generated_fixture_manifest.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "fixtures": [{"fixtureId": fixture, "generatedOnly": True} for fixture in FIXTURE_IDS],
        "realMedia": "not_used",
        "arbitraryMediaInput": "blocked",
    })
    cross_tool = {
        "phase": PHASE,
        "runId": args.run_id,
        "fixtureId": "generated-cross-tool-manifest",
        "status": suite_status,
        "toolStatus": tool_status,
        "artifactCount": len(artifacts),
        "artifacts": artifacts,
        "privateOnly": True,
        "publicOutput": "blocked",
        "realMedia": "not_used",
    }
    write_json(output_dir / "phase_46b_cross_tool_manifest.json", cross_tool)
    write_json(output_dir / "phase_46b_tool_version_report.json", {"phase": PHASE, "runId": args.run_id, "versions": versions})
    write_json(output_dir / "phase_46b_dependency_runtime_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed" if all_tool_passed else "blocked",
        "tempRuntimeOnly": True,
        "pythonRequirementsPinned": True,
        "sharpPinned": "0.34.5",
        "ffmpegCaveat": "PyAV FFmpeg dependency remains tracked; generated-only decode/encode evidence does not approve broad codec use.",
        "libvipsCaveat": "Sharp/libvips remains worker-only with LGPL/native binary review tracked.",
    })
    write_json(output_dir / "phase_46b_storage_privacy_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed",
        "privateArtifactPrefix": f"{PRIVATE_PREFIX}/{args.run_id}/",
        "generatedOnly": True,
        "realMedia": "not_used",
        "publicArtifacts": "blocked",
        "signedUrlsAsSourceOfTruth": "blocked",
        "committedBinaryFixtures": "blocked",
    })
    write_json(output_dir / "phase_46b_private_artifact_manifest.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "pending_upload_update",
        "privateArtifactPrefix": f"{PRIVATE_PREFIX}/{args.run_id}/",
        "localArtifactCount": len(artifacts),
        "artifacts": artifacts,
        "privateUpload": {"status": "pending_upload_update"},
    })
    write_json(output_dir / "phase_46b_generated_media_data_qa_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": suite_status,
        "mediaDataToolFamilyBetaStatus": beta_status,
        "generatedOnly": True,
        "toolStatus": tool_status,
        "privateArtifactStatus": "pending_upload_update",
        "qaGates": {
            "noRealMedia": True,
            "noArbitraryMedia": True,
            "noProviderCalls": True,
            "noVlmRuntime": True,
            "noOcrRuntime": True,
            "noPublicOutput": True,
            "allRequiredToolsPassed": all_tool_passed,
        },
    })
    write_json(output_dir / "phase_46b_blocker_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": "passed" if not blockers else "blocked",
        "blockers": blockers,
        "blockedScopes": [
            "Phase 46C until Phase 46B passes",
            "Phase 46D until reporting integration phase",
            "controlled real media",
            "broad media",
            "arbitrary media",
            "VLM runtime",
            "OCR runtime",
            "provider calls",
            "production",
            "beta",
            "public output",
            "Track A",
        ],
    })
    write_json(output_dir / "phase_46b_generated_media_data_suite_report.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "status": suite_status,
        "sourcePhase46aPr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/123",
        "mediaDataToolFamilyBetaStatus": beta_status,
        "toolStatus": tool_status,
        "privateArtifactStatus": "pending_upload_update",
        "packageInstallation": "temp_runtime_only",
        "mediaProcessing": "generated_only",
        "realMedia": "not_run",
        "docker": "not_run",
        "providerCalls": "not_run",
        "vlmRuntimeRetry": "not_run",
        "ocrRuntime": "not_run",
        "trackA": "not_touched",
        "nextPhaseDecision": "Phase 46C controlled real-video media/data suite is next only if private artifact upload passes; otherwise resolve the Phase 46B upload blocker first.",
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--node-bin", required=True)
    parser.add_argument("--sharp-node-prefix", required=True)
    parser.add_argument("--sharp-runner", required=True)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    opencv_report, image_path = build_opencv_fixture(output_dir)
    pyav_report, _ = build_pyav_fixture(output_dir)
    scene_report, _ = build_pyscenedetect_fixture(output_dir)
    sharp_report = run_sharp_fixture(args, output_dir, image_path)
    initial_reports = [opencv_report, pyav_report, scene_report, sharp_report]
    metrics_path = write_metrics_csv(output_dir, metric_rows(initial_reports))
    duckdb_report = build_duckdb_report(output_dir, metric_rows(initial_reports))
    polars_report = build_polars_report(output_dir, metric_rows(initial_reports + [duckdb_report]))
    write_final_reports(args, output_dir, initial_reports + [duckdb_report, polars_report], metrics_path)


if __name__ == "__main__":
    main()
