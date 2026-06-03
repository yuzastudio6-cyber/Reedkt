#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import time
import wave
from pathlib import Path

SAMPLE_RATE = 48000
SAMPLE_ID = "phase37d-phase32-color-export-safe-zone-window-v1"
CHAIN_ID = "controlled-real-video-chain-phase28-through-phase32-v1"
MAX_DURATION_SECONDS = 5.0

REQUIRED_CONFIRMATIONS = [
    "REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO",
    "REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ",
    "REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD",
    "REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH",
    "REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD",
]
FORBIDDEN_CONFIRMATIONS = [
    "REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO",
    "REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_TRACK_A_RUNTIME",
    "REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING",
    "REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT",
    "REEDITPRO_CONFIRM_PROVIDER_CALLS",
    "REEDITPRO_CONFIRM_PRODUCTION_UNLOCK",
    "REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK",
]

STRETCH_FIXTURES = [
    {
        "fixtureId": "controlled-stretch-expand-110",
        "stretchRatio": 1.10,
        "durationTolerancePercent": 2.0,
        "blocking": True,
    },
    {
        "fixtureId": "controlled-stretch-contract-090",
        "stretchRatio": 0.90,
        "durationTolerancePercent": 2.0,
        "blocking": True,
    },
    {
        "fixtureId": "controlled-stretch-expand-125",
        "stretchRatio": 1.25,
        "durationTolerancePercent": 3.0,
        "blocking": False,
        "stressFixture": True,
    },
]


def ensure_confirmations():
    missing = [name for name in REQUIRED_CONFIRMATIONS if os.environ.get(name) != "true"]
    forbidden = [name for name in FORBIDDEN_CONFIRMATIONS if os.environ.get(name) == "true"]
    if missing or forbidden:
        raise RuntimeError(f"signalsmith_controlled_confirmation_gate_failed missing={missing} forbidden={forbidden}")


def run_command(args, cwd=None, check=True, timeout=600):
    started = time.time()
    proc = subprocess.run(
        args,
        cwd=cwd,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout,
        env={**os.environ, "CLOUDSDK_CORE_DISABLE_PROMPTS": "1"},
    )
    result = {
        "args": [str(arg) for arg in args],
        "returncode": proc.returncode,
        "status": "passed" if proc.returncode == 0 else "blocked",
        "durationMs": round((time.time() - started) * 1000),
        "stdoutSummary": "\n".join(proc.stdout.splitlines()[:12]),
        "stderrSummary": "\n".join(proc.stderr.splitlines()[:12]),
    }
    if check and proc.returncode != 0:
        raise RuntimeError(json.dumps(result, indent=2))
    return result


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, value):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def clone_source(repo_url, tag, commit, source_dir):
    if source_dir.exists():
        shutil.rmtree(source_dir)
    clone = run_command(["git", "clone", "--recurse-submodules", "--branch", tag, "--depth", "1", repo_url, str(source_dir)], timeout=600)
    actual = run_command(["git", "rev-parse", "HEAD"], cwd=source_dir)
    actual_commit = actual["stdoutSummary"].strip()
    if actual_commit != commit:
        run_command(["git", "fetch", "--unshallow"], cwd=source_dir, check=False)
        actual = run_command(["git", "rev-parse", "HEAD"], cwd=source_dir)
        actual_commit = actual["stdoutSummary"].strip()
    if actual_commit != commit:
        raise RuntimeError(f"signalsmith_selected_commit_mismatch expected={commit} actual={actual_commit}")
    submodule = run_command(["git", "submodule", "status", "--recursive"], cwd=source_dir, check=False)
    return clone, actual_commit, submodule


def collect_source_checksums(source_dir):
    selected = []
    for relative in [
        "signalsmith-stretch.h",
        "LICENSE.txt",
        "README.md",
        "include/signalsmith-stretch/signalsmith-stretch.h",
    ]:
        path = source_dir / relative
        if path.exists():
            selected.append({
                "relativePath": relative,
                "sizeBytes": path.stat().st_size,
                "sha256": sha256_file(path),
            })
    for dsp_file in sorted((source_dir / "dsp").rglob("*.h"))[:20] if (source_dir / "dsp").exists() else []:
        selected.append({
            "relativePath": dsp_file.relative_to(source_dir).as_posix(),
            "sizeBytes": dsp_file.stat().st_size,
            "sha256": sha256_file(dsp_file),
        })
    return selected


