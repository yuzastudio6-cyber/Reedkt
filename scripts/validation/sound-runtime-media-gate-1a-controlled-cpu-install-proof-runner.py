#!/usr/bin/env python3
"""SOUND-RUNTIME-MEDIA-GATE-1A controlled CPU install proof runner.

This runner creates a disposable Python virtual environment outside the
repository, installs the existing SOUND pinned requirements manifest, checks
package metadata and import availability, then removes the environment. It
does not open media files, invoke media binaries, call providers, mutate
Supabase, run workers/routes/tools, download models, or create artifacts.
"""

from __future__ import annotations

import json
import os
import re
import shutil
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

EXPECTED_REQUIREMENTS = [
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

EXCLUDED_TOOLS = {
    "modelWeightGpuTools": [
        "deepfilternet",
        "demucs",
        "spleeter",
        "open_unmix",
        "asteroid",
        "speechbrain_enhancement",
        "basic_pitch",
        "whisper_cpp",
        "faster_whisper",
        "pyannote_audio",
        "crepe",
        "torchcrepe",
    ],
    "systemBinaryHandoffTools": [
        "ffmpeg",
        "ffprobe",
        "sox",
        "libsndfile",
        "soundfile",
        "soxr",
        "aubio",
        "madmom",
        "vamp_sonic_annotator",
        "fluidsynth_pyfluidsynth",
        "bs1770gain",
        "soundtouch",
        "opus_tools",
        "flac_metaflac",
        "vorbis_tools",
    ],
    "blockedEvaluationTools": [
        "rnnoise",
        "pyrubberband",
        "rubberband_cli",
        "rubber_band",
        "essentia",
    ],
    "providerTools": ["lyria", "mirelo_sfx_v1_5", "mmaudio_v2"],
}

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
    "toolExecutionAttempted": False,
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
    "mediaProcessingReadinessClaimed": False,
    "betaProductionReadinessClaimed": False,
}


def sanitize_text(value: str | None, temp_root: Path | None = None) -> str:
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


def command_result(
    command: list[str],
    *,
    timeout: int,
    temp_root: Path | None,
    cwd: Path | None = None,
) -> dict[str, object]:
    started_at = time.time()
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd) if cwd else None,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        return {
            "command": redact_command(command, temp_root),
            "returncode": completed.returncode,
            "durationSeconds": round(time.time() - started_at, 3),
            "stdout": sanitize_text(completed.stdout, temp_root),
            "stderr": sanitize_text(completed.stderr, temp_root),
            "timedOut": False,
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "command": redact_command(command, temp_root),
            "returncode": None,
            "durationSeconds": round(time.time() - started_at, 3),
            "stdout": sanitize_text(exc.stdout.decode("utf-8", "replace") if isinstance(exc.stdout, bytes) else exc.stdout, temp_root),
            "stderr": sanitize_text(exc.stderr.decode("utf-8", "replace") if isinstance(exc.stderr, bytes) else exc.stderr, temp_root),
            "timedOut": True,
        }


def redact_command(command: list[str], temp_root: Path | None) -> list[str]:
    redacted = []
    for part in command:
        value = str(part).replace(str(REPO_ROOT), "<repo>")
        if temp_root is not None:
            value = value.replace(str(temp_root), "<temp-venv>")
        redacted.append(value)
    return redacted


def read_requirements() -> list[str]:
    lines = []
    for raw_line in REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line and not line.startswith("#"):
            lines.append(line)
    return lines


def venv_python_path(venv_dir: Path) -> Path:
    if os.name == "nt":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def make_base_result() -> dict[str, object]:
    return {
        "milestone": "SOUND-RUNTIME-MEDIA-GATE-1A",
        "requirementsPath": str(REQUIREMENTS_PATH.relative_to(REPO_ROOT)),
        "pythonExecutable": sys.executable,
        "pythonVersion": sys.version.split()[0],
        "expectedDirectPinnedPackageCount": len(EXPECTED_REQUIREMENTS),
        "expectedImportCount": len(EXPECTED_IMPORTS),
        "aliasCoveredTools": ALIAS_COVERED_TOOLS,
        "excludedTools": EXCLUDED_TOOLS,
        "excludedCounts": {
            "modelWeightGpuTools": len(EXCLUDED_TOOLS["modelWeightGpuTools"]),
            "systemBinaryHandoffTools": len(EXCLUDED_TOOLS["systemBinaryHandoffTools"]),
            "blockedEvaluationTools": len(EXCLUDED_TOOLS["blockedEvaluationTools"]),
            "providerTools": len(EXCLUDED_TOOLS["providerTools"]),
        },
        "falseRuntimeFlags": dict(FALSE_RUNTIME_FLAGS),
        "warnings": [],
        "errors": [],
        "tempVenvRemoved": False,
        "tempVenvPath": None,
        "tempVenvRemovalError": None,
    }


