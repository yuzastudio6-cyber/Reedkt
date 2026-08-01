"""Verify the private-only Living Frame ComfyUI hardening derivative.

This verifier is deliberately fixed and argument-free. It validates the exact
runtime package versions, canonical runner lineage, non-root identity, source
layout, and the operation-scoped SAM2 import denial. It does not load model
weights, start ComfyUI, execute a graph, or grant runtime authority.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import os
from pathlib import Path

EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
RUNNER = Path("/opt/reeditpro/gpu-operations/comfyui/runner.py")
LAYOUT_VERIFIER = Path(
    "/opt/reeditpro/gpu-operations/comfyui/verify-installed-layout.sh"
)
SOURCE_ROOT = Path("/opt/reeditpro/gpu-operations/comfyui/source")
VENV_CONFIG = Path(
    "/opt/reeditpro/gpu-operations/comfyui/venv/pyvenv.cfg"
)
EXPECTED_RUNNER_SHA256 = (
    "f28160b8e63fdf1a5717045850efd141275f20b4913a80b6502104c662b85caa"
)
EXPECTED_LAYOUT_VERIFIER_SHA256 = (
    "71c0f35ad1ad0083eb88a2b1561d6e93ba0cfa05cb2762e6a28f8978008d5656"
)
EXPECTED_DISTRIBUTIONS = {
    "anyio": "4.14.2",
    "certifi": "2026.7.22",
    "click": "8.4.2",
    "exceptiongroup": "1.3.1",
    "filelock": "3.29.4",
    "fsspec": "2026.6.0",
    "h11": "0.16.0",
    "hf-xet": "1.5.1",
    "httpcore": "1.0.9",
    "httpx": "0.28.1",
    "huggingface-hub": "1.5.0",
    "idna": "3.18",
    "markdown-it-py": "4.2.0",
    "mdurl": "0.1.2",
    "numpy": "1.26.4",
    "nvidia-cusparselt-cu12": "0.6.2",
    "packaging": "23.2",
    "pillow": "12.3.0",
    "pygments": "2.20.0",
    "pyyaml": "6.0.3",
    "regex": "2026.5.9",
    "rich": "15.0.0",
    "safetensors": "0.8.0",
    "shellingham": "1.5.4",
    "tokenizers": "0.22.2",
    "torch": "2.6.0+cu124",
    "torchaudio": "2.6.0+cu124",
    "torchvision": "0.21.0+cu124",
    "tqdm": "4.68.3",
    "transformers": "5.5.0",
    "triton": "3.2.0",
    "typer": "0.19.2",
    "typing-extensions": "4.15.0",
}
FORBIDDEN_LEGACY_METADATA = (
    Path("/usr/lib/python3/dist-packages/setuptools-59.6.0.egg-info"),
    Path("/usr/lib/python3/dist-packages/wheel-0.37.1.egg-info"),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def main() -> None:
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        raise RuntimeError("Hardened runtime verifier requires UID/GID 65532.")
    if sha256(RUNNER) != EXPECTED_RUNNER_SHA256:
        raise RuntimeError("Canonical ComfyUI runner lineage changed.")
    if sha256(LAYOUT_VERIFIER) != EXPECTED_LAYOUT_VERIFIER_SHA256:
        raise RuntimeError("Canonical ComfyUI layout verifier lineage changed.")
    if not (SOURCE_ROOT / "main.py").is_file():
        raise RuntimeError("Canonical ComfyUI source layout is missing.")
    if "include-system-site-packages = true" not in VENV_CONFIG.read_text(
        encoding="utf-8"
    ):
        raise RuntimeError("ComfyUI environment ownership changed.")
    for path in FORBIDDEN_LEGACY_METADATA:
        if path.exists():
            raise RuntimeError("Obsolete Ubuntu Python build metadata remains.")

    observed = {
        name: importlib.metadata.version(name)
        for name in EXPECTED_DISTRIBUTIONS
    }
    if observed != EXPECTED_DISTRIBUTIONS:
        raise RuntimeError("Hardened runtime package matrix changed.")
    try:
        importlib.metadata.version("wheel")
    except importlib.metadata.PackageNotFoundError:
        pass
    else:
        raise RuntimeError("Runtime-unnecessary wheel package remains.")

    import PIL
    import huggingface_hub
    import torch
    import torchaudio
    import torchvision
    import transformers

    if torch.__version__ != "2.6.0+cu124":
        raise RuntimeError("Unexpected Torch runtime version.")
    if torch.version.cuda != "12.4":
        raise RuntimeError("Unexpected Torch CUDA build family.")
    if torchvision.__version__ != "0.21.0+cu124":
        raise RuntimeError("Unexpected TorchVision runtime version.")
    if torchaudio.__version__ != "2.6.0+cu124":
        raise RuntimeError("Unexpected TorchAudio runtime version.")
    if PIL.__version__ != "12.3.0":
        raise RuntimeError("Unexpected Pillow runtime version.")
    if transformers.__version__ != "5.5.0":
        raise RuntimeError("Unexpected Transformers runtime version.")
    if huggingface_hub.__version__ != "1.5.0":
        raise RuntimeError("Unexpected Hugging Face Hub runtime version.")

    runner_source = RUNNER.read_text(encoding="utf-8")
    for required_fragment in (
        'fullname == "sam2"',
        'fullname.startswith("sam2.")',
        '"sam2ImportDenied": True',
    ):
        if required_fragment not in runner_source:
            raise RuntimeError("SAM2 import-denial contract changed.")

    print(
        json.dumps(
            {
                "contract": (
                    "living-frame-comfyui-hardened-runtime"
                    "-private-build-verifier-v1"
                ),
                "status": "passed",
                "uid": os.getuid(),
                "gid": os.getgid(),
                "distributionCount": len(observed),
                "torch": torch.__version__,
                "torchCudaBuild": torch.version.cuda,
                "torchvision": torchvision.__version__,
                "torchaudio": torchaudio.__version__,
                "pillow": PIL.__version__,
                "transformers": transformers.__version__,
                "huggingfaceHub": huggingface_hub.__version__,
                "sam2ImportDenied": True,
                "modelWeightsLoaded": False,
                "graphExecuted": False,
                "runtimeAuthority": False,
                "productionReady": False,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
    )


if __name__ == "__main__":
    main()