def find_compiler():
    for compiler in ["c++", "clang++", "g++"]:
        if shutil.which(compiler):
            return compiler
    raise RuntimeError("signalsmith_cpp_compiler_unavailable")


def build_binary(source_dir, binary_path):
    compiler = find_compiler()
    cpp_path = Path(__file__).with_name("signalsmith_fixture_main.cpp")
    include_args = [
        f"-I{source_dir}",
        f"-I{source_dir / 'include'}",
        f"-I{source_dir / 'dsp' / 'include'}",
    ]
    result = run_command([compiler, "-std=c++11", "-O2", *include_args, str(cpp_path), "-o", str(binary_path)], timeout=600)
    version = run_command([compiler, "--version"], check=False)
    return {
        "status": result["status"],
        "compiler": compiler,
        "compilerVersion": version["stdoutSummary"],
        "compileCommand": [compiler, "-std=c++11", "-O2", "<include-paths>", "signalsmith_fixture_main.cpp", "-o", "<temp-binary>"],
        "durationMs": result["durationMs"],
        "stderrSummary": result["stderrSummary"],
    }


def read_wav_mono_48k(path):
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        sample_width = wav.getsampwidth()
        sample_rate = wav.getframerate()
        frames = wav.readframes(wav.getnframes())
    if channels != 1 or sample_width != 2 or sample_rate != SAMPLE_RATE:
        raise RuntimeError(f"bounded_wav_format_invalid channels={channels} sample_width={sample_width} sample_rate={sample_rate}")
    samples = []
    for (value,) in struct.iter_unpack("<h", frames):
        samples.append(value / 32768.0)
    return samples


def write_wav(path, samples):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            value = int(max(-1.0, min(1.0, sample)) * 32767)
            frames.extend(struct.pack("<h", value))
        wav.writeframes(bytes(frames))


def write_raw_float(path, samples):
    with open(path, "wb") as fh:
        for sample in samples:
            fh.write(struct.pack("<f", float(max(-1.0, min(1.0, sample)))))


def read_raw_float(path):
    data = Path(path).read_bytes()
    return [value[0] for value in struct.iter_unpack("<f", data)]


def audio_metrics(samples):
    if not samples:
        return {
            "durationSeconds": 0,
            "sampleRate": SAMPLE_RATE,
            "channels": 1,
            "rms": 0,
            "peak": 0,
            "clippingCount": 0,
            "silenceRatio": 1,
            "transientCountProxy": 0,
        }
    peak = max(abs(sample) for sample in samples)
    rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
    clipping = sum(1 for sample in samples if abs(sample) >= 0.999)
    silence = sum(1 for sample in samples if abs(sample) < 0.001) / len(samples)
    transient = 0
    previous = samples[0]
    for sample in samples[1:]:
        if abs(sample - previous) > 0.25:
            transient += 1
        previous = sample
    return {
        "durationSeconds": round(len(samples) / SAMPLE_RATE, 6),
        "sampleRate": SAMPLE_RATE,
        "channels": 1,
        "rms": round(rms, 8),
        "peak": round(peak, 8),
        "clippingCount": clipping,
        "silenceRatio": round(silence, 8),
        "transientCountProxy": transient,
        "noiseBandProxy": spectral_noise_proxy(samples),
    }


def spectral_noise_proxy(samples):
    if len(samples) < 1024:
        return 0
    # Deterministic finite-difference proxy, not production MIR.
    diffs = [abs(samples[i] - samples[i - 1]) for i in range(1, min(len(samples), SAMPLE_RATE))]
    return round(sum(diffs) / len(diffs), 8)


def copy_and_verify_source(source_gcs_uri, expected_sha, destination):
    if not source_gcs_uri.startswith("gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/"):
        raise RuntimeError("approved_controlled_timing_stretch_sample_missing:source_prefix_not_allowed")
    result = run_command(["gcloud", "--quiet", "storage", "cp", source_gcs_uri, str(destination)], timeout=1200)
    actual_sha = sha256_file(destination)
    if actual_sha != expected_sha:
        raise RuntimeError(f"controlled_sample_sha256_mismatch expected={expected_sha} actual={actual_sha}")
    return {
        "status": "passed",
        "sampleId": SAMPLE_ID,
        "chainId": CHAIN_ID,
        "sourceGcsUri": source_gcs_uri,
        "sourceSha256": actual_sha,
        "copyReport": result,
        "privateOnly": True,
        "publicUrlStatus": "blocked",
        "signedUrlAsSourceOfTruth": "blocked",
    }


