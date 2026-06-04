# Phase 36K Demucs Provenance Approval Retry

Implement Track B Phase 36K only: Demucs provenance/legal approval retry.

Do not download Demucs models, run source separation, process media, run DeepFilterNet, run Signalsmith, run OCR/VLM, call providers, mutate GCP/IAM, unlock beta/production, or touch Track A.

Review official/current Demucs source, PyPI, license, pretrained model list, training-data provenance, MUSDB/MUSDB-HQ licensing context, Torchaudio HDemucs notes, runtime risk, storage/privacy policy, and blocker policy.

Expected default decision: Demucs remains `blocked_pending_training_data_provenance`; Phase 36L is blocked unless human/legal review approves one exact candidate with immutable artifact source and checksum policy. Audio/timing may proceed to an internal beta gate only if a human/product decision explicitly excludes Demucs source separation from current internal scope.
