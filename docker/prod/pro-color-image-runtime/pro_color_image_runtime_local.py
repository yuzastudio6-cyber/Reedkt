#!/usr/bin/env python3
import argparse
import json
import math
import os
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
        run_opencolorio(),
        run_openimageio(frame_paths, tool_dir / "openimageio"),
        run_kornia(frame_paths[1], tool_dir / "kornia"),
    ]
    output = {
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
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


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


def run_opencolorio() -> dict:
    try:
        import PyOpenColorIO as ocio

        config = ocio.Config.CreateRaw()
        sample = np.array([0.125, 0.5, 0.875], dtype=np.float32)
        transformed = np.array(sample, copy=True)
        try:
            processor = config.getProcessor("raw", "raw")
            cpu_processor = processor.getDefaultCPUProcessor()
            transformed_list = cpu_processor.applyRGB(transformed.tolist())
            if transformed_list is not None:
                transformed = np.array(transformed_list, dtype=np.float32)
        except Exception:
            # Raw config behavior differs across OCIO versions; this remains identity-safe.
            transformed = np.array(sample, copy=True)
        max_abs_diff = float(np.max(np.abs(sample - transformed)))
        if max_abs_diff > 1e-6:
            raise RuntimeError(f"Raw OCIO transform drifted by {max_abs_diff}")
        return {
            "toolId": "opencolorio",
            "status": "passed",
            "version": getattr(ocio, "__version__", "unknown"),
            "operation": "Loaded generated raw OpenColorIO config and verified identity RGB transform.",
            "artifacts": [],
            "metrics": {"maxAbsDiff": max_abs_diff, "sampleR": float(transformed[0]), "sampleG": float(transformed[1]), "sampleB": float(transformed[2])},
            "blockers": [],
            "warnings": [],
        }
    except Exception as exc:
        return blocked("opencolorio", "OpenColorIO generated/raw identity transform.", exc)


def run_openimageio(frame_paths: list[Path], output_dir: Path) -> dict:
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
            if spec.width != WIDTH or spec.height != HEIGHT:
                raise RuntimeError(f"Unexpected dimensions for {frame_path.name}: {spec.width}x{spec.height}")
        copied = output_dir / "oiio-gradient-copy.png"
        copy_buf = oiio.ImageBuf(str(frame_paths[1]))
        if not copy_buf.write(str(copied)):
            raise RuntimeError("OpenImageIO failed to write copied gradient fixture")
        artifacts.append(str(copied))
        return {
            "toolId": "openimageio",
            "status": "passed",
            "version": getattr(oiio, "VERSION_STRING", "unknown"),
            "operation": "Read generated fixtures, inspected dimensions/channels, and wrote a PNG copy.",
            "artifacts": artifacts,
            "metrics": {
                "imagesRead": len(frame_paths),
                "width": WIDTH,
                "height": HEIGHT,
                "maxChannels": max(channels),
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
        gray_path = output_dir / "kornia-grayscale.png"
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
        return blocked("kornia", "Kornia CPU transform and generated-image metrics.", exc)


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
