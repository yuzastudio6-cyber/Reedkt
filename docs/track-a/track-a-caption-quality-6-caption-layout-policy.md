# TRACKA-CAPTION-QUALITY-6 Caption Layout Policy

## Product Decision

Caption layout is not a single universal QA target. It is a creative/project-level setting. ReEditPro should default to a safe one-line subtitle style, but must support user-configurable caption layout based on video style and intent.

## Default Policy

defaultCaptionPreset: `one_line_bottom_safe_area`

defaultMaxLines: `1`

configurableMaxLines: `1`, `2`, or `auto`

defaultPlacement: `bottom_center_safe_area`

defaultAvoidFaceObstruction: `true`

defaultSafeMarginsRequired: `true`

defaultTranscriptAccuracyClaim: `false`

## Configurable Presets

- `one_line_bottom_safe_area`
- `two_line_subtitle`
- `auto_wrap_subtitle`
- `creator_large_caption`
- `lower_third_caption`
- `manual_position_and_size`

## Policy Boundaries

- Default caption rendering should prefer one-line bottom-center safe-area captions.
- User or project intent may choose two-line, auto-wrap, creator-style, lower-third, or manual layout presets.
- Subject obstruction avoidance and safe margins remain required where possible.
- Final export still requires separate user/project approval.
- Production, external beta, public artifacts, signed URLs, broad media, and final delivery are not approved by this policy.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
