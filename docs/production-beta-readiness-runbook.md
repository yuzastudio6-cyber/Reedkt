# Production Beta Readiness Runbook

Internal dry-run testing may use static reports and generated mock artifacts. Local-dev fixture testing may use generated fixtures only when explicitly enabled and safe.

Real user media beta requires human approval for deployment, storage, security, cost controls, retention/deletion, model weights, licenses, monitoring, and support.

External beta and paid production remain blocked by default in M17.

Phase 35F can produce private SAM2 feature E2E evidence for internal SAM2
feature testing only. It does not approve external beta, paid production, broad
real media, providers, public delivery, final export, Revideo, FILM, slow
motion, or Real-ESRGAN.

Phase 36E produced private DeepFilterNet audio feature E2E evidence for
internal audio feature testing only. It does not approve external beta, paid
production, broad real media, arbitrary media, public delivery, final export,
RNNoise, Demucs, providers, Revideo, FILM, or slow motion.

Phase 36F marked the audio system ready for controlled internal audio feature
testing only after artifact verification and beta-scope QA passed. It still
does not approve external beta, paid production, broad real media, arbitrary
media, public delivery, final export, RNNoise, Demucs, providers, Revideo, FILM,
or slow motion.

Phase 36G closes the RNNoise/Demucs audio stack correction only. It removes RNNoise from active product flow and blocks Demucs download/runtime pending pretrained-model license/provenance clarity. It does not approve external beta, paid production, broad real media, arbitrary media, providers, Revideo, FILM, slow motion, public delivery, or final export.

Phase 36K keeps Demucs blocked after a provenance/legal-risk retry. MIT source and package evidence exists, but pretrained model weights remain blocked because training-data provenance, model artifact source, and human/legal approval are incomplete. Phase 36L download/runtime must not run unless one exact candidate is approved later. Audio/timing can advance toward an internal beta-readiness gate only if Demucs source separation is explicitly excluded from current internal scope or later approved phases pass.