def emit(result: dict[str, object], status: str, decision: str, return_code: int) -> int:
    result["status"] = status
    result["decision"] = decision
    print(json.dumps(result, indent=2, sort_keys=True))
    return return_code


def finish(
    result: dict[str, object],
    status: str,
    decision: str,
    return_code: int,
    temp_root: Path | None,
) -> int:
    if temp_root is not None and Path(temp_root).exists():
        try:
            shutil.rmtree(temp_root)
            result["tempVenvRemoved"] = True
        except Exception as exc:  # noqa: BLE001 - report sanitized cleanup issue.
            result["tempVenvRemoved"] = False
            result["tempVenvRemovalError"] = {
                "errorType": type(exc).__name__,
                "errorSummary": sanitize_text(str(exc), temp_root),
            }
    elif temp_root is not None:
        result["tempVenvRemoved"] = True
    return emit(result, status, decision, return_code)


def parse_child_json(stdout: str) -> dict[str, object]:
    start = stdout.find("{")
    end = stdout.rfind("}")
    if start < 0 or end < start:
        raise ValueError("child metadata/import checker did not emit JSON")
    return json.loads(stdout[start : end + 1])


def child_checker_code() -> str:
    expected_requirements = [
        {"packageName": package, "expectedVersion": version}
        for package, version, _module in EXPECTED_REQUIREMENTS
    ]
    return textwrap.dedent(
        f"""
        import importlib
        import importlib.metadata
        import json
        import traceback

        expected_requirements = {json.dumps(expected_requirements)}
        expected_imports = {json.dumps(EXPECTED_IMPORTS)}

        def clean_error(exc):
            message = str(exc).replace("\\n", " ")
            if len(message) > 240:
                message = message[:237] + "..."
            return {{"errorType": type(exc).__name__, "errorSummary": message}}

        metadata_checks = []
        import_checks = []

        for item in expected_requirements:
            package = item["packageName"]
            expected = item["expectedVersion"]
            try:
                observed = importlib.metadata.version(package)
                status = "passed" if observed == expected else "failed"
                metadata_checks.append({{
                    "packageName": package,
                    "expectedVersion": expected,
                    "installedVersionObserved": observed,
                    "metadataStatus": status,
                }})
            except Exception as exc:
                metadata_checks.append({{
                    "packageName": package,
                    "expectedVersion": expected,
                    "installedVersionObserved": None,
                    "metadataStatus": "failed",
                    **clean_error(exc),
                }})

        for module in expected_imports:
            try:
                importlib.import_module(module)
                import_checks.append({{
                    "moduleName": module,
                    "importStatus": "passed",
                }})
            except Exception as exc:
                import_checks.append({{
                    "moduleName": module,
                    "importStatus": "failed",
                    **clean_error(exc),
                }})

        print(json.dumps({{
            "metadataChecks": metadata_checks,
            "importChecks": import_checks,
        }}, sort_keys=True))
        """
    ).strip()


