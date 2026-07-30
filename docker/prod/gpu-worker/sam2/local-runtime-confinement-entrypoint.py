"""Fixed model-free SAM2 runtime-confinement entrypoint.

This is an internal Linux/amd64 compatibility probe for the already-built
GPU-worker candidate. It verifies the pinned SAM2 source/config/runtime
without accepting a checkpoint, prompt, media, output path, or inference
request. It is not the released L4 runner and cannot produce a mask.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import importlib.util
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import signal
import sys


EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
EXPECTED_SOURCE_REVISION = (
    "2b90b9f5ceec907a1c18123530e92e794ad901a4"
)
EXPECTED_SOURCE_LICENSE_SHA256 = (
    "c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4"
)
EXPECTED_CONFIG_SHA256 = (
    "0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55"
)
EXPECTED_DIRECT_URL_SHA256 = (
    "fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f"
)
EXPECTED_SAM2_DISTRIBUTION_VERSION = "1.0"
EXPECTED_TORCH_VERSION = "2.5.1+cu124"
EXPECTED_TORCHVISION_VERSION = "0.20.1+cu124"
EXPECTED_CUDA_BUILD = "12.4"
FIXED_LOOPBACK_PORT = 8_190

SITE_PACKAGES = Path("/usr/local/lib/python3.10/dist-packages")
SAM2_PACKAGE = SITE_PACKAGES / "sam2"
SAM2_DIST_INFO = SITE_PACKAGES / "sam_2-1.0.dist-info"
SAM2_CONFIG = (
    SAM2_PACKAGE
    / "configs"
    / "sam2.1"
    / "sam2.1_hiera_s.yaml"
)
SAM2_LICENSE = SAM2_DIST_INFO / "licenses" / "LICENSE"
SAM2_DIRECT_URL = SAM2_DIST_INFO / "direct_url.json"
MODEL_ROOT = Path("/opt/reeditpro/model-weights/sam2")
RUNTIME_ROOT = Path("/tmp/reeditpro-living-frame-sam2")

FIXED_ENVIRONMENT = {
    "PATH": (
        "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    ),
    "HOME": str(RUNTIME_ROOT),
    "LANG": "C.UTF-8",
    "LC_ALL": "C.UTF-8",
    "PYTHONHASHSEED": "0",
    "PYTHONDONTWRITEBYTECODE": "1",
    "PYTHONUNBUFFERED": "1",
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "CUDA_VISIBLE_DEVICES": "",
    "NO_PROXY": "127.0.0.1,localhost",
    "no_proxy": "127.0.0.1,localhost",
}

MODEL_SUFFIXES = {
    ".bin",
    ".ckpt",
    ".onnx",
    ".pt",
    ".pth",
    ".safetensors",
}


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _fail(code: int) -> None:
    print(
        json.dumps(
            {
                "code": code,
                "event": (
                    "living_frame_sam2_local_runtime_confinement_failure"
                ),
            },
            separators=(",", ":"),
            sort_keys=True,
        ),
        flush=True,
    )
    raise SystemExit(code)


def _count_model_artifacts() -> int:
    if not MODEL_ROOT.is_dir():
        return 0
    return sum(
        1
        for path in MODEL_ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in MODEL_SUFFIXES
    )


def _validate_source_and_runtime() -> dict[str, object]:
    if len(sys.argv) != 1:
        _fail(64)
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        _fail(65)
    if os.access("/", os.W_OK):
        _fail(66)

    os.environ.clear()
    os.environ.update(FIXED_ENVIRONMENT)
    if dict(os.environ) != FIXED_ENVIRONMENT:
        _fail(67)

    if (
        not SAM2_CONFIG.is_file()
        or not SAM2_LICENSE.is_file()
        or not SAM2_DIRECT_URL.is_file()
    ):
        _fail(68)
    if _sha256(SAM2_CONFIG) != EXPECTED_CONFIG_SHA256:
        _fail(69)
    if _sha256(SAM2_LICENSE) != EXPECTED_SOURCE_LICENSE_SHA256:
        _fail(70)
    if _sha256(SAM2_DIRECT_URL) != EXPECTED_DIRECT_URL_SHA256:
        _fail(71)

    direct_url = json.loads(SAM2_DIRECT_URL.read_text("utf-8"))
    vcs = direct_url.get("vcs_info")
    if (
        direct_url.get("url")
        != "https://github.com/facebookresearch/sam2.git"
        or not isinstance(vcs, dict)
        or vcs.get("vcs") != "git"
        or vcs.get("commit_id") != EXPECTED_SOURCE_REVISION
        or vcs.get("requested_revision") != EXPECTED_SOURCE_REVISION
    ):
        _fail(72)

    if _count_model_artifacts() != 0:
        _fail(73)

    spec = importlib.util.find_spec("sam2")
    if spec is None or spec.origin != str(SAM2_PACKAGE / "__init__.py"):
        _fail(74)

    import sam2  # noqa: F401
    from sam2.build_sam import build_sam2_video_predictor
    import torch
    import torchvision

    if not callable(build_sam2_video_predictor):
        _fail(75)
    if (
        importlib.metadata.version("sam-2")
        != EXPECTED_SAM2_DISTRIBUTION_VERSION
        or importlib.metadata.version("torch") != EXPECTED_TORCH_VERSION
        or importlib.metadata.version("torchvision")
        != EXPECTED_TORCHVISION_VERSION
        or torch.__version__ != EXPECTED_TORCH_VERSION
        or torchvision.__version__ != EXPECTED_TORCHVISION_VERSION
        or torch.version.cuda != EXPECTED_CUDA_BUILD
    ):
        _fail(76)
    if torch.cuda.is_available() or torch.cuda.device_count() != 0:
        _fail(77)

    RUNTIME_ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    environment_digest = hashlib.sha256(
        json.dumps(
            FIXED_ENVIRONMENT,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()
    return {
        "builderImportVerified": True,
        "callerArgumentsAccepted": False,
        "callerEnvironmentMerged": False,
        "checkpointLoaded": False,
        "configDigestSha256": EXPECTED_CONFIG_SHA256,
        "cpuEmulationOnly": True,
        "cudaAvailable": False,
        "cudaBuild": EXPECTED_CUDA_BUILD,
        "cudaDeviceCount": 0,
        "environmentDigestSha256": environment_digest,
        "externalNetworkAllowed": False,
        "licenseDigestSha256": EXPECTED_SOURCE_LICENSE_SHA256,
        "modelArtifactCount": 0,
        "modelInferenceAuthorized": False,
        "nativeVideoPredictorBuilderImportable": True,
        "runtimeDownloadsAllowed": False,
        "sam2DistributionVersion": EXPECTED_SAM2_DISTRIBUTION_VERSION,
        "sourceRevision": EXPECTED_SOURCE_REVISION,
        "torchVersion": EXPECTED_TORCH_VERSION,
        "torchvisionVersion": EXPECTED_TORCHVISION_VERSION,
        "uid": EXPECTED_UID,
        "gid": EXPECTED_GID,
    }


class _ReadinessHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path != "/ready":
            self.send_error(404)
            return
        body = b'{"ready":true}\n'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        del format, args


def _serve_readiness(marker: dict[str, object]) -> None:
    print(
        json.dumps(
            {
                **marker,
                "event": (
                    "living_frame_sam2_local_runtime_confinement_ready"
                ),
            },
            separators=(",", ":"),
            sort_keys=True,
        ),
        flush=True,
    )
    server = HTTPServer(
        ("127.0.0.1", FIXED_LOOPBACK_PORT),
        _ReadinessHandler,
    )
    stop_requested = False

    def _request_stop(signum: int, frame: object) -> None:
        nonlocal stop_requested
        del signum, frame
        stop_requested = True

    signal.signal(signal.SIGTERM, _request_stop)
    signal.signal(signal.SIGINT, _request_stop)
    server.timeout = 0.25
    while not stop_requested:
        server.handle_request()
    server.server_close()


if __name__ == "__main__":
    _serve_readiness(_validate_source_and_runtime())
