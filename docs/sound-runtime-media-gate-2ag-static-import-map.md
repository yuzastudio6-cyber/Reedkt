# SOUND Runtime Media Gate 2AG Static Import Map

```json sound-runtime-media-gate-2ag-static-import-map
{
  "decision": "sound_runtime_media_gate_2ag_runtime_source_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review",
  "runtimeSourceFiles": [
    "server/workers/sound-cpu/runtime/soundCpuJobContracts.ts",
    "server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts",
    "server/workers/sound-cpu/runtime/soundCpuMediaGuards.ts",
    "server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts",
    "server/workers/sound-cpu/runtime/soundCpuArtifactPolicy.ts",
    "server/workers/sound-cpu/runtime/soundCpuObservability.ts"
  ],
  "plannedStaticImportCoverage": [
    {
      "file": "server/workers/sound-cpu/runtime/soundCpuJobContracts.ts",
      "futureCoverage": [
        "accepted worker names",
        "accepted job types",
        "rejected unsafe payload inputs",
        "blocked result shape"
      ],
      "importedInThisGate": false
    },
    {
      "file": "server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts",
      "futureCoverage": [
        "disabled runtime flags",
        "owner gate",
        "fail-closed blocked result",
        "execution-blocking throw path"
      ],
      "importedInThisGate": false
    },
    {
      "file": "server/workers/sound-cpu/runtime/soundCpuMediaGuards.ts",
      "futureCoverage": [
        "media open blocked",
        "media processing blocked",
        "ffmpeg ffprobe blocked",
        "media readiness unclaimed"
      ],
      "importedInThisGate": false
    },
    {
      "file": "server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts",
      "futureCoverage": [
        "Supabase mutation blocked",
        "SQL execution blocked",
        "storage transfer blocked",
        "signed URL creation blocked"
      ],
      "importedInThisGate": false
    },
    {
      "file": "server/workers/sound-cpu/runtime/soundCpuArtifactPolicy.ts",
      "futureCoverage": [
        "artifact writes blocked",
        "public artifact creation blocked",
        "provider blob rejection",
        "model weight location rejection"
      ],
      "importedInThisGate": false
    },
    {
      "file": "server/workers/sound-cpu/runtime/soundCpuObservability.ts",
      "futureCoverage": [
        "audit event shape",
        "no execution audit invariant",
        "no artifact audit invariant",
        "owner gate audit invariant"
      ],
      "importedInThisGate": false
    }
  ],
  "integrationStyle": "future_static_imports_only_after_owner_review",
  "runtimeExecutionApprovedToday": false
}
```
