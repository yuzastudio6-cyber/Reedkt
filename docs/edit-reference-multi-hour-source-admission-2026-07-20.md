# Edit Reference multi-hour source admission

Date: 2026-07-20
Status: real-file local/private admission and planning proof; deployed worker execution remains gated

## Outcome

Edit Reference now has a focused regression proving that a valid six-hour video is not rejected merely because its timeline is long. The test creates a rights-safe sparse H.264 MP4 with a real six-hour media duration, passes it through the canonical private upload/finalization boundary, opens the finalized object with the real FFprobe-backed source inspector, and verifies the stored checksum remains unchanged.

The inspected source produces exactly 36 contiguous ten-minute study sections with the approved three-second decode overlaps. Every section retains its planned visual-sampling floor, all temporal stages cover the complete six-hour timeline, and the study retains:

- no browser-session dependency;
- no fixed whole-study wall-clock timeout;
- per-work-item checkpoints, leases, and restart/resume requirements;
- planning ETA ranges rather than invented progress;
- immutable-original and smaller-analysis-copy policy; and
- no customer price, credit, or service-fee mutation.

## Large-file routing proof

The same six-hour source identity is also planned at the current reviewed reference-media ceiling. That plan routes to resumable upload, forbids browser whole-file buffering, keeps infrastructure-capacity checks separate from study coverage, and still creates all 36 sections. File size changes the transfer and worker path; it does not silently reduce the timeline or substitute partial sampling for a completed study.

The reviewed ceiling remains a true infrastructure/product-capacity boundary, not a claim of unlimited storage. ReEditPro must report unavailable capacity or require the higher-capacity managed route when that real boundary is reached; it must not mislabel an otherwise supported large source as a study-quality failure.

## Verification

Run:

```text
npm run smoke:edit-reference-multi-hour-source-admission
```

The smoke proves real FFprobe admission, exact finalized-object binding, whole-source chunk planning, an unstarted recoverable work graph, honest ETA policy, immutable source bytes, and no provider or commercial action.

## Honest remaining boundary

The sparse fixture deliberately proves duration handling without spending hours decoding representative footage. It does not prove a deployed six-hour semantic run, multi-replica lease recovery, live GCS reads, production provider attempts, or remote checkpoint durability. Those claims remain blocked until the canonical durable pre-plan worker port has a reviewed live adapter and the same release candidate completes representative multi-hour media with live Auth/RLS/storage/worker/provider/cost evidence.

`productionReady` remains `false`.
