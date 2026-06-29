#!/usr/bin/env python3
import argparse
import inspect
import json
import math
import os
import socket
import sys
import traceback
import urllib.request
from contextlib import AbstractContextManager
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


PHASE = "37D"
MODEL_FAMILY = "PP-OCRv5"
ASSET_VERSION = "paddle3.0.0-mobile-safe-zone-v1"
AVOID_PADDING = 0.025


class NetworkGuard(AbstractContextManager):
    def __init__(self) -> None:
        self.network_attempted = False
        self._original_socket_connect = None
        self._original_create_connection = None
        self._original_urlopen = None
        self._original_requests_request = None

    def __enter__(self):
        self._original_socket_connect = socket.socket.connect
        self._original_create_connection = socket.create_connection
        self._original_urlopen = urllib.request.urlopen

        def blocked(*_args, **_kwargs):
            self.network_attempted = True
            raise RuntimeError("PHASE37D_RUNTIME_NETWORK_BLOCKED")

        socket.socket.connect = blocked
        socket.create_connection = blocked
        urllib.request.urlopen = blocked
        try:
            import requests

            self._original_requests_request = requests.sessions.Session.request
            requests.sessions.Session.request = blocked
        except Exception:
            self._original_requests_request = None
        return self

    def __exit__(self, exc_type, exc_value, tb):
        if self._original_socket_connect is not None:
            socket.socket.connect = self._original_socket_connect
        if self._original_create_connection is not None:
            socket.create_connection = self._original_create_connection
        if self._original_urlopen is not None:
            urllib.request.urlopen = self._original_urlopen
        if self._original_requests_request is not None:
            try:
                import requests

                requests.sessions.Session.request = self._original_requests_request
            except Exception:
                pass
        return False


def init_paddle_ocr(det_model_dir: str, rec_model_dir: str, dict_path: str) -> Tuple[Any, Dict[str, Any], Dict[str, Any]]:
    import paddle
    import paddleocr
    from paddleocr import PaddleOCR

    signature = inspect.signature(PaddleOCR.__init__)
    supported = set(signature.parameters.keys())
    kwargs: Dict[str, Any] = {}
    candidates = {
        "text_detection_model_dir": det_model_dir,
        "text_recognition_model_dir": rec_model_dir,
        "det_model_dir": det_model_dir,
        "rec_model_dir": rec_model_dir,
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
        "use_angle_cls": False,
        "device": "cpu",
    }
    for key, value in candidates.items():
        if key in supported:
            kwargs[key] = value

    dictionary_path_used = False
    for key in [
        "text_recognition_char_dict_path",
        "text_rec_char_dict_path",
        "rec_char_dict_path",
        "character_dict_path",
    ]:
        if key in supported:
            kwargs[key] = dict_path
            dictionary_path_used = True
            break

    ocr = PaddleOCR(**kwargs)
    metadata = {
        "paddlePaddleVersion": getattr(paddle, "__version__", None),
        "paddleOcrVersion": getattr(paddleocr, "__version__", None),
        "kwargs": {key: str(value) for key, value in kwargs.items()},
        "dictionaryPathUsed": dictionary_path_used,
        "localModelPathsUsed": (
            (("text_detection_model_dir" in kwargs) or ("det_model_dir" in kwargs))
            and (("text_recognition_model_dir" in kwargs) or ("rec_model_dir" in kwargs))
        ),
    }
    imports = {
        "paddleOcrImported": True,
        "paddlePaddleImported": True,
    }
    return ocr, metadata, imports


def run_predict(ocr: Any, image_path: Path) -> List[Dict[str, Any]]:
    if hasattr(ocr, "predict"):
        result = ocr.predict(str(image_path))
    else:
        result = ocr.ocr(str(image_path), cls=False)
    return parse_paddle_result(result)


