import argparse
import json
import os
import socket
from pathlib import Path

import numpy as np
import torch
from PIL import Image


def block_network() -> None:
    class BlockedSocket(socket.socket):
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Network sockets are disabled in the transparent-background runtime.")

    socket.socket = BlockedSocket


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-path", required=True)
    parser.add_argument("--mode", default="base")
    parser.add_argument("--input-image-path", required=True)
    parser.add_argument("--cutout-path", required=True)
    parser.add_argument("--mask-path", required=True)
    parser.add_argument("--output-json", required=True)
    args = parser.parse_args()

    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    os.environ["PROVIDER_EXECUTION_ENABLED"] = "false"
    block_network()

    from transparent_background import Remover

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for the transparent-background runtime; no CPU fallback is allowed.")

    checkpoint_path = Path(args.checkpoint_path)
    if checkpoint_path.suffix != ".pth" or not checkpoint_path.exists() or checkpoint_path.stat().st_size <= 0:
        raise RuntimeError("Approved local transparent-background checkpoint is missing or invalid.")

    input_path = Path(args.input_image_path)
    if not input_path.exists():
        raise RuntimeError(f"Missing private input image path: {input_path}")

    cutout_path = Path(args.cutout_path)
    mask_path = Path(args.mask_path)
    output_path = Path(args.output_json)
    image = Image.open(input_path).convert("RGB")
    remover = Remover(mode=args.mode, jit=False, device="cuda:0", ckpt=str(checkpoint_path))
    cutout = remover.process(image, type="rgba")
    cutout_path.parent.mkdir(parents=True, exist_ok=True)
    cutout.save(cutout_path)

    alpha = np.asarray(cutout.convert("RGBA").getchannel("A"), dtype=np.uint8)
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(alpha, mode="L").save(mask_path)

    output = {
        "ok": True,
        "toolId": "transparent_background",
        "cudaAvailable": True,
        "deviceName": torch.cuda.get_device_name(0),
        "runtime": {
            "mode": args.mode,
            "checkpointPath": str(checkpoint_path),
            "modelDownloadedExternally": False,
            "providerRuntimePerformed": False,
            "publicArtifactCreated": False,
            "signedUrlCreated": False,
        },
        "input": {
            "path": str(input_path),
            "width": image.size[0],
            "height": image.size[1],
        },
        "mask": {
            "path": str(mask_path),
            "cutoutPath": str(cutout_path),
            "meanAlpha": float(alpha.mean() / 255.0),
            "nonZeroRatio": float((alpha > 0).mean()),
        },
        "warnings": ["transparent-background used an approved local checkpoint through Remover(..., ckpt=...); no checkpoint download was allowed."],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
