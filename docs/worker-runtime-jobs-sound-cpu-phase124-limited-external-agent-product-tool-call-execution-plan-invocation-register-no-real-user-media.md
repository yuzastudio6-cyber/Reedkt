# WORKER_RUNTIME_JOBS SOUND CPU Phase 124 Limited External-Agent Product Tool-Call Execution Plan Invocation Register No Real User Media

```json worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-invocation-register-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-invocation-register-no-real-user-media",
  "decision": "worker_runtime_jobs_sound_cpu_phase124_limited_external_agent_product_tool_call_execution_plan_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_owner_review_no_real_user_media",
  "plannedProof": {
    "futurePrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE125-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PROOF-NO-REAL-USER-MEDIA",
    "futureProofKind": "limited_external_agent_product_tool_call_execution_no_real_user_media",
    "futureProofCommand": "not_created_in_phase124",
    "futureProofCommandCreatedInThisGate": false,
    "futureProofCommandRunInThisGate": false,
    "expectedInvocationCount": 4,
    "expectedToolCountCovered": 15,
    "requireRecordWhatHappened": true,
    "requireOwnerProofToPasteWhatHappened": true,
    "missingWhatHappenedEvidenceBlocksReadiness": true,
    "requireSanitizedEvidenceOnly": true
  },
  "plannedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "plannedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "plannedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "plannedTools": [
    "librosa",
    "audioread",
    "pydub",
    "scipy",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval",
    "pydub_effects",
    "ebu_r128_pyloudnorm"
  ]
}
```

The future proof command is intentionally not created here. Phase124 only defines the limited external-agent plan for owner review.
