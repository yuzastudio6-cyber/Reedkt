# Phase 37C OCR Runtime Worker

This worker is local-only for Phase 37C generated OCR runtime verification.

- Uses an isolated venv under `/tmp/reeditpro-ocr-runtime/phase37c/<run-id>/venv`.
- Reads only verified private Phase 37B PP-OCRv5 det/rec/dict assets copied to `/tmp`.
- Runs PaddleOCR on deterministic generated UI/text fixtures only.
- Forces CPU mode and disables document orientation classification, document unwarping, and textline orientation.
- Wraps PaddleOCR initialization and inference in a network guard; any runtime model-download/network attempt blocks Phase 37C.
- Prefers the bundled Codex Python 3.12 runtime so the exact direct pins can coexist with PaddleX 3.0.0's Python-version-specific numpy metadata.
- Seeds local PaddleX font files inside the isolated venv before import, preventing PaddleX's default font download path from becoming runtime network traffic.

Do not commit venvs, model archives, extracted models, generated fixture images, temp output, credentials, signed URLs, or real media.
