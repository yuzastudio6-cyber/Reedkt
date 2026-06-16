# Track A Missing Visual Evidence 1 Local Manifest

Status: `created`

## Bundle

bundleId: `tracka-missing-visual-evidence1-20260616T015436`

localBundlePath: `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436`

privateArtifactAccess: `bounded_confirmed_metadata_list_read_copy`

copiedVisualArtifacts: `5`

copiedMetadataArtifacts: `0`

skippedRefs: `5`

totalCopiedBytes: `8950978`

GCS upload: `not_attempted`

signedUrlsCreated: `0`

publicArtifactsCreated: `0`

## Copied File Manifest

| blocker | source PR | source ref | local file | size bytes | sha256 | status |
| --- | --- | --- | --- | --- | --- | --- |
| `birefnet_stronger_visual_proof` | #34 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-birefnet-stronger-proof-frame.png` | `5477828` | `cad684ff1fa07ebd4f5b69fecf246eb49e3db8606fff90982cad8df87a81f6d4` | copied |
| `opencolorio_openimageio_stronger_proof` | #68 | `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-20260531T12493/contact-sheet/pro-color-image-feature-contact-sheet.png` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-pro-color-image-proof-pro-color-image-feature-contact-sheet.png` | `451844` | `6c0ad6aa7f4f0be2bf89655c966c2dcae5a3686a490d8a379a8a8d4a6bba28af` | copied |
| `otio_full_private_e2e_proof` | #77 | `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-otio-private-e2e-proof-libass-burnin-preview.mp4` | `548136` | `99ade85fc6668d5983fe66bd6bb90deb4cb221b21464942818247822a4d21a73` | copied |
| `otio_full_private_e2e_proof` | #77 | `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-otio-private-e2e-proof-remotion-render-preview.mp4` | `1463324` | `d5fa23fcf5ea67e9e0ef524e397e63aecbc19c5356ac7f86cfbcebdbc4cfc33b` | copied |
| `otio_full_private_e2e_proof` | #80 | `gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-otio-private-e2e-proof-hardened-review-export.mp4` | `1009846` | `758b42ab7e99102802b6cd9307d872b8a9b4dafa08a2991fea48c0ac2c14c084` | copied |

## Important Handling Rule

Copied files are local-only review inputs under `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436`. They must not be committed, uploaded to GCS, turned into signed URLs, or treated as Track A closure until TRACKA-MISSING-VISUAL-EVIDENCE-2 records the visual review outcome.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A missing-evidence refs from current-source and historical PR evidence.
