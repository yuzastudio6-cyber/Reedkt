#!/usr/bin/env python3
"""Verify the complete private L4 visual-evidence build capsule."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat


ROOT = Path("/tmp/visual-evidence-private-build-input")
MANIFEST = ROOT / "capsule-manifest.json"
EXPECTED_MANIFEST_SHA256 = os.environ.get(
    "WEEDITPRO_VISUAL_EVIDENCE_PRIVATE_CAPSULE_MANIFEST_SHA256",
    "",
)
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
MAXIMUM_FILES = 20_000
MAXIMUM_FILE_BYTES = 12 * 1024 * 1024 * 1024
REQUIRED_ROLES = {
    "python_requirement_lock",
    "python_wheel",
    "ffmpeg_binary",
    "ffprobe_binary",
    "ffmpeg_cuda_receipt",
    "opencv_cuda_receipt",
    "paddleocr_model_manifest",
    "paddleocr_model_file",
}
ALLOWED_KEYS = {
    "schemaVersion",
    "capsuleId",
    "artifacts",
    "runtimeDownloadsAllowed",
    "containsCredentials",
    "containsCustomerMedia",
}
ARTIFACT_KEYS = {"path", "role", "byteLength", "sha256"}


def read_regular(
    path: Path,
    maximum_bytes: int,
    *,
    retain_bytes: bool = False,
) -> tuple[int, str, bytes | None]:
    if path.is_symlink():
        raise ValueError("capsule symlink forbidden")
    descriptor = os.open(
        path,
        os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0),
    )
    digest = hashlib.sha256()
    body: list[bytes] | None = [] if retain_bytes else None
    observed = 0
    try:
        before = os.fstat(descriptor)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_size < 1
            or before.st_size > maximum_bytes
        ):
            raise ValueError("capsule file size or type invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum_bytes:
                raise ValueError("capsule file exceeded bound")
            digest.update(chunk)
            if body is not None:
                body.append(chunk)
        after = os.fstat(descriptor)
        if (
            before.st_dev != after.st_dev
            or before.st_ino != after.st_ino
            or before.st_size != after.st_size
            or before.st_mtime_ns != after.st_mtime_ns
            or observed != before.st_size
        ):
            raise ValueError("capsule file changed during verification")
        return (
            observed,
            digest.hexdigest(),
            b"".join(body) if body is not None else None,
        )
    finally:
        os.close(descriptor)


def safe_relative_path(value: object) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ValueError("capsule artifact path invalid")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError("capsule artifact traversal forbidden")
    return value


def main() -> None:
    if RAW_SHA256.fullmatch(EXPECTED_MANIFEST_SHA256) is None:
        raise ValueError("expected capsule manifest digest missing")
    _size, digest, body = read_regular(
        MANIFEST,
        8 * 1024 * 1024,
        retain_bytes=True,
    )
    if digest != EXPECTED_MANIFEST_SHA256:
        raise ValueError("capsule manifest digest mismatch")
    if body is None:
        raise ValueError("capsule manifest body missing")
    manifest = json.loads(body.decode("utf-8"))
    if not isinstance(manifest, dict) or set(manifest) != ALLOWED_KEYS:
        raise ValueError("capsule manifest shape invalid")
    if (
        manifest["schemaVersion"]
        != "weeditpro-l4-visual-evidence-private-build-capsule-v1"
        or not isinstance(manifest["capsuleId"], str)
        or SAFE_ID.fullmatch(manifest["capsuleId"]) is None
        or manifest["runtimeDownloadsAllowed"] is not False
        or manifest["containsCredentials"] is not False
        or manifest["containsCustomerMedia"] is not False
    ):
        raise ValueError("capsule manifest policy invalid")
    artifacts = manifest["artifacts"]
    if (
        not isinstance(artifacts, list)
        or not artifacts
        or len(artifacts) > MAXIMUM_FILES
    ):
        raise ValueError("capsule artifact list invalid")
    expected_paths: set[str] = set()
    observed_roles: set[str] = set()
    for artifact in artifacts:
        if not isinstance(artifact, dict) or set(artifact) != ARTIFACT_KEYS:
            raise ValueError("capsule artifact shape invalid")
        relative = safe_relative_path(artifact["path"])
        if relative == "capsule-manifest.json" or relative in expected_paths:
            raise ValueError("capsule artifact path duplicated")
        if (
            not isinstance(artifact["role"], str)
            or SAFE_ID.fullmatch(artifact["role"]) is None
            or isinstance(artifact["byteLength"], bool)
            or not isinstance(artifact["byteLength"], int)
            or artifact["byteLength"] < 1
            or artifact["byteLength"] > MAXIMUM_FILE_BYTES
            or not isinstance(artifact["sha256"], str)
            or RAW_SHA256.fullmatch(artifact["sha256"]) is None
        ):
            raise ValueError("capsule artifact authority invalid")
        byte_length, artifact_digest, _body = read_regular(
            ROOT / relative,
            MAXIMUM_FILE_BYTES,
            retain_bytes=False,
        )
        if (
            byte_length != artifact["byteLength"]
            or artifact_digest != artifact["sha256"]
        ):
            raise ValueError("capsule artifact identity mismatch")
        expected_paths.add(relative)
        observed_roles.add(artifact["role"])
    if not REQUIRED_ROLES.issubset(observed_roles):
        raise ValueError("capsule required artifact role missing")
    actual_paths: set[str] = set()
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
            actual_paths.add(path.relative_to(ROOT).as_posix())
    if actual_paths != expected_paths | {"capsule-manifest.json"}:
        raise ValueError("capsule contains undeclared or missing files")


if __name__ == "__main__":
    main()
