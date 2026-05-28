# Activation GCP Staging Command Policy

Phase 22 command plans are text-only. Codex must not run them.

Mutating command-plan entries require `REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true` and human review. Phase 22 command plans may describe setup commands for APIs, Artifact Registry, buckets, service accounts, secret placeholders, and IAM.

Phase 22 command plans must not include Cloud Run deployment, Docker push, provider calls, model downloads, media processing, or secret payload creation.
