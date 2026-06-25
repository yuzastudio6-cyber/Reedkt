#!/usr/bin/env python3
"""Controlled SOUND CPU synthetic tool-call proof.

This runner creates a disposable virtual environment outside tracked source,
installs the approved SOUND CPU requirements file, and executes deterministic
synthetic probes. It does not open media files, run workers/routes, call
providers, mutate Supabase, call GCP, run Docker, or create artifacts.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import time
import venv
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIREMENTS_PATH = REPO_ROOT / "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"

DIRECT_PACKAGES = [
    {"toolId": "librosa", "packageName": "librosa", "importName": "librosa"},
    {"toolId": "audioread", "packageName": "audioread", "importName": "audioread"},
    {"toolId": "pydub", "packageName": "pydub", "importName": "pydub"},
    {"toolId": "scipy", "packageName": "scipy", "importName": "scipy"},
    {"toolId": "resampy", "packageName": "resampy", "importName": "resampy"},
    {"toolId": "pyloudnorm", "packageName": "pyloudnorm", "importName": "pyloudnorm"},
    {"toolId": "audioflux", "packageName": "audioflux", "importName": "audioflux"},
    {"toolId": "music21", "packageName": "music21", "importName": "music21"},
    {"toolId": "pretty_midi", "packageName": "pretty_midi", "importName": "pretty_midi"},
    {"toolId": "mido", "packageName": "mido", "importName": "mido"},
    {"toolId": "noisereduce", "packageName": "noisereduce", "importName": "noisereduce"},
    {"toolId": "pedalboard", "packageName": "pedalboard", "importName": "pedalboard"},
    {"toolId": "mir_eval", "packageName": "mir_eval", "importName": "mir_eval"},
]

ALIAS_TOOLS = [
    {"toolId": "pydub_effects", "coveredBy": "pydub", "probe": "pydub_in_memory_gain_fade"},
    {"toolId": "ebu_r128_pyloudnorm", "coveredBy": "pyloudnorm", "probe": "pyloudnorm_integrated_loudness"},
]

SAFETY_FLAGS = {
    "mediaFileOpenAttempted": False,
    "audioreadAudioOpenAttempted": False,
    "pydubFromFileAttempted": False,
    "pydubExportAttempted": False,
    "ffmpegExecuted": False,
    "ffprobeExecuted": False,
    "dockerExecuted": False,
    "gcpTouched": False,
    "providerCallAttempted": False,
    "modelDownloadAttempted": False,
    "workerExecutionAttempted": False,
    "routeExecutionAttempted": False,
    "supabaseTouched": False,
    "sqlExecuted": False,
    "artifactCreated": False,
    "signedUrlCreated": False,
    "publicArtifactCreated": False,
}


def sanitize_error(value: BaseException | str) -> str:
    text = str(value)
    text = text.replace(str(REPO_ROOT), "<repo>")
    return text[:700]


def run_command(args: list[str], cwd: Path | None = None, timeout: int = 240) -> tuple[int, str, str, float]:
    started = time.time()
    try:
        completed = subprocess.run(
            args,
            cwd=str(cwd) if cwd else None,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False,
        )
        return completed.returncode, completed.stdout[-4000:], completed.stderr[-4000:], time.time() - started
    except subprocess.TimeoutExpired as exc:
        stdout = (exc.stdout or "") if isinstance(exc.stdout, str) else ""
        stderr = (exc.stderr or "") if isinstance(exc.stderr, str) else ""
        return 124, stdout[-4000:], stderr[-4000:] + "\ncommand timed out", time.time() - started


INNER_PROOF = r"""
import importlib
import importlib.metadata
import json
import math
import sys
import traceback

direct_packages = __DIRECT_PACKAGES__
alias_tools = __ALIAS_TOOLS__

def sanitize_error(value):
    return str(value)[:700]

def shape_of(value):
    shape = getattr(value, "shape", None)
    if shape is None:
        return None
    return [int(part) for part in shape]

metadata_results = []
for item in direct_packages:
    try:
        version = importlib.metadata.version(item["packageName"])
        metadata_results.append({"toolId": item["toolId"], "status": "passed", "version": version})
    except Exception as exc:
        metadata_results.append({"toolId": item["toolId"], "status": "failed", "error": sanitize_error(exc)})

