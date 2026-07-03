import argparse
import json
import os
import socket
from pathlib import Path

import numpy as np
from PIL import Image


def block_network() -> None:
    class BlockedSocket(socket.socket):
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Network sockets are disabled in the rembg runtime.")

    socket.socket = BlockedSocket


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--model-name")
    parser.add_argument("--input-image-path", required=True)
    parser.add_argument("--cutout-path", required=True)
    parser.add_argument("--mask-path", required=True)
    parser.add_argument("--output-json", required=True)
    args = parser.parse_args()

    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    os.environ["PROVIDER_EXECUTION_ENABLED"] = "false"
    os.environ["MODEL_CHECKSUM_DISABLED"] = "1"
    block_network()

    import onnxruntime as ort
    from rembg import new_session, remove

    if "CUDAExecutionProvider" not in ort.get_available_providers():
        raise RuntimeError("CUDAExecutionProvider is required for the rembg GPU runtime; no CPU fallback is allowed.")

    model_path = Path(args.model_path)
    if model_path.suffix != ".onnx" or not model_path.exists() or model_path.stat().st_size <= 0:
        raise RuntimeError("Approved local rembg ONNX model is missing or invalid.")
    model_name = args.model_name or model_path.stem
    os.environ["U2NET_HOME"] = str(model_path.parent)

    input_path = Path(args.input_image_path)
    if not input_path.exists():
        raise RuntimeError(f"Missing private input image path: {input_path}")

    cutout_path = Path(args.cutout_path)
    mask_path = Path(args.mask_path)
    output_path = Path(args.output_json)
    session = new_session(model_name, providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
    input_bytes = input_path.read_bytes()
    output_bytes = remove(input_bytes, session=session, force_return_bytes=True)
    cutout_path.parent.mkdir(parents=True, exist_ok=True)
    cutout_path.write_bytes(output_bytes)

    cutout = Image.open(cutout_path).convert("RGBA")
    alpha = np.asarray(cutout.getchannel("A"), dtype=np.uint8)
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(alpha, mode="L").save(mask_path)

    output = {
        "ok": True,
        "toolId": "rembg",
        "cudaExecutionProviderAvailable": True,
        "runtime": {
            "onnxRuntimeDevice": ort.get_device(),
            "availableProviders": ort.get_available_providers(),
            "modelName": model_name,
            "modelDownloadedExternally": False,
        },
        "input": {
            "path": str(input_path),
            "width": cutout.size[0],
            "height": cutout.size[1],
        },
        "mask": {
            "path": str(mask_path),
            "cutoutPath": str(cutout_path),
            "meanAlpha": float(alpha.mean() / 255.0),
            "nonZeroRatio": float((alpha > 0).mean()),
        },
        "warnings": ["rembg used an approved local model file through U2NET_HOME; no model download was allowed."],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
