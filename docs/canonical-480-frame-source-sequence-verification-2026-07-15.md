# Canonical 480-Frame Source-Sequence Verification — 2026-07-15

Status: `verified_local_private_exact_ceiling`

## Scope

This bounded backend slice replaces the former shared 240-frame composition
ceiling with one explicit, versioned capacity profile:

- profile: `canonical_private_4k_source_sequence_480_frames_v1`;
- single-source maximum: 240 frames;
- individual source/voice/color operation maximum: 240 frames;
- ordered source-sequence maximum: 480 frames;
- source count: two through eight;
- longer duration: fail closed pending canonical chunk render, QA, and merge.

These are current private execution limits, not product-duration limits and not
evidence that ReEditPro is ready for arbitrary long-form media.

## Connected Boundary

The same limits are enforced by the browser-safe canonical compiler, the
server Remotion planning validator, the final-composition evidence schema, and
the pinned confined Docker runner. A sequence cannot use the larger total
ceiling to hide an oversized source operation: any individual approved source
range above 240 frames is rejected before publication and again at runtime.

The existing immutable approved-snapshot, 4K estimate/reservation, lease,
one-use dispatch, private create-only persistence, QA, reconciliation, replay,
authenticated no-store review, and acceptance boundaries remain unchanged.
No second export estimate or export credit charge was added.

## Exact Runtime Evidence

`npm run smoke:editor-full-stack-private-review` passed with exit code 0 after
the change. The signed-in local-test journey:

1. created a project and named edit;
2. uploaded and backend-probed eight distinct two-second MP4 sources;
3. published and approved the exact 480-frame/30fps canonical plan under the
   existing 3840x2160 4K estimate basis;
4. requested the immutable execution package separately;
5. completed all 27 server-derived work items and jobs;
6. executed eight exact source-bound voice/color branches, seven caption cues,
   seven approved hard cuts, final Remotion composition, and independent QA;
7. loaded and downloaded the authenticated review bytes;
8. verified a non-passthrough 3840x2160 MP4 with duration exactly 16.000
   seconds and SHA-256
   `bc00bfdee634fdcb6fb87d9afe52255e1c0e2b129e7e98fb15d6732ae22a79f1`;
9. independently sampled and verified all eight distinct source-bound tones in
   approved order; and
10. persisted private review acceptance.

The artifact was 1,086,192 bytes. Its small size reflects the deliberately
simple solid-color synthetic fixtures; it is not representative bitrate or
large-output evidence.

## Focused Validation

- `npm run typecheck:server` — passed.
- `npm run smoke:canonical-planning-publication-client` — passed; accepts the
  exact 480-frame sequence and rejects 481 frames plus any source operation
  above 240 frames.
- `npm run smoke:offline-remotion-render-execution` — passed after rebuilding
  and reopening the pinned image; actual Remotion, FFprobe, confinement,
  source sequence, caption timing, hard cuts, voice replacement, color
  intermediate, tamper rejection, and deterministic replay checks passed.
- `npm run smoke:editor-full-stack-private-review` — passed with the exact
  signed-in 480-frame 4K journey described above.
- `npm run smoke:canonical-multi-source-final-composition` — passed the complete
  three-source reference-bound color/voice/hard-cut lifecycle after the limit
  change.
- `npm run smoke:canonical-private-tool-dispatch` — passed and revalidated
  exactly 50 canonical E2E plus 50 canonical job-adapter identities.
- `npm run qa:internal-pipeline` — passed all 27 of 27 phases in 1,696,673 ms
  with exit code 0. Its final clean signed-in run reproduced the exact 16.000
  second artifact SHA-256 and all eight ordered tone checks.

## Readiness Boundary

This slice does not implement or claim:

- single-source or sequence execution above the stated frame ceilings;
- snapshot-bound chunk planning or chunk work items;
- per-chunk render/QA persistence;
- deterministic chunk concatenation and merged-output QA;
- distributed workers, deployed storage, live providers, live Supabase, live
  billing/wallet mutation, customer charging, public delivery, deployment, or
  production rendering;
- Motion Studio; or
- Edit Reference/Edit Preferences implementation owned by the separate
  coordinated task.

The 50-tool identity count is unchanged by this slice. Existing private
canonical/job-adapter evidence must still not be described as 50 tools being
production-ready.
