#!/usr/bin/env python3
"""SOUND-OSS-TOOLS-4 binary/import proof runner.

This script validates committed SOUND OSS direct dependency pins, package
metadata, and no-op imports only. It does not process media, invoke CLIs,
connect to services, or write files.
"""

from __future__ import annotations

import importlib
import importlib.metadata
import json
import sys
from pathlib import Path


EXPECTED_REQUIREMENTS = [
    ("librosa", "0.11.0"),
    ("audioread", "3.1.0"),
    ("pydub", "0.25.1"),
    ("scipy", "1.17.1"),
    ("resampy", "0.4.3"),
    ("pyloudnorm", "0.2.0"),
    ("audioflux", "0.1.9"),
    ("music21", "10.3.0"),
    ("pretty_midi", "0.2.11"),
    ("mido", "1.3.3"),
    ("noisereduce", "3.0.3"),
    ("pedalboard", "0.9.23"),
    ("mir_eval", "0.8.2"),
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

FORBIDDEN_NAMES = [
    "demucs",
    "rnnoise",
    "essentia",
    "pyrubberband",
    "rubberband",
    "rubberband-cli",
    "ffmpeg",
    "ffprobe",
    "signalsmith_stretch",
]


def sanitize_error(exc: BaseException) -> dict[str, str]:
    message = str(exc).replace("\n", " ")
    if len(message) > 240:
        message = message[:237] + "..."
    return {"errorType": type(exc).__name__, "errorSummary": message}


def read_manifest(path: Path) -> list[str]:
    lines = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line and not line.startswith("#"):
            lines.append(line)
    return lines


def parse_pin(line: str) -> tuple[str, str] | None:
    if "==" not in line:
        return None
    name, version = line.split("==", 1)
    name = name.strip()
    version = version.strip()
    if not name or not version:
        return None
    return name, version


def main() -> int:
    if len(sys.argv) != 2:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "decision": "sound_oss_tools_4_blocked_metadata_mismatch",
                    "error": "Expected exactly one requirements manifest path argument.",
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 2

    manifest_path = Path(sys.argv[1])
    expected_lines = [f"{name}=={version}" for name, version in EXPECTED_REQUIREMENTS]
    result: dict[str, object] = {
        "phase": "SOUND-OSS-TOOLS-4",
        "requirementsManifest": str(manifest_path),
        "expectedDirectPinCount": len(EXPECTED_REQUIREMENTS),
        "expectedImportCount": len(EXPECTED_IMPORTS),
        "mediaProcessingRun": False,
        "runtimeExecutionRun": False,
        "workerExecutionRun": False,
        "routeExecutionRun": False,
        "providerCallRun": False,
        "modelCallRun": False,
        "supabaseMutationRun": False,
        "sqlRun": False,
        "dryRunPassedClaimed": False,
        "generatedLocalFixturePassedClaimed": False,
        "runtimeReadinessClaimed": False,
    }

    if not manifest_path.exists():
        result.update(
            {
                "status": "failed",
                "decision": "sound_oss_tools_4_blocked_metadata_mismatch",
                "manifestStatus": "missing",
            }
        )
        print(json.dumps(result, indent=2, sort_keys=True))
        return 1

    manifest_lines = read_manifest(manifest_path)
    parsed_pins = [parse_pin(line) for line in manifest_lines]
    manifest_names = [pin[0] for pin in parsed_pins if pin is not None]
    forbidden_manifest_names = [
        name for name in manifest_names if name.lower() in set(FORBIDDEN_NAMES)
    ]
    manifest_matches = manifest_lines == expected_lines and all(parsed_pins)
    result["manifest"] = {
        "status": "passed" if manifest_matches and not forbidden_manifest_names else "failed",
        "lineCount": len(manifest_lines),
        "lines": manifest_lines,
        "forbiddenNames": forbidden_manifest_names,
    }

    metadata_results = []
    metadata_failures = []
    for package_name, expected_version in EXPECTED_REQUIREMENTS:
        try:
            observed_version = importlib.metadata.version(package_name)
            status = "passed" if observed_version == expected_version else "failed"
            item = {
                "packageName": package_name,
                "expectedVersion": expected_version,
                "installedVersionObserved": observed_version,
                "metadataStatus": status,
            }
            if status != "passed":
                metadata_failures.append(item)
        except Exception as exc:  # noqa: BLE001 - report sanitized proof failure.
            item = {
                "packageName": package_name,
                "expectedVersion": expected_version,
                "installedVersionObserved": None,
                "metadataStatus": "failed",
                **sanitize_error(exc),
            }
            metadata_failures.append(item)
        metadata_results.append(item)
    result["metadataChecks"] = metadata_results

    import_results = []
    import_failures = []
    for module_name in EXPECTED_IMPORTS:
        try:
            importlib.import_module(module_name)
            item = {"moduleName": module_name, "importStatus": "passed"}
        except Exception as exc:  # noqa: BLE001 - report sanitized proof failure.
            item = {
                "moduleName": module_name,
                "importStatus": "failed",
                **sanitize_error(exc),
            }
            import_failures.append(item)
        import_results.append(item)
    result["importChecks"] = import_results

    result["excludedTools"] = [
        {"toolId": name, "importedOrProven": False} for name in FORBIDDEN_NAMES
    ]

    if not manifest_matches or forbidden_manifest_names:
        decision = "sound_oss_tools_4_blocked_metadata_mismatch"
        status = "failed"
    elif metadata_failures:
        decision = "sound_oss_tools_4_blocked_metadata_mismatch"
        status = "failed"
    elif import_failures:
        decision = "sound_oss_tools_4_blocked_import_failure"
        status = "failed"
    else:
        decision = (
            "sound_oss_tools_4_binary_import_proof_passed_ready_for_synthetic_fixture_validation_plan"
        )
        status = "passed"

    result["status"] = status
    result["decision"] = decision
    result["summary"] = {
        "manifestMatchedExpectedPins": manifest_matches,
        "metadataPassed": not metadata_failures,
        "importsPassed": not import_failures,
        "failedMetadataCount": len(metadata_failures),
        "failedImportCount": len(import_failures),
    }

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if status == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
