# AI Graphics Satori Font Runtime Proof Implementation Prompt

Implement the descendant Satori proof lane from `origin/codex/rp-ai-graphics-browser-runtime-proof`.

Goal:

- Resolve the prior Satori font-fixture block without adding dependencies or committing font binaries.
- Use only an existing lockfile-provided deterministic font fixture.
- Keep all agent/tool/route/worker/provider execution, browser/WebGL/canvas readiness, GPU/model readiness, beta readiness, and production readiness false.

Implemented result:

- Decision: `ai_graphics_satori_font_runtime_proof_completed_with_warnings`.
- Satori proof status: `satori_font_fixture_svg_layout_proof_passed`.
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/791
- Draft PR status at creation: open/draft/CLEAN at `ead737928df89c83aeb402ec743c805a6284ef63`, empty check rollup.
- Added `scripts/validation/ai-graphics-satori-font-runtime-proof.mjs`.
- Added `scripts/validation/ai-graphics-satori-font-runtime-proof-diagnostics.mjs`.
- Added package scripts:
  - `ai-graphics:satori-font-runtime-proof`
  - `ai-graphics:satori-font-runtime-proof:diagnostics`
- Added `docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.md`.
- Added `docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json`.
- Updated `docs/production-beta-readiness-scorecard.md` with no runtime/beta/production unlock.

Proof details:

- `satori@0.26.0` renders a text SVG layout in memory.
- The font fixture comes from locked `three@0.184.0`: `node_modules/three/examples/fonts/ttf/kenpixel.ttf`.
- The proof validates SVG root, viewBox, path output, font hash, and deterministic repeated render hash.

No-scope:

- No `npm install`.
- No dependency addition.
- No package-lock mutation.
- No committed font binary.
- No committed SVG/media/browser/canvas/WebGL/public artifact.
- No Tool Route, Worker, provider/model, GPU/model, Supabase/GCS, signed URL, beta, or production unlock.
