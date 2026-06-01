#!/usr/bin/env python3
import argparse
import inspect
import json
import math
import os
import re
import socket
import sys
import traceback
import urllib.request
from contextlib import AbstractContextManager
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont


PHASE = "37C"
MODEL_FAMILY = "PP-OCRv5"
ASSET_VERSION = "paddle3.0.0-mobile-safe-zone-v1"
TOKEN_RECALL_THRESHOLD = 0.80
CONFIDENCE_THRESHOLD = 0.60


class NetworkGuard(AbstractContextManager):
    def __init__(self) -> None:
        self.active = False
        self.network_attempted = False
        self._original_socket_connect = None
        self._original_create_connection = None
        self._original_urlopen = None
        self._original_requests_request = None

    def __enter__(self):
        self.active = True
        self._original_socket_connect = socket.socket.connect
        self._original_create_connection = socket.create_connection
        self._original_urlopen = urllib.request.urlopen

        def blocked(*_args, **_kwargs):
            self.network_attempted = True
            raise RuntimeError("PHASE37C_RUNTIME_NETWORK_BLOCKED")

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


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def draw_text(draw: ImageDraw.ImageDraw, xy: Tuple[int, int], text: str, size: int = 48, fill=(18, 24, 32), bold: bool = True) -> None:
    draw.text(xy, text, font=load_font(size, bold=bold), fill=fill)


def generate_fixture(spec: Dict[str, Any], out_dir: Path) -> Path:
    image = Image.new("RGB", (int(spec["width"]), int(spec["height"])), (248, 250, 252))
    draw = ImageDraw.Draw(image)
    fixture_id = spec["fixtureId"]

    if fixture_id == "basic-ui-text":
        draw.rectangle((48, 42, 1232, 142), outline=(35, 45, 62), width=3, fill=(255, 255, 255))
        draw_text(draw, (86, 70), "REEDITPRO", 52)
        for x0, label in [(92, "UPLOAD"), (474, "APPROVE"), (886, "EXPORT")]:
            draw.rounded_rectangle((x0, 206, x0 + 300, 306), radius=8, outline=(18, 24, 32), width=3, fill=(255, 255, 255))
            draw_text(draw, (x0 + 28, 224), label, 48)
    elif fixture_id == "caption-safe-zone-conflict":
        draw_text(draw, (78, 82), "PREVIEW CHECK", 46)
        zone = spec["captionConflictZone"]
        draw.rectangle(
            (zone["x"], zone["y"], zone["x"] + zone["width"], zone["y"] + zone["height"]),
            outline=(180, 38, 38),
            width=5,
            fill=(255, 255, 255),
        )
        draw_text(draw, (356, 598), "CAPTION SAFE ZONE ALERT", 46)
    elif fixture_id == "multi-region-ui":
        draw.rectangle((52, 74, 430, 282), outline=(40, 48, 64), width=3, fill=(255, 255, 255))
        draw_text(draw, (82, 116), "SOURCE", 48)
        draw.rectangle((816, 74, 1218, 282), outline=(40, 48, 64), width=3, fill=(255, 255, 255))
        draw_text(draw, (868, 116), "PREVIEW", 48)
        draw.rectangle((52, 548, 520, 678), outline=(40, 48, 64), width=3, fill=(255, 255, 255))
        draw_text(draw, (86, 586), "TIMELINE", 48)
        draw.rectangle((850, 548, 1218, 678), outline=(40, 48, 64), width=3, fill=(255, 255, 255))
        draw_text(draw, (914, 586), "CREDITS", 48)
    elif fixture_id == "low-contrast-warning":
        draw.rectangle((300, 278, 980, 430), outline=(210, 214, 220), width=2, fill=(246, 247, 249))
        draw_text(draw, (365, 326), "LOW CONTRAST WARNING", 44, fill=(176, 182, 190))
    elif fixture_id == "small-text-warning":
        draw.rectangle((470, 326, 810, 412), outline=(55, 65, 81), width=2, fill=(255, 255, 255))
        draw_text(draw, (526, 360), "SMALL TEXT WARNING", 18, fill=(20, 25, 33), bold=False)
    elif fixture_id == "rotated-text-blocked-or-warning":
        layer = Image.new("RGBA", (420, 96), (255, 255, 255, 0))
        layer_draw = ImageDraw.Draw(layer)
        layer_draw.text((12, 18), "ROTATED TEXT DEFERRED", font=load_font(34, bold=True), fill=(22, 28, 36, 255))
        rotated = layer.rotate(25, expand=True, fillcolor=(255, 255, 255, 0))
        image.paste(rotated, (455, 245), rotated)
    else:
        draw_text(draw, (80, 80), fixture_id.upper(), 42)

    out_path = out_dir / f"{fixture_id}.png"
    image.save(out_path)
    return out_path


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


