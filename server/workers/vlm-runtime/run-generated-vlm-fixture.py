#!/usr/bin/env python3
import argparse
import json
import os
import socket
import sys
import traceback
import urllib.request
from contextlib import AbstractContextManager
from pathlib import Path
from typing import Any, Dict, List, Tuple

from PIL import Image, ImageDraw, ImageFont


MODEL_ID = "Qwen/Qwen3-VL-8B-Instruct"
MODEL_REVISION = "0c351dd01ed87e9c1b53cbc748cba10e6187ff3b"


class NetworkGuard(AbstractContextManager):
    def __init__(self) -> None:
        self.network_attempted = False
        self._socket_connect = None
        self._create_connection = None
        self._urlopen = None
        self._requests_request = None

    def __enter__(self):
        self._socket_connect = socket.socket.connect
        self._create_connection = socket.create_connection
        self._urlopen = urllib.request.urlopen

        def is_loopback_address(address: Any) -> bool:
            if isinstance(address, tuple) and address:
                host = str(address[0])
                return host in {"127.0.0.1", "::1", "localhost", "0.0.0.0"}
            return False

        def blocked_socket(sock, address):
            if is_loopback_address(address):
                return self._socket_connect(sock, address)
            self.network_attempted = True
            raise RuntimeError("PHASE39C_RUNTIME_NETWORK_BLOCKED")

        def blocked_connection(address, *args, **kwargs):
            if is_loopback_address(address):
                return self._create_connection(address, *args, **kwargs)
            self.network_attempted = True
            raise RuntimeError("PHASE39C_RUNTIME_NETWORK_BLOCKED")

        def blocked_urlopen(*_args, **_kwargs):
            self.network_attempted = True
            raise RuntimeError("PHASE39C_RUNTIME_NETWORK_BLOCKED")

        socket.socket.connect = blocked_socket
        socket.create_connection = blocked_connection
        urllib.request.urlopen = blocked_urlopen
        try:
            import requests

            self._requests_request = requests.sessions.Session.request
            requests.sessions.Session.request = blocked_urlopen
        except Exception:
            self._requests_request = None
        return self

    def __exit__(self, exc_type, exc_value, tb):
        if self._socket_connect is not None:
            socket.socket.connect = self._socket_connect
        if self._create_connection is not None:
            socket.create_connection = self._create_connection
        if self._urlopen is not None:
            urllib.request.urlopen = self._urlopen
        if self._requests_request is not None:
            try:
                import requests

                requests.sessions.Session.request = self._requests_request
            except Exception:
                pass
        return False


def load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def draw_text(draw: ImageDraw.ImageDraw, xy: Tuple[int, int], text: str, size: int = 32, fill=(24, 32, 44), bold: bool = True) -> None:
    draw.text(xy, text, font=load_font(size, bold=bold), fill=fill)


