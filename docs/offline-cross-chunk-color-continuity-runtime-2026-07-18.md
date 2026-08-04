# Offline Cross-Chunk Color-Continuity Runtime — 2026-07-18

Status: `bounded_adjacent_pair_runtime_verified_canonical_job_pending`

## Outcome

The pinned private FFmpeg runtime can now analyze one exact adjacent pair of
independently QA-passed 4K VP9 object chunks without mutating media. It reopens
both checksum-bound artifacts, independently verifies Matroska/VP9, the exact
4K frame, 30 fps, duration, `yuv420p`, limited-range BT.709, zero audio, and
timestamps, then decodes three 64x64 RGB samples from a 30-frame window on each
side of the boundary. Exact full-frame counting remains the responsibility of
the already-required per-chunk independent QA; it is not redundantly repeated
at every adjacent boundary.

This pairwise design keeps memory bounded for six-hour and multi-camera edits.
The future canonical color job can inspect 123 adjacent boundaries one pair at
a time instead of loading all 124 chunks into memory.

## Deterministic Policy

- A `continuous_technical_split` is a continuation of the same approved edit
  range. Mean-luma delta must be at most 18 and normalized RGB chromaticity
  delta at most 0.06. A mismatch or clipping-risk result blocks finalization.
- An `approved_hard_cut` may be an intentional scene/camera change. Its
  evidence tolerance is mean-luma delta 36 and chromaticity delta 0.12. A
  mismatch is `review_required`, not silently passed and not automatically
  color-corrected.
- Near-black/near-white clipping evidence blocks either boundary class.
- Thresholds are versioned server policy. Callers cannot supply thresholds,
  paths, URLs, commands, filters, codecs, artifacts, or commercial authority.
- The approved 4K edit reservation is reused; a second export estimate or
  additional export charge is forbidden.

## Executed Proof

`npm run smoke:offline-media-binary-object-chunk` passed with two real private
4K VP9 chunks. The second chunk used a nonzero source-frame range and began
with the exact color continuation of the first chunk. Four confined checks
passed: independent left/right FFprobe verification plus independent
left/right FFmpeg RGB sampling. Synthetic deterministic policy assertions also
proved that a technical mismatch blocks, an editorial mismatch requires
review, and clipping blocks.

The same slice separates the general 192 MiB private-media streaming ceiling
from the object-chunk-specific 512 MiB ceiling. Only the explicit Matroska
object-chunk persistence/read APIs receive that larger bound; existing media
operations keep their narrower ceiling.

## Readiness Truth

Verified local/private:

- exact adjacent-pair request validation and caller-field rejection;
- independent persisted-media shape verification;
- real decoded RGB boundary sampling under network-none/read-only/non-root
  confinement;
- deterministic pass/block/review policy; and
- no media mutation, provider call, billing, wallet, or public delivery.

Still false:

- canonical `validate_cross_chunk_color_continuity` authority, queue lease,
  one-use attempt, and attempt-level internal production-cost evidence;
- durable aggregation/checkpointing across all 123 boundaries;
- canonical reconciliation, replay, terminal completion, and downstream
  dependency release;
- execution proof for the other 122 object-chunk render/QA pairs;
- representative real multi-camera shot-match quality and load/throughput
  evidence;
- distributed object storage/database recovery, Google Cloud workers,
  deployment, product readiness, external beta, or production readiness.

## Next Gate

The next bounded increment is the canonical cross-chunk color job. It must
derive all boundary pairs from the immutable approved chunk graph, consume only
exact QA-passed artifact checksums, checkpoint pair evidence, meter the one
attempt's internal infrastructure cost, and release finalization only after
every boundary passes or an explicit approved review resolves every
`review_required` result.
