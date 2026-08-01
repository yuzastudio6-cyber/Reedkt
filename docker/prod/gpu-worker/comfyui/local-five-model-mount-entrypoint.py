"""Fixed private-local five-model ComfyUI mount preflight.

This process verifies the exact controlled SDXL bundle while all five model
files are mounted read-only in one container lifetime. It deliberately stops
at the CUDA boundary on the Apple-hosted linux/amd64 test environment. It
does not start ComfyUI, submit a prompt, load tensors, or generate an image.
"""

from __future__ import annotations

from datetime import datetime, timezone
import errno
import hashlib
import importlib.abc
import json
import os
from pathlib import Path
import sys


EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
EXPECTED_GPU_REFUSAL_EXIT_CODE = 78
MODEL_ROOT = Path("/mnt/reeditpro/model-artifacts")
COMFYUI_ROOT = Path("/opt/ComfyUI")
MAIN_PATH = COMFYUI_ROOT / "main.py"
IPADAPTER_NODE_PATH = (
    COMFYUI_ROOT / "custom_nodes" / "comfyui-ipadapter"
)
CONTROLNET_AUX_NODE_PATH = (
    COMFYUI_ROOT / "custom_nodes" / "comfyui_controlnet_aux"
)
EXTRA_MODEL_PATHS = Path(
    "/opt/reeditpro/gpu-operations/comfyui/extra_model_paths.yaml"
)

