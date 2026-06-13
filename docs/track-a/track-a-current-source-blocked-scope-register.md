# Track A Current-Source Blocked-Scope Register

Status: `blocked_scope_register`

The following scopes remain blocked by TRACKA-CURRENT-SOURCE-1.

| Scope | Status | Reason |
| --- | --- | --- |
| PR merge | blocked | old PRs require explicit owner-approved merge instruction |
| PR close | blocked | closure requires visual review and exact named PR targets |
| PR retarget | blocked | retargeting requires explicit owner-approved mutation pass |
| GCS access | blocked | artifact refs are manifest-only and no cloud access is performed |
| Signed URL source-of-truth | blocked | signed URLs are not durable source-of-truth |
| Public artifact creation | blocked | no public delivery path is approved |
| Runtime execution | blocked | current packet is docs/diagnostics only |
| Tool execution | blocked | tools remain planning-only |
| Worker execution | blocked | worker runtime is not invoked |
| Provider/model calls | blocked | provider/model routes are not invoked |
| Route execution | blocked | route execution waits for future route contract tests and approval |
| Media processing | blocked | no media, image, video, or audio processing is performed |
| BiRefNet runtime | blocked | historical evidence only |
| SAM2 runtime | blocked | historical evidence only |
| Real-ESRGAN runtime | blocked | historical evidence only |
| FILM runtime | blocked | historical evidence only |
| Kornia runtime | blocked | historical evidence only |
| OpenColorIO runtime | blocked | historical evidence only |
| OpenImageIO runtime | blocked | historical evidence only |
| libass runtime | blocked | historical evidence only |
| Remotion runtime | blocked | owner routing only; no render/export |
| OpenTimelineIO runtime | blocked | historical evidence only |
| FFmpeg runtime | blocked | historical evidence only |
| FFprobe runtime | blocked | historical evidence only |
| Full visual-video private E2E | blocked | future revalidation only |
| Internal beta unlock | blocked | no internal beta readiness is claimed |
| External beta unlock | blocked | no external beta readiness is claimed |
| Production unlock | blocked | no production readiness is claimed |
| Credit or Stripe mutation | blocked | billing remains unchanged |
| Supabase mutation | blocked | docs/status only |
| SQL or migration | blocked | no database mutation |
| Dependency mutation | blocked | no package or lockfile mutation beyond package script |
| Raw prompt execution | blocked | no raw prompt path |
| Final render/export | blocked | future Track A runtime only |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
