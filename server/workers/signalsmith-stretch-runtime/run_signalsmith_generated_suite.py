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
FORBIDDEN_CONFIRMATIONS = [
    "REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO",
    "REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ",
    "REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING",
    "REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT",
    "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_TRACK_A_RUNTIME",
]
REQUIRED_CONFIRMATIONS = [
    "REEDITPRO_CONFIRM_SIGNALSMITH_APPROVAL",
    "REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH",
    "REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD",
    "REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO",
    "REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD",
]

FIXTURES = [
    {
        "fixtureId": "generated-stretch-sine-noise-125",
        "kind": "sine_noise",
        "stretchRatio": 1.25,
        "durationSeconds": 2.0,
        "expectedDurationSeconds": 2.5,
        "durationTolerancePercent": 2.0,
    },
    {
        "fixtureId": "generated-stretch-chirp-075",
        "kind": "chirp",
        "stretchRatio": 0.75,
        "durationSeconds": 2.0,
        "expectedDurationSeconds": 1.5,
        "durationTolerancePercent": 2.0,
    },
    {
        "fixtureId": "generated-stretch-click-track-150",
        "kind": "click_track",
        "stretchRatio": 1.5,
        "durationSeconds": 2.0,
        "expectedDurationSeconds": 3.0,
        "durationTolerancePercent": 5.0,
        "stressFixture": True,
    },
]


def ensure_confirmations():
    missing = [name for name in REQUIRED_CONFIRMATIONS if os.environ.get(name) != "true"]
    forbidden = [name for name in FORBIDDEN_CONFIRMATIONS if os.environ.get(name) == "true"]
    if missing or forbidden:
        raise RuntimeError(f"signalsmith_confirmation_gate_failed missing={missing} forbidden={forbidden}")


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
        "stdoutSummary": "\n".join(proc.stdout.splitlines()[:10]),
        "stderrSummary": "\n".join(proc.stderr.splitlines()[:10]),
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


def generate_fixture(kind, duration_seconds):
    total = int(SAMPLE_RATE * duration_seconds)
    samples = []
    rng = 0x12345678
    for i in range(total):
        t = i / SAMPLE_RATE
        env = min(1.0, i / (0.05 * SAMPLE_RATE), (total - i) / (0.05 * SAMPLE_RATE))
        env = max(0.0, env)
        if kind == "sine_noise":
            rng = (1664525 * rng + 1013904223) & 0xFFFFFFFF
            noise = ((rng / 0xFFFFFFFF) * 2.0 - 1.0) * 0.025
            sample = env * (0.35 * math.sin(2 * math.pi * 440 * t) + noise)
        elif kind == "chirp":
            freq = 220 + 660 * (t / duration_seconds)
            sample = env * 0.32 * math.sin(2 * math.pi * freq * t)
        elif kind == "click_track":
            pulse = 0.0
            for onset in [0.1, 0.35, 0.65, 0.95, 1.25, 1.55, 1.85]:
                distance = abs(t - onset)
                if distance < 0.003:
                    pulse += 0.75 * (1.0 - distance / 0.003)
            sample = max(-0.9, min(0.9, pulse))
        else:
            sample = 0.0
        samples.append(float(max(-1.0, min(1.0, sample))))
    return samples


def write_raw_float(path, samples):
    with open(path, "wb") as fh:
        for sample in samples:
            fh.write(struct.pack("<f", float(sample)))


def read_raw_float(path):
    data = Path(path).read_bytes()
    return [value[0] for value in struct.iter_unpack("<f", data)]


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
            "dominantFrequencyHz": None,
            "transientCountProxy": 0,
        }
    peak = max(abs(sample) for sample in samples)
    rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
    clipping = sum(1 for sample in samples if abs(sample) >= 0.999)
    silence = sum(1 for sample in samples if abs(sample) < 0.001) / len(samples)
    transient = 0
    previous = samples[0]
    for sample in samples[1:]:
        if abs(sample - previous) > 0.35:
            transient += 1
        previous = sample
    dominant = estimate_dominant_frequency(samples)
    return {
        "durationSeconds": round(len(samples) / SAMPLE_RATE, 6),
        "sampleRate": SAMPLE_RATE,
        "channels": 1,
        "rms": round(rms, 8),
        "peak": round(peak, 8),
        "clippingCount": clipping,
        "silenceRatio": round(silence, 8),
        "dominantFrequencyHz": dominant,
        "transientCountProxy": transient,
    }


