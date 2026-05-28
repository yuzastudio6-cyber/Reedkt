# Activation Local Baseline Report Policy

The Phase 19 local baseline report records the local smoke/static readiness command catalog, planned commands, optional confirmed execution results, blockers, warnings, and preparation-only readiness for Phase 20.

## Report Fields

- `mode`: `static_only`, `command_plan`, `execute_confirmed`, or `production_blocked`.
- `commandCatalogSummary`: counts cataloged commands, missing scripts, generated-fixture commands, skip-safe commands, and forbidden catalog entries.
- `commandPlan`: ordered npm command plan. It is safe local/static and excludes Docker, `gcloud`, providers, model downloads, deployment, secrets, and real media processing.
- `commandResults`: one result per catalog command. Static and command-plan modes use `not_run`.
- `readinessStateSummary`: confirms required scripts exist, Phase 18 audit exists, production remains blocked, Revideo remains blocked, and the catalog is safe.
- `phase20Readiness`: states whether the repo is ready for container build preparation only.

## Command Statuses

- `passed`: command exited successfully without warning classification.
- `failed`: command exited non-zero or was blocked before execution.
- `skipped`: command exited successfully but reported a skip-safe local fixture/tool availability condition.
- `not_run`: command was cataloged but not executed.
- `warning`: command exited successfully with a warning that must be reviewed.

The existing Vite large chunk output is a warning only when the build exits successfully. If the build exits non-zero, the command is failed.

## Phase 20 Readiness

Phase 20 readiness means preparation only. It can be true only when required scripts exist, the Phase 18 audit exists, the Phase 19 local baseline command exists, production remains blocked, and the execution catalog excludes Docker/GCP/provider/model/real-media commands.

`dockerBuildAllowed` remains false by default. Container build, image push, and container readiness remain human-run later phases.

## Blocked Launch States

Every Phase 19 report must keep:

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false`
- `dockerBuildAllowed=false`

Revideo remains evaluation-only and production-blocked.
