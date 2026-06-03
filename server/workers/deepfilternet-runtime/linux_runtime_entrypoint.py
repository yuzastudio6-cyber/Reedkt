#!/usr/bin/env python3
import hashlib
import json
import math
import os
import platform
import shutil
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import wave
from pathlib import Path


SAMPLE_RATE = 48000
WORK_ROOT = Path(os.environ.get("REEDITPRO_PHASE36H_WORK_ROOT", "/tmp/reeditpro-phase36h-linux"))
ARTIFACT_PREFIX = os.environ["REEDITPRO_PHASE36H_ARTIFACT_PREFIX"]
CLI_FILE = os.environ["REEDITPRO_PHASE36H_DEEPFILTER_CLI_FILE"]
MODEL_ARCHIVE = os.environ["REEDITPRO_PHASE36H_MODEL_ARCHIVE"]
MANIFEST_FILE = "model_tree_manifest.json"
CONTROLLED_SAMPLE_URI = os.environ["REEDITPRO_PHASE36H_CONTROLLED_SAMPLE_URI"]
PRIVATE_PREFIX = os.environ["REEDITPRO_PHASE36H_PRIVATE_ARTIFACT_PREFIX"].rstrip("/") + "/"
RUN_ID = os.environ["REEDITPRO_PHASE36H_RUN_ID"]

EXPECTED_CLI_SHA256 = os.environ["REEDITPRO_PHASE36H_DEEPFILTER_CLI_SHA256"]
EXPECTED_MODEL_SHA256 = os.environ["REEDITPRO_PHASE36H_MODEL_SHA256"]
EXPECTED_AGGREGATE_SHA256 = os.environ["REEDITPRO_PHASE36H_AGGREGATE_SHA256"]
EXPECTED_CONTROLLED_SHA256 = os.environ["REEDITPRO_PHASE36H_CONTROLLED_SAMPLE_SHA256"]

CONTROLLED_WINDOW_START = float(os.environ["REEDITPRO_PHASE36H_CONTROLLED_WINDOW_START_SECONDS"])
CONTROLLED_WINDOW_END = float(os.environ["REEDITPRO_PHASE36H_CONTROLLED_WINDOW_END_SECONDS"])
CONTROLLED_SAMPLE_ID = os.environ["REEDITPRO_PHASE36H_CONTROLLED_SAMPLE_ID"]
CONTROLLED_CHAIN_ID = os.environ["REEDITPRO_PHASE36H_CONTROLLED_CHAIN_ID"]

FORBIDDEN_CONFIRMATIONS = [
    "REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING",
    "REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT",
    "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_TRACK_A_RUNTIME",
]


def ensure_confirmations():
    required = [
        "REEDITPRO_CONFIRM_DEEPFILTERNET_LINUX_AMD64_RUNTIME",
        "REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE",
        "REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO",
        "REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO",
        "REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ",
        "REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD",
    ]
    missing = [name for name in required if os.environ.get(name) != "true"]
    forbidden = [name for name in FORBIDDEN_CONFIRMATIONS if os.environ.get(name) == "true"]
    if missing or forbidden:
        raise RuntimeError(f"confirmation_gate_failed missing={missing} forbidden={forbidden}")


def run_command(args, check=True, timeout=600):
    started = time.time()
    proc = subprocess.run(
        args,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout,
        env={**os.environ, "CLOUDSDK_CORE_DISABLE_PROMPTS": "1"},
    )
    result = {
        "args": [str(a) for a in args],
        "returncode": proc.returncode,
        "status": "passed" if proc.returncode == 0 else "blocked",
        "durationMs": round((time.time() - started) * 1000),
        "stdoutSummary": "\n".join(proc.stdout.splitlines()[:8]),
        "stderrSummary": "\n".join(proc.stderr.splitlines()[:8]),
    }
    if check and proc.returncode != 0:
        raise RuntimeError(json.dumps(result, indent=2))
    return result


def gcloud_cp(source, destination):
    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    return run_command(["gcloud", "--quiet", "storage", "cp", source, str(destination)])


