"""Verify the source-built, runtime-pruned Living Frame ComfyUI image.

This argument-free verifier first replays the existing hardened runtime
verifier, then proves that stale operation-local installer metadata and the
inherited build/network toolchain were removed. It never mounts model weights,
starts ComfyUI, executes a graph, or grants runtime authority.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import subprocess

EXPECTED_UID = 65_532
EXPECTED_GID = 65_532
RUNTIME_ROOT = Path("/opt/reeditpro/gpu-operations/comfyui")
BASE_VERIFIER = RUNTIME_ROOT / "verify-hardened-runtime.py"
PRUNE_SCRIPT = RUNTIME_ROOT / "prune-hardened-runtime-offline.sh"
SAM2_REMOVAL_SCRIPT = (
    RUNTIME_ROOT / "remove-inherited-sam2-distribution.py"
)
VENV_ROOT = RUNTIME_ROOT / "venv"
VENV_SITE_PACKAGES = VENV_ROOT / "lib/python3.10/site-packages"
EXPECTED_BASE_VERIFIER_SHA256 = (
    "692f9829a3c32c1cc82cd26c6c7076ad32280692e3959e89b1ea4c5bd1f31ffc"
)
EXPECTED_SAM2_REMOVAL_SCRIPT_SHA256 = (
    "d7728338ebdc04c9a647882b9d0e16328e317f8863287dd7f4d9f6d7cf861440"
)
FORBIDDEN_PACKAGES = (
    "apt",
    "build-essential",
    "dirmngr",
    "g++",
    "gcc",
    "git",
    "gnupg",
    "gnupg-l10n",
    "gnupg-utils",
    "gnupg2",
    "gpg",
    "gpg-agent",
    "gpg-wks-client",
    "gpg-wks-server",
    "gpgconf",
    "gpgsm",
    "gpgv",
    "libnode-dev",
    "libnode72",
    "linux-libc-dev",
    "make",
    "ninja-build",
    "nodejs",
    "npm",
    "openssl",
    "pkg-config",
    "python3-dev",
)
FORBIDDEN_EXECUTABLES = (
    Path("/usr/bin/apt"),
    Path("/usr/bin/apt-get"),
    Path("/usr/bin/g++"),
    Path("/usr/bin/gcc"),
    Path("/usr/bin/git"),
    Path("/usr/bin/gpg"),
    Path("/usr/bin/gpgv"),
    Path("/usr/bin/make"),
    Path("/usr/bin/ninja"),
    Path("/usr/bin/node"),
    Path("/usr/bin/npm"),
    Path("/usr/bin/openssl"),
    Path("/usr/bin/pkg-config"),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def package_status(package_name: str) -> str:
    completed = subprocess.run(
        (
            "/usr/bin/dpkg-query",
            "-W",
            "-f=${db:Status-Status}",
            package_name,
        ),
        check=False,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip() if completed.returncode == 0 else ""


def main() -> None:
    if os.getuid() != EXPECTED_UID or os.getgid() != EXPECTED_GID:
        raise RuntimeError("Pruned runtime verifier requires UID/GID 65532.")
    if sha256(BASE_VERIFIER) != EXPECTED_BASE_VERIFIER_SHA256:
        raise RuntimeError("Base hardened runtime verifier lineage changed.")

    completed = subprocess.run(
        (
            "/usr/bin/python3",
            "-I",
            "-B",
            str(BASE_VERIFIER),
        ),
        check=True,
        capture_output=True,
        text=True,
    )
    base_lines = [
        line.strip()
        for line in completed.stdout.splitlines()
        if line.strip()
    ]
    if len(base_lines) != 1:
        raise RuntimeError("Base verifier emitted an unexpected receipt.")
    base_receipt = json.loads(base_lines[0])
    if base_receipt.get("status") != "passed":
        raise RuntimeError("Base hardened runtime verification failed.")

    for pattern in ("pip-*.dist-info", "setuptools-*.dist-info"):
        if tuple(VENV_SITE_PACKAGES.glob(pattern)):
            raise RuntimeError(
                "Operation-local installer metadata remains after pruning."
            )
    for executable in ("pip", "pip3", "pip3.10"):
        if (VENV_ROOT / "bin" / executable).exists():
            raise RuntimeError(
                "Operation-local installer executable remains after pruning."
            )

    installed_forbidden = tuple(
        package
        for package in FORBIDDEN_PACKAGES
        if package_status(package) == "installed"
    )
    if installed_forbidden:
        raise RuntimeError("Build-only OS packages remain installed.")
    if tuple(path for path in FORBIDDEN_EXECUTABLES if path.exists()):
        raise RuntimeError("Build or network executable remains installed.")

    if not PRUNE_SCRIPT.is_file() or not os.access(PRUNE_SCRIPT, os.X_OK):
        raise RuntimeError("Fixed runtime-prune contract is unavailable.")
    if (
        not SAM2_REMOVAL_SCRIPT.is_file()
        or not os.access(SAM2_REMOVAL_SCRIPT, os.X_OK)
        or sha256(SAM2_REMOVAL_SCRIPT)
        != EXPECTED_SAM2_REMOVAL_SCRIPT_SHA256
    ):
        raise RuntimeError(
            "Fixed inherited SAM-2 removal contract is unavailable."
        )
    if Path("/etc/ssl/certs/ca-certificates.crt").exists():
        raise RuntimeError("Network trust store remains in offline runtime.")

    try:
        importlib.metadata.distribution("sam-2")
    except importlib.metadata.PackageNotFoundError:
        pass
    else:
        raise RuntimeError(
            "Out-of-scope inherited SAM-2 distribution remains."
        )
    if importlib.util.find_spec("sam2") is not None:
        raise RuntimeError("Out-of-scope inherited sam2 module remains.")
    if importlib.util.find_spec("training") is not None:
        raise RuntimeError(
            "Out-of-scope inherited SAM-2 training module remains."
        )

    try:
        importlib.metadata.distribution("pip")
    except importlib.metadata.PackageNotFoundError:
        system_pip_present = False
    else:
        system_pip_present = True

    print(
        json.dumps(
            {
                "contract": (
                    "living-frame-comfyui-hardened-runtime"
                    "-pruned-private-build-verifier-v1"
                ),
                "status": "passed",
                "uid": os.getuid(),
                "gid": os.getgid(),
                "baseVerifierStatus": base_receipt["status"],
                "distributionCount": base_receipt["distributionCount"],
                "torch": base_receipt["torch"],
                "torchCudaBuild": base_receipt["torchCudaBuild"],
                "torchvision": base_receipt["torchvision"],
                "torchaudio": base_receipt["torchaudio"],
                "pillow": base_receipt["pillow"],
                "transformers": base_receipt["transformers"],
                "huggingfaceHub": base_receipt["huggingfaceHub"],
                "sam2ImportDenied": base_receipt["sam2ImportDenied"],
                "inheritedSam2DistributionPresent": False,
                "inheritedSam2ModuleImportable": False,
                "inheritedSam2TrainingModuleImportable": False,
                "operationVenvInstallerMetadataPresent": False,
                "buildToolchainPresent": False,
                "networkTrustStorePresent": False,
                "systemPipPresent": system_pip_present,
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
