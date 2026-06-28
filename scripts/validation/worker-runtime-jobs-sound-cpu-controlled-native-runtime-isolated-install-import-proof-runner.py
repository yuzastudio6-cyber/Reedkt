#!/usr/bin/env python3
"""Controlled isolated install/import proof for SOUND CPU native runtime lanes.

This runner intentionally does not open media, execute workers/routes/tools, run
Docker/GCP, touch Supabase, create artifacts, or claim runtime readiness.
"""

from __future__ import annotations

import contextlib
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time


REPO_ROOT = Path(__file__).resolve().parents[2]
PYTHON = shutil.which("python3") or sys.executable
DECISION_PASS = (
    "worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_"
    "passed_with_warnings_ready_for_source_install_closure_owner_review_no_media_no_production"
)
DECISION_DUPLICATE = (
    "worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_"
    "blocked_native_duplicate_warning_no_media_no_production"
)

DUPLICATE_WARNING_MARKERS = [
    "Class AVFFrameReceiver is implemented in both",
    "Class AVFMediaSelectionGroup is implemented in both",
    "objc[",
    "One of the two will be used. Which one is undefined.",
]

LANES = [
    {
        "id": "shared",
        "requirements": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
        "metadata": {
            "duckdb": "1.5.4",
            "polars": "1.42.0",
            "opentimelineio": "0.18.1",
        },
        "imports": ["duckdb", "polars", "opentimelineio"],
    },
    {
        "id": "pyav",
        "requirements": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
        "metadata": {
            "av": "17.1.0",
        },
        "imports": ["av"],
    },
    {
        "id": "opencv_scenedetect",
        "requirements": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
        "metadata": {
            "scenedetect": "0.7",
            "opencv-python-headless": "4.13.0.92",
        },
        "imports": ["cv2", "scenedetect"],
    },
]


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 900) -> dict[str, object]:
    started = time.monotonic()
    completed = subprocess.run(
        cmd,
        cwd=str(cwd or REPO_ROOT),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=False,
    )
    return {
        "cmd": [Path(cmd[0]).name, *cmd[1:]],
        "exitCode": completed.returncode,
        "durationSeconds": round(time.monotonic() - started, 3),
        "stdout": sanitize_output(completed.stdout),
        "stderr": sanitize_output(completed.stderr),
    }


def sanitize_output(text: str) -> str:
    text = text.replace(str(REPO_ROOT), "<repo>")
    text = text.replace(str(Path.home()), "<home>")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines[-80:])


def contains_duplicate_warning(*chunks: str) -> bool:
    combined = "\n".join(chunks)
    return any(marker in combined for marker in DUPLICATE_WARNING_MARKERS)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def lane_import_script(lane: dict[str, object]) -> str:
    imports = lane["imports"]
    metadata = lane["metadata"]
    assert isinstance(imports, list)
    assert isinstance(metadata, dict)
    return "\n".join(
        [
            "import importlib",
            "import importlib.metadata",
            "import json",
            f"imports = {json.dumps(imports)}",
            f"expected = {json.dumps(metadata, sort_keys=True)}",
            "versions = {}",
            "for package, wanted in expected.items():",
            "    got = importlib.metadata.version(package)",
            "    if got != wanted:",
            "        raise SystemExit(f'{package} metadata mismatch: {got} != {wanted}')",
            "    versions[package] = got",
            "for module in imports:",
            "    importlib.import_module(module)",
            "print(json.dumps({'versions': versions, 'imports': imports}, sort_keys=True))",
        ]
    )


