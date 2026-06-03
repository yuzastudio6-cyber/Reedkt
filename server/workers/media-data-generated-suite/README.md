# Phase 46B Generated Media/Data Suite Worker

This worker runs deterministic generated fixtures only. It does not accept real
media paths, arbitrary user media, provider inputs, OCR inputs, or VLM inputs.

Runtime dependencies are installed only into temporary execution directories by
the Phase 46B activation CLI. Do not commit venvs, npm prefixes, generated
videos, generated images, or package caches.
