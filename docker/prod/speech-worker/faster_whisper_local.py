import argparse
import json
import os
from pathlib import Path

from faster_whisper import WhisperModel


def main() -> None:
    args = parse_args()
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["MODEL_DOWNLOADS_ENABLED"] = "false"

    model_path = Path(args.model_path)
    audio_path = Path(args.audio_path)
    output_json = Path(args.output_json)
    for required in ["model.bin", "config.json", "tokenizer.json", "vocabulary.txt"]:
        if not (model_path / required).exists():
            raise RuntimeError(f"Approved local model file missing: {required}")
    if not audio_path.exists():
        raise RuntimeError("Generated audio fixture is missing.")

    model = WhisperModel(
        str(model_path),
        device=args.device,
        compute_type=args.compute_type,
        local_files_only=True,
    )
    segments_iter, info = model.transcribe(
        str(audio_path),
        beam_size=1,
        word_timestamps=args.word_timestamps,
        vad_filter=False,
    )
    segments = []
    full_text = []
    for index, segment in enumerate(segments_iter):
        words = []
        for word in segment.words or []:
            words.append({
                "word": word.word,
                "start": word.start,
                "end": word.end,
                "probability": word.probability,
            })
        text = segment.text or ""
        full_text.append(text)
        segments.append({
            "id": f"segment-{index + 1}",
            "start": segment.start,
            "end": segment.end,
            "text": text,
            "words": words,
        })

    output = {
        "status": "completed",
        "language": getattr(info, "language", None),
        "segments": segments,
        "fullText": " ".join(part.strip() for part in full_text if part.strip()),
        "warnings": [],
    }
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(output, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--audio-path", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--device", default="cpu", choices=["cpu"])
    parser.add_argument("--compute-type", default="int8")
    parser.add_argument("--word-timestamps", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    main()