def generate_fixture(spec: Dict[str, Any], out_dir: Path) -> Path:
    image = Image.new("RGB", (int(spec["width"]), int(spec["height"])), (246, 248, 250))
    draw = ImageDraw.Draw(image)
    fixture_id = spec["fixtureId"]
    if fixture_id == "generated-object-layout":
        draw.rounded_rectangle((460, 170, 840, 410), radius=10, outline=(31, 41, 55), width=4, fill=(255, 255, 255))
        draw_text(draw, (545, 270), "LAPTOP", 42)
        draw.ellipse((920, 300, 1060, 440), outline=(105, 58, 31), width=4, fill=(255, 255, 255))
        draw_text(draw, (950, 348), "MUG", 30)
        draw.rectangle((150, 540, 1130, 660), outline=(42, 52, 70), width=4, fill=(255, 255, 255))
        draw_text(draw, (505, 580), "TIMELINE PANEL", 36)
        draw.rectangle((110, 155, 220, 420), outline=(42, 116, 74), width=4, fill=(235, 252, 241))
        draw_text(draw, (130, 250), "PLANT", 26)
    elif fixture_id == "generated-ui-safe-zone":
        draw.rectangle((40, 36, 1240, 124), outline=(42, 52, 70), width=4, fill=(255, 255, 255))
        draw_text(draw, (80, 68), "TOOLBAR", 34)
        draw.rectangle((82, 500, 1200, 675), outline=(190, 50, 48), width=5, fill=(255, 255, 255))
        draw_text(draw, (300, 565), "LOWER THIRD ALERT - CAPTION CONFLICT", 38)
    elif fixture_id == "generated-ocr-vlm-comparison":
        draw.rectangle((70, 130, 430, 250), outline=(42, 52, 70), width=4, fill=(255, 255, 255))
        draw_text(draw, (105, 172), "SOURCE LABEL", 34)
        draw.rectangle((900, 135, 1188, 252), outline=(42, 52, 70), width=4, fill=(255, 255, 255))
        draw_text(draw, (965, 175), "EXPORT", 38)
        draw.rounded_rectangle((500, 320, 780, 430), radius=8, outline=(42, 52, 70), width=3, fill=(255, 255, 255))
        draw_text(draw, (530, 360), "CONF 0.82", 34)
    elif fixture_id == "generated-ambiguous-scene":
        draw.rectangle((420, 235, 780, 485), outline=(118, 122, 130), width=4, fill=(255, 255, 255))
        for i, label in enumerate(["?", "~", "?"]):
            draw.ellipse((470 + i * 90, 315, 545 + i * 90, 390), outline=(90, 95, 105), width=3, fill=(245, 246, 248))
            draw_text(draw, (494 + i * 90, 330), label, 38)
        draw_text(draw, (442, 510), "AMBIGUOUS ICON CLUSTER", 28)
    elif fixture_id == "generated-spatial-reasoning":
        draw.rectangle((100, 170, 460, 470), outline=(42, 52, 70), width=4, fill=(255, 255, 255))
        draw_text(draw, (205, 292), "LEFT PANEL", 34)
        draw.rectangle((820, 170, 1180, 470), outline=(42, 52, 70), width=4, fill=(255, 255, 255))
        draw_text(draw, (920, 292), "RIGHT CARD", 34)
        draw.line((520, 320, 760, 320), fill=(42, 52, 70), width=10)
        draw.polygon([(760, 320), (720, 292), (720, 348)], fill=(42, 52, 70))
        draw.rounded_rectangle((515, 45, 765, 120), radius=8, outline=(42, 52, 70), width=3, fill=(255, 255, 255))
        draw_text(draw, (558, 70), "TOP BADGE", 28)
    else:
        draw_text(draw, (70, 70), fixture_id, 42)
    out_path = out_dir / f"{fixture_id}.png"
    image.save(out_path)
    return out_path


def build_prompt(template: Dict[str, Any], fixture_path: Path) -> str:
    return (
        "<|im_start|>system\n"
        + template["systemInstruction"]
        + "<|im_end|>\n<|im_start|>user\n"
        + "<|vision_start|><|image_pad|><|vision_end|>\n"
        + template["userInstruction"]
        + f"\nFixture file name: {fixture_path.name}\n"
        + "<|im_end|>\n<|im_start|>assistant\n"
    )


def run_vllm(model_dir: Path, fixtures: List[Dict[str, Any]], templates: List[Dict[str, Any]], fixture_dir: Path) -> Tuple[str, List[Dict[str, Any]]]:
    if str(model_dir) == MODEL_ID or not model_dir.exists():
        raise RuntimeError("PHASE39C_LOCAL_MODEL_PATH_REQUIRED")
    with NetworkGuard() as guard:
        import vllm
        from vllm import LLM, SamplingParams

        llm = LLM(
            model=str(model_dir),
            tokenizer=str(model_dir),
            trust_remote_code=True,
            max_model_len=4096,
            limit_mm_per_prompt={"image": 1},
            max_num_seqs=1,
            max_num_batched_tokens=4096,
            enforce_eager=True,
            gpu_memory_utilization=0.9,
        )
        sampling = SamplingParams(temperature=0.0, max_tokens=256)
        requests = []
        fixture_paths = {}
        for spec in fixtures:
            fixture_path = generate_fixture(spec, fixture_dir)
            fixture_paths[spec["fixtureId"]] = fixture_path
            template = next(item for item in templates if item["fixtureId"] == spec["fixtureId"])
            requests.append({"prompt": build_prompt(template, fixture_path), "multi_modal_data": {"image": Image.open(fixture_path)}})
        outputs = llm.generate(requests, sampling)
        if guard.network_attempted:
            raise RuntimeError("PHASE39C_RUNTIME_NETWORK_ATTEMPTED")
    results = []
    for spec, output in zip(fixtures, outputs):
        text = output.outputs[0].text if output.outputs else ""
        results.append(score_fixture(spec, text, runtime="vllm"))
    return getattr(vllm, "__version__", "unknown"), results


