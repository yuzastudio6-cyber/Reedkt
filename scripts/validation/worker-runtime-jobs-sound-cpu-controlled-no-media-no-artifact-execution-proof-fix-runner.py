#!/usr/bin/env python3
"""Isolate SOUND CPU package import timeout without media or artifacts."""

from __future__ import annotations

import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import textwrap
import time
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIREMENTS_PATH = (
    REPO_ROOT
    / "server"
    / "workers"
    / "sound-oss-tools-controlled-install"
    / "requirements.sound-oss-tools.txt"
)

PASS_DECISION = (
    "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_"
    "passed_with_warnings_ready_for_package_proof_owner_review"
)
BLOCKED_DECISION = (
    "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_"
    "blocked_import_timeout"
)

PACKAGES = [
    ("librosa", "0.11.0", "librosa"),
    ("audioread", "3.1.0", "audioread"),
    ("pydub", "0.25.1", "pydub"),
    ("scipy", "1.17.1", "scipy"),
    ("resampy", "0.4.3", "resampy"),
    ("pyloudnorm", "0.2.0", "pyloudnorm"),
    ("audioflux", "0.1.9", "audioflux"),
    ("music21", "10.3.0", "music21"),
    ("pretty_midi", "0.2.11", "pretty_midi"),
    ("mido", "1.3.3", "mido"),
    ("noisereduce", "3.0.3", "noisereduce"),
    ("pedalboard", "0.9.23", "pedalboard"),
    ("mir_eval", "0.8.2", "mir_eval"),
]

IMPORT_MODULES = [
    "librosa",
    "audioread",
    "pydub",
    "scipy",
    "scipy.signal",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval",
]

SYNTHETIC_CHECKS = [
    (
        "scipy_in_memory_numeric_array_assertion",
        """
        import json
        import numpy as np
        from scipy import signal
        peaks, _ = signal.find_peaks(np.array([0.0, 1.0, 0.0]))
        assert peaks.tolist() == [1]
        print(json.dumps({"passed": True}))
        """,
    ),
    (
        "pyloudnorm_in_memory_loudness_shape_assertion",
        """
        import json
        import math
        import numpy as np
        import pyloudnorm as pyln
        meter = pyln.Meter(48000)
        loudness = meter.integrated_loudness(np.zeros(48000, dtype=float))
        assert math.isfinite(float(loudness)) or math.isinf(float(loudness))
        print(json.dumps({"passed": True}))
        """,
    ),
    (
        "music21_in_memory_symbolic_note_assertion",
        """
        import json
        from music21 import note
        n = note.Note("C4")
        assert n.pitch.nameWithOctave == "C4"
        print(json.dumps({"passed": True}))
        """,
    ),
    (
        "pretty_midi_in_memory_object_assertion",
        """
        import json
        import pretty_midi
        midi = pretty_midi.PrettyMIDI(initial_tempo=120)
        assert midi.get_tempo_changes()[1][0] == 120
        print(json.dumps({"passed": True}))
        """,
    ),
    (
        "mido_in_memory_message_assertion",
        """
        import json
        import mido
        msg = mido.Message("note_on", note=60, velocity=64)
        assert msg.type == "note_on" and msg.note == 60
        print(json.dumps({"passed": True}))
        """,
    ),
]

FALSE_RUNTIME_FLAGS = {
    "mediaFileOpenAttempted": False,
    "audioreadAudioOpenAttempted": False,
    "pydubMediaOperationAttempted": False,
    "ffmpegExecuted": False,
    "ffprobeExecuted": False,
    "modelDownloadAttempted": False,
    "providerCallAttempted": False,
    "workerExecutionAttempted": False,
    "routeExecutionAttempted": False,
    "toolRuntimeDispatchAttempted": False,
    "gcpCallAttempted": False,
    "dockerCloudRunAttempted": False,
    "supabaseMutationAttempted": False,
    "sqlExecutionAttempted": False,
    "artifactCreationAttempted": False,
    "signedUrlCreationAttempted": False,
    "publicArtifactCreationAttempted": False,
    "generatedLocalFixturePassedClaimed": False,
    "dryRunPassedClaimed": False,
    "runtimeReadinessClaimed": False,
    "toolCallReadinessClaimed": False,
    "mediaProcessingReadinessClaimed": False,
    "betaProductionReadinessClaimed": False,
}


