# Track A Caption Source Handoff Contract

Status: `handoff_contract_recorded`

## Owner

Owner: `TRACK_A_RENDER_EXPORT`

## Handoff Targets

| Target | Handoff Type | Scope |
| --- | --- | --- |
| libass burn-in future revalidation | planning only | use approved controlled-test caption source for future private burn-in validation |
| Remotion preview future revalidation | planning only | use approved controlled-test caption source for future private preview validation |
| Track A private E2E future revalidation | planning only | consume caption source after missing visual evidence is closed |
| Track B media processing | review/planning only | future real-user transcription accuracy if actual audio transcript is required |
| Sound/Music/Audio | review/planning only | future caption timing/audio cue interaction if needed |
| Worker Runtime Jobs | review/planning only | future approved execution must reference approved caption source |
| Observability/Audit/Cost | review/planning only | future QA and cost records |
| Compliance/Security | review/planning only | privacy and source-of-truth review |

## Required Inputs For Future Burn-In Revalidation

- `captionSourceId: tracka-caption-quality-1-controlled-test-copy`
- `captionSourceType: controlled_test_caption_copy`
- `transcriptAccuracyClaim: false`
- approved caption text from `docs/track-a/track-a-approved-caption-source.md`
- private revalidation artifact refs from a later approved phase
- checksum/provenance fields for future copied visual artifacts

## Blocked Handoffs

- no Track A runtime execution in this phase.
- no libass execution in this phase.
- no FFmpeg or FFprobe execution in this phase.
- no Remotion execution in this phase.
- no audio transcription or media processing in this phase.
- no provider/model calls in this phase.
- no worker/tool/route execution in this phase.
- no Supabase mutation, SQL, or migration in this phase.
- no public artifacts or signed URLs in this phase.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