def main() -> int:
    result = make_base_result()
    expected_lines = [f"{package}=={version}" for package, version, _module in EXPECTED_REQUIREMENTS]
    temp_root: Path | None = None

    try:
        if not REQUIREMENTS_PATH.exists():
            result["errors"].append(
                {
                    "phase": "source_preflight",
                    "errorType": "MissingRequirementsManifest",
                    "errorSummary": "Gate 1 requirements source is missing.",
                }
            )
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_missing_gate1_source", 1, temp_root)

        requirements_lines = read_requirements()
        result["requirementsManifest"] = {
            "lineCount": len(requirements_lines),
            "lines": requirements_lines,
            "matchesExpectedPins": requirements_lines == expected_lines,
        }
        if requirements_lines != expected_lines:
            result["errors"].append(
                {
                    "phase": "source_preflight",
                    "errorType": "RequirementsMismatch",
                    "errorSummary": "Requirements manifest does not match the expected 13 pinned packages.",
                }
            )
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_missing_gate1_source", 1, temp_root)

        temp_root = Path(tempfile.mkdtemp(prefix="reeditpro-sound-gate-1a-cpu-proof-", dir=tempfile.gettempdir()))
        venv_dir = temp_root / "venv"
        result["tempVenvPath"] = str(temp_root)

        venv_result = command_result([sys.executable, "-m", "venv", str(venv_dir)], timeout=300, temp_root=temp_root)
        result["venvCreation"] = venv_result
        if venv_result["returncode"] != 0 or venv_result["timedOut"]:
            result["errors"].append({"phase": "venv_create", "errorType": "VenvCreationFailed", "errorSummary": "Disposable venv creation failed or timed out."})
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_pip_install_failed", 1, temp_root)

        venv_python = venv_python_path(venv_dir)
        pip_install = command_result(
            [
                str(venv_python),
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "--no-input",
                "-r",
                str(REQUIREMENTS_PATH),
            ],
            timeout=2400,
            temp_root=temp_root,
            cwd=REPO_ROOT,
        )
        result["pipInstall"] = pip_install
        if pip_install["returncode"] != 0 or pip_install["timedOut"]:
            result["errors"].append(
                {
                    "phase": "pip_install",
                    "errorType": "PipInstallFailedOrTimedOut",
                    "errorSummary": "Pinned requirements install failed or timed out.",
                }
            )
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_pip_install_failed", 1, temp_root)

        checker = command_result(
            [str(venv_python), "-c", child_checker_code()],
            timeout=900,
            temp_root=temp_root,
            cwd=REPO_ROOT,
        )
        result["metadataImportChecker"] = checker
        stderr = str(checker.get("stderr", ""))
        if re.search(r"ffmpeg|avconv", stderr, re.I):
            result["warnings"].append(
                {
                    "warningId": "pydub_ffmpeg_avconv_import_warning",
                    "classification": "warning_only_no_media_operation",
                    "summary": "A pydub-related FFmpeg/avconv warning was emitted during import-only proof; pydub media operations remain blocked.",
                }
            )
        if checker["returncode"] != 0 or checker["timedOut"]:
            result["errors"].append(
                {
                    "phase": "metadata_import_check",
                    "errorType": "MetadataImportCheckerFailed",
                    "errorSummary": "Metadata/import checker failed or timed out before structured results were available.",
                }
            )
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_import_failure", 1, temp_root)

        checked = parse_child_json(str(checker["stdout"]))
        metadata_checks = checked["metadataChecks"]
        import_checks = checked["importChecks"]
        metadata_failures = [item for item in metadata_checks if item.get("metadataStatus") != "passed"]
        import_failures = [item for item in import_checks if item.get("importStatus") != "passed"]
        result["metadataChecks"] = metadata_checks
        result["importChecks"] = import_checks
        result["summary"] = {
            "metadataPassedCount": len(metadata_checks) - len(metadata_failures),
            "metadataFailedCount": len(metadata_failures),
            "importPassedCount": len(import_checks) - len(import_failures),
            "importFailedCount": len(import_failures),
            "failedImports": [item.get("moduleName") for item in import_failures],
        }

        if any(result["falseRuntimeFlags"].values()):
            result["errors"].append(
                {
                    "phase": "runtime_safety",
                    "errorType": "MediaExecutionDetected",
                    "errorSummary": "One or more runtime/media action flags were true.",
                }
            )
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_media_execution_detected", 1, temp_root)
        if metadata_failures:
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_metadata_mismatch", 1, temp_root)
        if import_failures:
            return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_import_failure", 1, temp_root)

        result["warnings"].extend(
            [
                {
                    "warningId": "audioread_file_open_remains_blocked",
                    "classification": "inherited_runtime_warning",
                    "summary": "audioread import passed, but audioread.audio_open and media file-open remain blocked.",
                },
                {
                    "warningId": "pydub_media_operations_remain_blocked",
                    "classification": "inherited_runtime_warning",
                    "summary": "pydub import passed, but media operations and FFmpeg/avconv use remain blocked.",
                },
            ]
        )
        return finish(
            result,
            "passed",
            "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review",
            0,
            temp_root,
        )
    except Exception as exc:  # noqa: BLE001 - emit sanitized proof failure.
        result["errors"].append(
            {
                "phase": "unexpected",
                "errorType": type(exc).__name__,
                "errorSummary": sanitize_text(str(exc), temp_root),
            }
        )
        return finish(result, "failed", "sound_runtime_media_gate_1a_blocked_safety_scan", 1, temp_root)


if __name__ == "__main__":
    raise SystemExit(main())
