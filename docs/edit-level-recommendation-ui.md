# Edit Level Recommendation UI

RP-EDITLEVEL-04 displays a deterministic mock/local recommendation banner for Edit Level selection. The banner shows the recommended level, confidence, reasons, warnings, degraded capability notices, and that user override is allowed.

Recommendation inputs use safe available context such as platform, prompt, marker count, attachment count, desired polish, and mock tool readiness. When context is unavailable, safe defaults are used. The UI does not invent unavailable runtime analysis.

This is no live planner behavior. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, media workers, render/export, or credit systems.

Credit estimate only copy remains visible. Render/revision budget is future metadata.

RP-EDITLEVEL-05 is complete as a mock/local tool capability router.

Recommended next milestone: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
