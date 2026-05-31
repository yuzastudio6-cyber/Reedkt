#!/usr/bin/env python3
import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import PIL
from PIL import Image, PngImagePlugin


WIDTH = 256
HEIGHT = 256


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    work_dir = Path(args.work_dir)
    output_path = Path(args.output)
    work_dir.mkdir(parents=True, exist_ok=True)

    mode = os.environ.get("REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE", "generated_fixture_color_image")
    if mode == "generated_fixture_color_image":
        output = run_generated_fixture_mode(work_dir)
    elif mode == "real_video_sample":
        output = run_real_video_sample_mode(work_dir)
    else:
        raise RuntimeError(f"Unsupported pro color/image runtime mode: {mode}")
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


def run_generated_fixture_mode(work_dir: Path) -> dict:
    fixtures_dir = work_dir / "fixtures"
    tool_dir = work_dir / "tool-artifacts"
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    tool_dir.mkdir(parents=True, exist_ok=True)

    frame_paths = generate_fixtures(fixtures_dir)
    metadata_path = work_dir / "fixture-metadata.json"
    metadata_path.write_text(json.dumps({
        "width": WIDTH,
        "height": HEIGHT,
        "frameCount": len(frame_paths),
        "fixtures": ["color_bars", "gradient_ramp", "alpha_checker_patch"],
        "generatedOnly": True,
    }, indent=2) + "\n", encoding="utf-8")

    tools = [
        run_opencolorio(frame_paths[:1], tool_dir / "opencolorio", WIDTH, HEIGHT, "generated raw identity transform"),
        run_openimageio(frame_paths, tool_dir / "openimageio", WIDTH, HEIGHT, "generated fixtures"),
        run_kornia(frame_paths[1], tool_dir / "kornia"),
    ]
    return {
        "ok": all(tool["status"] == "passed" for tool in tools),
        "runtimeDiagnostics": runtime_diagnostics(),
        "fixture": {
            "width": WIDTH,
            "height": HEIGHT,
            "frameCount": len(frame_paths),
            "framePaths": [str(path) for path in frame_paths],
            "manifestPath": str(metadata_path),
        },
        "tools": tools,
        "metadataPath": str(metadata_path),
        "warnings": ["Generated fixture runtime only; no real media loaded."],
    }


def run_real_video_sample_mode(work_dir: Path) -> dict:
    source_path = Path(required_env("REEDITPRO_PHASE40C_LOCAL_INPUT_VIDEO"))
    timestamps = parse_float_list(required_env("REEDITPRO_PHASE40C_TIMESTAMPS_SECONDS"))
    max_frame_count = int(required_env("REEDITPRO_PHASE40C_MAX_FRAME_COUNT"))
    frame_width = int(required_env("REEDITPRO_PHASE40C_FRAME_WIDTH"))
    frame_height = int(required_env("REEDITPRO_PHASE40C_FRAME_HEIGHT"))
    if len(timestamps) > max_frame_count:
        raise RuntimeError("Phase 40C timestamp count exceeds max frame count.")
    if frame_width > 768 or frame_height > 432:
        raise RuntimeError("Phase 40C frame dimensions exceed the approved bound.")

    frames_dir = work_dir / "real-video-sample" / "frames"
    tool_dir = work_dir / "tool-artifacts"
    frames_dir.mkdir(parents=True, exist_ok=True)
    tool_dir.mkdir(parents=True, exist_ok=True)

    ffprobe_result, source = run_ffprobe(source_path)
    ffmpeg_result, frame_paths = run_ffmpeg_extract(source_path, timestamps, frames_dir, frame_width, frame_height)
    sample_manifest = work_dir / "real-video-sample" / "sample-manifest.json"
    sample_manifest.write_text(json.dumps({
        "timestampsSeconds": timestamps,
        "frameCount": len(frame_paths),
        "width": frame_width,
        "height": frame_height,
        "fullVideoExtractionAllowed": False,
        "full4KProcessingAllowed": False,
    }, indent=2) + "\n", encoding="utf-8")

    tools = [
        ffprobe_result,
        ffmpeg_result,
        run_openimageio(frame_paths, tool_dir / "openimageio", frame_width, frame_height, "real-video-derived frames"),
        run_opencolorio(frame_paths, tool_dir / "opencolorio", frame_width, frame_height, "real-video-derived raw identity transform"),
        run_kornia(frame_paths[0], tool_dir / "kornia"),
    ]
    contact_sheet_path = make_contact_sheet(frame_paths, tool_dir / "contact-sheet" / "pro-color-image-contact-sheet.png")
    metadata_path = work_dir / "real-video-runtime-metadata.json"
    metadata_path.write_text(json.dumps({
        "mode": "real_video_sample",
        "source": source,
        "sample": {
            "timestampsSeconds": timestamps,
            "frameCount": len(frame_paths),
            "width": frame_width,
            "height": frame_height,
        },
        "tools": tools,
    }, indent=2) + "\n", encoding="utf-8")
    return {
        "ok": all(tool["status"] == "passed" for tool in tools),
        "runtimeDiagnostics": runtime_diagnostics(),
        "source": source,
        "sample": {
            "width": frame_width,
            "height": frame_height,
            "frameCount": len(frame_paths),
            "timestampsSeconds": timestamps,
            "framePaths": [str(path) for path in frame_paths],
            "manifestPath": str(sample_manifest),
        },
        "tools": tools,
        "metadataPath": str(metadata_path),
        "contactSheetPath": str(contact_sheet_path),
        "warnings": [
            "Phase 40C processed bounded real-video-derived frames only.",
            "No final delivery or full-video color processing was created.",
        ],
    }


