"""Fixed local-only ComfyUI confinement/startup entrypoint.

This is deliberately a CPU-emulated, model-free compatibility probe for the
exact locked local candidate image. It is not the released L4 entrypoint and
must never be used as generation or production evidence.
"""

from __future__ import annotations

import hashlib
import importlib.abc
import json
import os
from pathlib import Path
import runpy
import sys


EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
COMFYUI_ROOT = Path("/opt/ComfyUI")
MAIN_PATH = COMFYUI_ROOT / "main.py"
IPADAPTER_PATH = COMFYUI_ROOT / "custom_nodes" / "comfyui-ipadapter"
CONTROLNET_AUX_PATH = (
    COMFYUI_ROOT / "custom_nodes" / "comfyui_controlnet_aux"
)
RUNTIME_ROOT = Path("/tmp/reeditpro-living-frame-comfyui")

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
    "COMFYUI_MANAGER_DISABLE": "1",
    "NO_PROXY": "127.0.0.1,localhost",
    "no_proxy": "127.0.0.1,localhost",
}


class _DeniedImportFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        del path, target
        if fullname == "sam2" or fullname.startswith("sam2."):
            raise ImportError(
                "import blocked by fixed ComfyUI operation policy"
            )
        return None


def _fail(code: int) -> None:
    print(
        json.dumps(
            {
                "event": "living_frame_comfyui_local_confinement_failure",
                "code": code,
            },
            separators=(",", ":"),
            sort_keys=True,
        ),
        flush=True,
    )
    raise SystemExit(code)


def _prepare_runtime() -> None:
    if len(sys.argv) != 1:
        _fail(64)
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        _fail(65)
    if os.access("/", os.W_OK):
        _fail(66)
    if not MAIN_PATH.is_file():
        _fail(67)
    if not IPADAPTER_PATH.is_dir() or not CONTROLNET_AUX_PATH.is_dir():
        _fail(68)

    os.environ.clear()
    os.environ.update(FIXED_ENVIRONMENT)
    if dict(os.environ) != FIXED_ENVIRONMENT:
        _fail(69)

    sys.meta_path.insert(0, _DeniedImportFinder())
    blocked = False
    try:
        __import__("sam2")
    except ImportError:
        blocked = True
    if not blocked:
        _fail(70)

    for directory in (
        RUNTIME_ROOT,
        RUNTIME_ROOT / "input",
        RUNTIME_ROOT / "output",
        RUNTIME_ROOT / "temp",
        RUNTIME_ROOT / "user",
    ):
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)

    environment_digest = hashlib.sha256(
        json.dumps(
            FIXED_ENVIRONMENT,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()
    print(
        json.dumps(
            {
                "callerArgumentsAccepted": False,
                "callerEnvironmentMerged": False,
                "cpuEmulationOnly": True,
                "environmentDigestSha256": environment_digest,
                "event": (
                    "living_frame_comfyui_local_confinement_ready_to_start"
                ),
                "externalNetworkAllowed": False,
                "modelArtifactCount": 0,
                "modelInferenceAuthorized": False,
                "runtimeDownloadsAllowed": False,
                "sam2ImportBlocked": True,
                "standardLibraryImportPreserved": True,
                "uid": EXPECTED_UID,
                "gid": EXPECTED_GID,
            },
            separators=(",", ":"),
            sort_keys=True,
        ),
        flush=True,
    )


def _run_comfyui() -> None:
    sys.path.insert(0, str(COMFYUI_ROOT))
    sys.argv = [
        str(MAIN_PATH),
        "--listen",
        "127.0.0.1",
        "--port",
        "8188",
        "--disable-auto-launch",
        "--disable-metadata",
        "--disable-api-nodes",
        "--disable-all-custom-nodes",
        "--whitelist-custom-nodes",
        IPADAPTER_PATH.name,
        CONTROLNET_AUX_PATH.name,
        "--models-directory",
        str(COMFYUI_ROOT / "models"),
        "--input-directory",
        str(RUNTIME_ROOT / "input"),
        "--output-directory",
        str(RUNTIME_ROOT / "output"),
        "--temp-directory",
        str(RUNTIME_ROOT / "temp"),
        "--user-directory",
        str(RUNTIME_ROOT / "user"),
        "--database-url",
        f"sqlite:///{RUNTIME_ROOT / 'user' / 'comfyui.db'}",
        "--preview-method",
        "none",
        "--cache-none",
        "--cpu",
    ]
    runpy.run_path(str(MAIN_PATH), run_name="__main__")


if __name__ == "__main__":
    _prepare_runtime()
    _run_comfyui()
