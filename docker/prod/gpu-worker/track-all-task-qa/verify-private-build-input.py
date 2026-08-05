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
    "cuda_forward_compat_package", "cuda_forward_compat_ingest_receipt",
}
MANIFEST_KEYS = {
    "schemaVersion", "capsuleId", "artifacts", "runtimeDownloadsAllowed",
    "containsCredentials", "containsCustomerMedia", "containsModelWeights",
}
ARTIFACT_KEYS = {"path", "role", "byteLength", "sha256"}


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
    for artifact in artifacts:
        if not isinstance(artifact, dict) or set(artifact) != ARTIFACT_KEYS:
            raise ValueError("capsule artifact shape invalid")
        relative = safe_relative_path(artifact["path"])
        if relative == "capsule-manifest.json" or relative in paths:
            raise ValueError("capsule artifact path duplicated")
        if (
            not isinstance(artifact["role"], str)
            or SAFE_ID.fullmatch(artifact["role"]) is None
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


if __name__ == "__main__":
    main()
