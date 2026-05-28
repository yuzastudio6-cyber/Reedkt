import argparse
import json
import os
import socket
import sys
import types
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont


def block_network() -> None:
    class BlockedSocket(socket.socket):
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Network sockets are disabled in the Real-ESRGAN runtime.")

    socket.socket = BlockedSocket


def patch_torchvision_functional_tensor() -> None:
    # BasicSR 1.4.2 imports this legacy module name; modern torchvision moved it.
    from torchvision.transforms import functional as functional

    module = types.ModuleType("torchvision.transforms.functional_tensor")
    module.rgb_to_grayscale = functional.rgb_to_grayscale
    sys.modules.setdefault("torchvision.transforms.functional_tensor", module)


def generate_fixture(path: Path) -> Image.Image:
    image = Image.new("RGB", (128, 128), (226, 232, 238))
    pixels = image.load()
    for y in range(128):
        for x in range(128):
            base = 170 + int(45 * (x / 127))
            pixels[x, y] = (base, 190 + int(35 * (y / 127)), 210)

    draw = ImageDraw.Draw(image)
    for i in range(0, 128, 8):
        draw.line((i, 0, i, 127), fill=(130, 146, 165), width=1)
        draw.line((0, i, 127, i), fill=(130, 146, 165), width=1)
    draw.rectangle((12, 16, 58, 58), outline=(35, 68, 112), width=2)
    draw.ellipse((72, 14, 115, 57), outline=(204, 63, 51), width=2)
    draw.polygon([(24, 98), (54, 70), (84, 98)], fill=(245, 183, 74), outline=(99, 71, 30))
    draw.rounded_rectangle((70, 76, 118, 112), radius=8, fill=(43, 91, 119), outline=(12, 45, 60), width=2)
    for x in range(10, 118, 4):
        draw.point((x, 122), fill=(25, 40, 55))
        draw.point((x + 1, 123), fill=(225, 245, 255))
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    draw.text((20, 62), "RP", fill=(22, 31, 45), font=font)
    draw.text((75, 60), "x4", fill=(22, 31, 45), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--fixture-path", required=True)
    parser.add_argument("--enhanced-path", required=True)
    parser.add_argument("--output-json", required=True)
    args = parser.parse_args()

    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    os.environ["PROVIDER_EXECUTION_ENABLED"] = "false"
    os.environ["REAL_ESRGAN_FACE_ENHANCE"] = "false"
    os.environ["TORCH_HOME"] = "/tmp/reeditpro-no-runtime-downloads"
    os.environ["XDG_CACHE_HOME"] = "/tmp/reeditpro-no-runtime-downloads"
    block_network()
    patch_torchvision_functional_tensor()

    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer

    model_path = Path(args.model_path)
    if model_path.name != "RealESRGAN_x4plus.pth":
        raise RuntimeError("Only RealESRGAN_x4plus.pth is allowed.")
    if not model_path.exists() or model_path.stat().st_size <= 0:
        raise RuntimeError("Approved local RealESRGAN_x4plus.pth is missing or empty.")
    if os.environ.get("REAL_ESRGAN_FACE_ENHANCE") != "false":
        raise RuntimeError("GFPGAN/face enhancement is blocked in Phase 34C.")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for Phase 34C; no CPU fallback is allowed.")

    fixture_path = Path(args.fixture_path)
    enhanced_path = Path(args.enhanced_path)
    output_path = Path(args.output_json)
    image = generate_fixture(fixture_path)
    input_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    upsampler = RealESRGANer(
        scale=4,
        model_path=str(model_path),
        model=model,
        tile=64,
        tile_pad=10,
        pre_pad=0,
        half=True,
        gpu_id=0,
    )
    output_bgr, _ = upsampler.enhance(input_bgr, outscale=4)
    enhanced_path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(enhanced_path), output_bgr):
        raise RuntimeError("Failed to write enhanced PNG.")

    output = {
        "ok": True,
        "cudaAvailable": True,
        "deviceName": torch.cuda.get_device_name(0),
        "fixture": {
            "width": image.size[0],
            "height": image.size[1],
            "path": str(fixture_path),
            "kind": "generated_fixture",
        },
        "enhanced": {
            "width": int(output_bgr.shape[1]),
            "height": int(output_bgr.shape[0]),
            "scale": 4,
            "path": str(enhanced_path),
            "sizeBytes": enhanced_path.stat().st_size,
        },
        "runtime": {
            "modelName": "RealESRGAN_x4plus",
            "tile": 64,
            "faceEnhanceRan": False,
            "gfpganImported": False,
            "filmUsed": False,
            "modelDownloadedExternally": False,
        },
        "warnings": [
            "Generated synthetic fixture only; no real-video enhancement quality claim.",
            "GFPGAN/facexlib package dependencies are not execution evidence and no GFPGAN/facexlib weights were used.",
        ],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
