#!/usr/bin/env python3
"""Bounded, offline AST AudioSet classifier for reviewed local testing.

The process accepts one verified PCM WAV through stdin. Raw waveform data and
free-form model output never reach stdout or durable study state. Only bounded
window ranges plus a small set of AudioSet labels and confidence values are
returned for the TypeScript adapter to reduce into generalized, copy-safe
Audio/Sound Design evidence.
"""

from __future__ import annotations

import io
import json
import os
import socket
import sys
import wave
from typing import Any


SCHEMA_VERSION = "reeditpro-reviewed-local-ast-audioset-audio-v1"
TARGET_SAMPLE_RATE = 16_000
WINDOW_SECONDS = 10.0
MAX_AUDIO_BYTES = 64 * 1024 * 1024
MAX_WINDOWS = 3
TOP_LABEL_COUNT = 5

NETWORK_ATTEMPTED = False


def _deny_network(*_args: Any, **_kwargs: Any) -> None:
    global NETWORK_ATTEMPTED
    NETWORK_ATTEMPTED = True
    raise RuntimeError("Reviewed local AST runtime forbids network access.")


def _enforce_offline_runtime() -> None:
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    socket.socket.connect = _deny_network  # type: ignore[method-assign]
    socket.create_connection = _deny_network  # type: ignore[assignment]


def _read_bounded_pcm_wav() -> tuple[Any, int]:
    import numpy as np

    raw = sys.stdin.buffer.read(MAX_AUDIO_BYTES + 1)
    if len(raw) < 44 or len(raw) > MAX_AUDIO_BYTES:
        raise ValueError("Reviewed local AST input is outside the bounded WAV size.")
    with wave.open(io.BytesIO(raw), "rb") as handle:
        channels = handle.getnchannels()
        sample_width = handle.getsampwidth()
        sample_rate = handle.getframerate()
        frame_count = handle.getnframes()
        compression = handle.getcomptype()
        if not 1 <= channels <= 8:
            raise ValueError("Reviewed local AST WAV channel count is invalid.")
        if sample_width != 2 or compression != "NONE":
            raise ValueError("Reviewed local AST accepts uncompressed signed 16-bit PCM WAV only.")
        if not 8_000 <= sample_rate <= 192_000 or frame_count < 1:
            raise ValueError("Reviewed local AST WAV sample authority is invalid.")
        pcm = handle.readframes(frame_count)
    samples = np.frombuffer(pcm, dtype="<i2").reshape(-1, channels)
    mono = samples.astype(np.float32).mean(axis=1) / 32768.0
    if mono.size < 1:
        raise ValueError("Reviewed local AST WAV contains no samples.")
    if sample_rate != TARGET_SAMPLE_RATE:
        target_count = max(1, int(round(mono.size * TARGET_SAMPLE_RATE / sample_rate)))
        source_positions = np.linspace(0.0, 1.0, num=mono.size, endpoint=True)
        target_positions = np.linspace(0.0, 1.0, num=target_count, endpoint=True)
        mono = np.interp(target_positions, source_positions, mono).astype(np.float32)
    return mono, TARGET_SAMPLE_RATE


def _window_ranges(sample_count: int, sample_rate: int) -> list[tuple[int, int]]:
    window_samples = int(WINDOW_SECONDS * sample_rate)
    if sample_count <= window_samples:
        return [(0, sample_count)]
    last_start = sample_count - window_samples
    starts = [0, last_start // 2, last_start]
    unique_starts = sorted(set(starts))[:MAX_WINDOWS]
    return [(start, min(sample_count, start + window_samples)) for start in unique_starts]


def _load_runtime(model_path: str) -> tuple[Any, Any, str]:
    import torch
    from transformers import ASTForAudioClassification, AutoFeatureExtractor

    processor = AutoFeatureExtractor.from_pretrained(model_path, local_files_only=True)
    model = ASTForAudioClassification.from_pretrained(model_path, local_files_only=True)
    model.eval()
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    try:
        model.to(device)
    except Exception:
        device = "cpu"
        model.to(device)
    return processor, model, device


def _classify_window(
    samples: Any,
    processor: Any,
    model: Any,
    device: str,
) -> tuple[list[dict[str, Any]], str]:
    import torch

    inputs = processor(samples, sampling_rate=TARGET_SAMPLE_RATE, return_tensors="pt")

    def infer(target: str) -> Any:
        prepared = {key: value.to(target) for key, value in inputs.items()}
        with torch.no_grad():
            return model(**prepared).logits[0].detach().cpu()

    try:
        logits = infer(device)
    except Exception:
        if device == "cpu":
            raise
        device = "cpu"
        model.to(device)
        logits = infer(device)
    scores = torch.softmax(logits, dim=-1)
    top = torch.topk(scores, k=min(TOP_LABEL_COUNT, int(scores.shape[-1])))
    labels: list[dict[str, Any]] = []
    for index, score in zip(top.indices.tolist(), top.values.tolist(), strict=True):
        label = str(model.config.id2label[int(index)]).strip()
        if not label or len(label) > 160:
            raise ValueError("Reviewed local AST returned an invalid label.")
        labels.append({"label": label, "score": round(float(score), 8)})
    return labels, device


def main() -> None:
    if len(sys.argv) != 2:
        raise ValueError("Usage: ast-audioset-classify-audio.py MODEL_PATH")
    _enforce_offline_runtime()
    model_path = os.path.realpath(sys.argv[1])
    if not os.path.isabs(sys.argv[1]) or model_path != sys.argv[1] or not os.path.isdir(model_path):
        raise ValueError("Reviewed local AST model must be one absolute, non-aliased directory.")

    samples, sample_rate = _read_bounded_pcm_wav()
    processor, model, device = _load_runtime(model_path)
    windows: list[dict[str, Any]] = []
    for start, end in _window_ranges(int(samples.size), sample_rate):
        top_labels, device = _classify_window(samples[start:end], processor, model, device)
        windows.append({
            "startSeconds": round(start / sample_rate, 6),
            "endSeconds": round(end / sample_rate, 6),
            "topLabels": top_labels,
        })

    result = {
        "schemaVersion": SCHEMA_VERSION,
        "windowsAnalyzed": len(windows),
        "windows": windows,
        "deviceUsed": device,
        "semanticAudioModelExecuted": True,
        "rawAudioPersisted": False,
        "rawWaveformOrSpectrogramPersisted": False,
        "rawModelOutputPersisted": False,
        "exactAudioFingerprintRetained": False,
        "externalUrlFetched": False,
        "networkAttempted": NETWORK_ATTEMPTED,
        "providerCallMade": False,
    }
    print(json.dumps(result, separators=(",", ":")))


if __name__ == "__main__":
    main()
