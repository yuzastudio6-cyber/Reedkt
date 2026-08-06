#!/usr/bin/env python3
"""Verify the complete private Track All L4 task-QA image capsule."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat


ROOT = Path("/tmp/track-all-task-qa-private-build-input")
MANIFEST = ROOT / "capsule-manifest.json"
EXPECTED_MANIFEST_SHA256 = os.environ.get(
    "WEEDITPRO_TRACK_ALL_TASK_QA_PRIVATE_CAPSULE_MANIFEST_SHA256", ""
)
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
MAXIMUM_FILES = 10_000
MAXIMUM_FILE_BYTES = 12 * 1024 * 1024 * 1024
REQUIRED_ROLES = {
    "python_requirement_lock", "python_wheel", "opencv_cuda_receipt",
    "opencv_cuda_build_information", "opencv_cuda_python_module",
    "opencv_cuda_shared_library", "opencv_source_license",
    "opencv_contrib_source_license",
    "cuda_forward_compat_package", "cuda_forward_compat_ingest_receipt",
    "cuda_npp_shared_library", "cuda_npp_ingest_receipt",
    "cuda_npp_license",
    "ubuntu_security_package", "ubuntu_security_ingest_receipt",
}
MANIFEST_KEYS = {
    "schemaVersion", "capsuleId", "artifacts", "runtimeDownloadsAllowed",
    "containsCredentials", "containsCustomerMedia", "containsModelWeights",
}
ARTIFACT_KEYS = {"path", "role", "byteLength", "sha256"}
REQUIREMENTS = (
    "kornia==0.8.3 --hash=sha256:0b15f5d359aeafd7ff54ea631ed1943a3eb295c4a6dae3f745ddeada25e33289\n"
    "kornia-rs==0.1.14 --hash=sha256:396f84661fcf260885c3f9db717caf6904eafd44857dca17be09a835bd7da8d9\n"
    "numpy==2.2.6 --hash=sha256:fd83c01228a688733f1ded5201c678f0c53ecc1006ffbc404db9f7a899ac6249\n"
    "nvidia-ml-py==13.610.43 --hash=sha256:f13c72698edef492f985cc225f14faafe68ae065a2e407f45bdf6f4b9b43fde8\n"
    "packaging==26.3 --hash=sha256:d7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c\n"
    "pillow==12.3.0 --hash=sha256:78cb2c6865a35ab8ff8b75fd122f6033b92a62c82801110e48ddd6c936a45d91\n"
).encode("utf-8")
OPENCV_RECEIPT_KEYS = {
    "schemaVersion", "opencvVersion", "sourceRepository", "sourceCommitSha",
    "sourceArchiveSha256", "sourceReleaseTag",
    "sourceReleaseTagSignatureVerified", "licenseSpdx", "builderImage",
    "opencvContribRepository", "opencvContribCommitSha",
    "opencvContribArchiveSha256", "opencvContribReleaseTag",
    "opencvContribReleaseTagSignatureVerified",
    "runtimeBaseImage", "cudaToolkitVersion", "cudaArchitecture",
    "buildList", "sharedLibraries", "fastMathEnabled",
    "nonFreeAlgorithmsEnabled", "runtimeNetworkDownloadsAllowed",
    "pythonImportPassed", "cudaPythonBindingsPresent",
    "opencvBuildInformationSha256", "runtimeArtifactSetSha256",
}
CUDA_RECEIPT = {
    "schemaVersion": "weeditpro-cuda-forward-compat-ingest-receipt-v1",
    "packageName": "cuda-compat-12-8",
    "packageVersion": "570.211.01-0ubuntu1",
    "architecture": "amd64",
    "source": "official_nvidia_cuda_ubuntu_2404_repository",
    "sha256": "e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893",
    "byteLength": 37945232,
    "containsCredentials": False,
    "containsCustomerMedia": False,
    "containsModelWeights": False,
}
CUDA_NPP_LIBRARIES = {
    "libnppc.so.12": (1656080, "69c1468de02b2951a3c9755a76b8246b83fbf4d8f137fd1e843767a76c344ae7"),
    "libnppial.so.12": (22046288, "d37c9d285930dca5da32ccce15594bccdadde6da71fd1c297f79d7b435b50ce6"),
    "libnppidei.so.12": (13633464, "8397ce991612229cf673dce3b594187c61ada782d5cf61f4a7212cdd84e1e552"),
    "libnppig.so.12": (55871152, "f24d72d82ceea1b0833a2429cebd6903f0d9ca961841ee413cf6bdea7d0d1129"),
    "libnppist.so.12": (49739688, "adcaf330d4ba448d5b9f9e8e269d97e05e9c888720ee19cbbd484170fb59ac36"),
    "libnppitc.so.12": (6686096, "cb0bbbc4d1f08d30bfedde3a862be3a20426e6fdc45636c822fd1bf7ebe32ae9"),
}
CUDA_NPP_LICENSE_SHA256 = (
    "e4196076c5496c4bb5509be61e3d1cddf36b92a449a10ece1779afce3c65e684"
)
UBUNTU_SECURITY_PACKAGES = {
    "libssl3t64_3.0.13-0ubuntu3.12_amd64.deb": (
        "libssl3t64", 1942240,
        "6a963adb1106fca567d24d4a1e5da0bad25de79ac2564cd1ba846e677e1c951b",
    ),
    "openssl_3.0.13-0ubuntu3.12_amd64.deb": (
        "openssl", 1002894,
        "321b30ad5a1c3783cb3d73ae439f824f6d3874d76a93a62f4a984959b490aa7b",
    ),
}


def read_regular(path: Path, maximum: int, retain: bool = False) -> tuple[int, str, bytes | None]:
    if path.is_symlink():
        raise ValueError("capsule symlink forbidden")
    descriptor = os.open(
        path,
        os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0),
    )
    digest = hashlib.sha256()
    body: list[bytes] | None = [] if retain else None
    observed = 0
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode) or not 1 <= before.st_size <= maximum:
            raise ValueError("capsule file size or type invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum:
                raise ValueError("capsule file exceeded bound")
            digest.update(chunk)
            if body is not None:
                body.append(chunk)
        after = os.fstat(descriptor)
        if (
            before.st_dev != after.st_dev or before.st_ino != after.st_ino
            or before.st_size != after.st_size
            or before.st_mtime_ns != after.st_mtime_ns
            or observed != before.st_size
        ):
            raise ValueError("capsule file changed during verification")
        return observed, digest.hexdigest(), b"".join(body) if body is not None else None
    finally:
        os.close(descriptor)


def safe_relative_path(value: object) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ValueError("capsule path invalid")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError("capsule traversal forbidden")
    return value


def expected_role(relative: str) -> str:
    if relative == "python/requirements.lock.txt":
        return "python_requirement_lock"
    if relative.startswith("python/wheelhouse/") and re.fullmatch(
        r"[A-Za-z0-9][A-Za-z0-9._+-]{0,199}\.whl",
        relative.removeprefix("python/wheelhouse/"),
    ):
        return "python_wheel"
    if relative == "opencv/opencv-cuda-receipt.json":
        return "opencv_cuda_receipt"
    if relative == "opencv/opencv-build-information.txt":
        return "opencv_cuda_build_information"
    if relative == "opencv/LICENSE":
        return "opencv_source_license"
    if relative == "opencv/CONTRIB_LICENSE":
        return "opencv_contrib_source_license"
    if relative.startswith("opencv/install/python/") and relative.endswith(".so"):
        return "opencv_cuda_python_module"
    if relative.startswith("opencv/install/lib/") and ".so" in relative:
        return "opencv_cuda_shared_library"
    if relative.startswith("opencv/install/"):
        return "opencv_cuda_runtime_file"
    if relative == (
        "cuda-forward-compat/"
        "cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb"
    ):
        return "cuda_forward_compat_package"
    if relative == (
        "cuda-forward-compat/"
        "cuda-forward-compat-ingest-receipt.json"
    ):
        return "cuda_forward_compat_ingest_receipt"
    if relative == "cuda-npp/cuda-npp-runtime-receipt.json":
        return "cuda_npp_ingest_receipt"
    if relative == "cuda-npp/NGC-DL-CONTAINER-LICENSE":
        return "cuda_npp_license"
    if relative.startswith("cuda-npp/lib/"):
        soname = relative.removeprefix("cuda-npp/lib/")
        if soname in CUDA_NPP_LIBRARIES:
            return "cuda_npp_shared_library"
    if relative.startswith("os-security/"):
        name = relative.removeprefix("os-security/")
        if name in UBUNTU_SECURITY_PACKAGES:
            return "ubuntu_security_package"
        if name == "ubuntu-runtime-security-closure-receipt.json":
            return "ubuntu_security_ingest_receipt"
    raise ValueError("capsule artifact path is not allowlisted")


def validate_ubuntu_security_receipt(expected: dict[str, object]) -> None:
    receipt_path = "os-security/ubuntu-runtime-security-closure-receipt.json"
    _length, _digest, body = read_regular(ROOT / receipt_path, 1024 * 1024, True)
    if body is None:
        raise ValueError("Ubuntu runtime security receipt body missing")
    value = json.loads(body.decode("utf-8"))
    expected_value = {
        "schemaVersion": "weeditpro-ubuntu-runtime-security-closure-receipt-v1",
        "distribution": "ubuntu",
        "release": "noble-updates",
        "architecture": "amd64",
        "source": "official_ubuntu_archive",
        "packages": [
            {
                "packageName": package_name,
                "packageVersion": "3.0.13-0ubuntu3.12",
                "sha256": sha256,
                "byteLength": byte_length,
            }
            for _filename, (package_name, byte_length, sha256)
            in sorted(UBUNTU_SECURITY_PACKAGES.items())
        ],
        "runtimePackageManagersAllowed": False,
        "runtimeNetworkClientsAllowed": False,
        "removedRuntimePackages": [
            "base-pillow", "pip", "python3-pip", "python3-wheel",
            "setuptools", "urllib3", "wheel",
        ],
        "runtimeNetworkDownloadsAllowed": False,
        "containsCredentials": False,
        "containsCustomerMedia": False,
        "containsModelWeights": False,
    }
    if value != expected_value:
        raise ValueError("Ubuntu runtime security receipt changed")
    for filename, (_package_name, byte_length, sha256) in UBUNTU_SECURITY_PACKAGES.items():
        artifact = expected.get(f"os-security/{filename}")
        if not isinstance(artifact, dict) or (
            artifact.get("byteLength"), artifact.get("sha256")
        ) != (byte_length, sha256):
            raise ValueError("Ubuntu security package manifest lineage invalid")


def validate_cuda_npp_receipt(expected: dict[str, object]) -> None:
    receipt_path = "cuda-npp/cuda-npp-runtime-receipt.json"
    _length, _digest, body = read_regular(
        ROOT / receipt_path, 1024 * 1024, True
    )
    if body is None:
        raise ValueError("CUDA NPP receipt body missing")
    value = json.loads(body.decode("utf-8"))
    expected_keys = {
        "schemaVersion", "builderImage", "runtimeBaseImage",
        "cudaToolkitVersion", "architecture", "sourceDirectory",
        "opencvNeededSonames", "libraries", "licensePath",
        "licenseSha256", "runtimeNetworkDownloadsAllowed",
        "containsCredentials", "containsCustomerMedia",
        "containsModelWeights",
    }
    if not isinstance(value, dict) or set(value) != expected_keys:
        raise ValueError("CUDA NPP receipt shape invalid")
    exact = {
        "schemaVersion": "weeditpro-cuda-npp-runtime-receipt-v1",
        "builderImage": "pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081",
        "runtimeBaseImage": "pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca",
        "cudaToolkitVersion": "12.8",
        "architecture": "x86_64",
        "sourceDirectory": "/usr/local/cuda-12.8/targets/x86_64-linux/lib",
        "opencvNeededSonames": sorted(CUDA_NPP_LIBRARIES),
        "licensePath": "/NGC-DL-CONTAINER-LICENSE",
        "licenseSha256": CUDA_NPP_LICENSE_SHA256,
        "runtimeNetworkDownloadsAllowed": False,
        "containsCredentials": False,
        "containsCustomerMedia": False,
        "containsModelWeights": False,
    }
    if any(value.get(key) != item for key, item in exact.items()):
        raise ValueError("CUDA NPP receipt authority invalid")
    libraries = value["libraries"]
    if not isinstance(libraries, list) or len(libraries) != len(CUDA_NPP_LIBRARIES):
        raise ValueError("CUDA NPP library set invalid")
    expected_library_records = []
    for soname in sorted(CUDA_NPP_LIBRARIES):
        byte_length, sha256 = CUDA_NPP_LIBRARIES[soname]
        path = f"cuda-npp/lib/{soname}"
        artifact = expected.get(path)
        if not isinstance(artifact, dict) or (
            artifact.get("byteLength"), artifact.get("sha256")
        ) != (byte_length, sha256):
            raise ValueError("CUDA NPP manifest lineage invalid")
        expected_library_records.append({
            "soname": soname,
            "sourcePath": (
                "/usr/local/cuda-12.8/targets/x86_64-linux/lib/"
                + {
                    "libnppc.so.12": "libnppc.so.12.3.3.100",
                    "libnppial.so.12": "libnppial.so.12.3.3.100",
                    "libnppidei.so.12": "libnppidei.so.12.3.3.100",
                    "libnppig.so.12": "libnppig.so.12.3.3.100",
                    "libnppist.so.12": "libnppist.so.12.3.3.100",
                    "libnppitc.so.12": "libnppitc.so.12.3.3.100",
                }[soname]
            ),
            "byteLength": byte_length,
            "sha256": sha256,
        })
    if libraries != expected_library_records:
        raise ValueError("CUDA NPP library receipt changed")
    license_artifact = expected.get("cuda-npp/NGC-DL-CONTAINER-LICENSE")
    if not isinstance(license_artifact, dict) or (
        license_artifact.get("sha256") != CUDA_NPP_LICENSE_SHA256
    ):
        raise ValueError("CUDA NPP license lineage invalid")


def validate_opencv_receipt(expected: dict[str, object]) -> None:
    _length, _digest, body = read_regular(
        ROOT / "opencv/opencv-cuda-receipt.json", 1024 * 1024, True
    )
    if body is None:
        raise ValueError("OpenCV CUDA receipt body missing")
    value = json.loads(body.decode("utf-8"))
    if not isinstance(value, dict) or set(value) != OPENCV_RECEIPT_KEYS:
        raise ValueError("OpenCV CUDA receipt shape invalid")
    exact = {
        "schemaVersion": "weeditpro-opencv-cuda-runtime-receipt-v1",
        "opencvVersion": "4.12.0",
        "sourceRepository": "https://github.com/opencv/opencv",
        "sourceCommitSha": "49486f61fb25722cbcf586b7f4320921d46fb38e",
        "sourceArchiveSha256": "8f00b42869ab2836be36090f6631ae4c38ba59171e22a69a8e0f92f8ef1771d4",
        "sourceReleaseTag": "4.12.0",
        "sourceReleaseTagSignatureVerified": False,
        "opencvContribRepository": "https://github.com/opencv/opencv_contrib",
        "opencvContribCommitSha": "d943e1d61c8bc556a13783e1546ee7c1a9e0b1cf",
        "opencvContribArchiveSha256": "79b55fa0d0edc6b2766f20cc97baf9dcee5f974870d5afeb1f8e3c623623b59b",
        "opencvContribReleaseTag": "4.12.0",
        "opencvContribReleaseTagSignatureVerified": False,
        "licenseSpdx": "Apache-2.0",
        "builderImage": "pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081",
        "runtimeBaseImage": "pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca",
        "cudaToolkitVersion": "12.8",
        "cudaArchitecture": "8.9",
        "buildList": ["core", "imgproc", "cudev", "cudaarithm", "python3"],
        "sharedLibraries": True,
        "fastMathEnabled": False,
        "nonFreeAlgorithmsEnabled": False,
        "runtimeNetworkDownloadsAllowed": False,
        "pythonImportPassed": True,
        "cudaPythonBindingsPresent": True,
    }
    if any(value[key] != item for key, item in exact.items()):
        raise ValueError("OpenCV CUDA receipt authority invalid")
    information = expected.get("opencv/opencv-build-information.txt")
    if not isinstance(information, dict) or value["opencvBuildInformationSha256"] != information["sha256"]:
        raise ValueError("OpenCV CUDA build-information lineage invalid")
    runtime_lines = bytearray()
    for relative, artifact in sorted(expected.items()):
        if not relative.startswith("opencv/install/"):
            continue
        install_relative = relative.removeprefix("opencv/install/")
        runtime_lines.extend(
            f'{artifact["sha256"]}  ./{install_relative}\n'.encode("utf-8")
        )
    if hashlib.sha256(runtime_lines).hexdigest() != value["runtimeArtifactSetSha256"]:
        raise ValueError("OpenCV CUDA runtime artifact set changed")


def main() -> None:
    if RAW_SHA256.fullmatch(EXPECTED_MANIFEST_SHA256) is None:
        raise ValueError("expected capsule manifest digest missing")
    _length, digest, body = read_regular(MANIFEST, 8 * 1024 * 1024, True)
    if digest != EXPECTED_MANIFEST_SHA256 or body is None:
        raise ValueError("capsule manifest identity mismatch")
    manifest = json.loads(body.decode("utf-8"))
    if not isinstance(manifest, dict) or set(manifest) != MANIFEST_KEYS:
        raise ValueError("capsule manifest shape invalid")
    if (
        manifest["schemaVersion"]
        != "weeditpro-track-all-sam3_1-l4-task-qa-private-build-capsule-v1"
        or not isinstance(manifest["capsuleId"], str)
        or SAFE_ID.fullmatch(manifest["capsuleId"]) is None
        or manifest["runtimeDownloadsAllowed"] is not False
        or manifest["containsCredentials"] is not False
        or manifest["containsCustomerMedia"] is not False
        or manifest["containsModelWeights"] is not False
    ):
        raise ValueError("capsule policy invalid")
    artifacts = manifest["artifacts"]
    if not isinstance(artifacts, list) or not 1 <= len(artifacts) <= MAXIMUM_FILES:
        raise ValueError("capsule artifact list invalid")
    paths: set[str] = set()
    roles: set[str] = set()
    artifact_by_path: dict[str, dict[str, object]] = {}
    ordered_paths: list[str] = []
    for artifact in artifacts:
        if not isinstance(artifact, dict) or set(artifact) != ARTIFACT_KEYS:
            raise ValueError("capsule artifact shape invalid")
        relative = safe_relative_path(artifact["path"])
        if relative == "capsule-manifest.json" or relative in paths:
            raise ValueError("capsule artifact path duplicated")
        if (
            not isinstance(artifact["role"], str)
            or SAFE_ID.fullmatch(artifact["role"]) is None
            or artifact["role"] != expected_role(relative)
            or isinstance(artifact["byteLength"], bool)
            or not isinstance(artifact["byteLength"], int)
            or not 1 <= artifact["byteLength"] <= MAXIMUM_FILE_BYTES
            or not isinstance(artifact["sha256"], str)
            or RAW_SHA256.fullmatch(artifact["sha256"]) is None
        ):
            raise ValueError("capsule artifact authority invalid")
        length, item_digest, _body = read_regular(ROOT / relative, MAXIMUM_FILE_BYTES)
        if length != artifact["byteLength"] or item_digest != artifact["sha256"]:
            raise ValueError("capsule artifact identity mismatch")
        paths.add(relative)
        roles.add(artifact["role"])
        artifact_by_path[relative] = artifact
        ordered_paths.append(relative)
    if ordered_paths != sorted(ordered_paths):
        raise ValueError("capsule artifact list is not canonically ordered")
    if not REQUIRED_ROLES.issubset(roles):
        raise ValueError("capsule required artifact role missing")
    actual: set[str] = set()
    for directory, directories, files in os.walk(ROOT, followlinks=False):
        current = Path(directory)
        if current.is_symlink():
            raise ValueError("capsule directory symlink forbidden")
        for name in directories:
            if (current / name).is_symlink():
                raise ValueError("capsule directory symlink forbidden")
        for name in files:
            path = current / name
            if path.is_symlink():
                raise ValueError("capsule file symlink forbidden")
            actual.add(path.relative_to(ROOT).as_posix())
    if actual != paths | {"capsule-manifest.json"}:
        raise ValueError("capsule contains undeclared or missing files")
    _length, _digest, requirements = read_regular(
        ROOT / "python/requirements.lock.txt", 1024 * 1024, True
    )
    if requirements != REQUIREMENTS:
        raise ValueError("capsule requirements lock changed")
    validate_opencv_receipt(artifact_by_path)
    _length, _digest, cuda_receipt = read_regular(
        ROOT / "cuda-forward-compat/cuda-forward-compat-ingest-receipt.json",
        1024 * 1024,
        True,
    )
    if cuda_receipt is None or json.loads(cuda_receipt.decode("utf-8")) != CUDA_RECEIPT:
        raise ValueError("CUDA forward-compatibility receipt changed")
    validate_cuda_npp_receipt(artifact_by_path)
    validate_ubuntu_security_receipt(artifact_by_path)


if __name__ == "__main__":
    main()
