#!/usr/bin/env python3
"""Controlled no-media SOUND CPU tool execution runner.

This source is intentionally fail-closed. It executes only synthetic in-memory
operations and writes only a JSON report to stdout. It must not open media
files, spawn child processes, persist artifacts, contact services, or dispatch
workers/routes.
"""

from __future__ import annotations

import argparse
import importlib
import importlib.metadata
import json
import math
import sys
import traceback
from typing import Any, Callable


DIRECT_TOOLS = [
    {"toolId": "librosa", "package": "librosa", "module": "librosa"},
    {"toolId": "audioread", "package": "audioread", "module": "audioread"},
    {"toolId": "pydub", "package": "pydub", "module": "pydub"},
    {"toolId": "scipy", "package": "scipy", "module": "scipy"},
    {"toolId": "resampy", "package": "resampy", "module": "resampy"},
    {"toolId": "pyloudnorm", "package": "pyloudnorm", "module": "pyloudnorm"},
    {"toolId": "audioflux", "package": "audioflux", "module": "audioflux"},
    {"toolId": "music21", "package": "music21", "module": "music21"},
    {"toolId": "pretty_midi", "package": "pretty_midi", "module": "pretty_midi"},
    {"toolId": "mido", "package": "mido", "module": "mido"},
    {"toolId": "noisereduce", "package": "noisereduce", "module": "noisereduce"},
    {"toolId": "pedalboard", "package": "pedalboard", "module": "pedalboard"},
    {"toolId": "mir_eval", "package": "mir_eval", "module": "mir_eval"},
]

ALIAS_TOOLS = [
    {"toolId": "pydub_effects", "package": "pydub", "module": "pydub"},
    {"toolId": "ebu_r128_pyloudnorm", "package": "pyloudnorm", "module": "pyloudnorm"},
]

TOOLS = DIRECT_TOOLS + ALIAS_TOOLS
TOOL_IDS = [tool["toolId"] for tool in TOOLS]
WORKERS = ["sound-cpu-analysis-worker", "sound-audio-metadata-worker"]
IMAGES = ["reeditpro/sound-cpu-analysis-worker", "reeditpro/sound-audio-metadata-worker"]
JOB_TYPES = [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis",
]

RUNTIME_FLAGS = [
    "allowRealExternalAgentExecution",
    "allowRealUserMedia",
    "allowWorkerDispatch",
    "allowRouteExecution",
    "allowManifestPersistence",
    "allowMediaOpen",
    "allowProviderCall",
    "allowModelCall",
    "allowSupabaseMutation",
    "allowSqlExecution",
    "allowStorageObjectCreation",
    "allowSignedUrlCreation",
    "allowPublicArtifactCreation",
    "allowBetaUnlock",
    "allowProductionUnlock",
]

FORBIDDEN_PAYLOAD_FIELDS = [
    "rawPrompt",
    "mediaFilePath",
    "sourceMediaUrl",
    "signedUrl",
    "publicArtifactUrl",
    "artifactWriteTarget",
    "providerOutputBlob",
    "serviceRolePayload",
    "supabaseWriteIntent",
    "sqlStatement",
    "modelWeightLocation",
    "gcpResourceTarget",
    "dockerRunRequest",
    "betaUserExecutionRequest",
    "realExternalAgentRequest",
    "realUserMediaManifest",
    "manifestPersistenceRequest",
    "workerDispatchRequest",
    "routeExecutionRequest",
]


def has_value(value: Any) -> bool:
    if value is None or value is False:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    if isinstance(value, (list, tuple, set)):
        return len(value) > 0
    if isinstance(value, dict):
        return len(value) > 0
    return value != 0


def sanitize_error(exc: BaseException) -> dict[str, str]:
    lines = traceback.format_exception_only(type(exc), exc)
    return {
        "type": type(exc).__name__,
        "message": " ".join(line.strip() for line in lines)[0:500],
    }