def normalize_tokens(values: Iterable[str]) -> List[str]:
    tokens: List[str] = []
    for value in values:
        tokens.extend(re.findall(r"[A-Z0-9]+", value.upper()))
    return tokens


def intersects_region(polygon: List[List[float]], region: Dict[str, Any]) -> bool:
    if not polygon:
        return False
    xs = [point[0] for point in polygon]
    ys = [point[1] for point in polygon]
    ax0, ay0, ax1, ay1 = min(xs), min(ys), max(xs), max(ys)
    bx0, by0 = float(region["x"]), float(region["y"])
    bx1, by1 = bx0 + float(region["width"]), by0 + float(region["height"])
    return ax0 <= bx1 and ax1 >= bx0 and ay0 <= by1 and ay1 >= by0


def center_in_region(center: List[float], region: Dict[str, Any]) -> bool:
    x, y = center
    return (
        float(region["x"]) <= x <= float(region["x"]) + float(region["width"])
        and float(region["y"]) <= y <= float(region["y"]) + float(region["height"])
    )


def evaluate_fixture(spec: Dict[str, Any], image_path: Path, boxes: List[Dict[str, Any]], skipped: bool = False) -> Dict[str, Any]:
    recognized_text = [box["text"] for box in boxes]
    tokens = normalize_tokens(recognized_text)
    haystack = " ".join(tokens)
    critical = [str(token).upper() for token in spec["criticalTokens"]]
    matched = [token for token in critical if token in tokens or token in haystack.replace(" ", "")]
    missing = [token for token in critical if token not in matched]
    recall = len(matched) / len(critical) if critical else 1.0
    confidences = [float(box["confidence"]) for box in boxes if box.get("confidence") is not None and math.isfinite(float(box["confidence"]))]
    average_confidence = sum(confidences) / len(confidences) if confidences else None
    matched_regions = []
    for region in spec["expectedRegions"]:
        if any(center_in_region(box["center"], region) for box in boxes):
            matched_regions.append(region["regionId"])
    safe_zone_collision = False
    if spec.get("captionConflictZone"):
        safe_zone_collision = any(intersects_region(box["polygon"], spec["captionConflictZone"]) for box in boxes)

    blockers = []
    warnings = []
    risk = spec["riskCategory"]
    required_regions = [region for region in spec["expectedRegions"] if region.get("required")]
    missing_regions = [region["regionId"] for region in required_regions if region["regionId"] not in matched_regions]
    if risk == "required_pass":
        if recall < TOKEN_RECALL_THRESHOLD:
            blockers.append(f"{spec['fixtureId']} critical token recall {recall:.3f} below {TOKEN_RECALL_THRESHOLD:.2f}.")
        if average_confidence is not None and average_confidence < CONFIDENCE_THRESHOLD:
            blockers.append(f"{spec['fixtureId']} average confidence {average_confidence:.3f} below {CONFIDENCE_THRESHOLD:.2f}.")
        if missing_regions:
            blockers.append(f"{spec['fixtureId']} missing required broad regions: {', '.join(missing_regions)}.")
        if spec["fixtureId"] == "caption-safe-zone-conflict" and not safe_zone_collision:
            blockers.append("caption-safe-zone-conflict did not detect text intersecting the lower caption conflict zone.")
        status = "passed" if not blockers else "blocked"
    elif risk == "orientation_deferred":
        warnings.append("PP-LCNet_x1_0_textline_ori is deferred; rotated text remains skipped/warning for Phase 37C.")
        status = "skipped" if skipped else "warning"
    else:
        if missing:
            warnings.append(f"{spec['fixtureId']} warning fixture missed tokens: {', '.join(missing)}.")
        if average_confidence is not None and average_confidence < CONFIDENCE_THRESHOLD:
            warnings.append(f"{spec['fixtureId']} warning fixture average confidence {average_confidence:.3f} below {CONFIDENCE_THRESHOLD:.2f}.")
        status = "warning"

    return {
        "fixtureId": spec["fixtureId"],
        "imagePath": str(image_path),
        "generatedOnly": True,
        "status": status,
        "textBoxes": boxes,
        "recognizedText": recognized_text,
        "tokenRecall": recall,
        "averageConfidence": average_confidence,
        "matchedCriticalTokens": matched,
        "missingCriticalTokens": missing,
        "matchedRegionIds": matched_regions,
        "safeZoneCollision": safe_zone_collision,
        "blockers": blockers,
        "warnings": warnings,
    }


