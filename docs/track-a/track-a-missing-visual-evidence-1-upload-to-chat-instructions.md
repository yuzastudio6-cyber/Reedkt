# Track A Missing Visual Evidence 1 Upload-To-Chat Instructions

Status: `ready_after_upload_of_copied_visual_files`

## Local Bundle

bundleId: `tracka-missing-visual-evidence1-20260616T015436`

localBundlePath: `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436`

copiedVisualArtifacts: `5`

## Upload Instructions

Upload only the copied visual files listed below from `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436`, then run TRACKA-MISSING-VISUAL-EVIDENCE-2 to record the review outcome.

| blocker | local file | sha256 | upload status |
| --- | --- | --- | --- |
| `birefnet_stronger_visual_proof` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-birefnet-stronger-proof-frame.png` | `cad684ff1fa07ebd4f5b69fecf246eb49e3db8606fff90982cad8df87a81f6d4` | pending_human_upload |
| `opencolorio_openimageio_stronger_proof` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-pro-color-image-proof-pro-color-image-feature-contact-sheet.png` | `6c0ad6aa7f4f0be2bf89655c966c2dcae5a3686a490d8a379a8a8d4a6bba28af` | pending_human_upload |
| `otio_full_private_e2e_proof` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-otio-private-e2e-proof-libass-burnin-preview.mp4` | `99ade85fc6668d5983fe66bd6bb90deb4cb221b21464942818247822a4d21a73` | pending_human_upload |
| `otio_full_private_e2e_proof` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-otio-private-e2e-proof-remotion-render-preview.mp4` | `d5fa23fcf5ea67e9e0ef524e397e63aecbc19c5356ac7f86cfbcebdbc4cfc33b` | pending_human_upload |
| `otio_full_private_e2e_proof` | `/tmp/reeditpro-tracka-missing-visual-evidence-1/tracka-missing-visual-evidence1-20260616T015436/tracka-missing-otio-private-e2e-proof-hardened-review-export.mp4` | `758b42ab7e99102802b6cd9307d872b8a9b4dafa08a2991fea48c0ac2c14c084` | pending_human_upload |

## Upload Requirements

- upload copied visual files only from the local bundle path.
- include the checksum table from `docs/track-a/track-a-missing-visual-evidence-1-checksums.md`.
- do not upload JSON-only metadata as visual proof.
- do not use signed URLs as source of truth.
- do not treat upload as Track A closure until TRACKA-MISSING-VISUAL-EVIDENCE-2 records a visual review outcome.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A missing-evidence refs from current-source and historical PR evidence.
