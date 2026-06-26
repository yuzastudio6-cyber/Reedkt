# SOUND Runtime Media Gate 2AH Module Export Register

```json sound-runtime-media-gate-2ah-module-export-register
{
  "decision": "sound_runtime_media_gate_2ah_controlled_no_execution_runtime_import_proof_passed_with_warnings_ready_for_import_proof_owner_review",
  "moduleExports": [
    {
      "moduleName": "soundCpuJobContracts",
      "exportNames": [
        "SOUND_CPU_JOB_TYPES",
        "SOUND_CPU_REJECTED_CONTRACT_INPUTS",
        "SOUND_CPU_WORKER_NAMES",
        "createSoundCpuBlockedContractResult",
        "isSoundCpuJobType",
        "isSoundCpuWorkerName"
      ]
    },
    {
      "moduleName": "soundCpuRuntimeGuards",
      "exportNames": [
        "SOUND_CPU_RUNTIME_BLOCKED_REASON",
        "SOUND_CPU_RUNTIME_DISABLED_FLAGS",
        "SOUND_CPU_RUNTIME_OWNER_GATE",
        "assertSoundCpuRuntimeExecutionBlocked",
        "createSoundCpuRuntimeBlockedResult",
        "getSoundCpuRuntimeGateState"
      ]
    },
    {
      "moduleName": "soundCpuMediaGuards",
      "exportNames": [
        "SOUND_CPU_MEDIA_GUARD_STATE",
        "SOUND_CPU_MEDIA_OWNER_GATE",
        "assertSoundCpuMediaOperationBlocked",
        "getSoundCpuMediaGuardState"
      ]
    },
    {
      "moduleName": "soundCpuSupabaseGuards",
      "exportNames": [
        "SOUND_CPU_SUPABASE_GUARD_STATE",
        "SOUND_CPU_SUPABASE_OWNER_GATE",
        "assertSoundCpuSupabaseMutationBlocked",
        "getSoundCpuSupabaseGuardState"
      ]
    },
    {
      "moduleName": "soundCpuArtifactPolicy",
      "exportNames": [
        "SOUND_CPU_ARTIFACT_OWNER_GATE",
        "SOUND_CPU_ARTIFACT_POLICY_STATE",
        "assertSoundCpuArtifactWriteBlocked",
        "getSoundCpuArtifactPolicyState"
      ]
    },
    {
      "moduleName": "soundCpuObservability",
      "exportNames": [
        "createSoundCpuBlockedAuditEvent",
        "sanitizeSoundCpuAuditText"
      ]
    }
  ]
}
```