import_results = []
modules = {}
for item in direct_packages:
    try:
        modules[item["toolId"]] = importlib.import_module(item["importName"])
        import_results.append({"toolId": item["toolId"], "status": "passed", "module": item["importName"]})
    except Exception as exc:
        import_results.append({"toolId": item["toolId"], "status": "failed", "error": sanitize_error(exc)})

probe_results = []

def record(tool_id, status, probe, details=None, error=None, coverage=None):
    row = {"toolId": tool_id, "status": status, "probe": probe}
    if details is not None:
        row["details"] = details
    if error is not None:
        row["error"] = sanitize_error(error)
    if coverage is not None:
        row["coverage"] = coverage
    probe_results.append(row)

try:
    import numpy as np
    sample_rate = 48000
    t = np.linspace(0, 1.0, sample_rate, endpoint=False, dtype=np.float32)
    sine = (0.05 * np.sin(2 * np.pi * 440.0 * t)).astype(np.float32)
    short = sine[:4096]
except Exception as exc:
    print(json.dumps({"status": "failed", "phase": "numpy_setup", "error": sanitize_error(exc)}))
    sys.exit(1)

try:
    import librosa
    rms = librosa.feature.rms(y=short, frame_length=1024, hop_length=512)
    record("librosa", "passed", "librosa.feature.rms", {"shape": shape_of(rms)})
except Exception as exc:
    record("librosa", "failed", "librosa.feature.rms", error=exc)

try:
    import audioread
    backends = audioread.available_backends()
    record("audioread", "passed", "audioread.available_backends_no_audio_open", {"backendCount": len(backends)})
except Exception as exc:
    record("audioread", "failed", "audioread.available_backends_no_audio_open", error=exc)

try:
    from pydub import AudioSegment
    segment = AudioSegment.silent(duration=100, frame_rate=sample_rate)
    processed = segment.apply_gain(-3).fade_in(10).fade_out(10)
    record("pydub", "passed", "pydub.AudioSegment.silent_gain_fade_no_file_io", {"durationMs": len(processed), "frameRate": processed.frame_rate})
    record("pydub_effects", "passed", "pydub.apply_gain_fade_no_file_io", {"coveredBy": "pydub", "durationMs": len(processed)}, coverage="alias")
except Exception as exc:
    record("pydub", "failed", "pydub.AudioSegment.silent_gain_fade_no_file_io", error=exc)
    record("pydub_effects", "failed", "pydub.apply_gain_fade_no_file_io", error=exc, coverage="alias")

try:
    from scipy import signal
    peaks, _ = signal.find_peaks(short, distance=32)
    record("scipy", "passed", "scipy.signal.find_peaks", {"peakCount": int(len(peaks))})
except Exception as exc:
    record("scipy", "failed", "scipy.signal.find_peaks", error=exc)

try:
    import resampy
    resampled = resampy.resample(short, sample_rate, 16000)
    record("resampy", "passed", "resampy.resample", {"inputLength": int(len(short)), "outputLength": int(len(resampled))})
except Exception as exc:
    record("resampy", "failed", "resampy.resample", error=exc)

try:
    import pyloudnorm as pyln
    meter = pyln.Meter(sample_rate)
    loudness = meter.integrated_loudness(sine.reshape(-1, 1))
    record("pyloudnorm", "passed", "pyloudnorm.Meter.integrated_loudness", {"loudness": round(float(loudness), 4)})
    record("ebu_r128_pyloudnorm", "passed", "pyloudnorm.EBU_R128_integrated_loudness", {"coveredBy": "pyloudnorm", "loudness": round(float(loudness), 4)}, coverage="alias")
except Exception as exc:
    record("pyloudnorm", "failed", "pyloudnorm.Meter.integrated_loudness", error=exc)
    record("ebu_r128_pyloudnorm", "failed", "pyloudnorm.EBU_R128_integrated_loudness", error=exc, coverage="alias")

