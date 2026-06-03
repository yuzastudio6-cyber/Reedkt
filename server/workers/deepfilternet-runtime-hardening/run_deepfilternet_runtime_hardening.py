#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import os
import shutil
import struct
import subprocess
import time
import wave
from pathlib import Path


SAMPLE_RATE = 48000


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_wav(path: Path, samples):
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


def read_wav_samples(path: Path):
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        rate = wav.getframerate()
        frames = wav.getnframes()
        raw = wav.readframes(frames)
    values = struct.unpack("<" + "h" * (len(raw) // 2), raw)
    if channels > 1:
        values = values[::channels]
    return [v / 32768.0 for v in values], rate, channels


def metrics(path: Path):
    samples, rate, channels = read_wav_samples(path)
    duration = len(samples) / rate if rate else 0
    rms = math.sqrt(sum(s * s for s in samples) / max(1, len(samples)))
    peak = max((abs(s) for s in samples), default=0)
    clipping = sum(1 for s in samples if abs(s) >= 0.999)
    silence = sum(1 for s in samples if abs(s) < 0.001) / max(1, len(samples))
    diffs = [samples[i] - samples[i - 1] for i in range(1, len(samples))]
    noise_proxy = math.sqrt(sum(d * d for d in diffs) / max(1, len(diffs)))
    return {
        "pathBasename": path.name,
        "durationSeconds": round(duration, 6),
        "sampleRate": rate,
        "channels": channels,
        "rms": rms,
        "peak": peak,
        "clippingCount": clipping,
        "silenceRatio": silence,
        "noiseProxy": noise_proxy,
        "sizeBytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def generated_fixture(path: Path):
    samples = []
    for i in range(SAMPLE_RATE * 3):
        t = i / SAMPLE_RATE
        envelope = 0.5 + 0.5 * math.sin(2 * math.pi * 2.0 * t)
        tone = 0.16 * envelope * math.sin(2 * math.pi * (180 + 120 * t) * t)
        chirp = 0.08 * math.sin(2 * math.pi * (420 + 80 * math.sin(t)) * t)
        noise = 0.035 * math.sin(2 * math.pi * 7000 * t) + 0.02 * math.sin(2 * math.pi * 11000 * t)
        samples.append(tone + chirp + noise)
    write_wav(path, samples)


def run_deep_filter(binary: Path, model: Path, input_wav: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    started = time.time()
    subprocess.run([
        str(binary),
        "--model",
        str(model),
        "--output-dir",
        str(out_dir),
        str(input_wav),
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    elapsed = time.time() - started
    wavs = sorted(out_dir.glob("*.wav"))
    if not wavs:
        raise RuntimeError(f"deep-filter produced no wav in {out_dir}")
    return wavs[0], elapsed


def extract_controlled_audio(video: Path, output_wav: Path, start: float, end: float):
    duration = end - start
    subprocess.run([
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
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-json", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    config = json.loads(Path(args.input_json).read_text())
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    binary = Path(config["deepFilterBinaryPath"])
    model = Path(config["deepFilterModelPath"])
    controlled_video = Path(config["controlledVideoPath"])
    sample = config["controlledSample"]

    generated_input = out_dir / "generated-noisy-input.wav"
    generated_fixture(generated_input)
    generated_output, generated_seconds = run_deep_filter(binary, model, generated_input, out_dir / "generated-enhanced")
    generated_before = metrics(generated_input)
    generated_after = metrics(generated_output)
    generated_gate = gate(generated_before, generated_after)

    controlled_input = out_dir / "controlled-window-input.wav"
    extract_controlled_audio(controlled_video, controlled_input, float(sample["windowStartSeconds"]), float(sample["windowEndSeconds"]))
    controlled_before = metrics(controlled_input)
    controlled_suitability = speech_suitability_gate(controlled_before)
    if controlled_suitability["status"] != "passed":
        result = {
            "phase": "36H",
            "runId": config["runId"],
            "status": "blocked",
            "generatedFixture": {
                "status": generated_gate["status"],
                "metrics": {"before": generated_before, "after": generated_after, "runtimeSeconds": generated_seconds},
                "gates": [generated_gate],
                "blockers": generated_gate["blockers"],
                "artifacts": [generated_input.name, generated_output.name],
            },
            "controlledExtraction": {
                "status": "blocked",
                "metrics": controlled_before,
                "gates": [controlled_suitability],
                "blockers": controlled_suitability["blockers"],
            },
            "controlledEnhancement": {
                "status": "not_run",
                "metrics": {"before": controlled_before},
                "blockers": controlled_suitability["blockers"],
            },
            "metrics": {
                "generated": {"before": generated_before, "after": generated_after},
                "controlled": {"before": controlled_before},
            },
            "artifacts": [
                {"basename": p.name, "sizeBytes": p.stat().st_size, "sha256": sha256_file(p)}
                for p in sorted(out_dir.rglob("*"))
                if p.is_file()
            ],
            "blockers": generated_gate["blockers"] + controlled_suitability["blockers"],
        }
        (out_dir / "phase_36h_worker_result.json").write_text(json.dumps(result, indent=2) + "\n")
        return
    controlled_output, controlled_seconds = run_deep_filter(binary, model, controlled_input, out_dir / "controlled-enhanced")
    controlled_after = metrics(controlled_output)
    controlled_gate = gate(controlled_before, controlled_after)

    result = {
        "phase": "36H",
        "runId": config["runId"],
        "status": "passed" if generated_gate["status"] == "passed" and controlled_gate["status"] == "passed" else "blocked",
        "generatedFixture": {
            "status": generated_gate["status"],
            "metrics": {"before": generated_before, "after": generated_after, "runtimeSeconds": generated_seconds},
            "gates": [generated_gate],
            "blockers": generated_gate["blockers"],
            "artifacts": [generated_input.name, generated_output.name],
        },
        "controlledExtraction": {
            "status": "passed",
            "metrics": controlled_before,
            "gates": [controlled_suitability],
            "blockers": [],
        },
        "controlledEnhancement": {
            "status": controlled_gate["status"],
            "metrics": {"before": controlled_before, "after": controlled_after, "runtimeSeconds": controlled_seconds},
            "gates": [controlled_gate],
            "blockers": controlled_gate["blockers"],
        },
        "metrics": {
            "generated": {"before": generated_before, "after": generated_after},
            "controlled": {"before": controlled_before, "after": controlled_after},
        },
        "artifacts": [
            {"basename": p.name, "sizeBytes": p.stat().st_size, "sha256": sha256_file(p)}
            for p in sorted(out_dir.rglob("*"))
            if p.is_file()
        ],
        "blockers": generated_gate["blockers"] + controlled_gate["blockers"],
    }
    (out_dir / "phase_36h_worker_result.json").write_text(json.dumps(result, indent=2) + "\n")


if __name__ == "__main__":
    main()