def prove_lane(root: Path, lane: dict[str, object]) -> dict[str, object]:
    lane_id = str(lane["id"])
    requirements = REPO_ROOT / str(lane["requirements"])
    venv = root / lane_id
    lane_result: dict[str, object] = {
        "lane": lane_id,
        "requirements": str(lane["requirements"]),
        "venvInsideRepo": False,
        "installSucceeded": False,
        "metadataPassed": False,
        "importsPassed": False,
        "nativeDuplicateWarningDetected": False,
    }

    if not requirements.exists():
        lane_result["error"] = f"missing requirements file: {lane['requirements']}"
        return lane_result

    create = run([PYTHON, "-m", "venv", str(venv)], timeout=300)
    lane_result["venvCreate"] = {
        "exitCode": create["exitCode"],
        "durationSeconds": create["durationSeconds"],
    }
    if create["exitCode"] != 0:
        lane_result["error"] = create["stderr"] or create["stdout"]
        return lane_result

    python_bin = venv / "bin" / "python"
    pip_bin = venv / "bin" / "pip"
    install = run(
        [
            str(pip_bin),
            "install",
            "--no-cache-dir",
            "--disable-pip-version-check",
            "-r",
            str(requirements),
        ],
        timeout=1800,
    )
    lane_result["install"] = {
        "exitCode": install["exitCode"],
        "durationSeconds": install["durationSeconds"],
        "duplicateWarningDetected": contains_duplicate_warning(str(install["stdout"]), str(install["stderr"])),
    }
    lane_result["nativeDuplicateWarningDetected"] = bool(lane_result["install"]["duplicateWarningDetected"])
    if install["exitCode"] != 0:
        lane_result["error"] = install["stderr"] or install["stdout"]
        return lane_result
    lane_result["installSucceeded"] = True

    proof = run([str(python_bin), "-c", lane_import_script(lane)], timeout=300)
    lane_result["importProof"] = {
        "exitCode": proof["exitCode"],
        "durationSeconds": proof["durationSeconds"],
        "stdout": proof["stdout"],
        "stderr": proof["stderr"],
        "duplicateWarningDetected": contains_duplicate_warning(str(proof["stdout"]), str(proof["stderr"])),
    }
    lane_result["nativeDuplicateWarningDetected"] = bool(
        lane_result["nativeDuplicateWarningDetected"] or lane_result["importProof"]["duplicateWarningDetected"]
    )
    if proof["exitCode"] != 0:
        lane_result["error"] = proof["stderr"] or proof["stdout"]
        return lane_result

    try:
        parsed = json.loads(str(proof["stdout"]).splitlines()[-1])
    except (json.JSONDecodeError, IndexError) as exc:
        lane_result["error"] = f"failed to parse import proof output: {exc}"
        return lane_result

    lane_result["metadataVersions"] = parsed["versions"]
    lane_result["imports"] = parsed["imports"]
    lane_result["metadataPassed"] = True
    lane_result["importsPassed"] = True
    return lane_result


def main() -> int:
    package_lock = REPO_ROOT / "package-lock.json"
    before_hash = file_sha256(package_lock)
    temp_root = Path(
        tempfile.mkdtemp(prefix="reeditpro-sound-cpu-isolated-proof-", dir="/private/tmp")
    )
    temp_removed = False
    lanes: list[dict[str, object]] = []
    try:
        for lane in LANES:
            lanes.append(prove_lane(temp_root, lane))
    finally:
        with contextlib.suppress(FileNotFoundError):
            shutil.rmtree(temp_root)
            temp_removed = True

    after_hash = file_sha256(package_lock)
    duplicate_warning_detected = any(bool(lane.get("nativeDuplicateWarningDetected")) for lane in lanes)
    all_installed = all(bool(lane.get("installSucceeded")) for lane in lanes)
    all_metadata = all(bool(lane.get("metadataPassed")) for lane in lanes)
    all_imports = all(bool(lane.get("importsPassed")) for lane in lanes)
    package_lock_unchanged = before_hash == after_hash
    passed = (
        all_installed
        and all_metadata
        and all_imports
        and not duplicate_warning_detected
        and package_lock_unchanged
        and temp_removed
    )

    result = {
        "decision": DECISION_PASS if passed else DECISION_DUPLICATE if duplicate_warning_detected else "worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_blocked_dependency_failure_no_media_no_production",
        "sourceHead": "2b4c5b63b357ab62f6918357b6c13a0d65e6bb7f",
        "pythonVersion": subprocess.run(
            [PYTHON, "--version"],
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        ).stdout.strip(),
        "tempRoot": str(temp_root),
        "tempVenvRemoved": temp_removed,
        "packageLockHashBefore": before_hash,
        "packageLockHashAfter": after_hash,
        "packageLockUnchanged": package_lock_unchanged,
        "lanes": lanes,
        "summary": {
            "lanesChecked": len(lanes),
            "installSucceeded": all_installed,
            "metadataPassed": all_metadata,
            "importsPassed": all_imports,
            "nativeDuplicateWarningDetected": duplicate_warning_detected,
            "mediaFileOpen": False,
            "workerExecution": False,
            "routeExecution": False,
            "toolExecution": False,
            "dockerBuildRunPush": False,
            "gcpCloudRunSecretManager": False,
            "supabaseMutation": False,
            "sqlExecution": False,
            "artifactCreation": False,
            "realUserMediaBetaAllowed": False,
            "paidProductionAllowed": False,
            "runtimeReadinessClaimed": False,
        },
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
