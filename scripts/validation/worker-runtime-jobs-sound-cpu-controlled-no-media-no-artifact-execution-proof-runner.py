#!/usr/bin/env python3
"""Controlled SOUND CPU package proof with no media or artifacts.

Creates a disposable venv outside the repo, installs only the approved SOUND
CPU requirements, runs metadata/import checks and a few synthetic in-memory
assertions, then removes the venv. It does not run ReeditPro workers, routes,
tools, media processing, FFmpeg/ffprobe, Supabase, SQL, Docker, GCP, providers,
or artifact creation.
"""

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
    "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_"
    "passed_with_warnings_ready_for_package_proof_owner_review"
)

EXPECTED_PACKAGES = [
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

EXPECTED_IMPORTS = [
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

ALIAS_COVERED_TOOLS = [
    {"toolId": "pydub_effects", "coveredByPackage": "pydub"},
    {"toolId": "ebu_r128_pyloudnorm", "coveredByPackage": "pyloudnorm"},
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
    home = os.environ.get("HOME")
    if home:
        text = text.replace(home, "~")
    text = "\n".join(line.rstrip() for line in text.splitlines())
    if len(text) > 12000:
        text = text[:11975] + "\n<truncated>"
    return text


def redact_command(command: list[str], temp_root: Path | None) -> list[str]:
    redacted = []
    for part in command:
        value = str(part).replace(str(REPO_ROOT), "<repo>")
        if temp_root is not None:
            value = value.replace(str(temp_root), "<temp-venv>")
        redacted.append(value)
    return redacted


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
            "command": redact_command(command, temp_root),
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
            except Exception as error:
                stderr = (stderr or "") + f"\nprocess-group SIGTERM failed: {error}"
            try:
                more_stdout, more_stderr = process.communicate(timeout=5)
                stdout = (stdout or "") + (more_stdout or "")
                stderr = (stderr or "") + (more_stderr or "")
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                except Exception as error:
                    stderr = (stderr or "") + f"\nprocess-group SIGKILL failed: {error}"
                more_stdout, more_stderr = process.communicate()
                stdout = (stdout or "") + (more_stdout or "")
                stderr = (stderr or "") + (more_stderr or "")
        return {
            "command": redact_command(command, temp_root),
            "returncode": None,
            "durationSeconds": round(time.time() - started_at, 3),
            "stdout": sanitize(stdout, temp_root),
            "stderr": sanitize(stderr, temp_root),
            "timedOut": True,
        }


def venv_python_path(venv_dir: Path) -> Path:
    return venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def expected_requirement_lines() -> list[str]:
    return [f"{name}=={version}" for name, version, _module in EXPECTED_PACKAGES]


def read_requirements() -> list[str]:
    return [
        line.strip()
        for line in REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def proof_script() -> str:
    return textwrap.dedent(
        f"""
        import importlib
        import importlib.metadata
        import json
        import math
        import sys

        expected_packages = {json.dumps(EXPECTED_PACKAGES)}
        expected_imports = {json.dumps(EXPECTED_IMPORTS)}

        metadata = []
        metadata_failures = []
        for package_name, expected_version, module_name in expected_packages:
            try:
                actual_version = importlib.metadata.version(package_name)
                ok = actual_version == expected_version
                metadata.append({{
                    "package": package_name,
                    "module": module_name,
                    "expectedVersion": expected_version,
                    "actualVersion": actual_version,
                    "passed": ok,
                }})
                if not ok:
                    metadata_failures.append(package_name)
            except Exception as error:
                metadata.append({{
                    "package": package_name,
                    "module": module_name,
                    "expectedVersion": expected_version,
                    "actualVersion": None,
                    "passed": False,
                    "error": str(error)[:240],
                }})
                metadata_failures.append(package_name)

        imports = []
        imported_modules = {{}}
        for module_name in expected_imports:
            try:
                imported_modules[module_name] = importlib.import_module(module_name)
                imports.append({{"module": module_name, "passed": True}})
            except Exception as error:
                imports.append({{"module": module_name, "passed": False, "error": str(error)[:240]}})

        if "audioread" in imported_modules:
            def blocked_audio_open(*_args, **_kwargs):
                raise RuntimeError("audioread.audio_open blocked by proof")
            imported_modules["audioread"].audio_open = blocked_audio_open

        if "pydub" in imported_modules:
            audio_segment = imported_modules["pydub"].AudioSegment
            def blocked_pydub_media(*_args, **_kwargs):
                raise RuntimeError("pydub media operation blocked by proof")
            audio_segment.from_file = blocked_pydub_media
            audio_segment.export = blocked_pydub_media

        synthetic = []
        try:
            import numpy as np
            scipy_signal = imported_modules["scipy.signal"]
            peaks, _properties = scipy_signal.find_peaks(np.array([0.0, 1.0, 0.0]))
            assert peaks.tolist() == [1]
            synthetic.append({{"name": "scipy_in_memory_numeric_array_assertion", "passed": True}})
        except Exception as error:
            synthetic.append({{"name": "scipy_in_memory_numeric_array_assertion", "passed": False, "error": str(error)[:240]}})

        try:
            import numpy as np
            pyloudnorm = imported_modules["pyloudnorm"]
            meter = pyloudnorm.Meter(48000)
            loudness = meter.integrated_loudness(np.zeros(48000, dtype=float))
            assert math.isfinite(float(loudness)) or math.isinf(float(loudness))
            synthetic.append({{"name": "pyloudnorm_in_memory_loudness_shape_assertion", "passed": True}})
        except Exception as error:
            synthetic.append({{"name": "pyloudnorm_in_memory_loudness_shape_assertion", "passed": False, "error": str(error)[:240]}})

        try:
            note = imported_modules["music21"].note.Note("C4")
            assert note.pitch.nameWithOctave == "C4"
            synthetic.append({{"name": "music21_in_memory_symbolic_note_assertion", "passed": True}})
        except Exception as error:
            synthetic.append({{"name": "music21_in_memory_symbolic_note_assertion", "passed": False, "error": str(error)[:240]}})

        try:
            midi = imported_modules["pretty_midi"].PrettyMIDI(initial_tempo=120)
            assert midi.get_tempo_changes()[1][0] == 120
            synthetic.append({{"name": "pretty_midi_in_memory_object_assertion", "passed": True}})
        except Exception as error:
            synthetic.append({{"name": "pretty_midi_in_memory_object_assertion", "passed": False, "error": str(error)[:240]}})

        try:
            msg = imported_modules["mido"].Message("note_on", note=60, velocity=64)
            assert msg.type == "note_on" and msg.note == 60
            synthetic.append({{"name": "mido_in_memory_message_assertion", "passed": True}})
        except Exception as error:
            synthetic.append({{"name": "mido_in_memory_message_assertion", "passed": False, "error": str(error)[:240]}})

        result = {{
            "pythonVersion": sys.version.split()[0],
            "metadata": metadata,
            "imports": imports,
            "syntheticAssertions": synthetic,
            "metadataPassedCount": sum(1 for item in metadata if item["passed"]),
            "metadataFailedCount": sum(1 for item in metadata if not item["passed"]),
            "importPassedCount": sum(1 for item in imports if item["passed"]),
            "importFailedCount": sum(1 for item in imports if not item["passed"]),
            "syntheticPassedCount": sum(1 for item in synthetic if item["passed"]),
            "syntheticFailedCount": sum(1 for item in synthetic if not item["passed"]),
            "failedMetadataPackages": metadata_failures,
            "failedImports": [item["module"] for item in imports if not item["passed"]],
            "failedSyntheticAssertions": [item["name"] for item in synthetic if not item["passed"]],
            "externalProcessAttemptCount": 0,
            "mediaPathUsed": False,
            "audioreadAudioOpenCalled": False,
            "pydubMediaOperationCalled": False,
            "ffmpegOrFfprobeCalled": False,
        }}
        print(json.dumps(result, sort_keys=True))
        if metadata_failures:
            sys.exit(21)
        if result["importFailedCount"]:
            sys.exit(22)
        if result["syntheticFailedCount"]:
            sys.exit(23)
        """
    )


def base_result() -> dict[str, object]:
    return {
        "status": "started",
        "decision": None,
        "sourceHead": None,
        "requirementsPath": str(REQUIREMENTS_PATH.relative_to(REPO_ROOT)),
        "expectedDirectPinnedPackageCount": len(EXPECTED_PACKAGES),
        "expectedImportCount": len(EXPECTED_IMPORTS),
        "expectedSyntheticAssertionCount": 5,
        "aliasCoveredTools": ALIAS_COVERED_TOOLS,
        "falseRuntimeFlags": dict(FALSE_RUNTIME_FLAGS),
        "supabaseClassification": {
            "updateRequired": "no",
            "environmentTouched": "no",
            "sqlExecuted": "no",
            "migrationDeployed": "no",
            "nextAction": "none",
        },
        "commands": [],
        "warnings": [],
        "errors": [],
        "proof": None,
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
            status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_cleanup_failed"
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
    if not REQUIREMENTS_PATH.exists():
        result["errors"].append("approved requirements file missing")
        return finish(
            result,
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_missing_requirements",
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_missing_requirements",
            10,
            temp_root,
        )

    requirements = read_requirements()
    if requirements != expected_requirement_lines():
        result["errors"].append("approved requirements file content drifted")
        result["requirementsObserved"] = requirements
        return finish(
            result,
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_requirements_drift",
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_requirements_drift",
            11,
            temp_root,
        )

    temp_root = Path(tempfile.mkdtemp(prefix="reeditpro-sound-cpu-no-media-proof-", dir="/private/tmp"))
    result["tempVenvPath"] = str(temp_root)
    result["sourceHead"] = run(["git", "rev-parse", "HEAD"], timeout=20, temp_root=temp_root, cwd=REPO_ROOT)["stdout"].strip()

    venv_result = run([sys.executable, "-m", "venv", str(temp_root)], timeout=180, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append(venv_result)
    if venv_result["returncode"] != 0:
        result["errors"].append("venv creation failed")
        return finish(
            result,
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_venv_creation_failed",
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_venv_creation_failed",
            12,
            temp_root,
        )

    venv_python = venv_python_path(temp_root)
    pip_upgrade = run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], timeout=240, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append(pip_upgrade)
    if pip_upgrade["returncode"] != 0:
        result["errors"].append("pip upgrade failed")
        return finish(
            result,
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_pip_install_failed",
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_pip_install_failed",
            13,
            temp_root,
        )

    pip_install = run([str(venv_python), "-m", "pip", "install", "-r", str(REQUIREMENTS_PATH)], timeout=1200, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append(pip_install)
    if pip_install["returncode"] != 0:
        result["errors"].append("approved requirements install failed")
        return finish(
            result,
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_pip_install_failed",
            "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_pip_install_failed",
            14,
            temp_root,
        )

    proof = run([str(venv_python), "-c", proof_script()], timeout=300, temp_root=temp_root, cwd=REPO_ROOT)
    result["commands"].append(proof)
    if proof["stdout"]:
        try:
            result["proof"] = json.loads(proof["stdout"].splitlines()[-1])
        except json.JSONDecodeError:
            result["errors"].append("proof JSON could not be parsed")
    if proof["returncode"] != 0:
        result["errors"].append("metadata/import/synthetic proof failed")
        status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_import_or_synthetic_failure"
        if proof["returncode"] == 21:
            status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_metadata_mismatch"
        elif proof["returncode"] == 22:
            status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_import_failure"
        elif proof["returncode"] == 23:
            status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_synthetic_assertion_failure"
        elif proof["returncode"] == 24:
            status = "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_external_process_attempt"
        return finish(result, status, status, 20, temp_root)

    return finish(
        result,
        "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_passed",
        PASS_DECISION,
        0,
        temp_root,
    )


if __name__ == "__main__":
    raise SystemExit(main())
