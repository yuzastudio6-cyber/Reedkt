# Production GCP Bucket Plan

## Naming Pattern

Buckets use:

```text
reeditpro-${REEDITPRO_ENV}-${GCP_PROJECT_ID}-{purpose}
```

All buckets are private by default, use uniform bucket-level access, enforce public access prevention, and carry labels `app=reeditpro` and `env=${REEDITPRO_ENV}`.

## Bucket Purposes

| Purpose | Bucket suffix | Contents |
| --- | --- | --- |
| source media | `source-media` | User-uploaded source clips, audio, and references. |
| proxy media | `proxy-media` | Lower-resolution proxies and analysis-friendly derivatives. |
| analysis artifacts | `analysis-artifacts` | ffprobe reports, scene data, visual/audio/color/OCR analysis. |
| transcripts | `transcripts` | Transcript JSON, word timestamps, caption drafts, and alignment artifacts. |
| masks | `masks` | Mask images/sequences, alpha mattes, cutouts, and mask QA artifacts. |
| generated assets | `generated-assets` | Generated images/video assets, cards, overlays, and approved tool outputs. |
| previews | `previews` | Preview renders and review outputs. |
| final exports | `final-exports` | Final renders, variants, thumbnails, and delivery packages. |
| worker temp | `worker-temp` | Scratch files, partial outputs, and retry-local artifacts. |
| QA artifacts | `qa-artifacts` | QA reports, frame grabs, plots, waveforms, diffs, and review manifests. |

## Lifecycle Notes

- `worker-temp` should have aggressive lifecycle cleanup in a later hardening milestone.
- `qa-artifacts` can have a shorter retention window than final exports once audit policy is approved.
- `source-media`, `transcripts`, and `final-exports` must follow workspace/project retention and privacy policy.
- Signed URLs are delivery/access artifacts only and must not be persisted as canonical source-of-truth paths.