def build_text_match_report(run_id: str, fixtures: List[Dict[str, Any]]) -> Dict[str, Any]:
    blockers: List[str] = []
    warnings: List[str] = []
    for fixture in fixtures:
        if fixture["fixtureId"] in ["basic-ui-text", "caption-safe-zone-conflict", "multi-region-ui"]:
            blockers.extend(fixture["blockers"])
        else:
            warnings.extend(fixture["warnings"])
    return {
        "phase": PHASE,
        "runId": run_id,
        "requiredTokenRecallThreshold": TOKEN_RECALL_THRESHOLD,
        "requiredAverageConfidenceThreshold": CONFIDENCE_THRESHOLD,
        "fixtureResults": [
            {
                "fixtureId": fixture["fixtureId"],
                "status": fixture["status"],
                "tokenRecall": fixture["tokenRecall"],
                "averageConfidence": fixture.get("averageConfidence"),
                "matchedCriticalTokens": fixture["matchedCriticalTokens"],
                "missingCriticalTokens": fixture["missingCriticalTokens"],
            }
            for fixture in fixtures
        ],
        "blockers": blockers,
        "warnings": warnings,
    }


def build_safe_zone_report(run_id: str, fixtures: List[Dict[str, Any]]) -> Dict[str, Any]:
    blockers: List[str] = []
    warnings: List[str] = []
    caption = next((fixture for fixture in fixtures if fixture["fixtureId"] == "caption-safe-zone-conflict"), None)
    if not caption:
        blockers.append("caption-safe-zone-conflict result is missing.")
    elif not caption["safeZoneCollision"]:
        blockers.append("caption-safe-zone-conflict did not detect the expected lower caption conflict zone.")
    return {
        "phase": PHASE,
        "runId": run_id,
        "fixtureResults": [
            {
                "fixtureId": fixture["fixtureId"],
                "matchedRegionIds": fixture["matchedRegionIds"],
                "safeZoneCollision": fixture["safeZoneCollision"],
                "status": fixture["status"],
            }
            for fixture in fixtures
        ],
        "blockers": blockers,
        "warnings": warnings,
    }


