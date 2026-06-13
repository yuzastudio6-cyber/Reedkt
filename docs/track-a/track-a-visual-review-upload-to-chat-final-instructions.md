# Track A Visual Review Final Upload-To-Chat Instructions

Status: `copied_metadata_bundle_ready_to_upload`

Bundle ID: `tracka-visual-review-artifact-bundle1-20260613T195844`

Local bundle root: `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/`

Upload only the copied JSON files listed below, with their SHA-256 checksums. These files provide private metadata/report context; they do not replace representative visual frames or clips for pass/fail visual review.

## Files To Upload

- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-birefnet-masking-phase33c-report.json` (`1558a198d2c7aa579f5c0df85628b6a1e077bed690f665b7f159034e2ad0633b`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-sam2-segmentation-phase35f-report.json` (`35c9a6bc89d5943cf17728c8edc1c3a4a88f29fd417bf1ed9fe0cdd4ae57a055`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-real-esrgan-enhancement-phase34d-report.json` (`fcb3de1b43d933327711d5747fd16b3a14339f27d2fbae91ce9c1add5f07617b`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-film-interpolation-phase38d-report.json` (`edee293a8c1230afa0c2e468c2e0b094ed11cf7bfe66deccac8eb52f58d57b35`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-opencolorio-color-pipeline-phase40d-report.json` (`9631f22e5fec8a55efafc0461bfa87c6d5e26ccf7e4e91e65d49ae7e4ef21662`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-openimageio-image-io-phase40d-report.json` (`9631f22e5fec8a55efafc0461bfa87c6d5e26ccf7e4e91e65d49ae7e4ef21662`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-libass-caption-burnin-phase45a-report.json` (`137220848d73d881d0c52c3048feb9c89eef5c782d9f78a15ecc324144889900`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-opentimelineio-validation-phase45c-report.json` (`679493fa5ef597590c3c88c859328ba9dca45257fa4a57a17fa2c98188ebc179`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-ffmpeg-render-hardening-phase45d-report.json` (`7f6bf0b1f620c7a1b72fd00746e50aa052ac63348f7b3ff59dbbf82a53b0865c`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-ffprobe-export-validation-ffprobe-export-validation.json` (`d112753bb0acd548a04d302b6b89f2cbc82e8656b0eb7b660019634c600a01b4`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-full-visual-video-private-e2e-phase45e-report.json` (`28fbbb7995601d611fbea11c26870cf2240e5e9876ceb5bd862a58a78968aa8c`)
- `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-track-a-readiness-closure-phase45f-report.json` (`2da163e1c540f2bc9154d3c1891983f3ae72fb3119661512beee042a6a5becee`)

## Do Not Upload

- no unrelated private artifacts
- no broad GCS prefixes
- no missing-ref placeholders
- no signed URLs
- no public URLs
- no secrets or logs
- no full exports
- no raw prompts or raw provider responses

## Required Next Input

After uploading the copied JSON files, run:

`TRACKA-VISUAL-REVIEW-2B — Record AI-assisted private visual review outcome`

TRACKA-VISUAL-REVIEW-2B must record that visual pass/fail remains blocked unless representative frames/videos or exact review-safe visual artifacts are uploaded in the same review context.

## Still Needed For Visual Pass/Fail

- exact object ref for `tracka-bundle-remotion-render-preview`, or uploaded representative preview frames
- current-source artifact ref or representative upload for `tracka-bundle-kornia-pro-color-image`
- representative visual frames/videos for capabilities where copied JSON metadata cannot show visual quality directly

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/read/copy was allowed only for exact Track A review artifact refs explicitly allowlisted by the #400 bundle manifest.
