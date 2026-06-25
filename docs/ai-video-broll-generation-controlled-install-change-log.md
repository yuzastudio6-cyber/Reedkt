# AI Video B-roll Generation Controlled Install Change Log

Decision: `ai_video_broll_gen_5_controlled_dependency_install_completed_with_warnings_ready_for_model_weight_download_proof`

This change log records the exact repository changes made by AI-VIDEO-BROLL-GEN-5. It does not record model import proof, inference proof, generated video, media processing, runtime readiness, Supabase readiness, beta readiness, or production readiness.

```json ai-video-broll-gen-5-controlled-install-change-log
{
  "phase": "AI-VIDEO-BROLL-GEN-5",
  "decision": "ai_video_broll_gen_5_controlled_dependency_install_completed_with_warnings_ready_for_model_weight_download_proof",
  "trackedChanges": [
    {
      "path": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
      "changeType": "added",
      "purpose": "Scoped worker Python requirements manifest for approved AI video B-roll direct packages.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
      "changeType": "added",
      "purpose": "Controlled dependency install result and source audit evidence.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/ai-video-broll-generation-controlled-install-change-log.md",
      "changeType": "added",
      "purpose": "Machine-readable change log for AI-VIDEO-BROLL-GEN-5.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/ai-video-broll-generation-controlled-install-rollback-report.md",
      "changeType": "added",
      "purpose": "Rollback and removal plan for the scoped AI video B-roll manifest.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/implementation-prompts/prompt-ai-video-broll-gen-6-controlled-model-weight-download-proof.md",
      "changeType": "added",
      "purpose": "Next proof prompt; no import or inference.",
      "containsRuntimeCode": false
    },
    {
      "path": "scripts/validation/ai-video-broll-gen-5-diagnostics.mjs",
      "changeType": "added",
      "purpose": "Built-ins-only diagnostic for AI-VIDEO-BROLL-GEN-5 evidence.",
      "containsRuntimeCode": false
    },
    {
      "path": "package.json",
      "changeType": "updated",
      "purpose": "Adds npm script ai-video-broll-gen-5:diagnostics.",
      "containsRuntimeCode": false
    }
  ],
  "manifestDirectPins": [
    "torch==2.12.1",
    "torchvision==0.27.1",
    "diffusers==0.38.0",
    "transformers==5.12.1",
    "accelerate==1.14.0",
    "safetensors==0.8.0",
    "huggingface-hub==1.21.0",
    "sentencepiece==0.2.1",
    "protobuf==7.35.1",
    "einops==0.8.2",
    "numpy==2.5.0",
    "pillow==12.2.0"
  ],
  "notAddedToManifest": [
    "hunyuanvideo",
    "mochi source checkout",
    "ltx source checkout",
    "wan source checkout",
    "ffmpeg",
    "ffprobe",
    "imageio-ffmpeg",
    "opencv-python",
    "xformers",
    "flash-attn",
    "triton",
    "comfyui"
  ],
  "packageLockChanged": false,
  "nodePackageDependencyChanged": false,
  "runtimeFilesChanged": false,
  "supabaseFilesChanged": false,
  "sqlFilesChanged": false,
  "modelWeightsCreated": false,
  "mediaArtifactsCreated": false,
  "nextPrompt": "AI-VIDEO-BROLL-GEN-6: controlled model weight download proof, no import/no inference"
}
```
