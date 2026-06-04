# Phase 36M Audio/Timing Caveat Classification

Internal warnings:

- DeepFilterNet evidence covers one bounded approved controlled sample only.
- Signalsmith evidence covers generated fixtures and one bounded approved controlled sample only.
- FFmpeg/ffprobe and linux CPU worker runtime evidence remain bounded staging evidence, not production configuration approval.
- VLM remains blocked and OCR runtime remains blocked outside approved OCR phases; these are product beta caveats but not blockers for the restricted audio/timing internal-scope decision.

External, broad-media, and production blockers:

- Broad user media and arbitrary media have not been approved.
- Public output and public artifacts remain blocked.
- Demucs source separation is not approved.
- Provider calls, production, paid production, external beta, and Track A remain blocked.
