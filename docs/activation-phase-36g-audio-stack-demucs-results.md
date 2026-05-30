# Phase 36G Audio Stack Demucs Results

- phase: 36G
- status: closed with manifest-gated Demucs product routing
- run ID: `phase36g-static-demucs-model-license-block`
- source scope: approved Phase 32 private export only
- reference scope: approved Phase 31 normalized-audio export only

## Audio Stack Decision

- DeepFilterNet remains active for internal speech cleanup: Clean Voice, Enhance
  Speech, Remove Background Noise, Speech Denoise, and Voice Cleanup.
- RNNoise is removed from active product flow and must not be selected as an
  internal beta fallback.
- Demucs is the manifest-gated product engine for Separate Vocals, Remove
  Background Music, Split Stems, Create Instrumental, and Isolate Voice from
  Music.

## Demucs Evidence

- Official repo: `https://github.com/facebookresearch/demucs`
- Official code license: MIT
- Official README documents `htdemucs` and `--two-stems=vocals`.
- Official repository is archived/read-only.
- Pretrained model license/provenance remains ambiguous in open issue #327:
  `https://github.com/facebookresearch/demucs/issues/327`
- Because model-weight evidence is separate from the MIT code license, runtime
  auto-download of htdemucs remains blocked. Non-mock Demucs execution must use
  a company-controlled approved model artifact with `approval.json` and matching
  SHA-256.

## Decision

- demucsProductRoutingAllowed: true
- demucsDownloadAllowed: false
- demucsRuntimeAllowed: false
- demucsInternalBetaAllowed: false
- demucsBlocked: false for product routing
- runtime gate: approved local/company-controlled artifact, manifest, and
  checksum required; missing or invalid approval fails closed.

## Phase 37A Readiness

Phase 37A OCR approval workflow may start because the audio stack is now
unambiguous: DeepFilterNet is the internal speech-cleanup scope, RNNoise is
removed from active routing, and Demucs owns separation behind the approved-model
manifest gate.

This does not approve product beta, paid production, broad real media, providers,
Revideo, FILM, slow motion, arbitrary media, runtime model downloads, or
unapproved Demucs model weights.
