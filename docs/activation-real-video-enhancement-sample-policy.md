# Activation Real Video Enhancement Sample Policy

Phase 34D is sample-first. It uses exactly one private real-video-derived frame and rejects any attempt to enhance a whole frame or video.

The approved input is:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png`

The approved model is `RealESRGAN_x4plus` from manifest `real_esrgan_x4plus_staging_v1`, copied from private GCS and verified against Phase 34B checksums.

The default crop is a centered `512x512` sample. If the frame is smaller, the runtime may use the largest centered square down to `256x256`; smaller samples block the run.

No subjective quality claim is made until human before/after review checks hallucinated detail, oversharpening, and texture artifacts.
