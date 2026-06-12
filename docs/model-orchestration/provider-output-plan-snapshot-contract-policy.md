# Provider Output Plan Snapshot Contract Policy

PLAN-SNAPSHOT-1 converts committed MODEL-DRYRUN-1 sanitized provider outputs into candidate-only approved-plan snapshot evidence.

Source run: `modeldryrun1-20260612T174538`

Source decision: `provider_dry_run_passed_ready_for_plan_snapshot_contract`

Allowed input: committed sanitized JSON reports from PR #331 only.

Blocked inputs and actions: Qwen calls, DeepSeek calls, provider calls, tools, workers, routes, media, browser, map, web, SQL, migrations, schema/RLS changes, Docker, Cloud Run, production, external beta, public artifacts, signed URLs, raw prompts, raw provider responses, and secret payloads.

The candidate snapshot has `executionStatus: "candidate_only"` and `approvedForRuntime: false`. Worker Runtime receives a review handoff only.
