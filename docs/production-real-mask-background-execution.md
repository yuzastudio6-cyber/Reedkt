# Production Real Mask Background Execution

Milestone 15C turns mask, background removal, subject cutout, and text-behind-subject planning into a controlled server-only execution path.

The flow is approved payload validation, mask task planning, model/tool command planning, fallback planning, private mask artifacts, metadata-only text-behind-subject composition, and QA gates. BiRefNet, SAM2, transparent-background, rembg, OpenCV, and Kornia stay skip-safe unless explicitly enabled in local-dev with already available tools and reviewed/local-safe weights.

M15C does not final render/export, run Revideo, download models, run unapproved GPU jobs, call providers, deploy, run enhancement/upscaling, or overwrite source/proxy media.

M16A final render/export consumes private mask, cutout, and depth composition metadata artifacts for render layers and re-checks render asset integrity and mask coverage gates.

## Activation Phase 33A

Phase 33A does not execute mask/background/text-behind-subject work. It only
creates the staging approval workflow for `ZhengPeng7/BiRefNet` as the first
single-frame background-removal model scope. SAM2 tracking, text-behind-subject,
GPU runtime, model downloads, and real mask execution remain blocked until later
explicit phases.

## Activation Phase 33D

Phase 33D executed the first controlled real-video BiRefNet mask test on exactly
one representative frame from the approved Phase 32 private export. It produced
private frame, mask, RGBA cutout, metadata, and QA artifacts with no blocking
mask QA failures.

This is not production approval. Full-video masks, SAM2 tracking,
text-behind-subject execution, public delivery, external beta, and broad real
media remain blocked until later explicit phases.

## Activation Phase 33E

Phase 33E composed one private text-behind-subject PNG preview from the approved
Phase 33D frame, mask, and RGBA cutout. It produced a text layer plan, depth
composition manifest, private preview PNG, and QA report with no blocking
failures.

This remains single-frame staging evidence only. Full-video text-behind-subject,
SAM2 tracking, public delivery, production, external beta, and broad real media
remain blocked.

## Activation Phase 35A

Phase 35A reviews SAM2 as a future temporal segmentation and mask propagation
candidate. It reuses the Phase 33A evaluated-only SAM2 source/license evidence
but records that no human legal/model approval, exact checkpoint, checksum,
private storage artifact, runtime image, or runtime job is approved yet.

SAM2 download, runtime, temporal tracking, full-video masks, full-video
text-behind-subject, public delivery, production, external beta, and broad real
media remain blocked until later explicit phases pass.

## Activation Phase 35B

Phase 35B downloads and loads only the approved SAM2.1 tiny checkpoint/config
into private staging model storage. It records checksums, source evidence, and
GCS object verification.

This is not runtime approval. SAM2 inference, temporal tracking, full-video
masks, full-video text-behind-subject, public delivery, production, external
beta, and broad real media remain blocked.

## Activation Phase 35C

Phase 35C verified SAM2 runtime on generated/synthetic frames only for
`phase35c-20260529T16082`. It does not permit real-video temporal tracking,
full-video masks, text-behind-subject video, production, external beta, broad
real media, providers, or public output.

## Activation Phase 35D

Phase 35D completed one controlled short real-video SAM2 temporal mask path for
`phase35d-20260530T004442`. It was locked to the approved Phase 32 private
export, Phase 33D anchor frame/mask, a 6.9s-8.9s segment, 10 bounded 768x432
frames, private artifacts, and no public output.

This is not production approval. Full-video masks, full-video text-behind-subject
video, arbitrary media, providers, Revideo, FILM, slow motion, external beta,
and broad real media remain blocked after Phase 35D.

## Activation Phase 35E

Phase 35E composed one controlled private segment text-behind-subject preview
for `phase35e-20260530T01355` from the approved Phase 35D frames and masks. It
was locked to `phase35d-20260530T004442`, the 6.9s-8.9s segment, 10 frames at
768x432, and the fixed text `REEDITPRO`.

This is still not production approval. It does not create a final export, full
video text-behind-subject asset, full-video mask sequence, public URL,
provider output, Revideo render, FILM/slow-motion output, or broad-media
approval.

## Activation Phase 35F

Phase 35F adds a private SAM2 feature E2E beta-readiness gate for the approved
controlled video chain. It requires a structured approved plan snapshot before
execution, bounded preview extraction at 768x432 and <= 8 fps, the approved
private SAM2.1 tiny checkpoint/config, private SAM2 masks, private
text-behind-subject preview frames, and QA.

This may support internal SAM2 feature testing only if the full controlled
private preview scope passes. If the fallback segment scope is used, readiness
is segment-only. External beta, paid production, broad media, arbitrary media,
public delivery, final export, providers, Revideo, FILM, slow motion, and
Real-ESRGAN remain blocked.