def extract_bounded_audio(source_video, output_wav, start, end):
    duration = end - start
    if duration <= 0 or duration > MAX_DURATION_SECONDS:
        raise RuntimeError(f"controlled_audio_window_duration_invalid:{duration}")
    probe = run_command([
        "ffprobe",
        "-v", "error",
        "-show_streams",
        "-show_format",
        "-of", "json",
        str(source_video),
    ], timeout=120)
    extract = run_command([
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel", "error",
        "-ss", str(start),
        "-t", str(duration),
        "-i", str(source_video),
        "-vn",
        "-ac", "1",
        "-ar", str(SAMPLE_RATE),
        "-sample_fmt", "s16",
        str(output_wav),
    ], timeout=300)
    samples = read_wav_mono_48k(output_wav)
    metrics = audio_metrics(samples)
    if metrics["durationSeconds"] <= 0 or metrics["durationSeconds"] > MAX_DURATION_SECONDS + 0.15:
        raise RuntimeError(f"controlled_audio_extraction_duration_invalid:{metrics['durationSeconds']}")
    if metrics["rms"] < 0.0001 or metrics["silenceRatio"] > 0.98:
        raise RuntimeError("controlled_audio_window_not_timing_stretch_suitable")
    return {
        "status": "passed",
        "sampleId": SAMPLE_ID,
        "chainId": CHAIN_ID,
        "window": {"startSeconds": start, "endSeconds": end, "durationSeconds": duration},
        "outputFormat": "48k_mono_pcm_wav",
        "boundedWavSha256": sha256_file(output_wav),
        "boundedWavSizeBytes": output_wav.stat().st_size,
        "metrics": metrics,
        "ffprobeSummary": probe,
        "ffmpegExtraction": extract,
        "privacy": "private_temp_only",
    }, samples


def run_controlled_stretch(binary_path, input_samples, output_dir):
    results = []
    blockers = []
    metrics_rows = []
    input_duration = len(input_samples) / SAMPLE_RATE
    input_metrics = audio_metrics(input_samples)
    for fixture in STRETCH_FIXTURES:
        fixture_id = fixture["fixtureId"]
        expected_duration = input_duration * fixture["stretchRatio"]
        output_count = int(round(expected_duration * SAMPLE_RATE))
        input_raw = output_dir / f"{fixture_id}.input.raw"
        output_raw = output_dir / f"{fixture_id}.output.raw"
        output_wav = output_dir / f"{fixture_id}.output.wav"
        write_raw_float(input_raw, input_samples)
        started = time.time()
        run = run_command([str(binary_path), str(input_raw), str(output_raw), str(SAMPLE_RATE), str(len(input_samples)), str(output_count)])
        run["args"] = ["<signalsmith-controlled-fixture-binary>", "<input.raw>", "<output.raw>", str(SAMPLE_RATE), str(len(input_samples)), str(output_count)]
        latency_ms = round((time.time() - started) * 1000)
        output_samples = read_raw_float(output_raw)
        write_wav(output_wav, output_samples)
        output_metrics = audio_metrics(output_samples)
        duration_error = abs(output_metrics["durationSeconds"] - expected_duration)
        tolerance_seconds = expected_duration * fixture["durationTolerancePercent"] / 100.0
        passed = (
            duration_error <= tolerance_seconds
            and output_metrics["sampleRate"] == SAMPLE_RATE
            and output_metrics["channels"] == 1
            and output_metrics["rms"] > 0.0001
            and output_metrics["clippingCount"] <= input_metrics["clippingCount"] + 10
        )
        if not passed and fixture.get("blocking", True):
            blockers.append(f"controlled_stretch_fixture_failed:{fixture_id}")
        result = {
            **fixture,
            "status": "passed" if passed else ("warning" if not fixture.get("blocking", True) else "blocked"),
            "runtimeResult": run,
            "latencyMs": latency_ms,
            "inputMetrics": input_metrics,
            "outputMetrics": output_metrics,
            "expectedOutputDurationSeconds": round(expected_duration, 6),
            "durationRatio": round(output_metrics["durationSeconds"] / input_metrics["durationSeconds"], 8) if input_metrics["durationSeconds"] else None,
            "durationErrorSeconds": round(duration_error, 8),
            "toleranceSeconds": round(tolerance_seconds, 8),
            "outputSha256": sha256_file(output_wav),
            "outputSizeBytes": output_wav.stat().st_size,
            "privacy": "private_temp_only",
        }
        results.append(result)
        metrics_rows.append({
            "fixtureId": fixture_id,
            "stretchRatio": fixture["stretchRatio"],
            "durationRatio": result["durationRatio"],
            "durationErrorSeconds": result["durationErrorSeconds"],
            "latencyMs": latency_ms,
            "inputMetrics": input_metrics,
            "outputMetrics": output_metrics,
            "outputSha256": result["outputSha256"],
            "status": result["status"],
        })
    return results, metrics_rows, blockers