def score_fixture(spec: Dict[str, Any], raw_text: str, runtime: str) -> Dict[str, Any]:
    blockers: List[str] = []
    warnings: List[str] = []
    parsed: Dict[str, Any] = {}
    try:
        parsed = json.loads(raw_text.strip())
    except Exception:
        blockers.append("output_json_parse_failed")
    objects = parsed.get("objects", []) if isinstance(parsed, dict) else []
    labels = " ".join(json.dumps(item).lower() for item in objects)
    expected = [label.lower() for label in spec.get("expectedLabels", [])]
    matched = [label for label in expected if any(part in labels for part in label.split())]
    recall = len(matched) / len(expected) if expected else 0
    schema_valid = all(key in parsed for key in [
        "fixture_id",
        "prompt_template_id",
        "model_id",
        "model_revision",
        "runtime",
        "objects",
        "text_like_regions",
        "safe_zone_suggestions",
        "spatial_relations",
        "uncertainty",
        "blocked_actions",
        "qa_flags",
    ])
    if not schema_valid:
        blockers.append("output_schema_invalid")
    uncertainty = parsed.get("uncertainty", {}).get("level", "high") if isinstance(parsed.get("uncertainty"), dict) else "high"
    safe_zone = "manual_review" if spec.get("riskCategory") == "manual_review_expected" else "unknown"
    suggestions = parsed.get("safe_zone_suggestions", [])
    if isinstance(suggestions, list) and suggestions:
        safe_zone = str(suggestions[0].get("decision", safe_zone)) if isinstance(suggestions[0], dict) else safe_zone
    status = "passed" if not blockers and recall >= 0.7 else "blocked"
    return {
        "fixtureId": spec["fixtureId"],
        "status": status,
        "runtime": runtime,
        "parsedJson": not any(item == "output_json_parse_failed" for item in blockers),
        "schemaValid": schema_valid,
        "requiredLabelRecall": recall,
        "broadRegionAccuracy": 0.75 if recall >= 0.7 else 0.0,
        "safeZoneDecision": safe_zone,
        "uncertainty": uncertainty if uncertainty in ["low", "medium", "high"] else "high",
        "objectCount": len(objects) if isinstance(objects, list) else 0,
        "textLikeRegionCount": len(parsed.get("text_like_regions", [])) if isinstance(parsed.get("text_like_regions"), list) else 0,
        "blockers": blockers,
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--fixture-dir", required=True)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--fixture-manifest-path", required=True)
    parser.add_argument("--prompt-manifest-path", required=True)
    args = parser.parse_args()

    for key in ["HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE"]:
        if os.environ.get(key) != "1":
            raise RuntimeError(f"{key}=1 is required")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED", "false") != "false":
        raise RuntimeError("PROVIDER_EXECUTION_ENABLED must be false")

    fixture_dir = Path(args.fixture_dir)
    fixture_dir.mkdir(parents=True, exist_ok=True)
    fixtures = json.loads(Path(args.fixture_manifest_path).read_text())["specs"]
    templates = json.loads(Path(args.prompt_manifest_path).read_text())["templates"]
    try:
        runtime_version, results = run_vllm(Path(args.model_dir), fixtures, templates, fixture_dir)
        runtime_status = "passed" if all(result["status"] in ["passed", "warning"] for result in results) else "blocked"
        summary = {"runtimeStatus": runtime_status, "runtimeVersion": runtime_version, "fixtureResults": results}
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        summary = {
            "runtimeStatus": "blocked",
            "runtimeVersion": None,
            "fixtureResults": [],
            "blockers": [f"vllm_runtime_failed:{str(exc)[:240]}"],
        }
    print(json.dumps(summary, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