try:
    import audioflux
    details = {"publicAttributeCount": len([name for name in dir(audioflux) if not name.startswith("_")])}
    if hasattr(audioflux, "BFT"):
        try:
            bft = audioflux.BFT(num=8, radix2_exp=12, samplate=sample_rate)
            spec = bft.bft(short)
            details.update({"call": "audioflux.BFT.bft", "shape": shape_of(spec)})
        except TypeError:
            bft = audioflux.BFT(num=8, radix2_exp=12, samplate=sample_rate, data_type=0)
            spec = bft.bft(short)
            details.update({"call": "audioflux.BFT.bft", "shape": shape_of(spec)})
    else:
        details["call"] = "module_introspection_no_media"
    record("audioflux", "passed", details["call"], details)
except Exception as exc:
    record("audioflux", "failed", "audioflux.BFT_or_introspection", error=exc)

try:
    from music21 import note, stream
    part = stream.Stream()
    part.append(note.Note("C4", quarterLength=1.0))
    part.append(note.Note("G4", quarterLength=1.0))
    record("music21", "passed", "music21.stream_note_construction", {"noteCount": len(part.notes), "highestPitch": part.notes[-1].pitch.nameWithOctave})
except Exception as exc:
    record("music21", "failed", "music21.stream_note_construction", error=exc)

try:
    import pretty_midi
    midi = pretty_midi.PrettyMIDI()
    instrument = pretty_midi.Instrument(program=0)
    instrument.notes.append(pretty_midi.Note(velocity=90, pitch=60, start=0.0, end=0.5))
    midi.instruments.append(instrument)
    record("pretty_midi", "passed", "pretty_midi.in_memory_note", {"endTime": float(midi.get_end_time()), "instrumentCount": len(midi.instruments)})
except Exception as exc:
    record("pretty_midi", "failed", "pretty_midi.in_memory_note", error=exc)

try:
    import mido
    message = mido.Message("note_on", note=60, velocity=64, time=0)
    record("mido", "passed", "mido.Message.bytes", {"bytes": message.bytes()})
except Exception as exc:
    record("mido", "failed", "mido.Message.bytes", error=exc)

try:
    import noisereduce as nr
    noise = (sine + 0.005 * np.random.default_rng(7).normal(size=sine.shape)).astype(np.float32)
    reduced = nr.reduce_noise(y=noise[:12000], sr=sample_rate, stationary=True, prop_decrease=0.25)
    record("noisereduce", "passed", "noisereduce.reduce_noise_synthetic_array", {"shape": shape_of(reduced)})
except Exception as exc:
    record("noisereduce", "failed", "noisereduce.reduce_noise_synthetic_array", error=exc)

try:
    from pedalboard import Gain, Pedalboard
    board = Pedalboard([Gain(gain_db=-3.0)])
    processed = board(short.reshape(1, -1), sample_rate)
    record("pedalboard", "passed", "pedalboard.Gain_synthetic_array", {"shape": shape_of(processed)})
except Exception as exc:
    record("pedalboard", "failed", "pedalboard.Gain_synthetic_array", error=exc)

try:
    import mir_eval
    import mir_eval.onset
    precision, recall, f_measure = mir_eval.onset.f_measure(np.array([0.1, 0.5]), np.array([0.1, 0.49]))
    record("mir_eval", "passed", "mir_eval.onset.f_measure", {"precision": float(precision), "recall": float(recall), "fMeasure": float(f_measure)})
except Exception as exc:
    record("mir_eval", "failed", "mir_eval.onset.f_measure", error=exc)

failed = [row for row in probe_results if row["status"] != "passed"]

