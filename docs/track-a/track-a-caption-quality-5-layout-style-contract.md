# TRACKA-CAPTION-QUALITY-5 Layout Style Contract

Status: `applied`

## Profile

| Field | Value |
| --- | --- |
| layoutProfile | `tracka_caption_layout_fix_v1` |
| PlayResX | `2160` |
| PlayResY | `3840` |
| Alignment | `2` |
| MarginL | `190` |
| MarginR | `190` |
| MarginV | `250` |
| Fontsize | `132` |
| Outline | `6` |
| Shadow | `2` |
| Max lines | `2` |

## Requirements

- bottom-center subtitle-style placement.
- no absolute top/left positioning.
- safe margins encoded in ASS style.
- no more than two caption lines.
- readable white text with dark outline/shadow.
- no old #419 caption text.
- no transcript accuracy claim.

## Layout-Fixed Caption Lines

1. "Hey everyone — welcome to this\nReEditPro visual review."
2. "Today we are testing captions,\noverlays, and private render quality."
3. "The goal is a clean, professional edit\nwith readable text."
4. "Review this sample for timing,\npolish, and visual clarity."

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A caption layout fix revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
