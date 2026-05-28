# Activation Container Readiness Report Policy

The Phase 21 report is evidence-only. It records what human-run readiness logs say, keeps all launch flags false, and separates Phase 22 staging setup from Phase 23 image push readiness.

## Report Fields

- `imageReadinessResults`: per-image build evidence, readiness evidence, expected tools, missing tools, manual review tools, and forbidden findings.
- `toolReadinessResults`: per-tool status for each image.
- `modelWeightReadinessResults`: GPU/model-weight placeholders and blockers.
- `manualReviewItems`: FFmpeg LGPL, libass, OpenColorIO/OpenImageIO, source-install, and GPU review items.
- `phase22Readiness`: whether staging foundation setup planning can continue. GPU readiness is not required here.
- `phase23Readiness`: whether image push review can continue. Required non-GPU images need build/readiness evidence; GPU may be deferred for non-GPU staging.

## Statuses

Statuses are `passed`, `warning`, `missing`, `failed`, `blocked`, `not_checked`, `not_applicable`, `optional_missing`, `pending_manual_review`, `source_install_review_required`, `model_weight_missing`, `model_weight_blocked`, `evaluation_only`, and `deferred`.

## Blockers And Warnings

Forbidden findings block the report path: signed URLs, raw prompts, provider keys, service-role keys, secret-like text, model downloads, Docker push, `gcloud`, deployment, Revideo production, public buckets, provider calls, or user media mounts.

Pending manual review is warning-only when the tool is optional or explicitly review-gated. Failed required readiness blocks Phase 23.

Production-ready, external beta, real user media testing, Docker execution, GCP execution, provider execution, model downloads, and media processing remain false.