def upload_artifacts(artifact_dir, private_prefix):
    uploads = []
    blockers = []
    if not shutil.which("gcloud"):
        return {
            "status": "blocked",
            "privateArtifactPrefix": private_prefix,
            "objectCount": 0,
            "blockers": ["gcloud_unavailable_for_private_artifact_upload"],
            "uploads": [],
        }
    for path in sorted(Path(artifact_dir).rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(artifact_dir).as_posix()
        target = private_prefix.rstrip("/") + "/" + relative
        result = run_command(["gcloud", "--quiet", "storage", "cp", str(path), target], check=False, timeout=300)
        uploads.append({
            "relativePath": relative,
            "target": target,
            "status": result["status"],
            "durationMs": result["durationMs"],
            "sha256": sha256_file(path),
            "sizeBytes": path.stat().st_size,
        })
        if result["status"] != "passed":
            blockers.append(f"upload_failed:{relative}")
    return {
        "status": "passed" if not blockers else "blocked",
        "privateArtifactPrefix": private_prefix,
        "objectCount": sum(1 for upload in uploads if upload["status"] == "passed"),
        "uploads": uploads,
        "blockers": blockers,
        "publicOutput": "blocked",
        "signedUrls": "blocked",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-root", required=True)
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--repo-url", required=True)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--private-prefix", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--source-gcs-uri", required=True)
    parser.add_argument("--source-sha256", required=True)
    parser.add_argument("--window-start", required=True, type=float)
    parser.add_argument("--window-end", required=True, type=float)
    parser.add_argument("--keep-temp", action="store_true")
    args = parser.parse_args()

    ensure_confirmations()
    work_root = Path(args.work_root)
    artifact_dir = Path(args.artifact_dir)
    source_dir = work_root / "signalsmith-source"
    build_dir = work_root / "build"
    media_dir = work_root / "controlled-media"
    controlled_dir = artifact_dir / "controlled-sample"
    report_dir = artifact_dir / "reports"
    for directory in [build_dir, media_dir, controlled_dir, report_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    blockers = []
    source_status = build_status = sample_status = extraction_status = stretch_status = audio_status = "blocked"
    actual_commit = None
    source_checksums = []
    clone_report = {}
    submodule_report = {}
    build_report = {}
    binary_manifest = {}
    sample_evidence = {}
    extraction_report = {}
    stretch_results = []
    metrics_rows = []
    private_manifest = {}

    try:
        clone_report, actual_commit, submodule_report = clone_source(args.repo_url, args.tag, args.commit, source_dir)
        source_checksums = collect_source_checksums(source_dir)
        source_status = "passed"
    except Exception as error:
        blockers.append(f"signalsmith_exact_source_fetch_blocked:{error}")

    binary_path = build_dir / "signalsmith-controlled-fixture"
    if source_status == "passed":
        try:
            build_report = build_binary(source_dir, binary_path)
            binary_manifest = {
                "status": "passed",
                "binaryPath": "<temp-binary>",
                "sizeBytes": binary_path.stat().st_size,
                "sha256": sha256_file(binary_path),
                "committed": False,
            }
            build_status = "passed"
        except Exception as error:
            blockers.append(f"signalsmith_controlled_runtime_build_blocked:{error}")

    source_video = media_dir / "approved-controlled-source.mp4"
    bounded_wav = controlled_dir / "phase36j_controlled_input_48k_mono.wav"
    if build_status == "passed":
        try:
            sample_evidence = copy_and_verify_source(args.source_gcs_uri, args.source_sha256, source_video)
            sample_status = "passed"
        except Exception as error:
            blockers.append(str(error))

    if sample_status == "passed":
        try:
            extraction_report, input_samples = extract_bounded_audio(source_video, bounded_wav, args.window_start, args.window_end)
            extraction_status = "passed"
        except Exception as error:
            blockers.append(str(error))
            input_samples = []

    if extraction_status == "passed":
        try:
            stretch_results, metrics_rows, stretch_blockers = run_controlled_stretch(binary_path, input_samples, controlled_dir)
            blockers.extend(stretch_blockers)
            stretch_status = "passed" if not stretch_blockers else "blocked"
            audio_status = stretch_status
        except Exception as error:
            blockers.append(f"signalsmith_controlled_stretch_execution_blocked:{error}")

    controlled_stretch_report = {
        "status": stretch_status,
        "sampleId": SAMPLE_ID,
        "chainId": CHAIN_ID,
        "boundedControlledAudioOnly": True,
        "stretchResults": stretch_results,
        "publicOutput": "blocked",
    }
    audio_metrics_report = {
        "status": audio_status,
        "sampleId": SAMPLE_ID,
        "chainId": CHAIN_ID,
        "inputMetrics": extraction_report.get("metrics"),
        "fixtures": metrics_rows,
    }

    write_json(report_dir / "phase_36j_worker_source_fetch.json", {
        "status": source_status,
        "cloneReport": clone_report,
        "actualCommit": actual_commit,
        "submoduleReport": submodule_report,
        "sourceChecksums": source_checksums,
    })
    write_json(report_dir / "phase_36j_worker_build.json", build_report)
    write_json(report_dir / "phase_36j_worker_binary.json", binary_manifest)
    write_json(report_dir / "phase_36j_worker_sample_evidence.json", sample_evidence)
    write_json(report_dir / "phase_36j_worker_extraction.json", extraction_report)
    write_json(report_dir / "phase_36j_worker_controlled_stretch.json", controlled_stretch_report)
    write_json(report_dir / "phase_36j_worker_audio_metrics.json", audio_metrics_report)

    private_manifest = upload_artifacts(artifact_dir, args.private_prefix)
    if private_manifest["status"] != "passed":
        blockers.extend(private_manifest.get("blockers", []))

    final_status = "passed" if (
        source_status == "passed"
        and build_status == "passed"
        and sample_status == "passed"
        and extraction_status == "passed"
        and stretch_status == "passed"
        and audio_status == "passed"
        and private_manifest["status"] == "passed"
        and not blockers
    ) else "blocked"

    result = {
        "status": final_status,
        "runId": args.run_id,
        "sourceAcquisitionStatus": source_status,
        "runtimeBuildStatus": build_status,
        "controlledSampleEvidenceStatus": sample_status,
        "sourceSha256Verified": sample_status == "passed",
        "extractionStatus": extraction_status,
        "controlledStretchStatus": stretch_status,
        "audioQaStatus": audio_status,
        "actualCommit": actual_commit,
        "sourceChecksums": source_checksums,
        "buildReport": build_report,
        "binaryManifest": binary_manifest,
        "sampleEvidence": sample_evidence,
        "extractionReport": extraction_report,
        "controlledStretchReport": controlled_stretch_report,
        "audioMetricsReport": audio_metrics_report,
        "privateArtifactManifest": private_manifest,
        "blockers": sorted(set(blockers)),
    }
    print(json.dumps(result, indent=2))

    if not args.keep_temp and final_status == "passed":
        shutil.rmtree(work_root, ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({
            "status": "blocked",
            "sourceAcquisitionStatus": "blocked",
            "runtimeBuildStatus": "blocked",
            "controlledSampleEvidenceStatus": "blocked",
            "extractionStatus": "blocked",
            "controlledStretchStatus": "blocked",
            "audioQaStatus": "blocked",
            "blockers": [str(exc)],
        }, indent=2))
        sys.exit(0)
