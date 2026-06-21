# SOUND-RUNTIME-MEDIA-GATE-1A: controlled CPU install proof, no media execution

```json sound-runtime-media-gate-1a-controlled-cpu-install-proof
{
  "prompt": "SOUND-RUNTIME-MEDIA-GATE-1A",
  "title": "controlled CPU install proof, no media execution",
  "sourceMilestone": "SOUND-RUNTIME-MEDIA-GATE-1",
  "requiredDecision": "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof",
  "purpose": "Run the controlled CPU install proof for the 13 pinned packages and alias-covered tools without media execution.",
  "candidatePackages": [
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
    "mir_eval"
  ],
  "aliasCoveredTools": [
    "pydub_effects",
    "ebu_r128_pyloudnorm"
  ],
  "blockedActions": [
    "media file open",
    "pydub media operation",
    "FFmpeg or ffprobe execution",
    "worker execution",
    "route execution",
    "model download",
    "GCP or Docker action",
    "Supabase mutation",
    "SQL execution",
    "signed URL or public artifact creation",
    "beta or production unlock"
  ],
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
