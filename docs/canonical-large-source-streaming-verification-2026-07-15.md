# Canonical Large-Source Streaming Verification — 2026-07-15

Status: `one_resumable_sized_4k_mp4_verified_through_private_canonical_execution_long_duration_and_production_unverified`

## Verified private journey

`npm run smoke:canonical-private-color-execution` now connects one source above
the former canonical 16 MiB buffer boundary to the existing canonical editing
lifecycle. The fixture is a valid two-second 3840x2160, 24 fps MP4 with AAC
audio and a valid top-level MP4 `free` box. Its exact size is 18,874,505 bytes.

The passing run verifies:

1. an authenticated source upload intent with an exact size and SHA-256;
2. a create-only fake-GCS resumable target;
3. browser-side 8 MiB chunks without a whole-source `arrayBuffer()` call;
4. simulated response loss after the second committed chunk, provider-offset
   recovery, and exact resume;
5. no ReEditPro bearer token sent to the object-storage origin;
6. restart-safe background finalization with exact stored-byte checksum,
   generation, ETag, and FFprobe-derived 3840x2160 source metadata;
7. Exact Edit Preferences, confirmed frame, persisted planning handoff, one
   server-owned canonical plan, immutable approved snapshot, and one synthetic
   private-test reservation;
8. snapshot validation, source-trim validation, libass caption creation,
   source-bound FFmpeg voice delivery, source-bound professional color, final
   Remotion composition, and independent FFprobe final QA;
9. one-use dispatch, execution fence, private artifact persistence, QA,
   reconciliation, idempotent replay, and private integrity-bound download;
10. the original source reopened through the storage adapter four times—once
    for finalization and once for each source-bound canonical attempt—totalling
    75,498,020 streamed provider bytes in the local-backed proof; and
11. one approved 4K UHD estimate and reservation reused for the final master,
    with no second export estimate, reservation, credit mutation, or charge.

The browser upload issued four requests including recovery. Its largest chunk
body was 8,388,608 bytes. The 16,777,216-byte resumable threshold remained
unchanged, and the local raw Express upload route remained capped rather than
being widened to make the test pass.

## Source authority and runner behavior

Canonical source authority now accepts an approved MP4 commitment up to the
professional source ceiling. Before source bytes are traversed, the private
worker applies `large_media_worker_capacity_v1` and reserves space for one full
staging copy plus its required headroom. It then creates a random, create-only,
attempt-scoped sandbox bound to owner, workspace, project, edit session,
snapshot, job, lease, execution attempt, and dispatch grant.

The storage stream is materialized as a private file with exact byte-count and
SHA-256 verification. FFmpeg and FFprobe receive no caller path and no bind
mount. The backend reopens the staged file through a no-follow private reader,
streams it into the networkless confined container over stdin, and re-verifies
the exact byte count and SHA-256 on every pass. Sandbox cleanup requires the
original directory device/inode identity. Failed materialization or promotion
also destroys and awaits its source stream so a rejected create-only or
symlink path cannot leak a file handle.

The passing canonical run produced:

- a 5,612-byte QA-passed lossless VP9/Matroska professional-color
  intermediate; and
- a 120,156-byte private 3840x2160 H.264/AAC master with 48 exact frames.

Those small outputs are properties of the short, low-complexity fixture. They
are not representative output-size or throughput evidence.

## Fail-closed composition policy

The current Remotion protocol still accepts bounded in-memory selected render
inputs. Therefore, a canonical plan containing any original source above
16 MiB may publish only when it includes one approved professional-color
intermediate for every source. Final composition stages and re-verifies the
immutable originals, but consumes the QA-passed color intermediates as its
selected visual inputs. It never substitutes the 1080p analysis proxy as final
render authority.

If a large source lacks its required intermediate, planning fails before
approval. If an intermediate or combined selected-input set exceeds the
current bounded Remotion/media protocol, execution fails closed rather than
silently lowering quality or switching to a proxy.

## Honest limits

This result closes the former `source_over_16_mib_cannot_enter_canonical_media`
gap for one bounded MP4 fixture. It does not establish general large-video or
production readiness:

- canonical source-bound execution currently accepts MP4 only even though
  ingestion recognizes additional professional containers;
- source-bound Python runners remain on the older 16 MiB buffered contract;
- FFmpeg output, dependency-artifact reads, Remotion selected inputs, render
  request serialization, and final artifacts retain bounded in-memory limits;
- the executable canonical profile remains short-duration and cannot yet
  represent a long professional program;
- source staging is a full local copy per attempt and has no durable byte-level
  resume after host loss;
- the capacity reservation is process-local, not distributed;
- generic completion recovery does not retain attempt-level source-staging
  details and conservatively reports the new streaming proof flags as false
  instead of inferring them from a completed artifact;
- no live GCS CORS/IAM/session/lifecycle test was run;
- no 50 GiB, 250 GiB, 1 TiB, long-duration, 8K, ProRes, long-GOP, VFR,
  multichannel, timecode, damaged, hostile, HDR, or wide-gamut canonical suite
  was run; and
- no provider, remote Supabase, customer wallet, billing, deployment, public
  rendering, public export, Motion Studio, or MS-001 authority was enabled.

Product, external-beta, public-delivery, and production readiness remain
false. The next large-video execution milestone must stream or privately
file-bind bounded worker outputs and Remotion inputs without serializing whole
professional programs into request buffers, then prove long-duration media,
distributed recovery, and deployed storage behavior.

## Focused verification

The following passed on the changed code before the aggregate pipeline run:

```sh
npm run typecheck:server
npm run smoke:private-canonical-worker-sandbox
npm run smoke:actual-run-evidence-bridge
npm run smoke:offline-media-binary-execution
npm run smoke:canonical-private-color-execution
npm run smoke:canonical-multi-source-final-composition
npm run smoke:large-media-ingest-readiness
npm run smoke:large-media-background-finalization
npm run smoke:large-media-private-4k-pipeline
npm run smoke:professional-export
npm run smoke:credit-estimate
npm run smoke:canonical-planning-publication-client
```

These commands contact no live provider or remote Supabase project and perform
no billing, customer-credit, deployment, or public-delivery action.

## Aggregate verification

The post-change `npm run qa:internal-pipeline` run completed all 24 phases in
1,075,984 ms with exit code 0. Its large-source phase passed in 79,379 ms, the
three-source continuity phase passed in 585,201 ms, and the final signed-in
maximum eight-source private-review phase passed in 366,892 ms. The aggregate
also re-reported exactly 50 canonical end-to-end and job-adapter-verified tool
identities at evidence revision `2026-07-15.30`.

That aggregate result does not change the limits above. It remains local/private
evidence with fake-provider storage for the resumable fixtures, synthetic source
media, bounded artifacts, and no provider, remote Supabase, customer billing,
deployment, public delivery, external-beta, or paid-production authority.
