# Implementation Prompt: AI Graphics Draft Package Proof Canonical Promotion Review

Decision: `ai_graphics_draft_package_proof_canonical_promotion_review_passed_with_warnings`

Implement a docs/diagnostics-only canonical promotion review from `origin/codex/rp-ai-graphics-draft-package-proof-merge-execution-pr441`.

## Scope

Canonicalize exactly the 13 merged package-proof tools from PR #425, PR #433, and PR #441 with proof level `canonical_merged_package_import_static_fixture_proof`.

Do not promote runtime, E2E, Tool Route, Worker, browser/WebGL/canvas, provider, Supabase/GCS, signed URL, public artifact, beta, or production readiness.

## Records

Create the canonical promotion docs, JSON source lockfile, JSON matrix, JSON canonical ledger, prompt result, implementation prompt, and Node built-ins-only diagnostic.

Update present AI graphics/status docs to record canonical package proof while keeping runtime, beta, and production blocked.

## Validation

Run no-install validation only:

- `git diff --check`
- `npm run --silent ai-graphics:draft-package-proof-canonical-promotion-review:diagnostics`
- inherited diagnostics with `|| true`
- changed-file secret scan
- generated artifact/path scan
- package-lock unchanged check
- no `.local-artifacts` staged check
- `git diff --cached --check`

Draft PR: pending initial publication.
