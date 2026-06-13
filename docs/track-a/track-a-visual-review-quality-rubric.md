# Track A Visual Review Quality Rubric

Status: `rubric_ready_review_not_completed`

Score each section from 1 to 5. Passing threshold is 4 unless the human reviewer records a justified `pass_with_warnings` in TRACKA-VISUAL-REVIEW-2.

| Section | Score Field | Pass Threshold | Fail Examples | Reviewer Notes Field |
| --- | --- | --- | --- | --- |
| composition quality | `compositionQualityScore` | 4 | cluttered layout, unsafe crop, unclear visual hierarchy | `compositionQualityNotes` |
| segmentation/mask quality | `segmentationMaskQualityScore` | 4 | edge chatter, lost subject details, obvious matte defects | `segmentationMaskQualityNotes` |
| text-behind-subject quality | `textBehindSubjectScore` | 4 | text collides with subject, mask reveals artifacts, unreadable label | `textBehindSubjectNotes` |
| enhancement quality | `enhancementQualityScore` | 4 | waxy texture, halos, over-sharpening, damaged faces/text | `enhancementQualityNotes` |
| interpolation/smoothness quality | `interpolationSmoothnessScore` | 4 | warping, temporal smear, jitter, unnatural slow motion | `interpolationSmoothnessNotes` |
| color/image quality | `colorImageQualityScore` | 4 | broken color transform, clipped highlights, skin-tone shift | `colorImageQualityNotes` |
| caption burn-in readability | `captionBurninReadabilityScore` | 4 | low contrast, unsafe-zone placement, obstructed faces/evidence | `captionBurninReadabilityNotes` |
| timeline consistency | `timelineConsistencyScore` | 4 | missing clips, timing drift, broken transition metadata | `timelineConsistencyNotes` |
| render/export integrity | `renderExportIntegrityScore` | 4 | corrupt stream, missing audio/video, bad duration, broken metadata | `renderExportIntegrityNotes` |
| visual artifacts/glitches | `visualArtifactsGlitchesScore` | 4 | flicker, banding, compositing errors, stutter | `visualArtifactsGlitchesNotes` |
| professional polish | `professionalPolishScore` | 4 | looks unfinished, inconsistent style, unmotivated visual treatment | `professionalPolishNotes` |
| privacy/safety | `privacySafetyScore` | 5 | sensitive information exposure, public artifact dependency, signed URL source-of-truth | `privacySafetyNotes` |
| artifact/source consistency | `artifactSourceConsistencyScore` | 4 | artifact ref missing for a required review, mismatch with #390 source row | `artifactSourceConsistencyNotes` |

## Reviewer Guidance

- A score below threshold requires `requiredFollowUps[]`.
- A privacy/safety score below 5 must produce `overallDecision=blocked_privacy_issue`.
- Missing artifact refs for required visual review must produce `overallDecision=blocked_missing_artifact`.
- A pass does not approve runtime, final delivery, public artifacts, signed URL source-of-truth, beta, production, old PR closure, or private E2E replay.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
