# Production Demucs Policy

Demucs is for justified music/speech separation or stem workflows, not every video.

Milestone 9 never downloads Demucs models and never runs production separation. Local-dev execution is skip-first and requires an existing install/model plus explicit opt-in.

Production Demucs execution requires model-weight approval, artifact policy review, QA review, and worker deployment approval.

Phase 36A keeps Demucs restricted and deferred. It may be considered later only
for justified music/speech separation or stem workflows, not as the first voice
cleanup path. Repository code license evidence is not enough to approve
pretrained model artifacts; exact weight provenance, license, checksum, private
storage, and separation QA remain required before any download or runtime.

Phase 36G update: Demucs is the intended vocal/music/stem separation candidate, not a general denoise tool. htdemucs download/runtime remains blocked because official pretrained-model license/provenance is ambiguous in the archived repository.

Current product-flow update: Demucs is now the manifest-gated separation engine
for Separate Vocals, Remove Background Music, Split Stems, Create Instrumental,
and Isolate Voice from Music. Runtime execution still fails closed until a
company-controlled approved model artifact, `approval.json`, and checksum match
are installed outside git. Runtime model downloads remain blocked.