FIXED_ENVIRONMENT = {
    "PATH": (
        "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    ),
    "HOME": "/tmp",
    "LANG": "C.UTF-8",
    "LC_ALL": "C.UTF-8",
    "PYTHONHASHSEED": "0",
    "PYTHONDONTWRITEBYTECODE": "1",
    "PYTHONUNBUFFERED": "1",
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "COMFYUI_MANAGER_DISABLE": "1",
    "CUDA_VISIBLE_DEVICES": "0",
    "NVIDIA_VISIBLE_DEVICES": "0",
    "NO_PROXY": "127.0.0.1,localhost",
    "no_proxy": "127.0.0.1,localhost",
}

MODEL_ARTIFACTS = (
    {
        "canonicalOrder": 0,
        "role": "base_checkpoint",
        "relativePath": "checkpoints/sd_xl_base_1.0.safetensors",
        "byteLength": 6_938_078_334,
        "contentSha256": (
            "31e35c80fc4829d14f90153f4c74cd59"
            "c90b779f6afe05a74cd6120b893f7e5b"
        ),
    },
    {
        "canonicalOrder": 1,
        "role": "controlnet_checkpoint",
        "relativePath": (
            "controlnet/"
            "controlnet-canny-sdxl-small.fp16.safetensors"
        ),
        "byteLength": 320_237_179,
        "contentSha256": (
            "fde4888a5f0a5648118991cc50e0ac4d"
            "60a2356dbaddf5e0649dd69c1119a2f9"
        ),
    },
    {
        "canonicalOrder": 2,
        "role": "lora_adapter",
        "relativePath": "loras/sdxl-offset-lora.safetensors",
        "byteLength": 49_553_604,
        "contentSha256": (
            "4852686128f953d0277d0793e2f03353"
            "52f96a919c9c16a09787d77f55cbdf6f"
        ),
    },
    {
        "canonicalOrder": 3,
        "role": "generic_ipadapter_checkpoint",
        "relativePath": "ipadapter/ip-adapter_sdxl.safetensors",
        "byteLength": 702_585_376,
        "contentSha256": (
            "ba1002529e783604c5f326d49f012202"
            "5392d1d20ac8d573b3eeb3e6dea4ebb6"
        ),
    },
    {
        "canonicalOrder": 4,
        "role": "clip_vision_checkpoint",
        "relativePath": (
            "clip_vision/clip-vision-vit-big-g.safetensors"
        ),
        "byteLength": 3_689_912_664,
        "contentSha256": (
            "657723e09f46a7c3957df651601029f66"
            "b1748afb12b419816330f16ed45d64d"
        ),
    },
)


class _DeniedImportFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        del path, target
        if fullname == "sam2" or fullname.startswith("sam2."):
            raise ImportError(
                "import blocked by fixed ComfyUI operation policy"
            )
        return None


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(
        timespec="milliseconds"
    ).replace("+00:00", "Z")


def _emit(value: object) -> None:
    print(
        json.dumps(
            value,
            separators=(",", ":"),
            sort_keys=True,
        ),
        flush=True,
    )


def _fail(code: int, stage: str) -> None:
    _emit(
        {
            "code": code,
            "event": (
                "living_frame_comfyui_five_model_mount_failure"
            ),
            "sensitiveDetailsIncluded": False,
            "stage": stage,
        }
    )
    raise SystemExit(code)


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(8 * 1_024 * 1_024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def _decode_mount_path(value: str) -> str:
    return (
        value.replace("\\040", " ")
        .replace("\\011", "\t")
        .replace("\\012", "\n")
        .replace("\\134", "\\")
    )


def _read_only_mount_targets() -> set[str]:
    targets: set[str] = set()
    with Path("/proc/self/mountinfo").open(
        "r",
        encoding="utf-8",
    ) as handle:
        for raw_line in handle:
            fields = raw_line.rstrip("\n").split(" ")
            if len(fields) < 10 or "-" not in fields:
                continue
            separator = fields.index("-")
            mount_options = set(fields[5].split(","))
            super_options = (
                set(fields[separator + 3].split(","))
                if len(fields) > separator + 3
                else set()
            )
            if "ro" in mount_options or "ro" in super_options:
                targets.add(_decode_mount_path(fields[4]))
    return targets


def _write_open_rejected(path: Path) -> bool:
    try:
        descriptor = os.open(path, os.O_WRONLY)
    except OSError as error:
        return error.errno in {
            errno.EROFS,
            errno.EACCES,
            errno.EPERM,
        }
    else:
        os.close(descriptor)
        return False


def _validate_process_boundary() -> str:
    if len(sys.argv) != 1:
        _fail(64, "CALLER_ARGUMENT_REJECTED")
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        _fail(65, "IDENTITY_REJECTED")
    if os.access("/", os.W_OK):
        _fail(66, "ROOT_FILESYSTEM_NOT_READ_ONLY")
    if (
        not MAIN_PATH.is_file()
        or not IPADAPTER_NODE_PATH.is_dir()
        or not CONTROLNET_AUX_NODE_PATH.is_dir()
        or not EXTRA_MODEL_PATHS.is_file()
    ):
        _fail(67, "FIXED_RUNTIME_LAYOUT_INVALID")

    os.environ.clear()
    os.environ.update(FIXED_ENVIRONMENT)
    if dict(os.environ) != FIXED_ENVIRONMENT:
        _fail(68, "ENVIRONMENT_SCRUB_FAILED")

    sys.meta_path.insert(0, _DeniedImportFinder())
    try:
        __import__("sam2")
    except ImportError:
        pass
    else:
        _fail(69, "SAM2_IMPORT_POLICY_FAILED")

    return hashlib.sha256(
        json.dumps(
            FIXED_ENVIRONMENT,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()


def _validate_models() -> tuple[list[dict[str, object]], str]:
    read_only_targets = _read_only_mount_targets()
    expected_paths = {
        MODEL_ROOT / artifact["relativePath"]
        for artifact in MODEL_ARTIFACTS
    }
    observed_paths = {
        path
        for path in MODEL_ROOT.rglob("*.safetensors")
        if path.is_file()
    }
    if observed_paths != expected_paths:
        _fail(70, "MODEL_SET_NOT_EXACT")

    observations: list[dict[str, object]] = []
    for artifact in MODEL_ARTIFACTS:
        path = MODEL_ROOT / artifact["relativePath"]
        if path.is_symlink() or not path.is_file():
            _fail(71, "MODEL_FILE_TYPE_INVALID")
        if str(path) not in read_only_targets:
            _fail(72, "MODEL_MOUNT_NOT_READ_ONLY")
        if not _write_open_rejected(path):
            _fail(73, "MODEL_WRITE_OPEN_NOT_REJECTED")
        observed_size = path.stat().st_size
        if observed_size != artifact["byteLength"]:
            _fail(74, "MODEL_BYTE_LENGTH_MISMATCH")
        observed_sha256 = _sha256_file(path)
        if observed_sha256 != artifact["contentSha256"]:
            _fail(75, "MODEL_DIGEST_MISMATCH")
        observations.append(
            {
                "byteLength": observed_size,
                "canonicalOrder": artifact["canonicalOrder"],
                "contentSha256": observed_sha256,
                "readOnlyMountObserved": True,
                "role": artifact["role"],
            }
        )

    bundle_digest = hashlib.sha256(
        json.dumps(
            observations,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()
    return observations, bundle_digest


def _observe_cuda() -> tuple[str, str, bool, int]:
    import torch
    import torchvision

    return (
        str(torch.__version__),
        str(torchvision.__version__),
        bool(torch.cuda.is_available()),
        int(torch.cuda.device_count()),
    )


def main() -> None:
    started_at = _iso_now()
    environment_digest = _validate_process_boundary()
    observations, bundle_digest = _validate_models()
    (
        torch_version,
        torchvision_version,
        cuda_available,
        cuda_device_count,
    ) = _observe_cuda()
    if cuda_available or cuda_device_count != 0:
        _fail(76, "UNEXPECTED_LOCAL_CUDA_DEVICE")

    completed_at = _iso_now()
    _emit(
        {
            "aggregateByteLength": sum(
                int(item["byteLength"])
                for item in observations
            ),
            "atomicFiveModelMountLifetimeObserved": True,
            "bundleDigestSha256": bundle_digest,
            "callerArgumentsAccepted": False,
            "callerEnvironmentMerged": False,
            "canonicalOperationDispatched": False,
            "completedAt": completed_at,
            "cpuEmulationOnly": True,
            "cudaAvailable": False,
            "cudaDeviceCount": 0,
            "environmentDigestSha256": environment_digest,
            "event": (
                "living_frame_comfyui_five_model_mount_verified_"
                "cuda_required"
            ),
            "externalNetworkAllowed": False,
            "gpuExecutionPerformed": False,
            "modelArtifactCount": 5,
            "modelArtifacts": observations,
            "modelInferenceExecuted": False,
            "modelMountsReadOnlyObserved": True,
            "outputArtifactCreated": False,
            "productionReady": False,
            "promptSubmitted": False,
            "runtimeDownloadsAllowed": False,
            "sam2ImportBlocked": True,
            "sensitiveDetailsIncluded": False,
            "startedAt": started_at,
            "torchVersion": torch_version,
            "torchvisionVersion": torchvision_version,
        }
    )
    raise SystemExit(EXPECTED_GPU_REFUSAL_EXIT_CODE)


if __name__ == "__main__":
    main()
