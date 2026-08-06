# Canonical Faster Whisper Cloud Run GPU Execution Admission

## Outcome

This slice defines the exact server-owned model-artifact set and one
non-executable Google Cloud Run GPU preflight for future private
Faster Whisper transcription.

It does **not** add Faster Whisper to the exact 50-tool production registry.
`faster_whisper` remains a non-E2E capability candidate until the canonical
private operation, reproducible GPU image, dispatch adapter, artifact writes,
QA, cost receipt, deployment, and production evidence are complete.

## Immutable source observation

The candidate is pinned to:

- [`SYSTRAN/faster-whisper`](https://github.com/SYSTRAN/faster-whisper) tag
  `v1.2.1`, immutable Git revision
  `65882eee9f5cdbeeb2d877f1131d48cf241b327d`;
- package version `1.2.1`;
- [`Systran/faster-whisper-small`](https://huggingface.co/Systran/faster-whisper-small/tree/536b0662742c02347bc0e980a01041f333bce120)
  immutable model revision
  `536b0662742c02347bc0e980a01041f333bce120`;
- MIT source and model-card license observations;
- the upstream GPU requirement of CUDA 12 and cuDNN 9;
- CUDA-only execution with `float16` compute and no CPU fallback.

The observation downloaded and hashed only the small metadata/tokenizer files.
The 483,546,902-byte model binary was **not** downloaded during this slice; its
size and SHA-256 are bound from the immutable Hugging Face LFS metadata.

## Exact model-artifact set

All four files are separate canonical model-artifact records and must be
resolved in this order:

| Order | Slot | File | Format | Bytes | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| 0 | `faster_whisper_config` | `config.json` | `configuration` | 2,370 | `b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828` |
| 1 | `faster_whisper_model` | `model.bin` | `reviewed_binary` | 483,546,902 | `3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671` |
| 2 | `faster_whisper_tokenizer` | `tokenizer.json` | `tokenizer` | 2,203,239 | `fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab` |
| 3 | `faster_whisper_vocabulary` | `vocabulary.txt` | `tokenizer` | 459,861 | `34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913` |

The exact total is 486,212,372 bytes. Every descriptor requires:

- consumer scope `faster_whisper.private-inference`;
- execution target `google_cloud_run_gpu`;
- CUDA;
- no CPU fallback;
- no runtime download or network fetch;
- a fresh full repository checksum before any future handoff.

The old `faster_whisper_model` manifest template remains a placeholder. It is
not silently promoted or treated as a replacement for these four records.

## Candidate operation

The closed candidate operation identity is:

`tool.faster_whisper.transcribe_private_audio.v1`

It accepts only:

- one approved private `audio/wav` artifact;
- 16 kHz, mono, signed 16-bit PCM;
- at most 2 GiB and two hours;
- exact dependency QA and reconciliation lineage;
- approved snapshot, work item, estimate, reservation, lease, and idempotency
  lineage;
- the four exact model-manifest digests in canonical order;
- fixed `cuda` / `float16` / beam size 5 / word timestamps / VAD /
  deterministic-temperature settings.

It accepts no caller bytes, path, URL, raw chat, arbitrary model, arbitrary
settings, or CPU execution.

The declared future private outputs are:

1. word-timed transcript JSON;
2. caption-segment JSON;
3. transcription analysis JSON.

The existing `transcript_alignment` and `caption_timing` QA gates remain
authoritative. This preflight cannot mark either gate passed.

The server-derived runtime request and result parser are also candidate-only.
The request binds every runner field with SHA-256. The result parser can
strictly match that binding and the three digest-only output candidates, but
an untrusted wire response is not treated as proof of Cloud Run execution.
Canonical worker/completion receipts, immutable output bytes, artifact
QA/reconciliation, and GPU-active internal-cost evidence remain mandatory.

## Still blocked

The candidate deliberately keeps all of these false:

- production tool or operation promotion;
- canonical operation artifact-set verification;
- reproducible shared CUDA image (the hash-locked dependency list and
  CUDA-only runner source now exist in
  `canonical-faster-whisper-gpu-runtime-contract.md`);
- Cloud Run L4 benchmark;
- read-only remote model mounts;
- private audio reread;
- CTranslate2 model load and Faster Whisper inference;
- transcript/caption artifact writes;
- transcript alignment and caption timing QA;
- cloud dispatch, work/queue mutation, cost, approval, snapshot, provider,
  render, runtime, and production authority.

This is the safe prerequisite for a later canonical 51st-tool promotion. It is
not that promotion.

## Evidence

Run:

```bash
npx tsx server/smoke/canonical-faster-whisper-cloud-run-gpu-execution-admission-smoke.ts
```

The smoke proves the four exact files, 486,212,372-byte total, CUDA-only
settings, private WAV lineage, output/QA contract, exact production registry
count of 50, absence from the callable operation registry, and adversarial
rejection of CPU, model, manifest, path, source, output, digest, and authority
substitution.