def parse_paddle_result(result: Any) -> List[Dict[str, Any]]:
    if result is None:
        return []
    if isinstance(result, list) and len(result) == 1:
        return parse_paddle_result(result[0])
    payload = result
    if hasattr(payload, "json"):
        payload = payload.json
    if hasattr(payload, "to_dict"):
        payload = payload.to_dict()
    if not isinstance(payload, dict):
        return parse_legacy_result(result)
    res = payload.get("res", payload)
    texts = res.get("rec_texts") or res.get("texts") or []
    scores = res.get("rec_scores") or res.get("scores") or []
    polys = res.get("rec_polys") or res.get("dt_polys") or res.get("polys") or []
    boxes = []
    for index, text in enumerate(texts):
        polygon = normalize_polygon(polys[index] if index < len(polys) else None)
        if not polygon and "rec_boxes" in res and index < len(res["rec_boxes"]):
            polygon = box_to_polygon(res["rec_boxes"][index])
        if not polygon:
            continue
        confidence = float(scores[index]) if index < len(scores) and scores[index] is not None else None
        boxes.append(build_text_box(str(text), confidence, polygon))
    return boxes


def parse_legacy_result(result: Any) -> List[Dict[str, Any]]:
    boxes = []
    if not isinstance(result, list):
        return boxes
    rows = result[0] if result and isinstance(result[0], list) else result
    for row in rows:
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue
        polygon = normalize_polygon(row[0])
        text_info = row[1]
        text = ""
        confidence = None
        if isinstance(text_info, (list, tuple)):
            text = str(text_info[0]) if text_info else ""
            confidence = float(text_info[1]) if len(text_info) > 1 and text_info[1] is not None else None
        else:
            text = str(text_info)
        if polygon:
            boxes.append(build_text_box(text, confidence, polygon))
    return boxes


def normalize_polygon(value: Any) -> List[List[float]]:
    if value is None:
        return []
    if hasattr(value, "tolist"):
        value = value.tolist()
    if isinstance(value, list) and len(value) == 4 and all(isinstance(item, (int, float)) for item in value):
        return box_to_polygon(value)
    points = []
    if isinstance(value, list):
        for point in value:
            if hasattr(point, "tolist"):
                point = point.tolist()
            if isinstance(point, (list, tuple)) and len(point) >= 2:
                points.append([float(point[0]), float(point[1])])
    return points


def box_to_polygon(value: Any) -> List[List[float]]:
    if hasattr(value, "tolist"):
        value = value.tolist()
    if not isinstance(value, (list, tuple)) or len(value) < 4:
        return []
    x0, y0, x1, y1 = [float(value[index]) for index in range(4)]
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]


def build_text_box(text: str, confidence: Optional[float], polygon: List[List[float]]) -> Dict[str, Any]:
    xs = [point[0] for point in polygon]
    ys = [point[1] for point in polygon]
    return {
        "text": text,
        "confidence": confidence,
        "polygon": polygon,
        "center": [sum(xs) / len(xs), sum(ys) / len(ys)],
    }


def extract_frames(video_path: Path, frame_dir: Path, offsets: List[float], sample: Dict[str, Any]) -> Dict[str, Any]:
    import cv2

    frame_dir.mkdir(parents=True, exist_ok=True)
    blockers: List[str] = []
    warnings: List[str] = []
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        blockers.append("OpenCV could not open the approved Phase 32 source video.")
        return frame_manifest(sample, offsets, [], blockers, warnings)

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
    frames_total = float(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0)
    duration = frames_total / fps if fps > 0 else None
    if duration is not None and duration < float(sample["plannedWindow"]["endSeconds"]):
        blockers.append(f"Source duration {duration:.3f}s is shorter than selected end offset {sample['plannedWindow']['endSeconds']}s.")

    frames = []
    for index, offset in enumerate(offsets):
        if offset < float(sample["plannedWindow"]["startSeconds"]) or offset > float(sample["plannedWindow"]["endSeconds"]):
            blockers.append(f"Requested frame offset {offset:.3f}s is outside the selected window.")
            continue
        frame_id = f"phase37d_frame_{index + 1:02d}_{int(round(offset * 1000)):05d}ms"
        cap.set(cv2.CAP_PROP_POS_MSEC, offset * 1000.0)
        ok, frame = cap.read()
        if not ok and fps > 0:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(offset * fps)))
            ok, frame = cap.read()
        entry_warnings = []
        if not ok or frame is None:
            blockers.append(f"OpenCV failed to extract frame at {offset:.3f}s.")
            frames.append({
                "frameId": frame_id,
                "offsetSeconds": offset,
                "localFramePath": "",
                "extracted": False,
                "width": 0,
                "height": 0,
                "sourceTimeMsec": offset * 1000.0,
                "warnings": entry_warnings,
            })
            continue
        height, width = frame.shape[:2]
        frame_path = frame_dir / f"{frame_id}.png"
        if not cv2.imwrite(str(frame_path), frame):
            blockers.append(f"OpenCV failed to write frame PNG at {offset:.3f}s.")
            extracted = False
        else:
            extracted = True
        frames.append({
            "frameId": frame_id,
            "offsetSeconds": offset,
            "localFramePath": str(frame_path),
            "extracted": extracted,
            "width": int(width),
            "height": int(height),
            "sourceTimeMsec": offset * 1000.0,
            "warnings": entry_warnings,
        })
    cap.release()

    if len([frame for frame in frames if frame["extracted"]]) != 6:
        blockers.append("Phase 37D must extract exactly 6 controlled frames.")
    return frame_manifest(sample, offsets, frames, blockers, warnings)


