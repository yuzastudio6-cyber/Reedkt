# Production Final Render Export Execution

Milestone 16A adds the final render/export execution foundation for ReeditPro production workers.

The flow is TimelineManifest/RenderManifest plus private artifacts, normalized into a render execution manifest, converted into Remotion/FFmpeg/libass command plans, optionally executed in safe local-dev mode, and checked by render/export/final-delivery QA.

Final export additionally requires the professional export authority frozen from the approved edit estimate. The authority binds the covered 1080p, 2K/1440p, or 4K frame to the confirmed aspect ratio, FPS, duration, approved deliverable, approved estimate ID, and existing credit reservation ID. Missing coverage, a changed reservation/timing/frame, or dimensions outside the covered profile fail closed. Export does not create a second credit estimate or charge.

The private local evidence includes an actual FFmpeg export probed at exactly 3840×2160. This proves the bounded local path, not public or production delivery.

M16A does not deploy, run `gcloud`, call providers, download model weights, run unapproved GPU jobs, process arbitrary media paths, overwrite source artifacts, use raw prompts as instructions, make Revideo core, or bypass QA.

Milestone 16B validates this final render/export foundation in full workflow context. The E2E suite feeds render/export with private artifacts from prior dry-run stages, checks command plan creation, keeps `final_delivery` blocked without private `final_export`, and summarizes readiness blockers without running cloud jobs or arbitrary media.