def default_request() -> dict[str, Any]:
    return {
        "requestKind": "sound_cpu_bounded_external_agent_no_media_controlled_tool_execution",
        "adapterMode": "bounded_external_agent_no_media_controlled_tool_execution",
        "approvedPlanSnapshotId": "controlled-tool-execution-source-gate-snapshot",
        "workspaceId": "controlled-tool-execution-source-gate-workspace",
        "projectId": "controlled-tool-execution-source-gate-project",
        "jobId": "controlled-tool-execution-source-gate-job",
        "idempotencyKey": "controlled-tool-execution-source-gate-idempotency",
        "workerName": "sound-cpu-analysis-worker",
        "imageName": "reeditpro/sound-cpu-analysis-worker",
        "jobType": "sound.package_import_smoke",
        "toolId": "all",
        "syntheticOrNoMediaInput": True,
        "realExternalAgentUsed": False,
        "realUserMediaUsed": False,
        "runtimeFlags": {name: False for name in RUNTIME_FLAGS},
        "claims": {
            "generated_local_fixture_passed": False,
            "dry_run_passed": False,
            "runtimeReadiness": False,
            "workerReadiness": False,
            "mediaReadiness": False,
            "externalBetaReady": False,
            "productionReady": False,
        },
    }


def read_request() -> dict[str, Any]:
    data = sys.stdin.read().strip()
    if not data:
        return default_request()
    parsed = json.loads(data)
    if not isinstance(parsed, dict):
        raise ValueError("request_json_object_required")
    return parsed


