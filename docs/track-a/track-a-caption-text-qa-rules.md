# Track A Caption Text QA Rules

Status: `caption_text_qa_rules_recorded`

## Required QA Checks

| Rule | Requirement | Status For Controlled Copy |
| --- | --- | --- |
| grammar | clear sentence structure and professional phrasing | pass |
| readability | short readable caption chunks | pass |
| line length | max 42 characters per line where practical | pass |
| line count | max 2 lines per caption | pass |
| phrase boundary | caption chunks should map to readable phrase units | pass |
| punctuation | punctuation supports comprehension without clutter | pass |
| filler repetition | no repeated filler such as "guys" loops or fragment chains | pass |
| awkward fragments | no awkward grammar chains like the #419 rejected sample | pass |
| secrets/private data | no secrets, user-private data, service-role payloads, URLs, or keys | pass |
| unsupported transcript accuracy | transcriptAccuracyClaim: false | pass |
| production claims | no production, external beta, final delivery, or public artifact claim | pass |
| visual burn-in | future visual burn-in revalidation required | blocked pending future revalidation |

## Speech-First Policy

Caption text must remain readable and professional. Speech clarity and caption readability outrank beat sync, decorative motion, and visual flair.

## Timing Compatibility

The controlled-test copy is suitable for future phrase-level timing validation, but this packet does not run word alignment, audio transcription, libass, FFmpeg, Remotion, media processing, or visual burn-in QA.

## Source-Of-Truth Rule

The source-of-truth for this phase is the structured approved caption source manifest. Screenshots, temporary renders, signed URLs, public artifacts, raw prompts, and provider/model outputs are not source of truth.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
