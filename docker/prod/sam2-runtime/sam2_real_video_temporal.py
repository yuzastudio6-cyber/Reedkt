import argparse
import json
import os
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from sam2.build_sam import build_sam2_video_predictor


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--anchor-mask-path", required=True)
    parser.add_argument("--checkpoint-path", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--prompt-frame-index", type=int, required=True)
    args = parser.parse_args()

    require_env("MODEL_DOWNLOADS_ENABLED", "false")
    require_env("PROVIDER_EXECUTION_ENABLED", "false")
    require_env("REAL_MEDIA_INPUT_SCOPE", "approved_phase35d_short_segment_only")
    require_env("FULL_VIDEO_MASK_ENABLED", "false")
    require_env("TEXT_BEHIND_SUBJECT_VIDEO_ENABLED", "false")

    work_dir = Path(args.work_dir)
    frames_dir = Path(args.frames_dir)
    jpg_dir = work_dir / "frames_jpg"
    mask_dir = work_dir / "real_video_masks"
    overlay_dir = work_dir / "real_video_overlays"
    for directory in [jpg_dir, mask_dir, overlay_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    frame_paths = sorted(frames_dir.glob("frame-*.png"))
    if len(frame_paths) != 10:
        raise RuntimeError(f"Phase 35D requires exactly 10 extracted frames; found {len(frame_paths)}.")
    jpeg_paths = convert_frames_for_sam2(frame_paths, jpg_dir)
    first_frame = Image.open(frame_paths[0]).convert("RGB")
    frame_width, frame_height = first_frame.size
    if (frame_width, frame_height) != (768, 432):
        raise RuntimeError(f"Phase 35D requires 768x432 extracted frames; got {frame_width}x{frame_height}.")

    anchor_mask = Image.open(args.anchor_mask_path).convert("L")
    source_box = derive_bbox(anchor_mask)
    scaled_box = scale_box(source_box, anchor_mask.size, (frame_width, frame_height))
    if args.prompt_frame_index < 0 or args.prompt_frame_index >= len(frame_paths):
        raise RuntimeError("Prompt frame index is outside the extracted frame sequence.")

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for Phase 35D SAM2 runtime verification.")
    device_name = torch.cuda.get_device_name(0)
    if "L4" not in device_name.upper():
        raise RuntimeError(f"NVIDIA L4 is required for Phase 35D; got {device_name}.")

    checkpoint_path = Path(args.checkpoint_path)
    if not checkpoint_path.exists():
        raise RuntimeError(f"Missing private checkpoint path: {checkpoint_path}")

    predictor = build_sam2_video_predictor(
        "configs/sam2.1/sam2.1_hiera_t.yaml",
        str(checkpoint_path),
        device="cuda",
    )
    segments = {}
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        state = predictor.init_state(video_path=str(jpg_dir))
        predictor.add_new_points_or_box(
            inference_state=state,
            frame_idx=args.prompt_frame_index,
            obj_id=1,
            box=np.array(scaled_box, dtype=np.float32),
        )
        collect_segments(predictor.propagate_in_video(state, start_frame_idx=args.prompt_frame_index), segments)
        try:
            collect_segments(predictor.propagate_in_video(state, start_frame_idx=args.prompt_frame_index, reverse=True), segments)
        except TypeError:
            # Older SAM2 builds may not expose reverse propagation. Treat missing frames as a hard failure below.
            pass

    mask_paths = []
    overlay_paths = []
    per_frame = []
    for frame_index, frame_path in enumerate(frame_paths):
        if frame_index not in segments:
            raise RuntimeError(f"Missing SAM2 mask for extracted frame {frame_index}.")
        mask = np.squeeze(segments[frame_index]).astype(np.uint8) * 255
        mask_image = Image.fromarray(mask, mode="L")
        mask_path = mask_dir / f"frame-{frame_index:03d}-mask.png"
        mask_image.save(mask_path)
        overlay_path = overlay_dir / f"frame-{frame_index:03d}-overlay.png"
        write_overlay(Image.open(frame_path).convert("RGBA"), mask_image, overlay_path)
        mask_paths.append(str(mask_path))
        overlay_paths.append(str(overlay_path))
        per_frame.append(mask_stats(frame_index, mask))

    output = {
        "ok": True,
        "cudaAvailable": True,
        "deviceName": device_name,
        "source": {
            "frameDirectory": str(frames_dir),
            "frameCount": len(frame_paths),
            "width": frame_width,
            "height": frame_height,
        },
        "prompt": {
            "source": "phase33d_mask_bbox",
            "type": "box",
            "promptFrameIndex": args.prompt_frame_index,
            "anchorMaskDimensions": {"width": anchor_mask.size[0], "height": anchor_mask.size[1]},
            "frameDimensions": {"width": frame_width, "height": frame_height},
            "sourceBoundingBox": source_box,
            "scaledBoundingBox": scaled_box,
            "objectId": 1,
        },
        "masks": {
            "maskPaths": mask_paths,
            "overlayPaths": overlay_paths,
            "perFrame": per_frame,
        },
        "runtime": {
            "modelId": "sam2.1_hiera_tiny",
            "configName": "configs/sam2.1/sam2.1_hiera_t.yaml",
            "externalModelDownloadAttempted": False,
            "realMediaUsed": True,
            "fullVideoProcessed": False,
        },
        "warnings": [
            "One controlled short real-video segment only; full-video temporal QA is not claimed.",
            "Human visual review is required before any broader mask or text-behind-subject scope.",
        ],
    }
    Path(args.output_json).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


def require_env(name, expected):
    actual = os.environ.get(name)
    if actual != expected:
        raise RuntimeError(f"{name}={expected} is required; got {actual!r}.")


def convert_frames_for_sam2(frame_paths, jpg_dir):
    jpeg_paths = []
    for index, frame_path in enumerate(frame_paths):
        image = Image.open(frame_path).convert("RGB")
        jpeg_path = jpg_dir / f"{index}.jpg"
        image.save(jpeg_path, quality=95)
        jpeg_paths.append(jpeg_path)
    return jpeg_paths


def derive_bbox(mask_image):
    mask = np.array(mask_image)
    pixels = np.argwhere(mask > 10)
    if pixels.size == 0:
        raise RuntimeError("Phase 33D mask is empty; cannot derive a SAM2 prompt.")
    y_min, x_min = pixels.min(axis=0)
    y_max, x_max = pixels.max(axis=0)
    width = x_max - x_min + 1
    height = y_max - y_min + 1
    pad_x = max(4, int(width * 0.04))
    pad_y = max(4, int(height * 0.04))
    x_min = max(0, int(x_min) - pad_x)
    y_min = max(0, int(y_min) - pad_y)
    x_max = min(mask.shape[1] - 1, int(x_max) + pad_x)
    y_max = min(mask.shape[0] - 1, int(y_max) + pad_y)
    return [x_min, y_min, x_max, y_max]


def scale_box(box, source_size, target_size):
    source_width, source_height = source_size
    target_width, target_height = target_size
    scale_x = target_width / float(source_width)
    scale_y = target_height / float(source_height)
    scaled = [
        int(round(box[0] * scale_x)),
        int(round(box[1] * scale_y)),
        int(round(box[2] * scale_x)),
        int(round(box[3] * scale_y)),
    ]
    scaled[0] = max(0, min(target_width - 2, scaled[0]))
    scaled[1] = max(0, min(target_height - 2, scaled[1]))
    scaled[2] = max(scaled[0] + 1, min(target_width - 1, scaled[2]))
    scaled[3] = max(scaled[1] + 1, min(target_height - 1, scaled[3]))
    return scaled


def collect_segments(iterator, segments):
    for out_frame_idx, out_obj_ids, out_mask_logits in iterator:
        if 1 not in out_obj_ids:
            raise RuntimeError(f"Object id 1 missing from propagated frame {out_frame_idx}.")
        obj_index = list(out_obj_ids).index(1)
        segments[int(out_frame_idx)] = (out_mask_logits[obj_index] > 0.0).detach().cpu().numpy()


def mask_stats(frame_index, mask):
    nonzero = np.argwhere(mask > 0)
    non_zero_ratio = float(nonzero.shape[0]) / float(mask.shape[0] * mask.shape[1])
    if nonzero.size:
        centroid_y, centroid_x = nonzero.mean(axis=0)
        return {
            "frameIndex": frame_index,
            "nonZeroRatio": non_zero_ratio,
            "centroidX": float(centroid_x),
            "centroidY": float(centroid_y),
        }
    return {
        "frameIndex": frame_index,
        "nonZeroRatio": non_zero_ratio,
    }


def write_overlay(frame, mask, output_path):
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    tint = Image.new("RGBA", frame.size, (22, 125, 255, 120))
    overlay = Image.composite(tint, overlay, mask)
    Image.alpha_composite(frame, overlay).save(output_path)


if __name__ == "__main__":
    main()
