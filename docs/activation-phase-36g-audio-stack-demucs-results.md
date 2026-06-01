# Phase 36G Audio Stack Demucs Results

- phase: 36G
- status: closed with Demucs blocked
- run ID: `phase36g-static-demucs-model-license-block`
- source scope: approved Phase 32 private export only
- reference scope: approved Phase 31 normalized-audio export only

## Audio Stack Decision

- DeepFilterNet remains active for internal speech cleanup: Clean Voice, Enhance
  Speech, Remove Background Noise, speech denoise, and voice cleanup.
- RNNoise is removed from active product flow and must not be selected as an
  internal beta fallback.
- Demucs is the intended candidate for Separate Vocals, Remove Background
  Music, Split Audio Stems, isolate voice, and vocal/music separation.

## Demucs Evidence

- Official repo: `https://github.com/facebookresearch/demucs`
- Official code license: MIT
- Official README documents `htdemucs` and `--two-stems=vocals`.
- Official repository is archived/read-only.
- Pretrained model license/provenance remains ambiguous in open issue #327:
  `https://github.com/facebookresearch/demucs/issues/327`

## Decision

- demucsDownloadAllowed: false
- demucsRuntimeAllowed: false
- demucsInternalBetaAllowed: false
- demucsBlocked: true
- blocker: Demucs pretrained-model license/provenance is not clear enough to
  approve htdemucs download/runtime.

## Phase 37A Readiness

Phase 37A OCR approval workflow may start because the audio stack is now
unambiguous: DeepFilterNet is the internal speech-cleanup scope, RNNoise is
removed from active routing, and Demucs is not approved or exposed as active
runtime until model evidence is cleared.

This does not approve Demucs, product beta, paid production, broad real media,
providers, Revideo, FILM, slow motion, or arbitrary media.
