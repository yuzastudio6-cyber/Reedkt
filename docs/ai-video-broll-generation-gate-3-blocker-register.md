# AI Video B-roll Generation Gate 3 Blocker Register

Status: `ai_video_broll_gen_3_blocker_register_no_execution`

| Blocker | Applies to | Status | Exit requirement |
| --- | --- | --- | --- |
| Runtime GPU owner review missing | Wan, LTX, Mochi | open | `AI-VIDEO-BROLL-GEN-4: runtime GPU owner review` |
| Dependency install proof missing | Wan, LTX, Mochi | open | Future controlled install proof after runtime review. |
| Model weight download proof missing | Wan, LTX, Mochi | open | Future controlled weight download proof. |
| Model import proof missing | Wan, LTX, Mochi | open | Future import-only proof after install and weights. |
| Synthetic generation proof missing | Wan, LTX, Mochi | open | Future no-user-media synthetic proof after safety/runtime acceptance. |
| FFmpeg/ffprobe ownership unresolved for output handling | Mochi and generated video export | open | Track A/Track B media/export handoff before video assembly. |
| LTX exact runtime version unresolved | LTX | open | Choose original LTX-Video, LTX-2, or LTX-2.3 before install. |
| Mochi high VRAM and output dependency risk unresolved | Mochi | open | Runtime owner review. |
| Hunyuan legal/territory/commercial review missing | HunyuanVideo | blocked | Legal acceptance before any dependency or weight plan. |
| Beta readiness missing | All | open | Product beta readiness review. |

## Still Forbidden

- Package installation.
- Virtual environment creation.
- Model download.
- Model import.
- Inference.
- Generated video.
- Docker/GCP execution.
- Supabase mutation or SQL.
- Provider calls.
- Worker dispatch.
- Media processing.
- Render/export.
- Storage object, signed URL, or public artifact creation.
- Credit mutation.
- Beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claims.
