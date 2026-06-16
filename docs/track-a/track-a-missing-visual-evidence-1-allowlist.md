# Track A Missing Visual Evidence 1 Allowlist

Status: `allowlist_recorded_confirmation_blocked`

## Allowlist Rules

- exact private `gs://` object refs only, unless a prefix is narrow, run-scoped, and Track A-specific.
- allowed visual extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.mp4`, `.mov`, `.webm`.
- max listed objects per bounded prefix: `25`.
- max copied files per blocker group: `3`.
- max copied single file: `52428800` bytes.
- max copied bundle total: `262144000` bytes.
- still images and contact sheets are preferred over videos.
- public URLs, signed URLs, broad prefixes, JSON-only metadata, logs, secrets, token/key/JWT/service-role filenames, and non-Track-A refs are rejected.

## Candidate Allowlist

| blocker | source PR | source ref | artifact group | operation | safety classification |
| --- | --- | --- | --- | --- | --- |
| `birefnet_stronger_visual_proof` | #34 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png` | BiRefNet representative frame | `copy_if_small_visual_file` | exact private Track A visual object, supporting only |
| `real_esrgan_before_after_proof` | #30/#34 | no exact before/after visual ref found in PR body evidence | Real-ESRGAN enhancement proof | `metadata_only` | `evidence_not_found` |
| `opencolorio_openimageio_stronger_proof` | #68 | `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-20260531T12493/contact-sheet/pro-color-image-feature-contact-sheet.png` | pro color/image contact sheet | `copy_if_small_visual_file` | exact private Track A visual object |
| `opencolorio_openimageio_stronger_proof` | #65 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-20260531T10390/` | pro color/image generated fixture | `list_only_then_copy_if_small_visual_file` | narrow run-scoped Track A prefix |
| `opencolorio_openimageio_stronger_proof` | #67 | `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40c/phase40c-20260531T11504/` | real video pro color/image previews | `list_only_then_copy_if_small_visual_file` | narrow run-scoped Track A prefix |
| `otio_full_private_e2e_proof` | #77 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json` | OTIO timeline proof | `metadata_only` | exact nonvisual metadata ref |
| `otio_full_private_e2e_proof` | #80/#82 | `gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4` | hardened review export | `copy_if_small_visual_file` | exact private Track A visual object, supporting only |
| `otio_full_private_e2e_proof` | #82 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json` | full private E2E manifest | `metadata_only` | exact nonvisual metadata ref |

## Rejected Or Insufficient Refs

| blocker | ref | reason |
| --- | --- | --- |
| `birefnet_stronger_visual_proof` | #25/#26 PR bodies | no exact `gs://` refs found in current PR body evidence |
| `real_esrgan_before_after_proof` | #30 PR body | no exact `gs://` refs found in current PR body evidence |
| `real_esrgan_before_after_proof` | #34 phase33d representative-frame ref | unrelated to Real-ESRGAN before/after proof |
| `opencolorio_openimageio_stronger_proof` | `gs://.../phase40b-report.json` | `exact_nonvisual_metadata_ref` |
| `opencolorio_openimageio_stronger_proof` | `gs://.../phase40c-report.json` | `exact_nonvisual_metadata_ref` |
| `otio_full_private_e2e_proof` | `gs://.../phase45c-report.json` | `exact_nonvisual_metadata_ref` |
| `otio_full_private_e2e_proof` | `gs://.../phase45e-report.json` | `exact_nonvisual_metadata_ref` |
| `otio_full_private_e2e_proof` | broad historical phase roots | rejected unless exact or narrow run-scoped |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A missing-evidence refs from current-source and historical PR evidence.