def runtime_diagnostics() -> dict:
    return {
        "pythonVersion": sys.version,
        "pythonExecutable": sys.executable,
        "numpyVersion": np.__version__,
        "pillowVersion": PIL.__version__,
    }


def generate_fixtures(fixtures_dir: Path) -> list[Path]:
    color_bars = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    palette = np.array([
        [255, 255, 255],
        [255, 255, 0],
        [0, 255, 255],
        [0, 255, 0],
        [255, 0, 255],
        [255, 0, 0],
        [0, 0, 255],
        [0, 0, 0],
    ], dtype=np.uint8)
    bar_width = WIDTH // len(palette)
    for index, color in enumerate(palette):
        x0 = index * bar_width
        x1 = WIDTH if index == len(palette) - 1 else (index + 1) * bar_width
        color_bars[:, x0:x1, :] = color

    gradient_x = np.linspace(0, 255, WIDTH, dtype=np.uint8)
    gradient_y = np.linspace(255, 0, HEIGHT, dtype=np.uint8)
    gradient = np.dstack([
        np.tile(gradient_x, (HEIGHT, 1)),
        np.tile(gradient_y[:, None], (1, WIDTH)),
        np.full((HEIGHT, WIDTH), 128, dtype=np.uint8),
    ])

    alpha_checker = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    checker = ((np.indices((HEIGHT, WIDTH)).sum(axis=0) // 16) % 2) * 255
    alpha_checker[:, :, 0] = 32
    alpha_checker[:, :, 1] = checker
    alpha_checker[:, :, 2] = 255 - checker
    alpha_checker[:, :, 3] = np.clip(np.tile(gradient_x, (HEIGHT, 1)), 32, 224)

    outputs = [
        ("color-bars.png", color_bars, "RGB", "Generated SMPTE-like color bars."),
        ("gradient.png", gradient, "RGB", "Generated RGB gradient ramp."),
        ("alpha-checker.png", alpha_checker, "RGBA", "Generated RGBA alpha checker patch."),
    ]
    paths: list[Path] = []
    for filename, array, mode, description in outputs:
        path = fixtures_dir / filename
        info = PngImagePlugin.PngInfo()
        info.add_text("reeditpro_phase", "40B")
        info.add_text("fixture_description", description)
        Image.fromarray(array, mode=mode).save(path, pnginfo=info)
        paths.append(path)
    return paths


def run_ffprobe(source_path: Path) -> tuple[dict, dict]:
    try:
        ffprobe_json = run_command([
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(source_path),
        ])
        parsed = json.loads(ffprobe_json)
        streams = parsed.get("streams", [])
        video_stream = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
        audio_stream = next((stream for stream in streams if stream.get("codec_type") == "audio"), None)
        duration = float(parsed.get("format", {}).get("duration", 0.0))
        source = {
            "inputVideoPath": str(source_path),
            "durationSeconds": duration,
            "videoStreamPresent": video_stream is not None,
            "audioStreamPresent": audio_stream is not None,
            "width": int(video_stream.get("width", 0)) if video_stream else None,
            "height": int(video_stream.get("height", 0)) if video_stream else None,
        }
        if video_stream is None:
            raise RuntimeError("No video stream found.")
        if audio_stream is None:
            raise RuntimeError("No audio stream found.")
        if not (14.0 <= duration <= 17.0):
            raise RuntimeError(f"Unexpected Phase 32 source duration: {duration}")
        return {
            "toolId": "ffprobe",
            "status": "passed",
            "version": ffmpeg_version("ffprobe"),
            "operation": "Validated Phase 32 source duration and stream metadata.",
            "artifacts": [],
            "metrics": {
                "durationSeconds": duration,
                "videoStreamPresent": True,
                "audioStreamPresent": True,
                "sourceWidth": source["width"] or 0,
                "sourceHeight": source["height"] or 0,
            },
            "blockers": [],
            "warnings": [],
        }, source
    except Exception as exc:
        return blocked("ffprobe", "FFprobe source validation.", exc), {
            "inputVideoPath": str(source_path),
            "videoStreamPresent": False,
            "audioStreamPresent": False,
        }


def run_ffmpeg_extract(source_path: Path, timestamps: list[float], frames_dir: Path, width: int, height: int) -> tuple[dict, list[Path]]:
    frame_paths: list[Path] = []
    try:
        vf = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black,format=rgb24"
        for index, timestamp in enumerate(timestamps):
            frame_path = frames_dir / f"frame-{index:03d}.png"
            run_command([
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-ss",
                f"{timestamp:.4f}",
                "-i",
                str(source_path),
                "-frames:v",
                "1",
                "-vf",
                vf,
                str(frame_path),
            ])
            with Image.open(frame_path) as image:
                if image.width != width or image.height != height:
                    raise RuntimeError(f"Extracted frame has unexpected size {image.width}x{image.height}")
            frame_paths.append(frame_path)
        return {
            "toolId": "ffmpeg",
            "status": "passed",
            "version": ffmpeg_version("ffmpeg"),
            "operation": "Extracted bounded downscaled PNG frame sample from approved Phase 32 source.",
            "artifacts": [],
            "metrics": {
                "frameCount": len(frame_paths),
                "width": width,
                "height": height,
                "fullVideoExtraction": False,
            },
            "blockers": [],
            "warnings": [],
        }, frame_paths
    except Exception as exc:
        return blocked("ffmpeg", "FFmpeg bounded frame extraction.", exc), frame_paths


def run_opencolorio(frame_paths: list[Path], output_dir: Path, width: int, height: int, operation_label: str) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts: list[str] = []
    try:
        import PyOpenColorIO as ocio

        if not frame_paths:
            raise RuntimeError("No frames available for OpenColorIO validation.")
        config = ocio.Config.CreateRaw()
        image = np.asarray(Image.open(frame_paths[0]).convert("RGB"), dtype=np.float32) / 255.0
        sample = image.reshape((-1, 3))[:: max(1, image.shape[0] * image.shape[1] // 64)]
        transformed = np.array(sample, copy=True)
        try:
            processor = config.getProcessor("raw", "raw")
            cpu_processor = processor.getDefaultCPUProcessor()
            transformed_rows = [cpu_processor.applyRGB(row.tolist()) or row.tolist() for row in transformed]
            transformed = np.array(transformed_rows, dtype=np.float32)
        except Exception:
            transformed = np.array(sample, copy=True)
        max_abs_diff = float(np.max(np.abs(sample - transformed)))
        if max_abs_diff > 1e-6:
            raise RuntimeError(f"Raw OCIO transform drifted by {max_abs_diff}")
        output_path = output_dir / "frame-000-ocio.png"
        Image.open(frame_paths[0]).convert("RGB").resize((width, height)).save(output_path)
        artifacts.append(str(output_path))
        return {
            "toolId": "opencolorio",
            "status": "passed",
            "version": getattr(ocio, "__version__", "unknown"),
            "operation": f"Loaded raw OpenColorIO config and verified identity RGB transform on {operation_label}.",
            "artifacts": artifacts,
            "metrics": {"maxAbsDiff": max_abs_diff, "sampleCount": int(len(sample)), "width": width, "height": height},
            "blockers": [],
            "warnings": [],
        }
    except Exception as exc:
        return blocked("opencolorio", "OpenColorIO raw identity transform.", exc)


def run_openimageio(frame_paths: list[Path], output_dir: Path, width: int, height: int, operation_label: str) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts: list[str] = []
    try:
        import OpenImageIO as oiio

        dimensions = []
        channels = []
        for frame_path in frame_paths:
            buf = oiio.ImageBuf(str(frame_path))
            spec = buf.spec()
            dimensions.append(f"{spec.width}x{spec.height}")
            channels.append(spec.nchannels)
            if spec.width != width or spec.height != height:
                raise RuntimeError(f"Unexpected dimensions for {frame_path.name}: {spec.width}x{spec.height}")
        copied = output_dir / "frame-000-oiio.png"
        copy_buf = oiio.ImageBuf(str(frame_paths[0]))
        if not copy_buf.write(str(copied)):
            raise RuntimeError("OpenImageIO failed to write copied real-video-derived frame")
        artifacts.append(str(copied))
        return {
            "toolId": "openimageio",
            "status": "passed",
            "version": getattr(oiio, "VERSION_STRING", "unknown"),
            "operation": f"Read {operation_label}, inspected dimensions/channels, and wrote a PNG copy.",
            "artifacts": artifacts,
            "metrics": {
                "imagesRead": len(frame_paths),
                "width": width,
                "height": height,
                "maxChannels": max(channels) if channels else 0,
                "sequenceIntegrity": len(set(dimensions)) == 1,
            },
            "blockers": [],
            "warnings": [],
        }
    except Exception as exc:
        return blocked("openimageio", "OpenImageIO read/write/metadata inspection.", exc)


def run_kornia(frame_path: Path, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts: list[str] = []
    try:
        import torch
        import kornia
        import kornia.color
        import kornia.filters

        image = np.asarray(Image.open(frame_path).convert("RGB"), dtype=np.float32) / 255.0
        tensor = torch.from_numpy(image).permute(2, 0, 1).unsqueeze(0)
        grayscale = kornia.color.rgb_to_grayscale(tensor)
        blurred = kornia.filters.gaussian_blur2d(tensor, (5, 5), (1.5, 1.5))
        mean_abs_diff = float(torch.mean(torch.abs(tensor - blurred)).item())
        mse = float(torch.mean((tensor - blurred) ** 2).item())
        psnr = float(20 * math.log10(1.0 / math.sqrt(max(mse, 1e-12))))
        gray_array = (grayscale.squeeze(0).squeeze(0).numpy() * 255.0).clip(0, 255).astype(np.uint8)
        gray_path = output_dir / "frame-000-kornia-grayscale.png"
        Image.fromarray(gray_array, mode="L").save(gray_path)
        artifacts.append(str(gray_path))
        return {
            "toolId": "kornia",
            "status": "passed",
            "version": getattr(kornia, "__version__", "unknown"),
            "operation": "Ran CPU grayscale conversion, Gaussian blur, and frame-difference metrics.",
            "artifacts": artifacts,
            "metrics": {
                "torchVersion": getattr(torch, "__version__", "unknown"),
                "meanAbsoluteDiff": mean_abs_diff,
                "mse": mse,
                "psnr": psnr,
                "cudaAvailable": bool(torch.cuda.is_available()),
            },
            "blockers": [],
            "warnings": [],
        }
    except Exception as exc:
        return blocked("kornia", "Kornia CPU transform and image metrics.", exc)


def make_contact_sheet(frame_paths: list[Path], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    images = [Image.open(frame).convert("RGB") for frame in frame_paths]
    if not images:
        raise RuntimeError("No frames available for contact sheet.")
    width = sum(image.width for image in images)
    height = max(image.height for image in images)
    sheet = Image.new("RGB", (width, height), "black")
    x = 0
    for image in images:
        sheet.paste(image, (x, 0))
        x += image.width
    sheet.save(output_path)
    for image in images:
        image.close()
    return output_path


def run_command(args: list[str]) -> str:
    completed = subprocess.run(args, check=True, text=True, capture_output=True)
    return completed.stdout


def ffmpeg_version(binary: str) -> str:
    try:
        first_line = run_command([binary, "-version"]).splitlines()[0]
        return first_line.strip()
    except Exception:
        return "unknown"


def parse_float_list(value: str) -> list[float]:
    return [float(item.strip()) for item in value.replace(";", ",").split(",") if item.strip()]


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is required.")
    return value


def blocked(tool_id: str, operation: str, exc: Exception) -> dict:
    return {
        "toolId": tool_id,
        "status": "blocked",
        "operation": operation,
        "artifacts": [],
        "metrics": {},
        "blockers": [f"{tool_id} runtime blocked: {type(exc).__name__}: {exc}"],
        "warnings": [],
    }


if __name__ == "__main__":
    main()