def sanitize(value: str | None, temp_root: Path | None = None) -> str:
    if value is None:
        return ""
    text = value.replace("\r", "\n")
    text = re.sub(r"\bBearer\s+[A-Za-z0-9._-]+", "Bearer <redacted>", text)
    text = re.sub(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b", "<jwt-redacted>", text)
    text = re.sub(r"https://[a-z0-9.-]+\.supabase\.co", "https://<supabase-redacted>", text, flags=re.I)
    text = text.replace(str(REPO_ROOT), "<repo>")
    if temp_root is not None:
        text = text.replace(str(temp_root), "<temp-venv>")
    if len(text) > 4000:
        text = text[:3975] + "\n<truncated>"
    return text


def run(command: list[str], *, timeout: int, temp_root: Path | None, cwd: Path | None = None) -> dict[str, object]:
    started_at = time.time()
    env = os.environ.copy()
    env.setdefault("DEVELOPER_DIR", "/Library/Developer/CommandLineTools")
    try:
        process = subprocess.Popen(
            command,
            cwd=str(cwd) if cwd else None,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True,
        )
        stdout, stderr = process.communicate(timeout=timeout)
        return {
            "returncode": process.returncode,
            "durationSeconds": round(time.time() - started_at, 3),
            "stdout": sanitize(stdout, temp_root),
            "stderr": sanitize(stderr, temp_root),
            "timedOut": False,
        }
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout.decode("utf-8", "replace") if isinstance(exc.stdout, bytes) else exc.stdout
        stderr = exc.stderr.decode("utf-8", "replace") if isinstance(exc.stderr, bytes) else exc.stderr
        process = locals().get("process")
        if process is not None:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                more_stdout, more_stderr = process.communicate(timeout=5)
                stdout = (stdout or "") + (more_stdout or "")
                stderr = (stderr or "") + (more_stderr or "")
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                more_stdout, more_stderr = process.communicate()
                stdout = (stdout or "") + (more_stdout or "")
                stderr = (stderr or "") + (more_stderr or "")
        return {
            "returncode": None,
            "durationSeconds": round(time.time() - started_at, 3),
            "stdout": sanitize(stdout, temp_root),
            "stderr": sanitize(stderr, temp_root),
            "timedOut": True,
        }


def venv_python_path(venv_dir: Path) -> Path:
    return venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def expected_requirement_lines() -> list[str]:
    return [f"{name}=={version}" for name, version, _module in PACKAGES]


def read_requirements() -> list[str]:
    return [
        line.strip()
        for line in REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def module_import_script(module_name: str) -> str:
    return textwrap.dedent(
        f"""
        import importlib
        import json
        module = importlib.import_module({module_name!r})
        print(json.dumps({{"module": {module_name!r}, "passed": True, "moduleName": getattr(module, "__name__", {module_name!r})}}))
        """
    )


def metadata_script() -> str:
    return textwrap.dedent(
        f"""
        import importlib.metadata
        import json
        packages = {json.dumps(PACKAGES)}
        metadata = []
        for package_name, expected_version, module_name in packages:
            try:
                actual_version = importlib.metadata.version(package_name)
                metadata.append({{
                    "package": package_name,
                    "module": module_name,
                    "expectedVersion": expected_version,
                    "actualVersion": actual_version,
                    "passed": actual_version == expected_version
                }})
            except Exception as error:
                metadata.append({{
                    "package": package_name,
                    "module": module_name,
                    "expectedVersion": expected_version,
                    "actualVersion": None,
                    "passed": False,
                    "error": str(error)[:240]
                }})
        print(json.dumps({{"metadata": metadata}}))
        """
    )


def base_result() -> dict[str, object]:
    return {
        "status": "started",
        "decision": None,
        "sourceHead": None,
        "requirementsPath": str(REQUIREMENTS_PATH.relative_to(REPO_ROOT)),
        "directPinnedPackageCount": len(PACKAGES),
        "importCount": len(IMPORT_MODULES),
        "syntheticAssertionCount": len(SYNTHETIC_CHECKS),
        "falseRuntimeFlags": dict(FALSE_RUNTIME_FLAGS),
        "supabaseClassification": {
            "updateRequired": "no",
            "environmentTouched": "no",
            "sqlExecuted": "no",
            "migrationDeployed": "no",
            "nextAction": "none",
        },
        "commands": [],
        "metadata": [],
        "moduleImports": [],
        "syntheticAssertions": [],
        "errors": [],
        "warnings": [],
        "tempVenvPath": None,
        "tempVenvRemoved": False,
        "tempVenvRemovalError": None,
    }


def finish(result: dict[str, object], status: str, decision: str, return_code: int, temp_root: Path | None) -> int:
    if temp_root is not None and temp_root.exists():
        try:
            shutil.rmtree(temp_root)
            result["tempVenvRemoved"] = True
        except Exception as error:
            result["tempVenvRemoved"] = False
            result["tempVenvRemovalError"] = sanitize(str(error), temp_root)
            status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_cleanup_failed"
            decision = status
            return_code = 31
    elif temp_root is not None:
        result["tempVenvRemoved"] = True
    result["status"] = status
    result["decision"] = decision
    print(json.dumps(result, indent=2, sort_keys=True))
    return return_code


def main() -> int:
    result = base_result()
    temp_root: Path | None = None

    if not REQUIREMENTS_PATH.exists() or read_requirements() != expected_requirement_lines():
        result["errors"].append("approved requirements missing or drifted")
        return finish(result, "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_requirements_drift", "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_requirements_drift", 10, temp_root)

    temp_root = Path(tempfile.mkdtemp(prefix="reeditpro-sound-cpu-import-isolation-", dir="/private/tmp"))
    result["tempVenvPath"] = str(temp_root)
    head = run(["git", "rev-parse", "HEAD"], timeout=20, temp_root=temp_root, cwd=REPO_ROOT)
    result["sourceHead"] = head["stdout"].strip()

    venv_result = run([sys.executable, "-m", "venv", str(temp_root)], timeout=180, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append({"name": "venv_create", **venv_result})
    if venv_result["returncode"] != 0:
        result["errors"].append("venv creation failed")
        return finish(result, "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_venv_creation_failed", "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_venv_creation_failed", 11, temp_root)

    venv_python = venv_python_path(temp_root)
    pip_upgrade = run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], timeout=240, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append({"name": "pip_upgrade", **pip_upgrade})
    if pip_upgrade["returncode"] != 0:
        result["errors"].append("pip upgrade failed")
        return finish(result, "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_pip_install_failed", "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_pip_install_failed", 12, temp_root)

    pip_install = run([str(venv_python), "-m", "pip", "install", "-r", str(REQUIREMENTS_PATH)], timeout=1200, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append({"name": "pip_install_requirements", **pip_install})
    if pip_install["returncode"] != 0:
        result["errors"].append("approved requirements install failed")
        return finish(result, "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_pip_install_failed", "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_pip_install_failed", 13, temp_root)

    metadata = run([str(venv_python), "-c", metadata_script()], timeout=45, temp_root=temp_root, cwd=REPO_ROOT)
    if metadata["stdout"]:
        try:
            result["metadata"] = json.loads(metadata["stdout"].splitlines()[-1])["metadata"]
        except Exception as error:
            result["errors"].append(f"metadata JSON parse failed: {error}")
    result["commands"].append({"name": "metadata_check", **metadata})
    if metadata["returncode"] != 0 or metadata["timedOut"] or any(not item.get("passed") for item in result["metadata"]):
        result["errors"].append("metadata check failed or timed out")
        return finish(result, "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_metadata_mismatch", "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_metadata_mismatch", 20, temp_root)

    for module_name in IMPORT_MODULES:
        check = run([str(venv_python), "-c", module_import_script(module_name)], timeout=45, temp_root=temp_root, cwd=REPO_ROOT)
        record = {
            "module": module_name,
            "passed": check["returncode"] == 0 and not check["timedOut"],
            "timedOut": check["timedOut"],
            "durationSeconds": check["durationSeconds"],
            "stderr": check["stderr"],
        }
        result["moduleImports"].append(record)
        if not record["passed"]:
            result["errors"].append(f"module import failed or timed out: {module_name}")
            return finish(result, BLOCKED_DECISION, BLOCKED_DECISION, 21, temp_root)

    for name, script in SYNTHETIC_CHECKS:
        check = run([str(venv_python), "-c", textwrap.dedent(script)], timeout=45, temp_root=temp_root, cwd=REPO_ROOT)
        record = {
            "name": name,
            "passed": check["returncode"] == 0 and not check["timedOut"],
            "timedOut": check["timedOut"],
            "durationSeconds": check["durationSeconds"],
            "stderr": check["stderr"],
        }
        result["syntheticAssertions"].append(record)
        if not record["passed"]:
            result["errors"].append(f"synthetic assertion failed or timed out: {name}")
            return finish(result, "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_synthetic_assertion_failure", "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_synthetic_assertion_failure", 22, temp_root)

    return finish(
        result,
        "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_passed",
        PASS_DECISION,
        0,
        temp_root,
    )


if __name__ == "__main__":
    raise SystemExit(main())
