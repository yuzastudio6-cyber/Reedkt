from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from PIL import Image, ImageDraw, ImageFont


COARSE_ZONES = ["top", "bottom", "left", "right", "center", "lower_third", "upper_third"]


def canary_specs() -> List[Dict[str, Any]]:
    return [
        {
            "fixtureId": "canary-basic-shapes",
            "width": 512,
            "height": 512,
            "expectedLabels": ["red square", "blue circle", "green triangle"],
            "expectedZones": {"red square": "left", "blue circle": "right", "green triangle": "center"},
            "safeZoneExpected": "pass",
            "riskCategory": "canary_required_pass",
        },
        {
            "fixtureId": "canary-colored-layout",
            "width": 512,
            "height": 512,
            "expectedLabels": ["top banner", "center panel", "bottom strip"],
            "expectedZones": {"top banner": "top", "center panel": "center", "bottom strip": "bottom"},
            "safeZoneExpected": "pass",
            "riskCategory": "canary_required_pass",
        },
        {
            "fixtureId": "canary-text-and-shape",
            "width": 512,
            "height": 512,
            "expectedLabels": ["demo text", "orange star", "purple box"],
            "expectedZones": {"demo text": "upper_third", "orange star": "center", "purple box": "right"},
            "safeZoneExpected": "pass",
            "riskCategory": "canary_required_pass",
        },
        {
            "fixtureId": "canary-ui-simplified",
            "width": 512,
            "height": 512,
            "expectedLabels": ["toolbar", "preview canvas", "timeline panel"],
            "expectedZones": {"toolbar": "top", "preview canvas": "center", "timeline panel": "bottom"},
            "safeZoneExpected": "warn",
            "riskCategory": "canary_required_pass",
        },
        {
            "fixtureId": "canary-caption-safe-zone-simple",
            "width": 512,
            "height": 512,
            "expectedLabels": ["caption block", "face marker", "safe upper zone"],
            "expectedZones": {"caption block": "lower_third", "face marker": "center", "safe upper zone": "upper_third"},
            "safeZoneExpected": "warn",
            "riskCategory": "canary_required_pass",
        },
    ]


def manifest(run_id: str, created_at: str) -> Dict[str, Any]:
    return {
        "phase": "39C-Q-SO3",
        "reportId": "phase_39cq_so3_canary_fixture_manifest",
        "runId": run_id,
        "createdAt": created_at,
        "generatedOnly": True,
        "fixtureImagesCommitted": False,
        "coarseZones": COARSE_ZONES,
        "fixtures": canary_specs(),
    }


def draw_canary(spec: Dict[str, Any], output_dir: Path, max_size: int = 384) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    width = min(int(spec.get("width", 512)), max_size)
    height = min(int(spec.get("height", 512)), max_size)
    image = Image.new("RGB", (width, height), "#f8fafc")
    draw = ImageDraw.Draw(image)
    fixture_id = spec["fixtureId"]
    font = ImageFont.load_default()

    if fixture_id == "canary-basic-shapes":
        draw.rectangle([36, 176, 156, 296], fill="#ef4444", outline="#991b1b", width=3)
        draw.ellipse([width - 166, 176, width - 46, 296], fill="#2563eb", outline="#1e3a8a", width=3)
        draw.polygon([(width // 2, 132), (width // 2 - 70, 310), (width // 2 + 70, 310)], fill="#22c55e", outline="#14532d")
    elif fixture_id == "canary-colored-layout":
        draw.rectangle([20, 24, width - 20, 92], fill="#38bdf8", outline="#075985", width=3)
        draw.rectangle([84, 154, width - 84, height - 154], fill="#fde68a", outline="#92400e", width=3)
        draw.rectangle([28, height - 94, width - 28, height - 30], fill="#64748b", outline="#1e293b", width=3)
    elif fixture_id == "canary-text-and-shape":
        draw.text((44, 60), "DEMO", fill="#111827", font=font)
        star = [(width // 2, 150), (width // 2 + 24, 214), (width // 2 + 90, 214), (width // 2 + 36, 250), (width // 2 + 58, 312), (width // 2, 274), (width // 2 - 58, 312), (width // 2 - 36, 250), (width // 2 - 90, 214), (width // 2 - 24, 214)]
        draw.polygon(star, fill="#f97316", outline="#9a3412")
        draw.rectangle([width - 148, 300, width - 48, 400], fill="#a855f7", outline="#581c87", width=3)
    elif fixture_id == "canary-ui-simplified":
        draw.rectangle([0, 0, width, 58], fill="#0f172a")
        draw.text((24, 18), "TOOLBAR", fill="#f8fafc", font=font)
        draw.rectangle([78, 104, width - 78, height - 146], fill="#dbeafe", outline="#1d4ed8", width=4)
        draw.text((width // 2 - 34, height // 2 - 8), "PREVIEW", fill="#1e40af", font=font)
        draw.rectangle([0, height - 96, width, height], fill="#111827")
        for y in [height - 76, height - 52, height - 28]:
            draw.line([34, y, width - 34, y], fill="#94a3b8", width=5)
    elif fixture_id == "canary-caption-safe-zone-simple":
        draw.ellipse([width // 2 - 46, 160, width // 2 + 46, 252], fill="#fbbf24", outline="#92400e", width=3)
        draw.rectangle([34, 54, width - 34, 110], outline="#16a34a", width=4)
        draw.text((48, 72), "SAFE UPPER ZONE", fill="#166534", font=font)
        draw.rectangle([44, height - 128, width - 44, height - 58], fill="#111827", outline="#ef4444", width=4)
        draw.text((72, height - 102), "CAPTION BLOCK", fill="#f8fafc", font=font)
    else:
        draw.text((32, 32), fixture_id, fill="#111827", font=font)

    path = output_dir / f"{fixture_id}.png"
    image.save(path)
    return path
