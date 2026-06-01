from __future__ import annotations

import hashlib
import re
from typing import Any, Dict


def safe_excerpt(raw_text: str, limit: int = 240) -> str:
    collapsed = re.sub(r"\s+", " ", raw_text).strip()
    excerpt = collapsed[:limit]
    return excerpt.replace("gs://", "gs_redacted://")


def trace_record(candidate_id: str, fixture_id: str, strategy_id: str, raw_text: str) -> Dict[str, Any]:
    encoded = raw_text.encode("utf-8", errors="replace")
    return {
        "candidateId": candidate_id,
        "fixtureId": fixture_id,
        "strategyId": strategy_id,
        "rawOutputSha256": hashlib.sha256(encoded).hexdigest(),
        "rawOutputSizeBytes": len(encoded),
        "safeExcerpt": safe_excerpt(raw_text),
        "fullRawTraceCommitted": False,
        "fullRawTracePrivateOnly": True,
    }
