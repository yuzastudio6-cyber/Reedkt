# Activation Local Baseline Runbook

Phase 19 adds a local baseline command for reviewing the full smoke/static readiness suite before any container build or cloud deployment work starts. It is a reporting and safe local execution gate, not a production launch gate.

## Default Static Mode

`npm.cmd run activation:local-baseline` builds a static report. It validates that required package scripts exist, checks the local command catalog, summarizes Phase 20 preparation readiness, and keeps production, external beta, real user media, and Docker build blocked.

Default static mode does not execute smoke tests, build commands, Docker, `gcloud`, providers, model downloads, secrets, deployment, or real media processing.

## Command Plan Mode

`npm.cmd run activation:local-baseline -- --command-plan` prints the ordered local command plan. It is a plan only and does not run commands.

The command plan is limited to npm scripts for local smokes, static summaries, lint, build, and server build. It intentionally excludes Docker, `gcloud`, deployment, provider, model-download, and real-media commands.

## Confirmed Execute Mode

Execution is intentionally gated. The runner only executes the safe local suite when both conditions are true:

1. `--execute` is present.
2. `REEDITPRO_CONFIRM_LOCAL_BASELINE=true` is set.

Without the confirmation environment variable, execute mode fails safely with a clear refusal message. `--continue-on-failure` may be used only in confirmed execute mode to keep recording results after a command fails.

## Interpreting Results

Command statuses are `passed`, `failed`, `skipped`, `not_run`, and `warning`. Static and command-plan reports should show commands as `not_run`.

Warnings include known safe local cases, such as generated fixture or FFmpeg skip-safe behavior, and the existing Vite large chunk warning when the build exits successfully. Failures remain failures and should be resolved or documented before Phase 20 preparation.

## Phase 20 Comes Next

Phase 19 can mark the repo ready for Phase 20 container build preparation only. It does not build containers, push images, run container readiness, run Docker, or deploy. A human must still review image names/tags and explicitly run Phase 20 outside the local baseline runner.