def estimate_dominant_frequency(samples):
    window = samples[: min(len(samples), SAMPLE_RATE)]
    if len(window) < 256:
        return None
    # Lightweight Goertzel scan for generated fixtures, not production MIR.
    best_freq = None
    best_power = 0.0
    for freq in range(100, 1201, 20):
        omega = 2 * math.pi * freq / SAMPLE_RATE
        coeff = 2 * math.cos(omega)
        q0 = q1 = q2 = 0.0
        for sample in window[::4]:
            q0 = coeff * q1 - q2 + sample
            q2 = q1
            q1 = q0
        power = q1 * q1 + q2 * q2 - coeff * q1 * q2
        if power > best_power:
            best_power = power
            best_freq = freq
    return best_freq


def clone_source(repo_url, tag, commit, source_dir):
    if source_dir.exists():
        shutil.rmtree(source_dir)
    clone = run_command(["git", "clone", "--recurse-submodules", "--branch", tag, "--depth", "1", repo_url, str(source_dir)], timeout=600)
    actual = run_command(["git", "rev-parse", "HEAD"], cwd=source_dir)
    actual_commit = actual["stdoutSummary"].strip()
    if actual_commit != commit:
        # Depth + tag can sometimes hide the exact commit if the remote changes; force a full fetch before blocking.
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
    args = [compiler, "-std=c++11", "-O2", *include_args, str(cpp_path), "-o", str(binary_path)]
    result = run_command(args, timeout=600)
    version = run_command([compiler, "--version"], check=False)
    return {
        "status": result["status"],
        "compiler": compiler,
        "compilerVersion": version["stdoutSummary"],
        "compileCommand": [compiler, "-std=c++11", "-O2", "<include-paths>", "signalsmith_fixture_main.cpp", "-o", "<temp-binary>"],
        "durationMs": result["durationMs"],
        "stderrSummary": result["stderrSummary"],
    }


