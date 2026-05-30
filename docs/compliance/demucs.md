# Demucs Compliance

## Code License

The official Demucs codebase is MIT licensed. Code/package licensing is not
sufficient for model-weight approval.

## Model Artifact Approval

Production or non-mock internal runtime must load a company-controlled approved
model artifact. The approved model directory must contain:

- `MODEL_CARD.md`
- `LICENSE.md`
- `PROVENANCE.md`
- `approval.json`
- `checksums.sha256`
- the model file outside git

`approval.json` must record commercial-use approval, license status, model
source, approver, approval timestamp, and SHA-256. The worker validates those
fields before command planning.

## Runtime Restrictions

- No runtime model downloads.
- No arbitrary user media routing before approved product scope.
- No public URLs or signed URLs as source of truth.
- No use for Clean Voice, Enhance Speech, Remove Background Noise, Speech
  Denoise, or Voice Cleanup.
- No RNNoise fallback in active product flow.

## User Rights

Only upload, separate, export, or share audio that you own, have licensed, or
are legally permitted to use. Dukira does not grant rights to third-party songs,
vocals, instrumentals, or separated stems.
