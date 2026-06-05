# Tool Capability Registry Audit Runbook

Phase 52B default commands are static and non-mutating:

```sh
npm run smoke:activation-tool-capability-registry-audit
npm run activation:tool-capability-registry-audit:report
npm run activation:tool-capability-registry-audit:iam-plan
npm run activation:tool-capability-registry:summary
```

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_TOOL_CAPABILITY_REGISTRY_AUDIT=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:tool-capability-registry-audit -- --execute
```

Execution uploads private JSON under `activation-agents/phase52b/<runId>/`, upserts capability metadata into the Phase 51B milestone registry through the Phase 51D sync path, and reads back the Phase 52B activation run, 67 `tool_capabilities` rows, and the `tool_capability_registry` readiness snapshot.

Do not run this phase to execute tools or providers. It is a registry/readiness audit only.