def gcloud_upload(source, destination_prefix):
    uploads = []
    blockers = []
    source_path = Path(source)
    for path in sorted(source_path.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(source_path).as_posix()
        target = destination_prefix.rstrip("/") + "/" + relative
        result = run_command(["gcloud", "--quiet", "storage", "cp", str(path), target], check=False)
        uploads.append({"relativePath": relative, "target": target, "status": result["status"], "durationMs": result["durationMs"]})
        if result["status"] != "passed":
            blockers.append(f"upload_failed:{relative}")
    return {
        "args": ["gcloud", "--quiet", "storage", "cp", "<each-file>", destination_prefix],
        "returncode": 0 if not blockers else 1,
        "status": "passed" if not blockers else "blocked",
        "durationMs": sum(int(upload["durationMs"]) for upload in uploads),
        "stdoutSummary": f"uploaded {sum(1 for upload in uploads if upload['status'] == 'passed')} object(s)",
        "stderrSummary": "; ".join(blockers[:5]),
        "uploads": uploads,
    }


def parse_gcs_uri(uri):
    if not uri.startswith("gs://"):
        raise ValueError(f"expected_gcs_uri:{uri}")
    bucket_and_name = uri[5:]
    bucket, _, name = bucket_and_name.partition("/")
    if not bucket or not name:
        raise ValueError(f"expected_gcs_object_uri:{uri}")
    return bucket, name


def metadata_access_token():
    request = urllib.request.Request(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        headers={"Metadata-Flavor": "Google"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("metadata_access_token_missing")
    return token


def upload_object_json_api(path, target):
    started = time.time()
    bucket, name = parse_gcs_uri(target)
    token = metadata_access_token()
    url = (
        f"https://storage.googleapis.com/upload/storage/v1/b/{urllib.parse.quote(bucket, safe='')}/o"
        f"?uploadType=media&name={urllib.parse.quote(name, safe='')}"
    )
    data = Path(path).read_bytes()
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response.read()
        return {
            "status": "passed",
            "durationMs": round((time.time() - started) * 1000),
            "stderrSummary": "",
        }
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        if error.code == 409:
            return {
                "status": "passed",
                "durationMs": round((time.time() - started) * 1000),
                "stderrSummary": "object_already_exists_no_overwrite",
            }
        return {
            "status": "blocked",
            "durationMs": round((time.time() - started) * 1000),
            "stderrSummary": f"http_{error.code}:{body[:500]}",
        }
    except Exception as error:
        return {
            "status": "blocked",
            "durationMs": round((time.time() - started) * 1000),
            "stderrSummary": str(error)[:500],
        }


def private_upload(source, destination_prefix):
    uploads = []
    blockers = []
    source_path = Path(source)
    for path in sorted(source_path.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(source_path).as_posix()
        target = destination_prefix.rstrip("/") + "/" + relative
        result = upload_object_json_api(path, target)
        uploads.append({
            "relativePath": relative,
            "target": target,
            "status": result["status"],
            "durationMs": result["durationMs"],
            "stderrSummary": result["stderrSummary"],
        })
        if result["status"] != "passed":
            blockers.append(f"upload_failed:{relative}:{result['stderrSummary'][:160]}")
    return {
        "args": ["cloud-storage-json-api", "objects.insert", "<each-file>", destination_prefix],
        "returncode": 0 if not blockers else 1,
        "status": "passed" if not blockers else "blocked",
        "durationMs": sum(int(upload["durationMs"]) for upload in uploads),
        "stdoutSummary": f"uploaded {sum(1 for upload in uploads if upload['status'] == 'passed')} object(s)",
        "stderrSummary": "; ".join(blockers[:5]),
        "uploads": uploads,
    }


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, payload):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_wav(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            value = max(-32768, min(32767, int(sample * 32767)))
            frames.extend(struct.pack("<h", value))
        wav.writeframes(bytes(frames))


def read_wav_samples(path):
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        rate = wav.getframerate()
        frames = wav.getnframes()
        raw = wav.readframes(frames)
    values = struct.unpack("<" + "h" * (len(raw) // 2), raw)
    if channels > 1:
        values = values[::channels]
    return [v / 32768.0 for v in values], rate, channels


def metrics(path):
    samples, rate, channels = read_wav_samples(path)
    duration = len(samples) / rate if rate else 0
    rms = math.sqrt(sum(s * s for s in samples) / max(1, len(samples)))
    peak = max((abs(s) for s in samples), default=0)
    clipping = sum(1 for s in samples if abs(s) >= 0.999)
    silence = sum(1 for s in samples if abs(s) < 0.001) / max(1, len(samples))
    diffs = [samples[i] - samples[i - 1] for i in range(1, len(samples))]
    noise_proxy = math.sqrt(sum(d * d for d in diffs) / max(1, len(diffs)))
    return {
        "pathBasename": Path(path).name,
        "durationSeconds": round(duration, 6),
        "sampleRate": rate,
        "channels": channels,
        "rms": rms,
        "peak": peak,
        "clippingCount": clipping,
        "silenceRatio": silence,
        "noiseProxy": noise_proxy,
        "sizeBytes": Path(path).stat().st_size,
        "sha256": sha256_file(path),
    }


def generated_fixture(path):
    samples = []
    for i in range(SAMPLE_RATE * 3):
        t = i / SAMPLE_RATE
        envelope = 0.5 + 0.5 * math.sin(2 * math.pi * 2.0 * t)
        tone = 0.16 * envelope * math.sin(2 * math.pi * (180 + 120 * t) * t)
        chirp = 0.08 * math.sin(2 * math.pi * (420 + 80 * math.sin(t)) * t)
        noise = 0.035 * math.sin(2 * math.pi * 7000 * t) + 0.02 * math.sin(2 * math.pi * 11000 * t)
        samples.append(tone + chirp + noise)
    write_wav(path, samples)


def run_deep_filter(binary, model, input_wav, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    started = time.time()
    command = [str(binary), "--model", str(model), "--output-dir", str(out_dir), str(input_wav)]
    result = run_command(command, check=True, timeout=900)
    elapsed = time.time() - started
    wavs = sorted(out_dir.glob("*.wav"))
    if not wavs:
        raise RuntimeError(f"deep-filter produced no wav in {out_dir}")
    return wavs[0], elapsed, result


def extract_controlled_audio(video, output_wav, start, end):
    duration = end - start
    return run_command([
        "ffmpeg",
        "-y",
        "-ss",
        str(start),
        "-i",
        str(video),
        "-t",
        str(duration),
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        str(output_wav),
    ], check=True, timeout=600)


def gate(before, after):
    blockers = []
    if abs(before["durationSeconds"] - after["durationSeconds"]) > 0.15:
        blockers.append("duration_delta_exceeds_tolerance")
    if after["sampleRate"] != SAMPLE_RATE:
        blockers.append("output_sample_rate_not_48khz")
    if after["rms"] <= 0:
        blockers.append("output_is_silent")
    if after["clippingCount"] > before["clippingCount"]:
        blockers.append("clipping_count_increased")
    return {"status": "passed" if not blockers else "blocked", "blockers": blockers}


def speech_suitability_gate(sample_metrics):
    blockers = []
    if sample_metrics["durationSeconds"] < 1.75:
        blockers.append("controlled_audio_window_not_speech_suitable:duration_too_short")
    if sample_metrics["rms"] < 0.0015:
        blockers.append("controlled_audio_window_not_speech_suitable:rms_too_low")
    if sample_metrics["silenceRatio"] > 0.98:
        blockers.append("controlled_audio_window_not_speech_suitable:mostly_silent")
    return {"status": "passed" if not blockers else "blocked", "blockers": blockers}


def verify_artifacts(runtime_dir):
    cli_path = runtime_dir / CLI_FILE
    model_path = runtime_dir / MODEL_ARCHIVE
    manifest_path = runtime_dir / MANIFEST_FILE
    gcloud_cp(f"{ARTIFACT_PREFIX}{CLI_FILE}", cli_path)
    gcloud_cp(f"{ARTIFACT_PREFIX}{MODEL_ARCHIVE}", model_path)
    gcloud_cp(f"{ARTIFACT_PREFIX}{MANIFEST_FILE}", manifest_path)
    cli_path.chmod(0o755)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    cli_sha = sha256_file(cli_path)
    model_sha = sha256_file(model_path)
    aggregate_sha = str(manifest.get("aggregateSha256", ""))
    blockers = []
    if cli_sha != EXPECTED_CLI_SHA256:
        blockers.append("deepfilter_binary_sha256_mismatch")
    if model_sha != EXPECTED_MODEL_SHA256:
        blockers.append("deepfilternet_model_archive_sha256_mismatch")
    if aggregate_sha != EXPECTED_AGGREGATE_SHA256:
        blockers.append("deepfilternet_manifest_aggregate_sha256_mismatch")
    return {
        "status": "passed" if not blockers else "blocked",
        "cliPath": str(cli_path),
        "modelPath": str(model_path),
        "manifestPath": str(manifest_path),
        "cliSha256": cli_sha,
        "modelArchiveSha256": model_sha,
        "manifestAggregateSha256": aggregate_sha,
        "expectedAggregateSha256": EXPECTED_AGGREGATE_SHA256,
        "blockers": blockers,
    }, cli_path, model_path


def artifact_inventory(root):
    objects = []
    for path in sorted(Path(root).rglob("*")):
        if path.is_file():
            objects.append({
                "relativePath": str(path.relative_to(root)),
                "sizeBytes": path.stat().st_size,
                "sha256": sha256_file(path),
            })
    return objects


def main():
    ensure_confirmations()
    runtime_dir = WORK_ROOT / "runtime"
    reports_dir = WORK_ROOT / "reports"
    private_audio_dir = WORK_ROOT / "private-audio-artifacts"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    private_audio_dir.mkdir(parents=True, exist_ok=True)

    smoke_blockers = []
    machine = platform.machine().lower()
    system = platform.system().lower()
    if system != "linux" or machine not in ("x86_64", "amd64"):
        smoke_blockers.append(f"linux_amd64_required:{system}_{machine}")

    ffmpeg_version = run_command(["ffmpeg", "-version"], check=False)
    ffprobe_version = run_command(["ffprobe", "-version"], check=False)
    if ffmpeg_version["status"] != "passed":
        smoke_blockers.append("ffmpeg_unavailable_for_bounded_audio_extraction")
    if ffprobe_version["status"] != "passed":
        smoke_blockers.append("ffprobe_unavailable_for_bounded_audio_extraction")

    binary_verification, binary_path, model_path = verify_artifacts(runtime_dir)
    smoke_blockers.extend(binary_verification["blockers"])
    version_check = run_command([str(binary_path), "--version"], check=False)
    help_check = run_command([str(binary_path), "--help"], check=False)
    if help_check["status"] != "passed":
        smoke_blockers.append("deepfilter_help_command_failed")

    smoke_report = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": "passed" if not smoke_blockers else "blocked",
        "platform": {"system": system, "machine": machine},
        "ffmpeg": ffmpeg_version,
        "ffprobe": ffprobe_version,
        "binaryVerification": binary_verification,
        "deepFilterVersionCommand": version_check,
        "deepFilterHelpCommand": help_check,
        "noRuntimeAutoDownload": True,
        "blockers": smoke_blockers,
    }
    write_json(reports_dir / "phase_36h_deepfilternet_linux_runtime_smoke_report.json", smoke_report)
    write_json(reports_dir / "phase_36h_deepfilternet_binary_verification_report.json", binary_verification)
    write_json(reports_dir / "phase_36h_ffmpeg_availability_report.json", {
        "phase": "36H",
        "runId": RUN_ID,
        "status": "passed" if ffmpeg_version["status"] == "passed" and ffprobe_version["status"] == "passed" else "blocked",
        "ffmpeg": ffmpeg_version,
        "ffprobe": ffprobe_version,
        "blockers": [b for b in smoke_blockers if b.startswith("ffmpeg") or b.startswith("ffprobe")],
    })
    if smoke_blockers:
        raise RuntimeError(f"runtime_smoke_blocked:{smoke_blockers}")

    generated_input = private_audio_dir / "generated-noisy-input.wav"
    generated_fixture(generated_input)
    generated_output, generated_seconds, generated_command = run_deep_filter(binary_path, model_path, generated_input, private_audio_dir / "generated-enhanced")
    generated_before = metrics(generated_input)
    generated_after = metrics(generated_output)
    generated_gate = gate(generated_before, generated_after)
    generated_report = {
        "phase": "36H",
        "runId": RUN_ID,
        "fixtureId": "phase36h-generated-noisy-speechlike-48khz-v1",
        "generatedOnly": True,
        "status": generated_gate["status"],
        "metrics": {"before": generated_before, "after": generated_after, "runtimeSeconds": generated_seconds},
        "command": generated_command,
        "gates": [generated_gate],
        "blockers": generated_gate["blockers"],
    }
    write_json(reports_dir / "phase_36h_deepfilternet_generated_audio_fixture_manifest.json", {
        "phase": "36H",
        "runId": RUN_ID,
        "fixtureId": generated_report["fixtureId"],
        "status": generated_report["status"],
        "generatedOnly": True,
        "artifactsPrivateOnly": True,
        "metrics": generated_report["metrics"],
        "blockers": generated_report["blockers"],
    })
    write_json(reports_dir / "phase_36h_deepfilternet_generated_audio_qa_report.json", generated_report)
    if generated_gate["status"] != "passed":
        raise RuntimeError(f"generated_audio_blocked:{generated_gate['blockers']}")

    controlled_video = runtime_dir / "controlled-source.mp4"
    gcloud_cp(CONTROLLED_SAMPLE_URI, controlled_video)
    controlled_video_sha = sha256_file(controlled_video)
    controlled_sample_blockers = []
    if controlled_video_sha != EXPECTED_CONTROLLED_SHA256:
        controlled_sample_blockers.append("controlled_sample_sha256_mismatch")
    sample_evidence = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": "passed" if not controlled_sample_blockers else "blocked",
        "sampleId": CONTROLLED_SAMPLE_ID,
        "chainId": CONTROLLED_CHAIN_ID,
        "sourceGcsUri": CONTROLLED_SAMPLE_URI,
        "sourceSha256": controlled_video_sha,
        "expectedSourceSha256": EXPECTED_CONTROLLED_SHA256,
        "window": {"startSeconds": CONTROLLED_WINDOW_START, "endSeconds": CONTROLLED_WINDOW_END},
        "privateOnly": True,
        "publicUrlStatus": "blocked",
        "signedUrlAsSourceOfTruth": "blocked",
        "blockers": controlled_sample_blockers,
    }
    write_json(reports_dir / "phase_36h_controlled_audio_sample_evidence.json", sample_evidence)
    write_json(reports_dir / "phase_36h_controlled_audio_plan.json", {
        "phase": "36H",
        "runId": RUN_ID,
        "status": sample_evidence["status"],
        "sampleId": CONTROLLED_SAMPLE_ID,
        "chainId": CONTROLLED_CHAIN_ID,
        "window": sample_evidence["window"],
        "boundedAudioOnly": True,
        "fullVideoCleanup": "blocked",
        "arbitraryMedia": "blocked",
        "blockers": controlled_sample_blockers,
    })
    if controlled_sample_blockers:
        raise RuntimeError(f"controlled_sample_blocked:{controlled_sample_blockers}")

    controlled_input = private_audio_dir / "controlled-window-input.wav"
    extraction_command = extract_controlled_audio(controlled_video, controlled_input, CONTROLLED_WINDOW_START, CONTROLLED_WINDOW_END)
    controlled_before = metrics(controlled_input)
    controlled_suitability = speech_suitability_gate(controlled_before)
    extraction_report = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": controlled_suitability["status"],
        "sampleId": CONTROLLED_SAMPLE_ID,
        "window": sample_evidence["window"],
        "metrics": controlled_before,
        "command": extraction_command,
        "gates": [controlled_suitability],
        "blockers": controlled_suitability["blockers"],
    }
    write_json(reports_dir / "phase_36h_controlled_audio_extraction_report.json", extraction_report)
    if controlled_suitability["status"] != "passed":
        raise RuntimeError(f"controlled_audio_window_not_speech_suitable:{controlled_suitability['blockers']}")

    controlled_output, controlled_seconds, controlled_command = run_deep_filter(binary_path, model_path, controlled_input, private_audio_dir / "controlled-enhanced")
    controlled_after = metrics(controlled_output)
    controlled_gate = gate(controlled_before, controlled_after)
    controlled_report = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": controlled_gate["status"],
        "sampleId": CONTROLLED_SAMPLE_ID,
        "metrics": {"before": controlled_before, "after": controlled_after, "runtimeSeconds": controlled_seconds},
        "command": controlled_command,
        "gates": [controlled_gate],
        "blockers": controlled_gate["blockers"],
        "noRawAudioCommitted": True,
        "privateArtifactsOnly": True,
    }
    write_json(reports_dir / "phase_36h_controlled_deepfilternet_qa_report.json", controlled_report)
    audio_metrics_report = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": "passed" if generated_gate["status"] == "passed" and controlled_gate["status"] == "passed" else "blocked",
        "generatedMetrics": generated_report["metrics"],
        "controlledExtractionMetrics": controlled_before,
        "controlledEnhancementMetrics": controlled_report["metrics"],
        "blockers": generated_gate["blockers"] + controlled_gate["blockers"],
    }
    write_json(reports_dir / "phase_36h_audio_metrics_report.json", audio_metrics_report)
    if controlled_gate["status"] != "passed":
        raise RuntimeError(f"controlled_deepfilternet_blocked:{controlled_gate['blockers']}")

    upload_reports = private_upload(reports_dir, f"{PRIVATE_PREFIX}reports/")
    upload_audio = private_upload(private_audio_dir, f"{PRIVATE_PREFIX}runtime-artifacts/")
    artifact_manifest = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": "passed" if upload_reports["status"] == "passed" and upload_audio["status"] == "passed" else "blocked",
        "privateArtifactPrefix": PRIVATE_PREFIX,
        "committedAudioPayloads": False,
        "privateRuntimeArtifactCount": len(artifact_inventory(private_audio_dir)),
        "privateReportArtifactCount": len(artifact_inventory(reports_dir)),
        "runtimeArtifacts": artifact_inventory(private_audio_dir),
        "reportArtifacts": artifact_inventory(reports_dir),
        "uploadReports": upload_reports,
        "uploadRuntimeArtifacts": upload_audio,
        "blockers": [],
    }
    if artifact_manifest["status"] != "passed":
        artifact_manifest["blockers"] = ["phase36h_private_artifact_upload_failed"]
    write_json(reports_dir / "phase_36h_private_artifact_manifest.json", artifact_manifest)

    final_status = "passed" if artifact_manifest["status"] == "passed" else "blocked"
    hardening = {
        "phase": "36H",
        "runId": RUN_ID,
        "status": final_status,
        "runtimePreflightStatus": "passed",
        "linuxRuntimeStatus": "passed",
        "ffmpegStatus": "passed",
        "binaryVerificationStatus": binary_verification["status"],
        "generatedFixtureStatus": generated_report["status"],
        "controlledExtractionStatus": extraction_report["status"],
        "controlledEnhancementStatus": controlled_report["status"],
        "privateArtifactStatus": artifact_manifest["status"],
        "audioTimingToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if final_status == "passed" else "blocked",
        "controlledSampleId": CONTROLLED_SAMPLE_ID,
        "controlledAudioWindow": sample_evidence["window"],
        "blockers": artifact_manifest["blockers"],
        "blockedScopes": [
            "Phase 36I Signalsmith Stretch until implemented",
            "Demucs until provenance/legal approval",
            "broad media",
            "arbitrary media",
            "VLM runtime",
            "OCR runtime",
            "provider calls",
            "production",
            "internal/external beta unlock",
            "public output",
            "Track A runtime/visual/render stack",
        ],
        "nextPhaseDecision": "Proceed to Phase 36I Signalsmith Stretch approval/runtime/generated fixture." if final_status == "passed" else "Resolve Phase 36H Linux runtime blocker before Phase 36I.",
    }
    write_json(reports_dir / "phase_36h_deepfilternet_runtime_hardening_report.json", hardening)
    write_json(reports_dir / "phase_36h_audio_timing_beta_status_report.json", {
        "phase": "36H",
        "runId": RUN_ID,
        "status": final_status,
        "audioTimingToolFamilyBetaStatus": hardening["audioTimingToolFamilyBetaStatus"],
        "internalBetaReady": False,
        "externalBetaReady": False,
        "productionReady": False,
    })
    write_json(reports_dir / "phase_36h_blocker_report.json", {
        "phase": "36H",
        "runId": RUN_ID,
        "status": "passed_no_required_blockers" if final_status == "passed" else "blocked",
        "blockers": hardening["blockers"],
        "blockedScopes": hardening["blockedScopes"],
    })
    private_upload(reports_dir, f"{PRIVATE_PREFIX}reports/")
    print(json.dumps(hardening, indent=2, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        failure_dir = WORK_ROOT / "reports"
        failure_dir.mkdir(parents=True, exist_ok=True)
        failure = {
            "phase": "36H",
            "runId": RUN_ID,
            "status": "blocked",
            "error": str(exc),
            "audioTimingToolFamilyBetaStatus": "blocked",
        }
        write_json(failure_dir / "phase_36h_deepfilternet_linux_runtime_smoke_report.json", failure)
        write_json(failure_dir / "phase_36h_blocker_report.json", {**failure, "blockers": [str(exc)]})
        try:
            gcloud_upload(failure_dir, f"{PRIVATE_PREFIX}reports/")
        except Exception:
            pass
        print(json.dumps(failure, indent=2, sort_keys=True), file=sys.stderr)
        raise