def run_fixtures(binary_path, fixture_dir):
    results = []
    blockers = []
    for fixture in FIXTURES:
        fixture_id = fixture["fixtureId"]
        input_samples = generate_fixture(fixture["kind"], fixture["durationSeconds"])
        output_count = int(round(fixture["expectedDurationSeconds"] * SAMPLE_RATE))
        input_raw = fixture_dir / f"{fixture_id}.input.raw"
        output_raw = fixture_dir / f"{fixture_id}.output.raw"
        input_wav = fixture_dir / f"{fixture_id}.input.wav"
        output_wav = fixture_dir / f"{fixture_id}.output.wav"
        write_raw_float(input_raw, input_samples)
        write_wav(input_wav, input_samples)
        started = time.time()
        run = run_command([str(binary_path), str(input_raw), str(output_raw), str(SAMPLE_RATE), str(len(input_samples)), str(output_count)])
        run["args"] = ["<signalsmith-generated-fixture-binary>", "<input.raw>", "<output.raw>", str(SAMPLE_RATE), str(len(input_samples)), str(output_count)]
        latency_ms = round((time.time() - started) * 1000)
        output_samples = read_raw_float(output_raw)
        write_wav(output_wav, output_samples)
        input_metrics = audio_metrics(input_samples)
        output_metrics = audio_metrics(output_samples)
        duration_error = abs(output_metrics["durationSeconds"] - fixture["expectedDurationSeconds"])
        tolerance_seconds = fixture["expectedDurationSeconds"] * fixture["durationTolerancePercent"] / 100.0
        passed = (
            duration_error <= tolerance_seconds
            and output_metrics["sampleRate"] == SAMPLE_RATE
            and output_metrics["channels"] == 1
            and output_metrics["rms"] > 0.0001
            and output_metrics["clippingCount"] <= input_metrics["clippingCount"] + 10
        )
        if not passed:
            blockers.append(f"generated_fixture_failed:{fixture_id}")
        results.append({
            **fixture,
            "status": "passed" if passed else "blocked",
            "runtimeResult": run,
            "latencyMs": latency_ms,
            "inputMetrics": input_metrics,
            "outputMetrics": output_metrics,
            "durationRatio": round(output_metrics["durationSeconds"] / input_metrics["durationSeconds"], 8) if input_metrics["durationSeconds"] else None,
            "durationErrorSeconds": round(duration_error, 8),
            "toleranceSeconds": round(tolerance_seconds, 8),
            "inputSha256": sha256_file(input_wav),
            "outputSha256": sha256_file(output_wav),
            "privacy": "private_temp_only",
        })
    return results, blockers


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
    parser.add_argument("--keep-temp", action="store_true")
    args = parser.parse_args()

    ensure_confirmations()
    work_root = Path(args.work_root)
    artifact_dir = Path(args.artifact_dir)
    source_dir = work_root / "signalsmith-source"
    build_dir = work_root / "build"
    fixture_dir = artifact_dir / "generated-fixtures"
    report_dir = artifact_dir / "reports"
    build_dir.mkdir(parents=True, exist_ok=True)
    fixture_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)

    blockers = []
    source_status = build_status = generated_status = audio_status = "blocked"
    actual_commit = None
    source_checksums = []
    clone_report = {}
    submodule_report = {}
    build_report = {}
    binary_manifest = {}
    fixture_results = []
    private_manifest = {}

    try:
        clone_report, actual_commit, submodule_report = clone_source(args.repo_url, args.tag, args.commit, source_dir)
        source_checksums = collect_source_checksums(source_dir)
        source_status = "passed"
    except Exception as error:
        blockers.append(f"signalsmith_exact_source_fetch_blocked:{error}")

    binary_path = build_dir / "signalsmith-generated-fixture"
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
            blockers.append(f"signalsmith_runtime_build_blocked:{error}")

    if build_status == "passed":
        try:
            fixture_results, fixture_blockers = run_fixtures(binary_path, fixture_dir)
            blockers.extend(fixture_blockers)
            generated_status = "passed" if not fixture_blockers else "blocked"
            audio_status = generated_status
        except Exception as error:
            blockers.append(f"signalsmith_generated_fixture_execution_blocked:{error}")

    generated_audio_qa_report = {
        "status": generated_status,
        "fixtures": fixture_results,
        "generatedAudioOnly": True,
        "realMedia": "blocked",
        "controlledMedia": "blocked",
    }
    audio_metrics_report = {
        "status": audio_status,
        "fixtures": [
            {
                "fixtureId": fixture["fixtureId"],
                "stretchRatio": fixture.get("stretchRatio"),
                "inputMetrics": fixture.get("inputMetrics"),
                "outputMetrics": fixture.get("outputMetrics"),
                "durationRatio": fixture.get("durationRatio"),
                "durationErrorSeconds": fixture.get("durationErrorSeconds"),
                "latencyMs": fixture.get("latencyMs"),
                "inputSha256": fixture.get("inputSha256"),
                "outputSha256": fixture.get("outputSha256"),
                "status": fixture.get("status"),
            }
            for fixture in fixture_results
        ],
    }

    write_json(report_dir / "phase_36i_worker_source_fetch.json", {
        "status": source_status,
        "cloneReport": clone_report,
        "actualCommit": actual_commit,
        "submoduleReport": submodule_report,
        "sourceChecksums": source_checksums,
    })
    write_json(report_dir / "phase_36i_worker_build.json", build_report)
    write_json(report_dir / "phase_36i_worker_binary.json", binary_manifest)
    write_json(report_dir / "phase_36i_worker_generated_audio_qa.json", generated_audio_qa_report)
    write_json(report_dir / "phase_36i_worker_audio_metrics.json", audio_metrics_report)

    private_manifest = upload_artifacts(artifact_dir, args.private_prefix)
    if private_manifest["status"] != "passed":
        blockers.extend(private_manifest.get("blockers", []))

    final_status = "passed" if source_status == build_status == generated_status == audio_status == "passed" and private_manifest["status"] == "passed" and not blockers else "blocked"
    result = {
        "status": final_status,
        "runId": args.run_id,
        "sourceAcquisitionStatus": source_status,
        "runtimeBuildStatus": build_status,
        "generatedFixtureStatus": generated_status,
        "audioQaStatus": audio_status,
        "actualCommit": actual_commit,
        "sourceChecksums": source_checksums,
        "buildReport": build_report,
        "binaryManifest": binary_manifest,
        "fixtures": fixture_results,
        "generatedAudioQaReport": generated_audio_qa_report,
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
            "generatedFixtureStatus": "blocked",
            "audioQaStatus": "blocked",
            "blockers": [str(exc)],
        }, indent=2))
        sys.exit(0)
