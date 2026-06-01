from __future__ import annotations

from typing import Dict, List


ALIAS_MAP: Dict[str, List[str]] = {
    "red square": ["red square", "square", "red box"],
    "blue circle": ["blue circle", "circle", "blue round shape"],
    "green triangle": ["green triangle", "triangle"],
    "top banner": ["top banner", "banner", "top bar", "header"],
    "center panel": ["center panel", "main panel", "middle panel", "central panel"],
    "bottom strip": ["bottom strip", "bottom bar", "footer", "lower strip"],
    "demo text": ["demo text", "demo", "text label"],
    "orange star": ["orange star", "star"],
    "purple box": ["purple box", "purple rectangle", "box"],
    "toolbar": ["toolbar", "top bar", "menu bar", "control bar"],
    "preview canvas": ["preview canvas", "preview", "canvas", "viewer", "video preview"],
    "timeline panel": ["timeline", "timeline panel", "bottom track", "bottom tracks", "track area", "editing timeline"],
    "caption block": ["caption", "caption block", "subtitle block", "lower third text", "lower-third caption"],
    "face marker": ["face marker", "face", "head", "person marker"],
    "safe upper zone": ["safe upper zone", "upper third", "top safe zone", "safe caption zone"],
    "laptop": ["laptop", "computer", "screen"],
    "coffee mug": ["coffee mug", "mug", "cup"],
    "plant": ["plant", "potted plant"],
    "caption conflict": ["caption conflict", "lower-third conflict", "subtitle collision", "caption overlap"],
    "lower third alert": ["lower third alert", "lower third", "warning banner", "alert"],
    "source label": ["source label", "source", "label"],
    "export button": ["export button", "export", "button"],
    "confidence badge": ["confidence badge", "confidence", "badge"],
    "text-like region": ["text-like region", "text region", "text", "ocr region"],
    "ambiguous icon cluster": ["ambiguous icon cluster", "icon cluster", "ambiguous icons", "unclear icons"],
    "manual review": ["manual review", "uncertain", "ambiguous", "needs review", "high uncertainty"],
    "left panel": ["left panel", "left card", "left box"],
    "right card": ["right card", "right panel", "right box"],
    "center arrow": ["center arrow", "arrow", "middle arrow"],
    "top badge": ["top badge", "badge", "top label"],
}


def aliases_for(label: str) -> List[str]:
    key = label.lower().strip()
    values = ALIAS_MAP.get(key, [])
    return sorted(set([key, *[value.lower().strip() for value in values]]))


def alias_report() -> Dict[str, object]:
    return {
        "phase": "39C-SG",
        "reportId": "phase_39c_sg_label_alias_map",
        "aliases": ALIAS_MAP,
        "policy": "Alias matching is allowed for simple perception concepts and broad UI regions. It cannot invent missing labels or override safe-zone blockers.",
    }
