# SOUND Runtime Media Gate 2AG Diagnostics Coverage Plan

```json sound-runtime-media-gate-2ag-diagnostics-coverage-plan
{
  "decision": "sound_runtime_media_gate_2ag_runtime_source_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review",
  "diagnosticsCoverage": {
    "gate2agDiagnosticsCreated": true,
    "usesNodeBuiltInsOnly": true,
    "parsesGate2agDocs": true,
    "verifiesPr938SourceEvidence": true,
    "verifiesPr937RuntimeSourceEvidence": true,
    "verifiesSixRuntimeSourceFilesExist": true,
    "readsRuntimeSourceTextWithoutImporting": true,
    "rejectsEnabledRuntimeFlags": true,
    "rejectsSupabaseSqlMediaDockerGcpClaims": true,
    "rejectsReadinessWidening": true
  },
  "requiredValidationCommands": [
    "npm run sound-runtime-media-gate-2ag:diagnostics",
    "npm run worker-runtime-jobs:sound-cpu-actual-runtime-source-owner-review:diagnostics",
    "npm run sound-runtime-media-gate-2af:diagnostics",
    "npm run cross-chat-tool-ownership:diagnostics",
    "node --check scripts/validation/sound-runtime-media-gate-2ag-diagnostics.mjs",
    "git diff --check",
    "git diff --cached --check"
  ],
  "dependencyHydrationPolicy": {
    "forceNpmCi": false,
    "packageLockMustRemainUnchanged": true,
    "nodeModulesMustRemainUnstaged": true
  }
}
```
