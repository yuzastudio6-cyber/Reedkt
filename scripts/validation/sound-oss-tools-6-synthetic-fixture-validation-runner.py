#!/usr/bin/env python3
"""SOUND-OSS-TOOLS-6 synthetic fixture validation runner.

This runner is intentionally narrow: it uses only synthetic in-memory values,
does not read or write media files, does not invoke CLIs, and emits a sanitized
JSON summary to stdout.
"""

from __future__ import annotations

import argparse
import importlib
import importlib.metadata
import json
import math
from pathlib import Path
from typing import Any, Callable


EXPECTED_REQUIREMENTS = {
    "librosa": "0.11.0",
    "audioread": "3.1.0",
    "pydub": "0.25.1",
    "scipy": "1.17.1",
    "resampy": "0.4.3",
    "pyloudnorm": "0.2.0",
    "audioflux": "0.1.9",
    "music21": "10.3.0",
    "pretty_midi": "0.2.11",
    "mido": "1.3.3",
    "noisereduce": "3.0.3",
    "pedalboard": "0.9.23",
    "mir_eval": "0.8.2",
}

EXPECTED_MODULES = [
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


def parse_requirements(path: Path) -> dict[str, str]:
    pins: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "==" not in line:
            raise ValueError(f"Requirement is not exact-pinned: {line}")
        name, version = line.split("==", 1)
        pins[name] = version
    return pins


def make_wave(sample_rate: int = 8000, length: int = 8000) -> Any:
    signal = importlib.import_module("scipy.signal")
    raw = [0.05 * math.sin(2.0 * math.pi * 220.0 * i / sample_rate) for i in range(length)]
    return signal.lfilter([1.0], [1.0], raw)


def fixture_passed(
    fixture_id: str,
    package_name: str,
    module_name: str,
    fixture_type: str,
    reason: str,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "fixtureId": fixture_id,
        "packageName": package_name,
        "moduleName": module_name,
        "fixtureType": fixture_type,
        "inputMode": "synthetic_in_memory",
        "realUserDataUsed": False,
        "mediaFileRead": False,
        "mediaFileWritten": False,
        "generatedArtifactCreated": False,
        "runtimeExecutionRun": False,
        "supabaseMutationRun": False,
        "status": "passed",
        "reason": reason,
        "details": details or {},
    }


def fixture_skipped(
    fixture_id: str,
    package_name: str,
    module_name: str,
    fixture_type: str,
    reason: str,
) -> dict[str, Any]:
    return {
        "fixtureId": fixture_id,
        "packageName": package_name,
        "moduleName": module_name,
        "fixtureType": fixture_type,
        "inputMode": "blocked_by_policy",
        "realUserDataUsed": False,
        "mediaFileRead": False,
        "mediaFileWritten": False,
        "generatedArtifactCreated": False,
        "runtimeExecutionRun": False,
        "supabaseMutationRun": False,
        "status": "skipped_blocked_by_policy",
        "reason": reason,
        "details": {},
    }


def run_fixture(fixture: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    try:
        return fixture()
    except Exception as exc:  # pragma: no cover - exercised by validation environment.
        return {
            "fixtureId": getattr(fixture, "__name__", "unknown_fixture"),
            "packageName": "unknown",
            "moduleName": "unknown",
            "fixtureType": "synthetic_in_memory",
            "inputMode": "synthetic_in_memory",
            "realUserDataUsed": False,
            "mediaFileRead": False,
            "mediaFileWritten": False,
            "generatedArtifactCreated": False,
            "runtimeExecutionRun": False,
            "supabaseMutationRun": False,
            "status": "failed",
            "reason": f"{type(exc).__name__}: {exc}",
            "details": {},
        }


def librosa_fixture() -> dict[str, Any]:
    librosa = importlib.import_module("librosa")
    wave = make_wave()
    zcr = librosa.feature.zero_crossing_rate(y=wave, frame_length=256, hop_length=128)
    return fixture_passed(
        "sound-fixture-librosa-synthetic-array-001",
        "librosa",
        "librosa",
        "synthetic_array_in_memory",
        "Computed synthetic zero-crossing feature shape without loading or writing media.",
        {"featureShape": list(zcr.shape)},
    )


def audioread_fixture() -> dict[str, Any]:
    importlib.import_module("audioread")
    return fixture_skipped(
        "sound-fixture-audioread-blocked-no-file-001",
        "audioread",
        "audioread",
        "blocked_file_open",
        "audioread requires file-open validation for meaningful behavior; media files are prohibited.",
    )


def pydub_fixture() -> dict[str, Any]:
    importlib.import_module("pydub")
    return fixture_skipped(
        "sound-fixture-pydub-blocked-ffmpeg-warning-001",
        "pydub",
        "pydub",
        "blocked_media_operation",
        "pydub media operations remain blocked by the inherited FFmpeg/avconv warning policy.",
    )


def scipy_fixture() -> dict[str, Any]:
    scipy = importlib.import_module("scipy")
    wave = make_wave()
    return fixture_passed(
        "sound-fixture-scipy-synthetic-array-001",
        "scipy",
        "scipy",
        "synthetic_array_in_memory",
        "Created deterministic synthetic ndarray through scipy without file I/O.",
        {"scipyVersion": getattr(scipy, "__version__", "unknown"), "sampleCount": int(wave.shape[0])},
    )


def scipy_signal_fixture() -> dict[str, Any]:
    signal = importlib.import_module("scipy.signal")
    window = signal.windows.hann(16, sym=False)
    filtered = signal.lfilter([0.5, 0.5], [1.0], window)
    return fixture_passed(
        "sound-fixture-scipy-signal-window-001",
        "scipy",
        "scipy.signal",
        "synthetic_signal_in_memory",
        "Ran deterministic in-memory window/filter operation with no media or external binary.",
        {"windowLength": int(window.shape[0]), "filteredLength": int(filtered.shape[0])},
    )


def resampy_fixture() -> dict[str, Any]:
    resampy = importlib.import_module("resampy")
    wave = make_wave(sample_rate=8000, length=800)
    resampled = resampy.resample(wave, 8000, 4000)
    return fixture_passed(
        "sound-fixture-resampy-synthetic-shape-001",
        "resampy",
        "resampy",
        "synthetic_resampling_in_memory",
        "Resampled a tiny synthetic numeric array in memory with no file read/write.",
        {"inputLength": int(wave.shape[0]), "outputLength": int(resampled.shape[0])},
    )


def pyloudnorm_fixture() -> dict[str, Any]:
    pyln = importlib.import_module("pyloudnorm")
    wave = make_wave(sample_rate=8000, length=8000)
    meter = pyln.Meter(8000)
    loudness = meter.integrated_loudness(wave)
    return fixture_passed(
        "sound-fixture-pyloudnorm-synthetic-loudness-001",
        "pyloudnorm",
        "pyloudnorm",
        "synthetic_loudness_in_memory",
        "Computed synthetic loudness from generated numeric data only.",
        {"sampleRate": 8000, "integratedLoudnessRounded": round(float(loudness), 4)},
    )


def audioflux_fixture() -> dict[str, Any]:
    audioflux = importlib.import_module("audioflux")
    return fixture_passed(
        "sound-fixture-audioflux-metadata-001",
        "audioflux",
        "audioflux",
        "metadata_only",
        "Imported audioflux and recorded module metadata only; no analyzer object or audio operation was run.",
        {"module": getattr(audioflux, "__name__", "audioflux")},
    )


def music21_fixture() -> dict[str, Any]:
    note_module = importlib.import_module("music21.note")
    stream_module = importlib.import_module("music21.stream")
    note = note_module.Note("C4", quarterLength=1.0)
    stream = stream_module.Stream()
    stream.append(note)
    return fixture_passed(
        "sound-fixture-music21-symbolic-stream-001",
        "music21",
        "music21",
        "symbolic_music_in_memory",
        "Created symbolic note/stream objects in memory without export.",
        {"noteName": note.nameWithOctave, "streamLength": len(stream)},
    )


def pretty_midi_fixture() -> dict[str, Any]:
    pretty_midi = importlib.import_module("pretty_midi")
    midi = pretty_midi.PrettyMIDI()
    instrument = pretty_midi.Instrument(program=0)
    instrument.notes.append(pretty_midi.Note(velocity=80, pitch=60, start=0.0, end=0.25))
    midi.instruments.append(instrument)
    return fixture_passed(
        "sound-fixture-pretty-midi-symbolic-object-001",
        "pretty_midi",
        "pretty_midi",
        "symbolic_midi_in_memory",
        "Created PrettyMIDI objects in memory without writing or synthesizing media.",
        {"instrumentCount": len(midi.instruments), "noteCount": len(instrument.notes)},
    )


def mido_fixture() -> dict[str, Any]:
    mido = importlib.import_module("mido")
    messages = [mido.Message("note_on", note=60, velocity=64), mido.Message("note_off", note=60)]
    return fixture_passed(
        "sound-fixture-mido-message-sequence-001",
        "mido",
        "mido",
        "symbolic_midi_message_in_memory",
        "Created MIDI message objects in memory without file save/export.",
        {"messageCount": len(messages), "messageTypes": [message.type for message in messages]},
    )


def noisereduce_fixture() -> dict[str, Any]:
    noisereduce = importlib.import_module("noisereduce")
    wave = make_wave(sample_rate=8000, length=800)
    reduced = noisereduce.reduce_noise(y=wave, sr=8000, stationary=True, prop_decrease=0.25)
    return fixture_passed(
        "sound-fixture-noisereduce-synthetic-array-001",
        "noisereduce",
        "noisereduce",
        "synthetic_array_in_memory",
        "Ran tiny synthetic in-memory array validation with no media file, model download, or export.",
        {"inputLength": int(wave.shape[0]), "outputLength": int(reduced.shape[0])},
    )


def pedalboard_fixture() -> dict[str, Any]:
    pedalboard = importlib.import_module("pedalboard")
    board = pedalboard.Pedalboard([])
    return fixture_passed(
        "sound-fixture-pedalboard-config-001",
        "pedalboard",
        "pedalboard",
        "object_config_in_memory",
        "Created an empty Pedalboard config only; no processing, plugin execution, or export.",
        {"pluginCount": len(board)},
    )


def mir_eval_fixture() -> dict[str, Any]:
    signal = importlib.import_module("scipy.signal")
    onset = importlib.import_module("mir_eval.onset")
    reference = signal.lfilter([1.0], [1.0], [0.10, 0.25, 0.50])
    estimated = signal.lfilter([1.0], [1.0], [0.10, 0.26, 0.75])
    precision, recall, f_measure = onset.f_measure(reference, estimated)
    return fixture_passed(
        "sound-fixture-mir-eval-synthetic-metric-001",
        "mir_eval",
        "mir_eval",
        "synthetic_metric_array_in_memory",
        "Computed a synthetic onset metric from numeric arrays only.",
        {
            "precisionRounded": round(float(precision), 4),
            "recallRounded": round(float(recall), 4),
            "fMeasureRounded": round(float(f_measure), 4),
        },
    )


FIXTURES: list[Callable[[], dict[str, Any]]] = [
    librosa_fixture,
    audioread_fixture,
    pydub_fixture,
    scipy_fixture,
    scipy_signal_fixture,
    resampy_fixture,
    pyloudnorm_fixture,
    audioflux_fixture,
    music21_fixture,
    pretty_midi_fixture,
    mido_fixture,
    noisereduce_fixture,
    pedalboard_fixture,
    mir_eval_fixture,
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--requirements",
        default="server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    )
    args = parser.parse_args()

    requirements_path = Path(args.requirements)
    pins = parse_requirements(requirements_path)
    requirement_mismatch = pins != EXPECTED_REQUIREMENTS

    metadata: dict[str, str] = {}
    metadata_failures: list[dict[str, str]] = []
    for package_name, expected_version in EXPECTED_REQUIREMENTS.items():
        try:
            actual = importlib.metadata.version(package_name)
            metadata[package_name] = actual
            if actual != expected_version:
                metadata_failures.append(
                    {"packageName": package_name, "expected": expected_version, "actual": actual}
                )
        except importlib.metadata.PackageNotFoundError as exc:
            metadata_failures.append(
                {"packageName": package_name, "expected": expected_version, "actual": type(exc).__name__}
            )

    rows = [run_fixture(fixture) for fixture in FIXTURES]
    failed = [row for row in rows if row["status"] == "failed"]
    skipped = [row for row in rows if row["status"] == "skipped_blocked_by_policy"]
    passed = [row for row in rows if row["status"] == "passed"]

    decision = "sound_oss_tools_6_synthetic_fixture_validation_passed_with_warnings_ready_for_owner_review"
    if requirement_mismatch or metadata_failures or failed:
        decision = "sound_oss_tools_6_blocked_fixture_validation_failure"

    result = {
        "phase": "SOUND-OSS-TOOLS-6",
        "decision": decision,
        "requirementsManifest": str(requirements_path),
        "requirementsValidated": not requirement_mismatch,
        "metadataValidated": not metadata_failures,
        "packageMetadata": metadata,
        "metadataFailures": metadata_failures,
        "approvedModuleCount": len(EXPECTED_MODULES),
        "fixtureCount": len(rows),
        "passedCount": len(passed),
        "skippedCount": len(skipped),
        "failedCount": len(failed),
        "rows": rows,
        "runtimeFlags": {
            "realUserDataUsed": False,
            "mediaFileRead": False,
            "mediaFileWritten": False,
            "mediaProcessingRun": False,
            "ffmpegOrFfprobeRun": False,
            "pydubMediaOperationsRun": False,
            "workerExecutionRun": False,
            "routeExecutionRun": False,
            "providerOrModelCallRun": False,
            "supabaseMutationRun": False,
            "sqlRun": False,
            "signedUrlCreated": False,
            "publicArtifactCreated": False,
            "dryRunPassedClaimed": False,
            "generatedLocalFixturePassedClaimed": False,
            "runtimeReadinessClaimed": False,
            "betaProductionUnlockClaimed": False,
        },
        "pydubWarningStatus": {
            "warningPreserved": True,
            "mediaOperationsBlocked": True,
            "status": "skipped_blocked_by_policy",
        },
        "nextPrompt": "SOUND-OSS-TOOLS-7: synthetic fixture owner review, no media processing",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 1 if decision == "sound_oss_tools_6_blocked_fixture_validation_failure" else 0


if __name__ == "__main__":
    raise SystemExit(main())