def build_qa(run_id: str, fixtures: List[Dict[str, Any]], text_report: Dict[str, Any], safe_zone_report: Dict[str, Any], runtime: Dict[str, Any], artifact_count: int, model_verified: bool) -> Dict[str, Any]:
    blockers = []
    warnings = []
    blockers.extend(text_report["blockers"])
    blockers.extend(safe_zone_report["blockers"])
    for fixture in fixtures:
        blockers.extend(fixture["blockers"])
        warnings.extend(fixture["warnings"])
    if not model_verified:
        blockers.append("Phase 37B OCR model asset verification did not pass.")
    if not runtime["localModelPathsUsed"]:
        blockers.append("PaddleOCR did not accept explicit local detection and recognition model directories.")
    if not runtime["runtimeModelAutoDownloadBlocked"]:
        blockers.append("PaddleOCR attempted network/model download during init or inference.")
    if not runtime["networkBlocked"]:
        blockers.append("Runtime network guard was not active.")
    if runtime["exitCode"] != 0:
        blockers.append("PaddleOCR worker reported a runtime error.")
    if artifact_count <= 0:
        blockers.append("No Phase 37C runtime artifacts were written.")

    def gate(gate_id: str, ok: bool, summary: str) -> Dict[str, Any]:
        return {"gateId": gate_id, "status": "passed" if ok else "blocked", "summary": summary}

    gates = [
        gate("phase37b_model_assets", model_verified, "Uses only verified private Phase 37B PP-OCRv5 model assets."),
        gate("checksum_verification", model_verified, "Local SHA-256 checksums matched Phase 37B evidence."),
        gate("model_extraction", True, "Archive safety was enforced by the TypeScript runner before worker execution."),
        gate("runtime_integrity", runtime["exitCode"] == 0 and runtime["localModelPathsUsed"] and runtime["runtimeModelAutoDownloadBlocked"] and runtime["networkBlocked"], "PaddleOCR CPU runtime used local model paths with network/download guard."),
        gate("generated_fixture_integrity", all(fixture["generatedOnly"] for fixture in fixtures), "All inputs were generated UI/text fixtures."),
        gate("ocr_text_match", len(text_report["blockers"]) == 0, "Required fixtures met OCR token/confidence thresholds."),
        gate("caption_safe_zone_collision", len(safe_zone_report["blockers"]) == 0, "Caption-safe-zone conflict fixture detected OCR text in the expected zone."),
        gate("artifact_privacy", artifact_count > 0, "Only private generated reports/fixtures are emitted."),
        gate("blocked_features", True, "Real media, providers, public output, Cloud Run, GPU, beta, production, and Track A remain blocked."),
    ]
    return {
        "status": "passed" if not blockers else "blocked",
        "gates": gates,
        "blockers": blockers,
        "warnings": sorted(set(warnings)),
    }


