# Phase 36H DeepFilterNet Runtime Hardening Controlled Speech

Phase 36H is a Track B audio/timing hardening phase for DeepFilterNet speech cleanup. It preserves the historical Phase 36C generated-audio runtime namespace and adds the new guarded `activation:deepfilternet-runtime-hardening:*` namespace.

The runtime path is restricted to the already approved Phase 36B/36C DeepFilterNet v0.5.6 private artifacts:

- `deep-filter-0.5.6-x86_64-unknown-linux-musl`
- `DeepFilterNet3_onnx.tar.gz`

Phase 36H does not approve a new PyPI runtime, model auto-download, Demucs, Signalsmith Stretch, OCR, VLM, providers, production, beta, broad media, arbitrary media, public output, Docker, Cloud Build, Cloud Run, GPU jobs, IAM mutation, or Track A.

Execution order:

1. Verify Phase 36G, Phase 36C, Phase 36D, and Phase 46C evidence.
2. Refresh DeepFilterNet source/license/runtime metadata from official public sources.
3. Verify approved private DeepFilterNet CLI/model artifacts and aggregate hash.
4. Run deterministic generated 48 kHz mono noisy speech fixture.
5. If generated audio passes, copy exactly one approved controlled sample and extract only `6.9s-8.9s`.
6. Run DeepFilterNet on the bounded controlled audio window.
7. Upload private QA artifacts only when explicitly confirmed.

Required current-shell confirmations:

- `REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE=true`
- `REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO=true`
- `REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO=true`
- `REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ=true`
- `REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD=true`

Forbidden confirmations for this phase include broad media, arbitrary media, VLM runtime, OCR runtime, Demucs runtime, Signalsmith runtime, and Track A runtime confirmations.
