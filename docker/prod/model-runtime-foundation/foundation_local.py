import argparse
import json
import os
import socket
from pathlib import Path


def block_network() -> None:
    class BlockedSocket(socket.socket):
        def __init__(self, *args, **kwargs):
            raise RuntimeError("Network sockets are disabled in the AI graphics model-runtime foundation probe.")

    socket.socket = BlockedSocket


def version_for(module: object) -> str:
    return str(getattr(module, "__version__", None) or "unknown")


def run_torch_torchvision_probe(allow_cpu: bool) -> dict[str, object]:
    import torch
    import torchvision

    cuda_available = bool(torch.cuda.is_available())
    if not cuda_available and not allow_cpu:
        raise RuntimeError("CUDA is required for the torch/torchvision foundation runtime; no CPU fallback is allowed.")

    device = torch.device("cuda" if cuda_available else "cpu")
    tensor = torch.arange(16, dtype=torch.float32, device=device).reshape(4, 4)
    normalized = (tensor / torch.max(tensor)).sum()
    if cuda_available:
        torch.cuda.synchronize()
    return {
        "toolId": "torch_torchvision",
        "torchVersion": version_for(torch),
        "torchvisionVersion": version_for(torchvision),
        "cudaAvailable": cuda_available,
        "deviceType": str(device),
        "deviceName": torch.cuda.get_device_name(0) if cuda_available else "cpu",
        "cpuFoundationRuntimeAllowed": bool(allow_cpu),
        "tensorProbeSum": float(normalized.detach().cpu().item()),
        "modelWeightsLoaded": False,
        "modelInferencePerformed": False,
        "mediaProcessed": False,
    }


def run_transformers_probe(allow_cpu: bool) -> dict[str, object]:
    import torch
    import transformers

    cuda_available = bool(torch.cuda.is_available())
    if not cuda_available and not allow_cpu:
        raise RuntimeError("CUDA is required for the Transformers foundation runtime; no CPU fallback is allowed.")

    device = torch.device("cuda" if cuda_available else "cpu")
    tensor = torch.ones((1,), dtype=torch.float32, device=device)
    if cuda_available:
        torch.cuda.synchronize()
    return {
        "toolId": "transformers",
        "torchVersion": version_for(torch),
        "transformersVersion": version_for(transformers),
        "cudaAvailable": cuda_available,
        "deviceType": str(device),
        "deviceName": torch.cuda.get_device_name(0) if cuda_available else "cpu",
        "cpuFoundationRuntimeAllowed": bool(allow_cpu),
        "tensorProbeSum": float(tensor.detach().cpu().item()),
        "modelWeightsLoaded": False,
        "modelInferencePerformed": False,
        "mediaProcessed": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tool-id", required=True, choices=["torch_torchvision", "transformers"])
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--allow-cpu", action="store_true")
    args = parser.parse_args()

    os.environ["HF_DATASETS_OFFLINE"] = "1"
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"
    os.environ["PROVIDER_EXECUTION_ENABLED"] = "false"
    os.environ["REAL_MEDIA_INPUT_ENABLED"] = "false"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    block_network()

    if args.tool_id == "torch_torchvision":
        probe = run_torch_torchvision_probe(args.allow_cpu)
    else:
        probe = run_transformers_probe(args.allow_cpu)

    output_path = Path(args.output_json)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "ok": True,
        "runtime": {
            **probe,
            "modelDownloadedExternally": False,
            "providerRuntimePerformed": False,
            "publicArtifactCreated": False,
            "signedUrlCreated": False,
        },
        "warnings": [
            "Foundation runtime probe executed only package import/CUDA visibility checks and a bounded tensor operation; no model weights, media, provider calls, or public artifacts were used."
        ],
    }
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
