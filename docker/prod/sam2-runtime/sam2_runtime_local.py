import argparse
import json
import os
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw
from sam2.build_sam import build_sam2_video_predictor


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--checkpoint-path", required=True)
    parser.add_argument("--output-json", required=True)
    args = parser.parse_args()

    if os.environ.get("MODEL_DOWNLOADS_ENABLED") != "false":
        raise RuntimeError("MODEL_DOWNLOADS_ENABLED=false is required.")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED") != "false":
        raise RuntimeError("PROVIDER_EXECUTION_ENABLED=false is required.")
    if os.environ.get("REAL_MEDIA_INPUT_ENABLED") != "false":
        raise RuntimeError("REAL_MEDIA_INPUT_ENABLED=false is required.")

    work_dir = Path(args.work_dir)
    png_dir = work_dir / "frames_png"
    jpg_dir = work_dir / "frames_jpg"
    mask_dir = work_dir / "masks"
    overlay_dir = work_dir / "overlays"
    for directory in [png_dir, jpg_dir, mask_dir, overlay_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    frame_paths, jpeg_paths = create_fixture_frames(png_dir, jpg_dir)
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for Phase 35C SAM2 runtime verification.")
    device_name = torch.cuda.get_device_name(0)
    if "L4" not in device_name.upper():
        raise RuntimeError(f"NVIDIA L4 is required for Phase 35C; got {device_name}.")

    checkpoint_path = Path(args.checkpoint_path)
    if not checkpoint_path.exists():
        raise RuntimeError(f"Missing private checkpoint path: {checkpoint_path}")

    predictor = build_sam2_video_predictor(
        "configs/sam2.1/sam2.1_hiera_t.yaml",
        str(checkpoint_path),
        device="cuda",
    )
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        state = predictor.init_state(video_path=str(jpg_dir))
        box = np.array([168, 176, 336, 344], dtype=np.float32)
        predictor.add_new_points_or_box(
            inference_state=state,
            frame_idx=0,
            obj_id=1,
            box=box,
        )
        segments = {}
        for out_frame_idx, out_obj_ids, out_mask_logits in predictor.propagate_in_video(state):
            if 1 not in out_obj_ids:
                raise RuntimeError(f"Object id 1 missing from propagated frame {out_frame_idx}.")
            obj_index = list(out_obj_ids).index(1)
            segments[int(out_frame_idx)] = (out_mask_logits[obj_index] > 0.0).detach().cpu().numpy()

    mask_paths = []
    overlay_paths = []
    per_frame = []
    for frame_index in range(5):
        if frame_index not in segments:
            raise RuntimeError(f"Missing SAM2 mask for generated frame {frame_index}.")
        mask = np.squeeze(segments[frame_index]).astype(np.uint8) * 255
        mask_image = Image.fromarray(mask, mode="L")
        mask_path = mask_dir / f"frame-{frame_index:03d}-mask.png"
        mask_image.save(mask_path)
        overlay_path = overlay_dir / f"frame-{frame_index:03d}-overlay.png"
        write_overlay(Image.open(frame_paths[frame_index]).convert("RGBA"), mask_image, overlay_path)
        mask_paths.append(str(mask_path))
        overlay_paths.append(str(overlay_path))
        nonzero = np.argwhere(mask > 0)
        non_zero_ratio = float(nonzero.shape[0]) / float(mask.shape[0] * mask.shape[1])
        if nonzero.size:
            centroid_y, centroid_x = nonzero.mean(axis=0)
            per_frame.append({
                "frameIndex": frame_index,
                "nonZeroRatio": non_zero_ratio,
                "centroidX": float(centroid_x),
                "centroidY": float(centroid_y),
            })
        else:
            per_frame.append({
                "frameIndex": frame_index,
                "nonZeroRatio": non_zero_ratio,
            })

    output = {
        "ok": True,
        "cudaAvailable": True,
        "deviceName": device_name,
        "fixture": {
            "width": 512,
            "height": 512,
            "frameCount": 5,
            "framePaths": [str(path) for path in frame_paths],
            "jpegFramePaths": [str(path) for path in jpeg_paths],
        },
        "prompt": {
            "type": "box",
            "box": [168, 176, 336, 344],
            "frameIndex": 0,
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
            "realMediaUsed": False,
        },
        "warnings": ["Generated synthetic fixture only; real-video temporal QA is not claimed."],
    }
    Path(args.output_json).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


def create_fixture_frames(png_dir: Path, jpg_dir: Path):
    frame_paths = []
    jpeg_paths = []
    for index in range(5):
        image = Image.new("RGB", (512, 512), (236, 241, 244))
        draw = ImageDraw.Draw(image)
        for x in range(0, 512, 64):
            draw.line([(x, 0), (x, 512)], fill=(218, 224, 229), width=1)
        for y in range(0, 512, 64):
            draw.line([(0, y), (512, y)], fill=(218, 224, 229), width=1)
        offset = index * 18
        box = [168 + offset, 176 + index * 6, 336 + offset, 344 + index * 6]
        draw.rounded_rectangle(box, radius=34, fill=(43, 107, 181), outline=(18, 62, 118), width=5)
        draw.ellipse([box[0] + 48, box[1] + 42, box[0] + 120, box[1] + 114], fill=(82, 177, 132))
        png_path = png_dir / f"frame-{index:03d}.png"
        jpg_path = jpg_dir / f"{index}.jpg"
        image.save(png_path)
        image.save(jpg_path, quality=95)
        frame_paths.append(png_path)
        jpeg_paths.append(jpg_path)
    return frame_paths, jpeg_paths


def write_overlay(frame: Image.Image, mask: Image.Image, output_path: Path):
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    red = Image.new("RGBA", frame.size, (255, 74, 74, 110))
    overlay = Image.composite(red, overlay, mask)
    Image.alpha_composite(frame, overlay).save(output_path)


if __name__ == "__main__":
    main()