def validate_request(request: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if request.get("requestKind") != "sound_cpu_bounded_external_agent_no_media_controlled_tool_execution":
        reasons.append("request_kind_invalid")
    if request.get("adapterMode") != "bounded_external_agent_no_media_controlled_tool_execution":
        reasons.append("adapter_mode_invalid")
    if request.get("syntheticOrNoMediaInput") is not True:
        reasons.append("synthetic_or_no_media_input_required")
    if request.get("realExternalAgentUsed") is not False:
        reasons.append("real_external_agent_detected")
    if request.get("realUserMediaUsed") is not False:
        reasons.append("real_user_media_detected")
    if request.get("workerName") not in WORKERS:
        reasons.append("worker_not_allowlisted")
    if request.get("imageName") not in IMAGES:
        reasons.append("image_not_allowlisted")
    if request.get("jobType") not in JOB_TYPES:
        reasons.append("job_type_not_allowlisted")
    if request.get("toolId") not in TOOL_IDS + ["all"]:
        reasons.append("tool_id_not_allowlisted")
    for field in ["approvedPlanSnapshotId", "workspaceId", "projectId", "jobId", "idempotencyKey"]:
        if not request.get(field):
            reasons.append(f"{field}_required")
    flags = request.get("runtimeFlags")
    if not isinstance(flags, dict):
        reasons.append("runtime_flags_required")
    else:
        for name in RUNTIME_FLAGS:
            if flags.get(name) is not False:
                reasons.append(f"{name}_must_be_false")
    for field in FORBIDDEN_PAYLOAD_FIELDS:
        if has_value(request.get(field)):
            reasons.append(f"{field}_not_allowed")
    claims = request.get("claims", {})
    for claim in [
        "generated_local_fixture_passed",
        "dry_run_passed",
        "runtimeReadiness",
        "workerReadiness",
        "mediaReadiness",
        "externalBetaReady",
        "productionReady",
    ]:
        if isinstance(claims, dict) and claims.get(claim) is True:
            reasons.append(f"{claim}_claim_not_allowed")
    return sorted(set(reasons))


def version_for(package: str) -> str:
    try:
        return importlib.metadata.version(package)
    except importlib.metadata.PackageNotFoundError:
        return "missing"


def import_module(name: str) -> Any:
    return importlib.import_module(name)


def op_librosa() -> dict[str, Any]:
    numpy = import_module("numpy")
    librosa = import_module("librosa")
    y = numpy.zeros(2205, dtype=float)
    rms = librosa.feature.rms(y=y)
    return {"rmsShape": list(rms.shape)}


def op_audioread() -> dict[str, Any]:
    audioread = import_module("audioread")
    return {"moduleLoaded": bool(audioread), "mediaOpenCalled": False}


def op_pydub() -> dict[str, Any]:
    audio_segment = import_module("pydub").AudioSegment
    segment = audio_segment.silent(duration=10)
    return {"durationMs": len(segment), "channels": segment.channels}


def op_scipy() -> dict[str, Any]:
    numpy = import_module("numpy")
    signal = import_module("scipy.signal")
    peaks, _ = signal.find_peaks(numpy.array([0, 1, 0, 1, 0], dtype=float))
    return {"peakCount": int(len(peaks))}


def op_resampy() -> dict[str, Any]:
    numpy = import_module("numpy")
    resampy = import_module("resampy")
    source = numpy.zeros(100, dtype=float)
    result = resampy.resample(source, 1000, 500)
    return {"outputLength": int(len(result))}


def op_pyloudnorm() -> dict[str, Any]:
    numpy = import_module("numpy")
    pyloudnorm = import_module("pyloudnorm")
    meter = pyloudnorm.Meter(48000)
    loudness = meter.integrated_loudness(numpy.zeros(4800, dtype=float))
    return {"loudnessFiniteOrSilent": bool(math.isfinite(loudness) or math.isinf(loudness))}


def op_audioflux() -> dict[str, Any]:
    audioflux = import_module("audioflux")
    return {"moduleLoaded": bool(audioflux), "version": getattr(audioflux, "__version__", "unknown")}


def op_music21() -> dict[str, Any]:
    music21 = import_module("music21")
    note = music21.note.Note("C4")
    return {"noteName": note.pitch.nameWithOctave}


def op_pretty_midi() -> dict[str, Any]:
    pretty_midi = import_module("pretty_midi")
    midi = pretty_midi.PrettyMIDI()
    instrument = pretty_midi.Instrument(program=0)
    instrument.notes.append(pretty_midi.Note(velocity=64, pitch=60, start=0.0, end=0.1))
    midi.instruments.append(instrument)
    return {"instrumentCount": len(midi.instruments), "noteCount": len(midi.instruments[0].notes)}


def op_mido() -> dict[str, Any]:
    mido = import_module("mido")
    message = mido.Message("note_on", note=60, velocity=64, time=0)
    return {"messageType": message.type, "note": message.note}


def op_noisereduce() -> dict[str, Any]:
    numpy = import_module("numpy")
    noisereduce = import_module("noisereduce")
    result = noisereduce.reduce_noise(y=numpy.zeros(1024, dtype=float), sr=16000, stationary=True)
    return {"outputLength": int(len(result))}


def op_pedalboard() -> dict[str, Any]:
    numpy = import_module("numpy")
    pedalboard = import_module("pedalboard")
    board = pedalboard.Pedalboard([pedalboard.Gain(gain_db=0.0)])
    result = board(numpy.zeros((1, 1024), dtype=numpy.float32), sample_rate=48000)
    return {"outputShape": list(result.shape)}


def op_mir_eval() -> dict[str, Any]:
    numpy = import_module("numpy")
    mir_eval = import_module("mir_eval")
    scores = mir_eval.onset.f_measure(numpy.array([0.1, 0.2]), numpy.array([0.1, 0.25]))
    return {"scoreCount": len(scores)}


def op_pydub_effects() -> dict[str, Any]:
    audio_segment = import_module("pydub").AudioSegment
    segment = audio_segment.silent(duration=10).fade_in(1) + 3
    return {"durationMs": len(segment), "channels": segment.channels}


def op_ebu_r128_pyloudnorm() -> dict[str, Any]:
    return op_pyloudnorm()


OPERATIONS: dict[str, Callable[[], dict[str, Any]]] = {
    "librosa": op_librosa,
    "audioread": op_audioread,
    "pydub": op_pydub,
    "scipy": op_scipy,
    "resampy": op_resampy,
    "pyloudnorm": op_pyloudnorm,
    "audioflux": op_audioflux,
    "music21": op_music21,
    "pretty_midi": op_pretty_midi,
    "mido": op_mido,
    "noisereduce": op_noisereduce,
    "pedalboard": op_pedalboard,
    "mir_eval": op_mir_eval,
    "pydub_effects": op_pydub_effects,
    "ebu_r128_pyloudnorm": op_ebu_r128_pyloudnorm,
}


def run_tools(selected_tool_id: str) -> list[dict[str, Any]]:
    selected = TOOL_IDS if selected_tool_id == "all" else [selected_tool_id]
    results: list[dict[str, Any]] = []
    for tool_id in selected:
        meta = next(tool for tool in TOOLS if tool["toolId"] == tool_id)
        record: dict[str, Any] = {
            "toolId": tool_id,
            "package": meta["package"],
            "module": meta["module"],
            "version": version_for(meta["package"]),
            "passed": False,
            "operation": None,
            "error": None,
        }
        try:
            import_module(meta["module"])
            record["operation"] = OPERATIONS[tool_id]()
            record["passed"] = True
        except Exception as exc:  # noqa: BLE001 - sanitized below for proof output
            record["error"] = sanitize_error(exc)
        results.append(record)
    return results


def describe_contract() -> dict[str, Any]:
    return {
        "runner": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner",
        "toolCount": len(TOOLS),
        "directPinnedPackageCount": len(DIRECT_TOOLS),
        "aliasCoveredToolCount": len(ALIAS_TOOLS),
        "tools": TOOL_IDS,
        "workers": WORKERS,
        "images": IMAGES,
        "jobTypes": JOB_TYPES,
        "runtimeFlagsRequiredFalse": RUNTIME_FLAGS,
        "forbiddenPayloadFields": FORBIDDEN_PAYLOAD_FIELDS,
        "readsRealMedia": False,
        "writesArtifacts": False,
        "dispatchesWorkers": False,
        "executesRoutes": False,
        "touchesSupabase": False,
        "runsSql": False,
        "callsProvidersOrModels": False,
        "runsDockerOrCloudRun": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--describe-contract", action="store_true")
    args = parser.parse_args()

    if args.describe_contract:
        print(json.dumps(describe_contract(), indent=2, sort_keys=True))
        return 0

    request = read_request()
    stop_reasons = validate_request(request)
    if stop_reasons:
        print(
            json.dumps(
                {
                    "ok": False,
                    "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_blocked_boundary",
                    "stopReasons": stop_reasons,
                    "sideEffects": side_effects(),
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 2

    results = run_tools(request["toolId"])
    passed = sum(1 for result in results if result["passed"] is True)
    failed = len(results) - passed
    print(
        json.dumps(
            {
                "ok": failed == 0,
                "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_observed",
                "requestedToolId": request["toolId"],
                "attemptedToolCount": len(results),
                "passedToolCount": passed,
                "failedToolCount": failed,
                "results": results,
                "sideEffects": side_effects(),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0 if failed == 0 else 1


def side_effects() -> dict[str, bool]:
    return {
        "realExternalAgentUsed": False,
        "realUserMediaUsed": False,
        "workerDispatched": False,
        "routeExecuted": False,
        "manifestPersisted": False,
        "mediaOpened": False,
        "providerCalled": False,
        "modelCalled": False,
        "supabaseTouched": False,
        "sqlExecuted": False,
        "storageObjectCreated": False,
        "signedUrlCreated": False,
        "publicArtifactCreated": False,
        "dockerCloudRunExecuted": False,
        "betaUnlocked": False,
        "productionUnlocked": False,
        "outputWrittenToDisk": False,
        "tempArtifactsCreated": False,
    }


if __name__ == "__main__":
    raise SystemExit(main())
