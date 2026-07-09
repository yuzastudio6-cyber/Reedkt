export function buildFasterWhisperPythonRunnerScript(): string {
  return String.raw`
import argparse
import json


def bool_arg(value):
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def float_or_none(value):
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


parser = argparse.ArgumentParser(description="ReEditPro local faster-whisper JSON runner")
parser.add_argument("audio")
parser.add_argument("--model", required=True)
parser.add_argument("--device", default="auto")
parser.add_argument("--output_format", default="json")
parser.add_argument("--output", required=True)
parser.add_argument("--language")
parser.add_argument("--compute_type")
parser.add_argument("--word_timestamps", default="false")
parser.add_argument("--vad_filter", default="false")
parser.add_argument("--beam_size", type=int)
args = parser.parse_args()

if args.output_format != "json":
    raise SystemExit("ReEditPro faster-whisper runner only writes json output")

from faster_whisper import WhisperModel

model_kwargs = {}
if args.device and args.device != "auto":
    model_kwargs["device"] = args.device
if args.compute_type:
    model_kwargs["compute_type"] = args.compute_type

transcribe_kwargs = {
    "word_timestamps": bool_arg(args.word_timestamps),
    "vad_filter": bool_arg(args.vad_filter),
}
if args.language:
    transcribe_kwargs["language"] = args.language
if args.beam_size:
    transcribe_kwargs["beam_size"] = args.beam_size

model = WhisperModel(args.model, **model_kwargs)
segments_iter, info = model.transcribe(args.audio, **transcribe_kwargs)

segments = []
for index, segment in enumerate(segments_iter):
    segment_id = str(getattr(segment, "id", index + 1))
    words = []
    for word_index, word in enumerate(getattr(segment, "words", None) or []):
        words.append({
            "word": getattr(word, "word", "") or "",
            "start": float_or_none(getattr(word, "start", None)),
            "end": float_or_none(getattr(word, "end", None)),
            "probability": float_or_none(getattr(word, "probability", None)),
            "id": word_index + 1,
        })

    segments.append({
        "id": segment_id,
        "start": float_or_none(getattr(segment, "start", None)),
        "end": float_or_none(getattr(segment, "end", None)),
        "text": getattr(segment, "text", "") or "",
        "avg_logprob": float_or_none(getattr(segment, "avg_logprob", None)),
        "words": words,
    })

payload = {
    "language": getattr(info, "language", None),
    "language_probability": float_or_none(getattr(info, "language_probability", None)),
    "duration": float_or_none(getattr(info, "duration", None)),
    "segments": segments,
}

with open(args.output, "w", encoding="utf-8") as output_file:
    json.dump(payload, output_file, ensure_ascii=False)
`
}
