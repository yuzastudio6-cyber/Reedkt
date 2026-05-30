#!/usr/bin/env python3
import argparse
import json
import os
import socket
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw


def block_network():
    original_socket = socket.socket

    class BlockedSocket(original_socket):
        def connect(self, address):
            raise RuntimeError(f"Network access is blocked in Phase 38C FILM runtime: {address}")

        def connect_ex(self, address):
            raise RuntimeError(f"Network access is blocked in Phase 38C FILM runtime: {address}")

    socket.socket = BlockedSocket


def make_frame(width, height, x_offset):
    image = Image.new("RGB", (width, height), (26, 30, 36))
    draw = ImageDraw.Draw(image)
    for y in range(0, height, 16):
        color = 38 + (y // 16) % 3 * 8
        draw.line((0, y, width, y), fill=(color, color + 4, color + 10))
    for x in range(0, width, 16):
        color = 34 + (x // 16) % 3 * 7
        draw.line((x, 0, x, height), fill=(color, color + 3, color + 8))
    subject_left = int(width * 0.24) + x_offset
    subject_top = int(height * 0.32)
    subject_right = subject_left + int(width * 0.24)
    subject_bottom = subject_top + int(height * 0.26)
    draw.rounded_rectangle((subject_left, subject_top, subject_right, subject_bottom), radius=10, fill=(235, 82, 68), outline=(255, 224, 140), width=3)
    draw.ellipse((subject_right - 22, subject_top + 18, subject_right + 18, subject_top + 58), fill=(62, 178, 255), outline=(245, 245, 245), width=2)
    return image


def image_to_tensor(image):
    array = np.asarray(image).astype(np.float32) / 255.0
    return array[np.newaxis, ...]


def save_image(array, destination):
    clipped = np.clip(array, 0.0, 1.0)
    image = Image.fromarray((clipped * 255.0).astype(np.uint8))
    image.save(destination)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--width", type=int, default=256)
    parser.add_argument("--height", type=int, default=256)
    parser.add_argument("--time", type=float, default=0.5)
    args = parser.parse_args()

    if os.environ.get("MODEL_DOWNLOADS_ENABLED", "false") != "false":
        raise RuntimeError("MODEL_DOWNLOADS_ENABLED must be false.")
    if os.environ.get("REAL_MEDIA_INPUT_ENABLED", "false") != "false":
        raise RuntimeError("REAL_MEDIA_INPUT_ENABLED must be false.")

    block_network()
    work_dir = Path(args.work_dir)
    fixture_dir = work_dir / "fixture"
    interpolated_dir = work_dir / "interpolated"
    fixture_dir.mkdir(parents=True, exist_ok=True)
    interpolated_dir.mkdir(parents=True, exist_ok=True)

    frame_a = make_frame(args.width, args.height, -28)
    frame_b = make_frame(args.width, args.height, 28)
    frame_a_path = fixture_dir / "frame-a.png"
    frame_b_path = fixture_dir / "frame-b.png"
    frame_a.save(frame_a_path)
    frame_b.save(frame_b_path)

    model_path = Path(args.model_path)
    if not (model_path / "saved_model.pb").exists():
        raise RuntimeError(f"FILM saved_model.pb is missing from {model_path}")
    model = tf.compat.v2.saved_model.load(str(model_path))
    x0 = image_to_tensor(frame_a)
    x1 = image_to_tensor(frame_b)
    dt = np.array([args.time], dtype=np.float32)
    inputs = {"x0": x0, "x1": x1, "time": dt[..., np.newaxis]}
    try:
        result = model(inputs, training=False)
    except TypeError:
        result = model(inputs)
    if "image" not in result:
        raise RuntimeError(f"FILM SavedModel output did not include image; keys={list(result.keys())}")
    image = result["image"].numpy()[0]
    interpolated_path = interpolated_dir / "interpolated-frame-000.png"
    save_image(image, interpolated_path)

    frame_a_array = x0[0]
    frame_b_array = x1[0]
    metrics = {
        "meanAbsoluteDiffFromFrameA": float(np.mean(np.abs(image - frame_a_array))),
        "meanAbsoluteDiffFromFrameB": float(np.mean(np.abs(image - frame_b_array))),
        "outputStddev": float(np.std(image)),
    }
    output = {
        "ok": True,
        "tensorflowVersion": tf.__version__,
        "modelLoaded": True,
        "networkBlocked": True,
        "fixture": {
            "width": args.width,
            "height": args.height,
            "frameCount": 2,
            "framePaths": [str(frame_a_path), str(frame_b_path)],
            "interpolationTime": args.time,
        },
        "interpolation": {
            "interpolatedFramePaths": [str(interpolated_path)],
            "metrics": metrics,
        },
        "runtime": {
            "externalModelDownloadAttempted": False,
            "realMediaUsed": False,
            "fullVideoInterpolationExecuted": False,
            "slowMotionExecuted": False,
        },
        "warnings": ["Generated synthetic frames only; no real-video slow-motion QA yet."],
    }
    Path(args.output_json).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
