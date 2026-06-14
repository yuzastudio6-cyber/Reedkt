# Track A Visual Review Artifact Bundle 2 Discovery Results

Status: `completed_with_visual_artifact_bundle`

Bundle ID: `tracka-visual-review-artifact-bundle2-20260613T215327`

## Execution

The runner was executed with `--execute` and inline `REEDITPRO_CONFIRM_TRACKA_EXACT_VISUAL_ARTIFACT_BUNDLE=true`.

private_artifact_access=completed_bounded_visual_allowlist

GCS metadata/list/read/copy: `bounded_metadata_list_read_copy_for_expanded_allowlist`

local_visual_bundle=created

copied visual artifacts: `10`

TRACKA-VISUAL-REVIEW-2C readiness: `ready_after_upload_of_copied_visual_bundle_files`

## Discovery Result

Confirmed expanded discovery re-queried historical Track A PR bodies and inspected exact/narrow private Track A refs only. It copied 10 review-safe visual artifacts with allowed extensions `.png` and `.mp4`.

## Candidate Review

| area | result |
| --- | --- |
| historical PRs re-queried | `25` |
| historical PR body refs discovered | `53` |
| exact visual object allowlist | `14` |
| bounded prefix discovery allowlist | `7` |
| copied `.png/.jpg/.jpeg/.webp/.gif/.mp4/.mov/.webm` files | `10` |
| JSON metadata copied into visual bundle | `0` |
| public artifact refs | `0` |
| signed URL refs | `0` |

## Copied Visual Artifacts

| groupId | source PR | local path | size bytes | sha256 |
| --- | --- | --- | --- | --- |
| `tracka-bundle-birefnet-masking` | #34 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-birefnet-masking-frame.png` | `5477828` | `cad684ff1fa07ebd4f5b69fecf246eb49e3db8606fff90982cad8df87a81f6d4` |
| `tracka-bundle-kornia-pro-color-image` | #68 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-kornia-pro-color-image-pro-color-image-feature-contact-sheet.png` | `451844` | `6c0ad6aa7f4f0be2bf89655c966c2dcae5a3686a490d8a379a8a8d4a6bba28af` |
| `tracka-bundle-sam2-segmentation` | #42 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-sam2-segmentation-frame-000-preview.png` | `476015` | `4b59b8a82e26a437e8c4162cf619398bd3e17c01499cada4599c7c893b4b9e99` |
| `tracka-bundle-sam2-segmentation` | #42 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-sam2-segmentation-frame-001-preview.png` | `470121` | `0b90a49433253e56cb66143dc9dbe26f70495916d680f2ffa4930d2ddae04744` |
| `tracka-bundle-sam2-segmentation` | #42 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-sam2-segmentation-frame-002-preview.png` | `470625` | `680892541616a35f2a677d6743c0d15b811a4e68d689fba3b990efb6dfe3112a` |
| `tracka-bundle-film-interpolation` | #60 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-film-interpolation-film-slowmotion-preview.mp4` | `71235` | `0d018e605555076e8ed2c9d44204365e13b1b7d65a8a10ea34124aa454ec43be` |
| `tracka-bundle-libass-caption-burnin` | #73 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-libass-caption-burnin-libass-burnin-preview.mp4` | `548136` | `99ade85fc6668d5983fe66bd6bb90deb4cb221b21464942818247822a4d21a73` |
| `tracka-bundle-remotion-render-preview` | #75 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-remotion-render-preview-remotion-render-preview.mp4` | `1463324` | `d5fa23fcf5ea67e9e0ef524e397e63aecbc19c5356ac7f86cfbcebdbc4cfc33b` |
| `tracka-bundle-ffprobe-export-validation` | #80 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-ffprobe-export-validation-hardened-review-export.mp4` | `1009846` | `758b42ab7e99102802b6cd9307d872b8a9b4dafa08a2991fea48c0ac2c14c084` |
| `tracka-bundle-ffmpeg-render-hardening` | #82 | `/tmp/reeditpro-tracka-visual-review-bundle-2/tracka-visual-review-artifact-bundle2-20260613T215327/tracka-bundle-ffmpeg-render-hardening-hardened-review-export.mp4` | `1009846` | `758b42ab7e99102802b6cd9307d872b8a9b4dafa08a2991fea48c0ac2c14c084` |

Human action: upload the copied visual files listed above before running TRACKA-VISUAL-REVIEW-2C.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A visual review artifact refs from current-source and historical PR evidence.
