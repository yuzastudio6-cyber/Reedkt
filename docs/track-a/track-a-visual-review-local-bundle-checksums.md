# Track A Visual Review Local Bundle Checksums

Status: `checksums_recorded`

Bundle ID: `tracka-visual-review-artifact-bundle1-20260613T195844`

Private artifact access: `completed_bounded_allowlist`

Local review bundle: `created`

## Checksum Table

| file | artifact group | source ref | size bytes | sha256 | status |
| --- | --- | --- | --- | --- | --- |
| `tracka-bundle-birefnet-masking-phase33c-report.json` | `tracka-bundle-birefnet-masking` | `phase33c-report.json` | `6911` | `1558a198d2c7aa579f5c0df85628b6a1e077bed690f665b7f159034e2ad0633b` | `copied` |
| `tracka-bundle-sam2-segmentation-phase35f-report.json` | `tracka-bundle-sam2-segmentation` | `phase35f-report.json` | `193247` | `35c9a6bc89d5943cf17728c8edc1c3a4a88f29fd417bf1ed9fe0cdd4ae57a055` | `copied` |
| `tracka-bundle-real-esrgan-enhancement-phase34d-report.json` | `tracka-bundle-real-esrgan-enhancement` | `phase34d-report.json` | `8073` | `fcb3de1b43d933327711d5747fd16b3a14339f27d2fbae91ce9c1add5f07617b` | `copied` |
| `tracka-bundle-film-interpolation-phase38d-report.json` | `tracka-bundle-film-interpolation` | `phase38d-report.json` | `36060` | `edee293a8c1230afa0c2e468c2e0b094ed11cf7bfe66deccac8eb52f58d57b35` | `copied` |
| `tracka-bundle-opencolorio-color-pipeline-phase40d-report.json` | `tracka-bundle-opencolorio-color-pipeline` | `phase40d-report.json` | `16012` | `9631f22e5fec8a55efafc0461bfa87c6d5e26ccf7e4e91e65d49ae7e4ef21662` | `copied` |
| `tracka-bundle-openimageio-image-io-phase40d-report.json` | `tracka-bundle-openimageio-image-io` | `phase40d-report.json` | `16012` | `9631f22e5fec8a55efafc0461bfa87c6d5e26ccf7e4e91e65d49ae7e4ef21662` | `copied` |
| `tracka-bundle-libass-caption-burnin-phase45a-report.json` | `tracka-bundle-libass-caption-burnin` | `phase45a-report.json` | `7471` | `137220848d73d881d0c52c3048feb9c89eef5c782d9f78a15ecc324144889900` | `copied` |
| `tracka-bundle-opentimelineio-validation-phase45c-report.json` | `tracka-bundle-opentimelineio-validation` | `phase45c-report.json` | `7951` | `679493fa5ef597590c3c88c859328ba9dca45257fa4a57a17fa2c98188ebc179` | `copied` |
| `tracka-bundle-ffmpeg-render-hardening-phase45d-report.json` | `tracka-bundle-ffmpeg-render-hardening` | `phase45d-report.json` | `9690` | `7f6bf0b1f620c7a1b72fd00746e50aa052ac63348f7b3ff59dbbf82a53b0865c` | `copied` |
| `tracka-bundle-ffprobe-export-validation-ffprobe-export-validation.json` | `tracka-bundle-ffprobe-export-validation` | `ffprobe-export-validation.json` | `760` | `d112753bb0acd548a04d302b6b89f2cbc82e8656b0eb7b660019634c600a01b4` | `copied` |
| `tracka-bundle-full-visual-video-private-e2e-phase45e-report.json` | `tracka-bundle-full-visual-video-private-e2e` | `phase45e-report.json` | `10276` | `28fbbb7995601d611fbea11c26870cf2240e5e9876ceb5bd862a58a78968aa8c` | `copied` |
| `tracka-bundle-track-a-readiness-closure-phase45f-report.json` | `tracka-bundle-track-a-readiness-closure` | `phase45f-report.json` | `17851` | `2da163e1c540f2bc9154d3c1891983f3ae72fb3119661512beee042a6a5becee` | `copied` |
| `tracka-bundle-kornia-pro-color-image` | `tracka-bundle-kornia-pro-color-image` | `artifact_ref_not_recorded_in_current_source` | `0` | `not_available` | `skipped_missing_ref` |
| `tracka-bundle-remotion-render-preview` | `tracka-bundle-remotion-render-preview` | `needs_exact_object_ref` | `0` | `not_available` | `skipped_prefix_ref` |

## Checksum Rule For Upload

Upload only the copied local files listed above, and include the matching SHA-256 checksum with the upload. Do not commit copied files or media/binary outputs.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/read/copy was allowed only for exact Track A review artifact refs explicitly allowlisted by the #400 bundle manifest.
