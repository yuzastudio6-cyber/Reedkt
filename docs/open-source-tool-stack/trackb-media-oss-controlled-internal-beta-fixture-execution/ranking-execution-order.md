# Ranking Execution Order

The internal fixture receipt sequence preserves the deterministic Track B ranking: metadata/probe tools first, structured local analysis next, color/image tools next, heavier frame/OCR routes later, and FFmpeg last because transform behavior remains highest risk.

OpenColorIO precedes OpenImageIO so color configuration intent is established before image-buffer/API-shape handling.