print(json.dumps({
    "status": "passed" if not failed else "failed",
    "metadataResults": metadata_results,
    "importResults": import_results,
    "probeResults": probe_results,
    "metadataPassedCount": len([row for row in metadata_results if row["status"] == "passed"]),
    "metadataFailedCount": len([row for row in metadata_results if row["status"] != "passed"]),
    "importPassedCount": len([row for row in import_results if row["status"] == "passed"]),
    "importFailedCount": len([row for row in import_results if row["status"] != "passed"]),
    "probePassedCount": len([row for row in probe_results if row["status"] == "passed"]),
    "probeFailedCount": len(failed),
    "failedProbes": failed,
}, sort_keys=True))
"""


def build_inner_script() -> str:
    return (
        INNER_PROOF.replace("__DIRECT_PACKAGES__", json.dumps(DIRECT_PACKAGES))
        .replace("__ALIAS_TOOLS__", json.dumps(ALIAS_TOOLS))
    )


def decision_for(status: str, install_code: int, proof: dict[str, Any] | None, temp_removed: bool) -> str:
    if install_code != 0:
        return "sound_runtime_media_gate_2a_blocked_pip_install_failed"
    if not temp_removed:
        return "sound_runtime_media_gate_2a_blocked_temp_venv_cleanup_failed"
    if status != "passed" or not proof or proof.get("probeFailedCount", 0) != 0:
        return "sound_runtime_media_gate_2a_blocked_synthetic_tool_call_failure"
    return "sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review"


def main() -> int:
    if not REQUIREMENTS_PATH.exists():
        print(json.dumps({"status": "failed", "decision": "sound_runtime_media_gate_2a_blocked_missing_requirements"}))
        return 1

    started = time.time()
    temp_dir = Path(tempfile.mkdtemp(prefix="reeditpro-sound-gate-2a-", dir=os.environ.get("TMPDIR") or None))
    venv_dir = temp_dir / "venv"
    proof: dict[str, Any] | None = None
    install_code = 1
    install_stderr = ""
    install_duration = 0.0
    proof_code = 1
    proof_stderr = ""
    proof_duration = 0.0
    temp_removed = False
    temp_remove_error = None

    try:
        venv.create(str(venv_dir), with_pip=True, clear=True)
        python = venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        pip = [str(python), "-m", "pip"]
        run_command([*pip, "install", "--upgrade", "pip"], timeout=180)
        install_code, _install_stdout, install_stderr, install_duration = run_command(
            [*pip, "install", "--no-cache-dir", "--requirement", str(REQUIREMENTS_PATH)],
            timeout=600,
        )
        if install_code == 0:
            proof_code, proof_stdout, proof_stderr, proof_duration = run_command(
                [str(python), "-c", build_inner_script()],
                timeout=360,
            )
            try:
                proof = json.loads(proof_stdout.strip().splitlines()[-1])
            except Exception as exc:  # pragma: no cover - diagnostic path
                proof = {"status": "failed", "phase": "parse_inner_proof", "error": sanitize_error(exc), "stdoutTail": proof_stdout[-1200:]}
    finally:
        try:
            shutil.rmtree(temp_dir)
            temp_removed = not temp_dir.exists()
        except Exception as exc:  # pragma: no cover - diagnostic path
            temp_remove_error = sanitize_error(exc)

    status = "passed" if install_code == 0 and proof_code == 0 and proof and proof.get("status") == "passed" and temp_removed else "failed"
    result = {
        "milestone": "SOUND-RUNTIME-MEDIA-GATE-2A",
        "status": status,
        "decision": decision_for(status, install_code, proof, temp_removed),
        "sourceHead": "eb4fa16292f41e97660fe1dd429cd567fa944380",
        "requirementsPath": str(REQUIREMENTS_PATH.relative_to(REPO_ROOT)),
        "directPackageCount": len(DIRECT_PACKAGES),
        "aliasToolCount": len(ALIAS_TOOLS),
        "toolCandidateCount": len(DIRECT_PACKAGES) + len(ALIAS_TOOLS),
        "install": {
            "exitCode": install_code,
            "durationSeconds": round(install_duration, 3),
            "stderrTail": sanitize_error(install_stderr),
        },
        "proof": proof,
        "proofExitCode": proof_code,
        "proofDurationSeconds": round(proof_duration, 3),
        "proofStderrTail": sanitize_error(proof_stderr),
        "runtimeFlags": SAFETY_FLAGS,
        "tempVenvRemoved": temp_removed,
        "tempVenvRemovalError": temp_remove_error,
        "durationSeconds": round(time.time() - started, 3),
        "supabaseClassification": {
            "updateRequired": "no",
            "environmentTouched": "no",
            "sqlExecuted": "no",
            "migrationDeployed": "no",
            "nextAction": "none",
        },
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if status == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
