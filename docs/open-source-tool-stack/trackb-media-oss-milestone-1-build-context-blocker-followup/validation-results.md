# Validation Results

Generated decision: `trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof`.

Validated in the follow-up branch:

- `npm ci --ignore-scripts --no-audit --no-fund` completed for dependency hydration and left `package.json` / `package-lock.json` unchanged.
- `npm run build:server` generated `dist-server`; `npm run build:staging-fixture-worker` generated `dist-staging-fixture-worker`.
- Generated build-context scan passed with warnings only for the repo-owned static assets copied by Vite: `brand/reeditpro-logo-source.png`, `brand/reeditpro-mark.png`, and `favicon.png`.
- The approved Docker build command completed and the local probe image was removed.
- Container-only version proofs passed for ExifTool, MediaInfo, Tesseract, and ImageMagick.
- Synthetic fixture proofs passed for ExifTool, MediaInfo, and ImageMagick.
- Tesseract OCR proof remained blocked: version proof passed, but the synthetic OCR fixture output was `REEDLTPRU` instead of the required `REEDITPRO` normalized text.
- Cleanup removed `dist`, `dist-server`, `dist-staging-fixture-worker`, `node_modules`, and `/private/tmp` proof fixtures before commit.
- New diagnostics, smoke, report, summary, dependent Track B/open-source diagnostics, `git diff --check`, and `git diff --cached --check` passed.

Readiness/beta/lint/typecheck/tsc were skipped after cleanup because the final validation state intentionally has no `node_modules` and this phase does not authorize another dependency hydration.