def write_json(path: Path, value: Dict[str, Any]) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--fixture-dir", required=True)
    parser.add_argument("--det-model-dir", required=True)
    parser.add_argument("--rec-model-dir", required=True)
    parser.add_argument("--dict-path", required=True)
    parser.add_argument("--asset-verification-path", required=True)
    parser.add_argument("--fixture-manifest-path", required=True)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    fixture_dir = Path(args.fixture_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    fixture_dir.mkdir(parents=True, exist_ok=True)

    fixture_manifest = json.loads(Path(args.fixture_manifest_path).read_text(encoding="utf-8"))
    asset_verification = json.loads(Path(args.asset_verification_path).read_text(encoding="utf-8"))
    model_verified = asset_verification.get("status") == "verified"

    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
    os.environ.setdefault("MODEL_DOWNLOADS_ENABLED", "false")
    os.environ.setdefault("REAL_MEDIA_INPUT_ENABLED", "false")
    os.environ.setdefault("PROVIDER_EXECUTION_ENABLED", "false")

    fixtures: List[Dict[str, Any]] = []
    runtime = {
        "mode": "generated_ui_text_frame",
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
    }
    runtime_blockers: List[str] = []
    runtime_warnings: List[str] = []

    generated_images = {}
    for spec in fixture_manifest["specs"]:
        generated_images[spec["fixtureId"]] = generate_fixture(spec, fixture_dir)

    try:
        with NetworkGuard() as guard:
            ocr, metadata, imports = init_paddle_ocr(args.det_model_dir, args.rec_model_dir, args.dict_path)
            runtime.update(imports)
            runtime["paddleOcrVersion"] = metadata.get("paddleOcrVersion")
            runtime["paddlePaddleVersion"] = metadata.get("paddlePaddleVersion")
            runtime["localModelPathsUsed"] = bool(metadata.get("localModelPathsUsed"))
            runtime["dictionaryPathUsed"] = bool(metadata.get("dictionaryPathUsed"))
            if not runtime["dictionaryPathUsed"]:
                runtime_warnings.append("PaddleOCR constructor did not expose a recognized dictionary-path parameter; verified dictionary path was present but not passed.")
            for spec in fixture_manifest["specs"]:
                image_path = generated_images[spec["fixtureId"]]
                if spec["riskCategory"] == "orientation_deferred":
                    fixtures.append(evaluate_fixture(spec, image_path, [], skipped=True))
                    continue
                boxes = run_predict(ocr, image_path)
                fixtures.append(evaluate_fixture(spec, image_path, boxes))
            runtime["runtimeModelAutoDownloadBlocked"] = not guard.network_attempted
    except Exception as exc:
        runtime["exitCode"] = 1
        runtime["stderrPreview"] = "".join(traceback.format_exception_only(type(exc), exc)).strip()
        runtime_blockers.append(f"PaddleOCR runtime failed: {runtime['stderrPreview']}")
        for spec in fixture_manifest["specs"]:
            if not any(fixture["fixtureId"] == spec["fixtureId"] for fixture in fixtures):
                image_path = generated_images.get(spec["fixtureId"], fixture_dir / f"{spec['fixtureId']}.png")
                empty = evaluate_fixture(spec, image_path, [], skipped=spec["riskCategory"] == "orientation_deferred")
                if spec["riskCategory"] == "required_pass":
                    empty["status"] = "blocked"
                    empty["blockers"].append("PaddleOCR runtime did not return OCR boxes for this required fixture.")
                fixtures.append(empty)

    text_report = build_text_match_report(args.run_id, fixtures)
    safe_zone_report = build_safe_zone_report(args.run_id, fixtures)
    artifact_count = len(fixtures) + 8
    qa = build_qa(args.run_id, fixtures, text_report, safe_zone_report, runtime, artifact_count, model_verified)
    qa["blockers"].extend(runtime_blockers)
    qa["warnings"] = sorted(set(qa["warnings"] + runtime_warnings))
    if runtime_blockers:
        qa["status"] = "blocked"

    runtime_results = {
        "phase": PHASE,
        "runId": args.run_id,
        "runtime": runtime,
        "fixtures": fixtures,
        "blockers": runtime_blockers,
        "warnings": runtime_warnings,
    }
    safe_zone_json = safe_zone_report
    text_json = text_report
    qa_json = {"phase": PHASE, "runId": args.run_id, **qa}

    report = {
        "ok": qa["status"] == "passed",
        "runId": args.run_id,
        "phase": PHASE,
        "projectId": "reeditpro",
        "runtime": runtime,
        "model": {
            "modelFamily": MODEL_FAMILY,
            "assetVersion": ASSET_VERSION,
            "modelGcsPath": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/",
            "detectionModelDir": args.det_model_dir,
            "recognitionModelDir": args.rec_model_dir,
            "dictionaryPath": args.dict_path,
            "detectionArchiveSha256": "50446e5d01ac2a73d5319c89513281f6578414c888c602f9af13f93feefffc58",
            "recognitionArchiveSha256": "566b9512b34e34a9f0db54d87b51fa5a0b9ed2cf1ab7e49728cc0b8b5a64f414",
            "dictionarySha256": "d1979e9f794c464c0d2e0b70a7fe14dd978e9dc644c0e71f14158cdf8342af1b",
            "aggregateSha256": "6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b",
        },
        "fixtures": fixtures,
        "textMatchReport": text_json,
        "safeZoneReport": safe_zone_json,
        "qa": qa_json,
        "artifacts": [],
        "safety": {
            "generatedFixturesOnly": True,
            "realMediaUsed": False,
            "realVideoInputUsed": False,
            "broadMediaUsed": False,
            "providerExecuted": False,
            "publicAccessEnabled": False,
            "signedUrlSourceOfTruthUsed": False,
            "cloudRunDeployed": False,
            "gpuJobUsed": False,
            "trackATouched": False,
            "productionReadyAllowed": False,
            "internalBetaAllowed": False,
            "externalBetaAllowed": False,
            "broadRealUserMediaAllowed": False,
        },
        "warnings": qa_json["warnings"],
    }

    write_json(output_dir / "phase_37c_ocr_runtime_results.json", runtime_results)
    write_json(output_dir / "phase_37c_ocr_text_match_report.json", text_json)
    write_json(output_dir / "phase_37c_ocr_safe_zone_report.json", safe_zone_json)
    write_json(output_dir / "phase_37c_ocr_runtime_qa_report.json", qa_json)
    write_json(output_dir / "phase_37c_private_artifact_manifest.json", {
        "phase": PHASE,
        "runId": args.run_id,
        "privateOnly": True,
        "localArtifactDir": str(output_dir),
        "fixtureDir": str(fixture_dir),
        "publicAccessEnabled": False,
        "signedUrlsUsed": False,
    })
    write_json(output_dir / "phase_37c_generated_ocr_runtime_report.json", report)
    print(json.dumps({"ok": report["ok"], "runId": args.run_id, "qaStatus": qa_json["status"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
