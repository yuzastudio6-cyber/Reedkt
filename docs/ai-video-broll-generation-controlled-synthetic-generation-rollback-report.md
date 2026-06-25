# AI Video B-roll Generation Controlled Synthetic Generation Rollback Report

Decision: `ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof`

Rollback is limited to the AI-VIDEO-BROLL-GEN-8 tracked evidence files and package script. No runtime environment, private model cache, generated frames, generated video, media file, Supabase row, storage object, signed URL, public artifact, provider call, worker job, or credit record was created by this gate.

```json ai-video-broll-gen-8-controlled-synthetic-generation-rollback-report
{
  "phase": "AI-VIDEO-BROLL-GEN-8",
  "decision": "ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof",
  "rollbackScope": "remove_ai_video_broll_gen_8_docs_prompt_diagnostic_and_package_script",
  "rollbackFiles": [
    "docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md",
    "docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md",
    "docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md",
    "docs/ai-video-broll-generation-controlled-synthetic-generation-change-log.md",
    "docs/ai-video-broll-generation-controlled-synthetic-generation-rollback-report.md",
    "docs/implementation-prompts/prompt-ai-video-broll-gen-9-controlled-synthetic-generation-proof.md",
    "scripts/validation/ai-video-broll-gen-8-diagnostics.mjs"
  ],
  "rollbackPackageJsonChange": "remove script ai-video-broll-gen-8:diagnostics",
  "throwawayEnvironmentRollbackRequired": false,
  "privateModelCacheRollback": {
    "requiredForRepositoryCleanliness": false,
    "managedByGate6": true,
    "path": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a"
  },
  "packageLockRollbackRequired": false,
  "runtimeRollbackRequired": false,
  "supabaseRollbackRequired": false,
  "sqlRollbackRequired": false,
  "artifactRollbackRequired": false,
  "generatedFrameRollbackRequired": false,
  "generatedVideoRollbackRequired": false,
  "blockedRuntimeGatesAfterRollback": [
    "text_encoding",
    "denoising",
    "scheduler_run",
    "vae_decode",
    "model_inference",
    "generated_frames",
    "generated_video",
    "media_processing",
    "ffmpeg",
    "route_execution",
    "worker_execution",
    "provider_model_calls",
    "supabase_mutation",
    "sql",
    "signed_urls",
    "public_artifacts",
    "credits",
    "beta_production"
  ],
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9: controlled synthetic generation proof, local tiny non-user-media only"
}
```
