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


def configure_cpu_proof_base_size(mode: str, output_path: Path, base_size: int) -> None:
    if base_size <= 0:
        return

    import transparent_background
    import yaml

    config_root = output_path.parent / "transparent-background-config"
    config_home = config_root / ".transparent-background"
    config_home.mkdir(parents=True, exist_ok=True)
    source_config = Path(transparent_background.__file__).parent / "config.yaml"
    config = yaml.safe_load(source_config.read_text(encoding="utf-8"))
    if mode not in config:
        raise RuntimeError(f"Unsupported transparent-background mode for CPU proof: {mode}")
    config[mode]["base_size"] = [base_size, base_size]
    (config_home / "config.yaml").write_text(
        yaml.safe_dump(config, sort_keys=False),
        encoding="utf-8",
    )
    os.environ["TRANSPARENT_BACKGROUND_FILE_PATH"] = str(config_root)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-path", required=True)
    parser.add_argument("--mode", default="base")
    parser.add_argument("--input-image-path", required=True)
    parser.add_argument("--cutout-path", required=True)
    parser.add_argument("--mask-path", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--allow-cpu-model-runtime", action="store_true")
    parser.add_argument("--cpu-proof-base-size", type=int, default=64)
    args = parser.parse_args()

    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    os.environ["PROVIDER_EXECUTION_ENABLED"] = "false"
    block_network()

    from transparent_background import Remover

    cuda_available = bool(torch.cuda.is_available())
    if not cuda_available and not args.allow_cpu_model_runtime:
        raise RuntimeError("CUDA is required for the transparent-background runtime unless explicit CPU model runtime proof is requested.")
    runtime_device = "cpu" if args.allow_cpu_model_runtime else "cuda:0"
    output_runtime_device = "cpu" if args.allow_cpu_model_runtime else "cuda"

    checkpoint_path = Path(args.checkpoint_path)
    if checkpoint_path.suffix != ".pth" or not checkpoint_path.exists() or checkpoint_path.stat().st_size <= 0:
        raise RuntimeError("Approved local transparent-background checkpoint is missing or invalid.")

    input_path = Path(args.input_image_path)
    if not input_path.exists():
        raise RuntimeError(f"Missing private input image path: {input_path}")

    cutout_path = Path(args.cutout_path)
    mask_path = Path(args.mask_path)
    output_path = Path(args.output_json)
    if args.allow_cpu_model_runtime:
        configure_cpu_proof_base_size(args.mode, output_path, args.cpu_proof_base_size)
    image = Image.open(input_path).convert("RGB")
    remover = Remover(mode=args.mode, jit=False, device=runtime_device, ckpt=str(checkpoint_path))
    cutout = remover.process(image, type="rgba")
    cutout_path.parent.mkdir(parents=True, exist_ok=True)
    cutout.save(cutout_path)

    alpha = np.asarray(cutout.convert("RGBA").getchannel("A"), dtype=np.uint8)
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(alpha, mode="L").save(mask_path)

    output = {
        "ok": True,
        "toolId": "transparent_background",
        "cudaAvailable": cuda_available,
        "cpuModelRuntimeAllowed": bool(args.allow_cpu_model_runtime),
        "runtimeDevice": output_runtime_device,
        "selectedProviders": [],
        "deviceName": "cpu" if args.allow_cpu_model_runtime else torch.cuda.get_device_name(0),
        "modelDownloadedExternally": False,
        "providerRuntimePerformed": False,
        "publicArtifactCreated": False,
        "signedUrlCreated": False,
        "runtime": {
            "mode": args.mode,
            "cpuProofBaseSize": args.cpu_proof_base_size if args.allow_cpu_model_runtime else None,
            "checkpointPath": str(checkpoint_path),
            "runtimeDevice": output_runtime_device,
            "cpuModelRuntimeAllowed": bool(args.allow_cpu_model_runtime),
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
