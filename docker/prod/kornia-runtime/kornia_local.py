import argparse
import json
import math
import os
import socket
from pathlib import Path

import numpy as np
import torch
from PIL import Image


def block_network() -> None:
    class BlockedSocket(socket.socket):
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Network sockets are disabled in the Kornia runtime.")

    socket.socket = BlockedSocket


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-image-path", required=True)
    parser.add_argument("--mask-path", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--allow-cpu", action="store_true")
    args = parser.parse_args()

    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    os.environ["PROVIDER_EXECUTION_ENABLED"] = "false"
    block_network()

    import kornia
    import kornia.color
    import kornia.filters

    cuda_available = bool(torch.cuda.is_available())
    if not cuda_available and not args.allow_cpu:
        raise RuntimeError("CUDA is required for the Kornia AI graphics runtime; no CPU fallback is allowed.")
    device = torch.device("cuda" if cuda_available else "cpu")

    input_path = Path(args.input_image_path)
    if not input_path.exists():
        raise RuntimeError(f"Missing private input image path: {input_path}")

    mask_path = Path(args.mask_path)
    output_path = Path(args.output_json)
    image = Image.open(input_path).convert("RGB")
    rgb = np.asarray(image, dtype=np.float32) / 255.0
    tensor = torch.from_numpy(rgb).permute(2, 0, 1).unsqueeze(0).to(device)
    grayscale = kornia.color.rgb_to_grayscale(tensor)
    blurred = kornia.filters.gaussian_blur2d(tensor, (5, 5), (1.5, 1.5))
    edges = kornia.filters.sobel(grayscale)

    edge_tensor = edges.detach().cpu().squeeze(0).squeeze(0).clamp(0, 1)
    edge_array = (edge_tensor.numpy() * 255.0).astype(np.uint8)
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(edge_array, mode="L").save(mask_path)

    mse = float(torch.mean((tensor - blurred) ** 2).detach().cpu().item())
    psnr = float(20 * math.log10(1.0 / math.sqrt(max(mse, 1e-12))))
    output = {
        "ok": True,
        "toolId": "kornia",
        "cudaAvailable": cuda_available,
        "deviceType": str(device),
        "deviceName": torch.cuda.get_device_name(0) if cuda_available else "cpu",
        "cpuTensorRuntimeAllowed": bool(args.allow_cpu),
        "runtime": {
            "torchVersion": getattr(torch, "__version__", "unknown"),
            "korniaVersion": getattr(kornia, "__version__", "unknown"),
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
            "width": image.size[0],
            "height": image.size[1],
            "meanEdge": float(edge_tensor.float().mean().item()),
            "nonZeroRatio": float((edge_array > 0).mean()),
        },
        "metrics": {
            "mseAfterGaussianBlur": mse,
            "psnrAfterGaussianBlur": psnr,
        },
        "warnings": ["Kornia ran bounded tensor/image operations only; no model inference or download was performed."],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