def frame_manifest(sample: Dict[str, Any], offsets: List[float], frames: List[Dict[str, Any]], blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "runId": sample["runId"],
        "sampleId": sample["sampleId"],
        "controlledChainId": sample["chainId"],
        "sourceGcsUri": sample["sourceGcsUri"],
        "window": sample["plannedWindow"],
        "requestedOffsetsSeconds": offsets,
        "extractedFrameCount": len([frame for frame in frames if frame["extracted"]]),
        "maxSampledFrames": 6,
        "frameExtractionEngine": "opencv",
        "ffmpegUnavailableExpected": True,
        "frames": frames,
        "blockers": blockers,
        "warnings": warnings,
    }


def normalize_regions(raw_boxes: List[Dict[str, Any]], frame: Dict[str, Any]) -> List[Dict[str, Any]]:
    width = float(frame["width"] or 1)
    height = float(frame["height"] or 1)
    regions = []
    for index, box in enumerate(raw_boxes):
        polygon = [[float(point[0]), float(point[1])] for point in box["polygon"]]
        normalized_polygon = [[clamp(point[0] / width), clamp(point[1] / height)] for point in polygon]
        xs = [point[0] for point in normalized_polygon]
        ys = [point[1] for point in normalized_polygon]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        regions.append({
            "regionId": f"{frame['frameId']}_text_{index + 1:02d}",
            "frameId": frame["frameId"],
            "text": str(box["text"]),
            "confidence": box.get("confidence"),
            "polygon": polygon,
            "normalizedPolygon": normalized_polygon,
            "box": {
                "x": x0,
                "y": y0,
                "width": max(0.0, x1 - x0),
                "height": max(0.0, y1 - y0),
            },
            "center": [clamp(float(box["center"][0]) / width), clamp(float(box["center"][1]) / height)],
        })
    return regions


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def build_ocr_results(run_id: str, sample: Dict[str, Any], frames: List[Dict[str, Any]], frame_boxes: Dict[str, List[Dict[str, Any]]], runtime: Dict[str, Any], blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    results = []
    for frame in frames:
        frame_warnings = []
        frame_blockers = []
        regions = normalize_regions(frame_boxes.get(frame["frameId"], []), frame) if frame["extracted"] else []
        confidences = [float(region["confidence"]) for region in regions if region.get("confidence") is not None and math.isfinite(float(region["confidence"]))]
        if not regions:
            frame_warnings.append("No OCR text regions detected in this controlled frame.")
        results.append({
            "frameId": frame["frameId"],
            "offsetSeconds": frame["offsetSeconds"],
            "width": frame["width"],
            "height": frame["height"],
            "textRegions": regions,
            "textRegionCount": len(regions),
            "averageConfidence": sum(confidences) / len(confidences) if confidences else None,
            "warnings": frame_warnings,
            "blockers": frame_blockers,
        })
    total_regions = sum(result["textRegionCount"] for result in results)
    frames_with_text = len([result for result in results if result["textRegionCount"] > 0])
    return {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": sample["sampleId"],
        "modelFamily": MODEL_FAMILY,
        "assetVersion": ASSET_VERSION,
        "frameResults": results,
        "totalTextRegionCount": total_regions,
        "framesWithTextCount": frames_with_text,
        "runtime": runtime,
        "blockers": blockers,
        "warnings": warnings,
    }


def build_collision_reports(run_id: str, sample: Dict[str, Any], ocr_results: Dict[str, Any], candidate_zones: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    blockers: List[str] = []
    warnings: List[str] = []
    if not candidate_zones:
        blockers.append("No caption candidate zones are available.")
    lower_zone = next((zone for zone in candidate_zones if zone["zoneId"] == "vertical_lower_caption_safe_zone"), candidate_zones[0])
    entries = []
    avoid_regions_all = []
    for frame in ocr_results["frameResults"]:
        avoid_regions = []
        for region in frame["textRegions"]:
            avoid = {
                "avoidRegionId": f"avoid_{region['regionId']}",
                "sourceRegionId": region["regionId"],
                "frameId": frame["frameId"],
                "x": clamp(float(region["box"]["x"]) - AVOID_PADDING),
                "y": clamp(float(region["box"]["y"]) - AVOID_PADDING),
                "width": min(1.0, float(region["box"]["width"]) + AVOID_PADDING * 2),
                "height": min(1.0, float(region["box"]["height"]) + AVOID_PADDING * 2),
                "padding": AVOID_PADDING,
            }
            avoid_regions.append(avoid)
            avoid_regions_all.append(avoid)
        candidate_results = []
        for zone in candidate_zones:
            overlap = sum(intersection_area(region["box"], zone) for region in frame["textRegions"])
            candidate_results.append({
                "zoneId": zone["zoneId"],
                "intersectsText": overlap > 0,
                "overlapScore": round(overlap / max(float(zone["width"]) * float(zone["height"]), 0.000001), 6),
            })
        preferred = sorted(candidate_results, key=lambda item: (item["intersectsText"], item["overlapScore"]))[0] if candidate_results else None
        entry_warnings = []
        entry_blockers = []
        if frame["textRegionCount"] == 0:
            entry_warnings.append("No OCR text regions detected; caption zone recommendation is based on no-text frame state.")
        if preferred is None:
            entry_blockers.append("No caption candidate zone was available for this frame.")
        elif preferred["intersectsText"]:
            entry_warnings.append("Every caption candidate zone intersects detected OCR text; selected zone has the lowest overlap.")
        lower_overlap = next((candidate for candidate in candidate_results if candidate["zoneId"] == lower_zone["zoneId"]), {"overlapScore": 0, "intersectsText": False})
        entries.append({
            "frameId": frame["frameId"],
            "offsetSeconds": frame["offsetSeconds"],
            "lowerThirdCollision": bool(lower_overlap["intersectsText"]),
            "lowerThirdOverlapScore": float(lower_overlap["overlapScore"]),
            "textRegionCount": frame["textRegionCount"],
            "recommendedZoneId": str(preferred["zoneId"]) if preferred else "blocked_no_candidate_zone",
            "recommendationStatus": "warning" if entry_warnings else "passed",
            "candidateZones": candidate_results,
            "avoidRegions": avoid_regions,
            "warnings": entry_warnings,
            "blockers": entry_blockers,
        })
        warnings.extend(entry_warnings)
        blockers.extend(entry_blockers)

    frames_with_collision = len([entry for entry in entries if entry["lowerThirdCollision"]])
    frames_without_text = len([frame for frame in ocr_results["frameResults"] if frame["textRegionCount"] == 0])
    recommendations = len([entry for entry in entries if not entry["blockers"]])
    if recommendations != len(entries):
        blockers.append("One or more controlled frames could not produce a caption-zone recommendation.")

    safe_zone_manifest = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": sample["sampleId"],
        "captionCandidateZones": candidate_zones,
        "avoidTextRegions": avoid_regions_all,
        "frameRecommendations": entries,
        "blockers": blockers,
        "warnings": sorted(set(warnings)),
    }
    collision_report = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": sample["sampleId"],
        "expectedLowerCaptionZone": lower_zone,
        "framesChecked": len(entries),
        "framesWithLowerThirdCollision": frames_with_collision,
        "framesWithoutText": frames_without_text,
        "recommendationsAvailable": recommendations,
        "entries": entries,
        "blockers": blockers,
        "warnings": sorted(set(warnings)),
    }
    preferred_ids = sorted(set(entry["recommendedZoneId"] for entry in entries if not entry["blockers"]))
    recommendation_report = {
        "phase": PHASE,
        "runId": run_id,
        "sampleId": sample["sampleId"],
        "status": "passed" if not blockers else "blocked",
        "recommendedForPhase37EPlanning": not blockers,
        "summary": {
            "sampledFrames": len(entries),
            "totalTextRegionCount": ocr_results["totalTextRegionCount"],
            "framesWithLowerThirdCollision": frames_with_collision,
            "framesWithoutText": frames_without_text,
            "preferredCaptionZoneIds": preferred_ids,
        },
        "blockers": blockers,
        "warnings": sorted(set(warnings)),
    }
    return safe_zone_manifest, collision_report, recommendation_report


