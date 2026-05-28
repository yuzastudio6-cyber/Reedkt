import argparse
import json
import os
import socket
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw
from torchvision import transforms
from transformers import AutoModelForImageSegmentation


def block_network() -> None:
    class BlockedSocket(socket.socket):
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Network sockets are disabled in Phase 33C BiRefNet runtime.")

    socket.socket = BlockedSocket


def generate_fixture(path: Path) -> Image.Image:
    image = Image.new("RGB", (512, 512), (224, 233, 242))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 400, 512, 512), fill=(198, 209, 221))
    draw.ellipse((196, 72, 316, 192), fill=(42, 72, 115))
    draw.rounded_rectangle((166, 178, 346, 405), radius=48, fill=(231, 80, 73))
    draw.rectangle((145, 265, 190, 420), fill=(42, 72, 115))
    draw.rectangle((322, 265, 367, 420), fill=(42, 72, 115))
    draw.rectangle((202, 404, 244, 485), fill=(42, 72, 115))
    draw.rectangle((268, 404, 310, 485), fill=(42, 72, 115))
    draw.ellipse((222, 112, 242, 132), fill=(255, 245, 235))
    draw.ellipse((270, 112, 290, 132), fill=(255, 245, 235))
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--fixture-path", required=True)
    parser.add_argument("--mask-path", required=True)
    parser.add_argument("--cutout-path", required=True)
    parser.add_argument("--output-json", required=True)
    args = parser.parse_args()

    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_DATASETS_OFFLINE"] = "1"
    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    block_network()

    model_path = Path(args.model_path)
    if not (model_path / "model.safetensors").exists():
        raise RuntimeError("Approved local BiRefNet model.safetensors is missing.")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for Phase 33C; no CPU fallback is allowed.")

    device = "cuda"
    fixture_path = Path(args.fixture_path)
    mask_path = Path(args.mask_path)
    cutout_path = Path(args.cutout_path)
    output_path = Path(args.output_json)

    image = generate_fixture(fixture_path)
    model = AutoModelForImageSegmentation.from_pretrained(
        str(model_path),
        trust_remote_code=True,
        local_files_only=True,
    )
    model.to(device)
    model.eval()
    model.half()

    transform = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    input_tensor = transform(image).unsqueeze(0).to(device).half()
    with torch.no_grad():
        prediction = model(input_tensor)[-1].sigmoid().detach().cpu().float()

    mask_tensor = prediction[0].squeeze().clamp(0, 1)
    mask_array = (mask_tensor.numpy() * 255.0).astype(np.uint8)
    mask_image = Image.fromarray(mask_array, mode="L").resize(image.size)
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    mask_image.save(mask_path)

    cutout = image.convert("RGBA")
    cutout.putalpha(mask_image)
    cutout_path.parent.mkdir(parents=True, exist_ok=True)
    cutout.save(cutout_path)

    alpha = np.asarray(mask_image).astype(np.float32) / 255.0
    output = {
        "ok": True,
        "cudaAvailable": True,
        "deviceName": torch.cuda.get_device_name(0),
        "fixture": {
            "width": image.size[0],
            "height": image.size[1],
            "path": str(fixture_path),
        },
        "mask": {
            "width": mask_image.size[0],
            "height": mask_image.size[1],
            "nonZeroRatio": float((alpha > 0.02).mean()),
            "meanAlpha": float(alpha.mean()),
            "minAlpha": float(alpha.min()),
            "maxAlpha": float(alpha.max()),
            "path": str(mask_path),
            "cutoutPath": str(cutout_path),
        },
        "warnings": [],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
