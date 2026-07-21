#!/usr/bin/env python3
"""Run one reviewed local PaddleOCR frame without emitting recognized text."""

import contextlib
import io
import json
import math
import os
import sys

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

from PIL import Image  # noqa: E402
from paddleocr import PaddleOCR  # noqa: E402


def fail(message: str) -> None:
    raise RuntimeError(message)


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def normalized_bounds(box, width: int, height: int) -> dict:
    if isinstance(box, list) and len(box) == 4 and all(isinstance(value, (int, float)) for value in box):
        left, top, right, bottom = box
    elif isinstance(box, list) and len(box) >= 4:
        xs = [point[0] for point in box if isinstance(point, list) and len(point) >= 2]
        ys = [point[1] for point in box if isinstance(point, list) and len(point) >= 2]
        if not xs or not ys:
            fail("PaddleOCR returned an invalid text-region polygon.")
        left, top, right, bottom = min(xs), min(ys), max(xs), max(ys)
    else:
        fail("PaddleOCR returned an invalid text-region box.")
    x = clamp(float(left) / width)
    y = clamp(float(top) / height)
    region_width = clamp(float(right - left) / width)
    region_height = clamp(float(bottom - top) / height)
    if region_width <= 0 or region_height <= 0:
        fail("PaddleOCR returned an empty text-region box.")
    return {
        "x": round(x, 6),
        "y": round(y, 6),
        "width": round(min(region_width, 1.0 - x), 6),
        "height": round(min(region_height, 1.0 - y), 6),
    }


def main() -> None:
    if len(sys.argv) < 5 or len(sys.argv) > 28:
        fail("Expected detection model, recognition model, max-region count, and one to 24 frame paths.")
    detection_model_path, recognition_model_path, max_regions_raw = sys.argv[1:4]
    frame_paths = sys.argv[4:]
    max_regions = int(max_regions_raw)
    if max_regions < 1 or max_regions > 16:
        fail("PaddleOCR max-region count is outside the reviewed bound.")

    # Paddle/PaddleX may print model initialization and recognized payloads.
    # Capture and discard both streams so raw OCR text never reaches durable logs.
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    with contextlib.redirect_stdout(captured_stdout), contextlib.redirect_stderr(captured_stderr):
        ocr = PaddleOCR(
            text_detection_model_name="PP-OCRv5_mobile_det",
            text_detection_model_dir=detection_model_path,
            text_recognition_model_name="en_PP-OCRv5_mobile_rec",
            text_recognition_model_dir=recognition_model_path,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            device="cpu",
        )
        frames = []
        for frame_index, frame_path in enumerate(frame_paths):
            with Image.open(frame_path) as image:
                width, height = image.size
            if width < 1 or height < 1 or width > 16384 or height > 16384:
                fail("PaddleOCR frame dimensions are outside the reviewed bound.")
            predictions = list(ocr.predict(frame_path))
            regions = []
            for prediction in predictions:
                payload = prediction.json.get("res", {})
                texts = payload.get("rec_texts", [])
                scores = payload.get("rec_scores", [])
                boxes = payload.get("rec_boxes", payload.get("rec_polys", []))
                if not (isinstance(texts, list) and isinstance(scores, list) and isinstance(boxes, list)):
                    fail("PaddleOCR returned an unsupported result payload.")
                for index, text in enumerate(texts):
                    if index >= len(scores) or index >= len(boxes) or not isinstance(text, str):
                        fail("PaddleOCR result arrays are inconsistent.")
                    stripped = text.strip()
                    score = float(scores[index])
                    if not stripped or not math.isfinite(score):
                        continue
                    regions.append({
                        "normalizedBounds": normalized_bounds(boxes[index], width, height),
                        "lineCount": max(1, min(8, stripped.count("\n") + 1)),
                        "estimatedCharacterCount": max(1, min(500, len(stripped))),
                        "confidence": round(clamp(score), 6),
                        "exactTextPersisted": False,
                    })
            regions.sort(key=lambda item: (
                item["normalizedBounds"]["y"],
                item["normalizedBounds"]["x"],
                -item["confidence"],
            ))
            frames.append({
                "frameIndex": frame_index,
                "frameWidth": width,
                "frameHeight": height,
                "regions": regions[:max_regions],
            })

    output = {
        "schemaVersion": "reeditpro-reviewed-local-paddleocr-frame-batch-v1",
        "frames": frames,
        "rawOcrOutputPersisted": False,
        "recognizedTextPersisted": False,
        "externalUrlFetched": False,
        "providerCallMade": False,
    }
    print(json.dumps(output, separators=(",", ":")))


if __name__ == "__main__":
    main()
