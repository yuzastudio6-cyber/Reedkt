# Production Real Mask Background Execution

Milestone 15C turns mask, background removal, subject cutout, and text-behind-subject planning into a controlled server-only execution path.

The flow is approved payload validation, mask task planning, model/tool command planning, fallback planning, private mask artifacts, metadata-only text-behind-subject composition, and QA gates. BiRefNet, SAM2, transparent-background, rembg, OpenCV, and Kornia stay skip-safe unless explicitly enabled in local-dev with already available tools and reviewed/local-safe weights.

M15C does not final render/export, run Revideo, download models, run unapproved GPU jobs, call providers, deploy, run enhancement/upscaling, or overwrite source/proxy media.

M16A final render/export consumes private mask, cutout, and depth composition metadata artifacts for render layers and re-checks render asset integrity and mask coverage gates.