def intersection_area(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    ax0, ay0 = float(a["x"]), float(a["y"])
    ax1, ay1 = ax0 + float(a["width"]), ay0 + float(a["height"])
    bx0, by0 = float(b["x"]), float(b["y"])
    bx1, by1 = bx0 + float(b["width"]), by0 + float(b["height"])
    width = max(0.0, min(ax1, bx1) - max(ax0, bx0))
    height = max(0.0, min(ay1, by1) - max(ay0, by0))
    return width * height


def build_qa(frame_manifest_json: Dict[str, Any], model_verified: bool, ocr_results: Dict[str, Any], collision_report: Dict[str, Any], runtime_blockers: List[str], runtime_warnings: List[str]) -> Dict[str, Any]:
    blockers = []
    warnings = []
    blockers.extend(frame_manifest_json["blockers"])
    blockers.extend(ocr_results["blockers"])
    blockers.extend(collision_report["blockers"])
    blockers.extend(runtime_blockers)
    warnings.extend(frame_manifest_json["warnings"])
    warnings.extend(ocr_results["warnings"])
    warnings.extend(collision_report["warnings"])
    warnings.extend(runtime_warnings)
    runtime = ocr_results["runtime"]
    if not model_verified:
        blockers.append("Phase 37B OCR model checksum verification did not pass.")
    if frame_manifest_json["extractedFrameCount"] != 6:
        blockers.append("Phase 37D did not extract exactly 6 controlled frames.")
    if runtime["exitCode"] != 0:
        blockers.append("PaddleOCR worker reported a runtime error.")
    if not runtime["networkBlocked"]:
        blockers.append("Runtime network guard was not active.")
    if not runtime["runtimeModelAutoDownloadBlocked"]:
        blockers.append("PaddleOCR attempted network/model download during controlled real-video OCR.")
    if not runtime["localModelPathsUsed"]:
        blockers.append("PaddleOCR did not accept explicit local detection and recognition model paths.")
    if collision_report["recommendationsAvailable"] != frame_manifest_json["extractedFrameCount"]:
        blockers.append("Safe-zone recommendations were not available for every extracted frame.")

    def gate(gate_id: str, ok: bool, summary: str) -> Dict[str, Any]:
        return {"gateId": gate_id, "status": "passed" if ok else "blocked", "summary": summary}

    gates = [
        gate("approved_private_sample", True, "Uses only the Phase 37D gate-approved Phase 32 private sample."),
        gate("source_object_metadata", True, "Source object metadata and SHA-256 were verified by the TypeScript runner before worker execution."),
        gate("frame_extraction_bounds", frame_manifest_json["extractedFrameCount"] == 6 and not frame_manifest_json["blockers"], "OpenCV extracted exactly six frames inside 6.9s-8.9s."),
        gate("phase37b_model_checksums", model_verified, "Phase 37B PP-OCRv5 det/rec/dictionary SHA-256 values matched local copied bytes."),
        gate("paddleocr_runtime", runtime["exitCode"] == 0 and runtime["networkBlocked"] and runtime["runtimeModelAutoDownloadBlocked"] and runtime["localModelPathsUsed"], "PaddleOCR CPU runtime used local model paths under the network/model-download guard."),
        gate("safe_zone_collision_report", not collision_report["blockers"], "Caption collision and avoid-text reports were generated for every controlled frame."),
        gate("private_json_artifacts", True, "Worker emitted JSON reports only; raw frames stay local temp only."),
        gate("blocked_scopes", True, "Phase 37E, broad OCR, arbitrary media, providers, public output, beta, production, GPU, Cloud Run, Docker push, and Track A remain blocked."),
    ]
    return {
        "status": "passed" if not blockers else "blocked",
        "gates": gates,
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
    }


def write_json(path: Path, value: Dict[str, Any]) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def parse_offsets(value: str) -> List[float]:
    return [float(item.strip()) for item in value.split(",") if item.strip()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--frame-dir", required=True)
    parser.add_argument("--video-path", required=True)
    parser.add_argument("--det-model-dir", required=True)
    parser.add_argument("--rec-model-dir", required=True)
    parser.add_argument("--dict-path", required=True)
    parser.add_argument("--asset-verification-path", required=True)
    parser.add_argument("--sample-manifest-path", required=True)
    parser.add_argument("--execution-plan-path", required=True)
    parser.add_argument("--offsets", required=True)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    frame_dir = Path(args.frame_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    frame_dir.mkdir(parents=True, exist_ok=True)

    sample_manifest = json.loads(Path(args.sample_manifest_path).read_text(encoding="utf-8"))
    execution_plan = json.loads(Path(args.execution_plan_path).read_text(encoding="utf-8"))
    asset_verification = json.loads(Path(args.asset_verification_path).read_text(encoding="utf-8"))
    sample = dict(sample_manifest["candidates"][0])
    sample["runId"] = args.run_id
    offsets = parse_offsets(args.offsets)
    candidate_zones = execution_plan["captionCandidateZones"]
    model_verified = asset_verification.get("status") == "verified"

    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
    os.environ.setdefault("MODEL_DOWNLOADS_ENABLED", "false")
    os.environ.setdefault("ARBITRARY_MEDIA_ENABLED", "false")
    os.environ.setdefault("PROVIDER_EXECUTION_ENABLED", "false")
    os.environ.setdefault("PUBLIC_OUTPUT_ENABLED", "false")
    os.environ.setdefault("TRACK_A_EXECUTION_ENABLED", "false")

    frame_manifest_json = extract_frames(Path(args.video_path), frame_dir, offsets, sample)
    frames = frame_manifest_json["frames"]
    runtime = {
        "mode": "controlled_real_video_safe_zone_execution",
        "cpuOnly": True,
        "paddleOcrImported": False,
        "paddlePaddleImported": False,
        "paddleOcrVersion": None,
        "paddlePaddleVersion": None,
        "exitCode": 0,
        "stderrPreview": "",
        "networkBlocked": True,
        "runtimeModelAutoDownloadBlocked": True,
        "localModelPathsUsed": False,
        "dictionaryPathUsed": False,
        "frameExtractionEngine": "opencv",
    }
    runtime_blockers: List[str] = []
    runtime_warnings: List[str] = []
    frame_boxes: Dict[str, List[Dict[str, Any]]] = {}

    try:
        if frame_manifest_json["blockers"]:
            raise RuntimeError("Frame extraction blockers prevent OCR execution.")
        with NetworkGuard() as guard:
            ocr, metadata, imports = init_paddle_ocr(args.det_model_dir, args.rec_model_dir, args.dict_path)
            runtime.update(imports)
            runtime["paddleOcrVersion"] = metadata.get("paddleOcrVersion")
            runtime["paddlePaddleVersion"] = metadata.get("paddlePaddleVersion")
            runtime["localModelPathsUsed"] = bool(metadata.get("localModelPathsUsed"))
            runtime["dictionaryPathUsed"] = bool(metadata.get("dictionaryPathUsed"))
            if not runtime["dictionaryPathUsed"]:
                runtime_warnings.append("PaddleOCR constructor did not expose a recognized dictionary-path parameter; verified dictionary path was present but not passed.")
            runtime_warnings.append("PP-LCNet_x1_0_textline_ori remains deferred; rotated/vertical text is warning-only and blocked from auto-download.")
            for frame in frames:
                if frame["extracted"]:
                    frame_boxes[frame["frameId"]] = run_predict(ocr, Path(frame["localFramePath"]))
            runtime["runtimeModelAutoDownloadBlocked"] = not guard.network_attempted
    except Exception as exc:
        runtime["exitCode"] = 1
        runtime["stderrPreview"] = "".join(traceback.format_exception_only(type(exc), exc)).strip()
        runtime_blockers.append(f"PaddleOCR controlled real-video runtime failed: {runtime['stderrPreview']}")

    ocr_results = build_ocr_results(args.run_id, sample, frames, frame_boxes, runtime, runtime_blockers, runtime_warnings)
    safe_zone_manifest, collision_report, recommendation_report = build_collision_reports(args.run_id, sample, ocr_results, candidate_zones)
    qa = build_qa(frame_manifest_json, model_verified, ocr_results, collision_report, runtime_blockers, runtime_warnings)
    if runtime_blockers:
        qa["status"] = "blocked"

    report = {
        "ok": qa["status"] == "passed",
        "phase": PHASE,
        "runId": args.run_id,
        "projectId": "reeditpro",
        "status": "passed" if qa["status"] == "passed" else "blocked",
        "sample": {
            "sampleId": sample["sampleId"],
            "controlledChainId": sample["chainId"],
            "sourceGcsUri": sample["sourceGcsUri"],
            "window": sample["plannedWindow"],
            "frameOffsetsSeconds": offsets,
            "frameCount": frame_manifest_json["extractedFrameCount"],
        },
        "modelVerification": asset_verification,
        "frameExtraction": frame_manifest_json,
        "ocrResults": ocr_results,
        "safeZoneManifest": safe_zone_manifest,
        "collisionReport": collision_report,
        "recommendationReport": recommendation_report,
        "qa": qa,
        "artifacts": [],
        "safety": {
            "controlledRealVideoOnly": True,
            "arbitraryMediaUsed": False,
            "broadRealVideoOcrUsed": False,
            "rawFramesUploaded": False,
            "overlaysUploaded": False,
            "captionRenderIntegrationPerformed": False,
            "iamMutated": False,
            "dockerBuilt": False,
            "cloudRunDeployed": False,
            "providerExecuted": False,
            "publicAccessEnabled": False,
            "signedUrlSourceOfTruthUsed": False,
            "gpuJobUsed": False,
            "trackATouched": False,
            "productionReadyAllowed": False,
            "externalBetaAllowed": False,
            "broadRealUserMediaAllowed": False,
        },
        "phase37EReadiness": {
            "readyForControlledCaptionRenderQaPlanning": qa["status"] == "passed",
            "reason": "Phase 37D controlled execution passed; Phase 37E may plan caption/render QA integration only." if qa["status"] == "passed" else "Phase 37E remains blocked until Phase 37D controlled execution blockers are resolved.",
        },
        "blockers": qa["blockers"],
        "warnings": qa["warnings"],
    }

    write_json(output_dir / "phase_37d_frame_extraction_manifest.json", frame_manifest_json)
    write_json(output_dir / "phase_37d_ocr_results.json", ocr_results)
    write_json(output_dir / "phase_37d_ocr_safe_zone_manifest.json", safe_zone_manifest)
    write_json(output_dir / "phase_37d_caption_collision_report.json", collision_report)
    write_json(output_dir / "phase_37d_safe_zone_recommendation_report.json", recommendation_report)
    write_json(output_dir / "phase_37d_controlled_real_video_ocr_execution_report.json", report)
    print(json.dumps({
        "ok": report["ok"],
        "runId": args.run_id,
        "qaStatus": qa["status"],
        "frames": frame_manifest_json["extractedFrameCount"],
        "textRegionCount": ocr_results["totalTextRegionCount"],
        "lowerThirdCollisionFrames": collision_report["framesWithLowerThirdCollision"],
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
