#!/usr/bin/env python3
import argparse
import json
import os
import socket
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image


def block_network():
    original_socket = socket.socket

    class BlockedSocket(original_socket):
        def connect(self, address):
            raise RuntimeError(f"Network access is blocked in Phase 38D FILM runtime: {address}")

        def connect_ex(self, address):
            raise RuntimeError(f"Network access is blocked in Phase 38D FILM runtime: {address}")

    socket.socket = BlockedSocket


def image_to_tensor(path):
    image = Image.open(path).convert("RGB")
    array = np.asarray(image).astype(np.float32) / 255.0
    return array[np.newaxis, ...]


def save_image(array, destination):
    clipped = np.clip(array, 0.0, 1.0)
    image = Image.fromarray((clipped * 255.0).astype(np.uint8))
    image.save(destination)


def call_model(model, frame_a, frame_b, time_value):
    dt = np.array([time_value], dtype=np.float32)
    inputs = {"x0": frame_a, "x1": frame_b, "time": dt[..., np.newaxis]}
    try:
        result = model(inputs, training=False)
    except TypeError:
        result = model(inputs)
    if "image" not in result:
        raise RuntimeError(f"FILM SavedModel output did not include image; keys={list(result.keys())}")
    return result["image"].numpy()[0]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--time", type=float, default=0.5)
    args = parser.parse_args()

    if os.environ.get("MODEL_DOWNLOADS_ENABLED", "false") != "false":
        raise RuntimeError("MODEL_DOWNLOADS_ENABLED must be false.")
    if os.environ.get("FULL_VIDEO_INTERPOLATION_ENABLED", "false") != "false":
        raise RuntimeError("FULL_VIDEO_INTERPOLATION_ENABLED must be false.")
    if os.environ.get("AUDIO_STRETCH_ENABLED", "false") != "false":
        raise RuntimeError("AUDIO_STRETCH_ENABLED must be false.")
    if os.environ.get("FINAL_DELIVERY_ENABLED", "false") != "false":
        raise RuntimeError("FINAL_DELIVERY_ENABLED must be false.")

    block_network()
    work_dir = Path(args.work_dir)
    frames_dir = Path(args.frames_dir)
    interpolated_dir = work_dir / "interpolated"
    preview_dir = work_dir / "preview-frames"
    interpolated_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    frame_paths = sorted(frames_dir.glob("frame-*.png"))
    if len(frame_paths) < 2:
        raise RuntimeError("At least two source frames are required for FILM interpolation.")
    if len(frame_paths) > 12:
        raise RuntimeError(f"Too many source frames for Phase 38D: {len(frame_paths)}")

    first_image = Image.open(frame_paths[0]).convert("RGB")
    width, height = first_image.size
    if width > 512 or height > 288:
        raise RuntimeError(f"Frame dimensions exceed Phase 38D bounds: {width}x{height}")

    model_path = Path(args.model_path)
    if not (model_path / "saved_model.pb").exists():
        raise RuntimeError(f"FILM saved_model.pb is missing from {model_path}")
    model = tf.compat.v2.saved_model.load(str(model_path))

    interpolated_paths = []
    preview_paths = []
    previous_diffs = []
    next_diffs = []
    stddevs = []
    preview_index = 0

    for pair_index in range(len(frame_paths) - 1):
        frame_a = image_to_tensor(frame_paths[pair_index])
        frame_b = image_to_tensor(frame_paths[pair_index + 1])
        if pair_index == 0:
            preview_source_path = preview_dir / f"frame-{preview_index:03d}-preview.png"
            Image.open(frame_paths[pair_index]).convert("RGB").save(preview_source_path)
            preview_paths.append(str(preview_source_path))
            preview_index += 1

        interpolated = call_model(model, frame_a, frame_b, args.time)
        interpolated_path = interpolated_dir / f"interpolated-frame-{pair_index:03d}.png"
        save_image(interpolated, interpolated_path)
        interpolated_paths.append(str(interpolated_path))

        midpoint_preview_path = preview_dir / f"frame-{preview_index:03d}-preview.png"
        save_image(interpolated, midpoint_preview_path)
        preview_paths.append(str(midpoint_preview_path))
        preview_index += 1

        next_source_path = preview_dir / f"frame-{preview_index:03d}-preview.png"
        Image.open(frame_paths[pair_index + 1]).convert("RGB").save(next_source_path)
        preview_paths.append(str(next_source_path))
        preview_index += 1

        previous_diffs.append(float(np.mean(np.abs(interpolated - frame_a[0]))))
        next_diffs.append(float(np.mean(np.abs(interpolated - frame_b[0]))))
        stddevs.append(float(np.std(interpolated)))

    if len(preview_paths) > 24:
        raise RuntimeError(f"Too many preview frames for Phase 38D: {len(preview_paths)}")

    output = {
        "ok": True,
        "tensorflowVersion": tf.__version__,
        "modelLoaded": True,
        "networkBlocked": True,
        "sourceFrames": {
            "width": width,
            "height": height,
            "frameCount": len(frame_paths),
            "framePaths": [str(path) for path in frame_paths],
            "interpolationTime": args.time,
        },
        "interpolation": {
            "interpolatedFramePaths": interpolated_paths,
            "previewFramePaths": preview_paths,
            "metrics": {
                "meanMidpointDiffFromPreviousSource": float(np.mean(previous_diffs)),
                "meanMidpointDiffFromNextSource": float(np.mean(next_diffs)),
                "meanOutputStddev": float(np.mean(stddevs)),
            },
        },
        "runtime": {
            "externalModelDownloadAttempted": False,
            "fullVideoInterpolationExecuted": False,
            "audioStretchExecuted": False,
            "finalDeliveryCreated": False,
        },
        "warnings": ["Selected real-video segment only; no full-video interpolation or audio stretch executed."],
    }
    Path(args.output_json).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
