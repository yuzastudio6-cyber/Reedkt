# Canonical Private Source-Trim Final Composition

Status: private single-host internal-test evidence

This slice connects approved source-cleanup authority to the exact private Remotion final-composition runner. It does not enable public export or production rendering.

## Exact authority chain

1. The tool-free source-trim runner revalidates the immutable approved snapshot, funded reservation, source sequence, cleanup decision IDs, meaning-preservation status, and resolved user review.
2. Its private JSON artifact records the exact decision ID, source-sequence ID, action, start frame, exclusive end frame, confidence, review states, and a hash of the approved reason.
3. Lease-time dependency verification reopens that private object and verifies its internal-runner profile, execution fence, checksum, semantic report, passed QA, and reconciliation.
4. The final job requires the exact approved source/cleanup sequence and lease-selected artifacts consisting of one source-trim JSON plus either one legacy full-duration caption PNG or two through seven QA-passed libass caption PNGs.
5. The coordinator reloads current immutable authority, requires the trim report to equal the current cleanup decision, and requires `sourceEndFrameExclusive - sourceStartFrame = durationFrames`.
6. The pinned Remotion image receives only server-injected committed source/caption bytes and exact trim/caption frames. `OffthreadVideo` applies source ranges while preserving source audio, and Remotion `Sequence` bounds every caption-track PNG to its approved frame range.
7. A separate pinned FFprobe runtime verifies H.264, yuv420p, BT.709, exact frame count, AAC at 48 kHz, channel bounds, and duration drift of at most two frames.
8. The final MP4 is stored create-only, QA-passed, reconciled for private-test dependency use, available only through the authenticated private download service, and replayed by the job adapter without a second render.
9. A separate canonical `run_final_qa` ffprobe job can start only after that final artifact is QA-passed and reconciled. It reopens the exact MP4 dependency, derives expectations from the upstream approved Remotion work item, persists its own QA-passed JSON report, and replays without a second probe.

## Fail-closed rules

- Caller-selected tools, operations, snapshots, leases, artifacts, paths, URLs, commands, bytes, prices, credits, or providers are rejected.
- A missing, extra, changed, non-QA-passed, or unreconciled dependency is rejected.
- A trim decision that does not exactly match the current approved plan is rejected.
- A `cut` decision cannot become a source-video final composition.
- Product, external-beta, production, public delivery, further render, wallet mutation, credit spend, settlement, billing, provider, Supabase, and deployment permissions remain false.

## Verification

- `npm run typecheck:server`
- `npm run smoke:canonical-internal-authority-runner`
- `npm run smoke:offline-remotion-render-execution`
- `npm run smoke:canonical-multi-source-final-composition`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run qa:internal-pipeline`
