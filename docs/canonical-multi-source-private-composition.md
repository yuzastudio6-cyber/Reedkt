# Canonical Multi-Source Private Composition

Status date: 2026-07-13

Status: exact ordered two-source composition is verified through the canonical private lifecycle; product, external-beta, public-delivery, and production readiness remain false.

## What is implemented

The canonical planning compiler can publish a bounded source-and-caption graph for an exact ordered source sequence. The graph contains:

1. immutable approved-snapshot validation;
2. exact source-range validation for every ordered source;
3. one dependency-free libass caption overlay;
4. one Remotion final composition using `approved_source_sequence_caption_final_v1`;
5. dependency-bound FFprobe final-artifact QA.

The Remotion composition places each source in an explicit timeline `Sequence`, applies its exact approved source range, preserves source audio, and overlays one approved full-frame RGBA caption artifact. Source bytes are reopened only by the backend from the approved private source manifest. Browser paths, URLs, bytes, commands, credentials, and caller-authored storage identity are rejected.

## Exact sequence contract

The sequence contract accepts two through eight unique MP4 sources and requires all of the following:

- confirmed source order and one exact cleanup decision per source;
- duration-preserving source-to-timeline ranges with no gap or overlap;
- exact coverage of the approved 24–240-frame final duration;
- 24fps or 30fps and an approved bounded output frame;
- each source between 64 bytes and 16 MB and the combined sequence no larger than 20 MB;
- a PNG caption overlay no larger than 8 MB;
- a complete serialized request no larger than the confined runtime's 32 MB stdin ceiling;
- one safe caption spanning the complete final frame range;
- no unsupported cleanup action, speed change, placeholder, provider route, or hidden fallback.

The protocol and compiler cover two through eight sources. The executable evidence in this milestone uses two distinct approved source objects and must not be represented as eight-source runtime proof.

## Source-bound runtime identity

The Remotion image is rebuilt with an aggregate SHA-256 over the Dockerfile, runner, composition, entry point, bundle scripts, package manifest, and lockfile. That digest is stored in the image label `com.reeditpro.runner.source-tree.sha256`. Runtime activation recomputes the digest from the reviewed source and refuses an image whose label does not match. This closes the prior gap where current host source hashes could be combined with an older already-built image identity.

The container remains network-none, read-only, non-root, capability-dropped, mount-free, caller-environment-free, and bounded by fixed CPU, memory, PID, tmpfs, stdin, output, and timeout limits.

## Verified evidence

`npm run smoke:offline-remotion-render-execution` proves the current source-bound image actually renders two ordered one-second MP4 sources into a 48-frame H.264 composition, preserves AAC audio, applies the approved caption overlay, and passes an independent pinned FFprobe frame/codec/duration check.

`npm run smoke:canonical-multi-source-final-composition` proves the same exact sequence profile through:

- persisted planning handoff;
- immutable approved snapshot;
- synthetic private-test credit reservation without customer charging;
- two-source trim authority and dependency readiness;
- worker lease and one-use dispatch;
- backend-only source reads and confined Remotion execution;
- private artifact persistence;
- independent final FFprobe QA;
- reconciliation, idempotent adapter replay, downstream QA, and authenticated private download.

`npm run smoke:canonical-planning-publication-client` proves the named-edit compiler produces the ordered two-source payload only when the plan is exactly representable and preserves the source order/ranges in the canonical work graph.

The broader `npm run smoke:canonical-private-tool-dispatch` command is not a green completion signal in this checkout. It passes this exact sequence lifecycle, then currently fails later in the separate terminal-review replacement fixture at its exact-preference revision/lock comparison. That later fixture is outside this bounded composition milestone, and its failure is not hidden or counted as passing evidence here.

## No-silent-drop boundary

The normal rich two-source mock editor plan is intentionally not published into this bounded graph. In the current regression scenario, two one-second sources expand into a longer multi-segment plan with multiple caption cues, transitions, SFX, ducking, color/audio work, and other segment operations. Those semantics are not equivalent to two contiguous source ranges plus one caption. The compiler returns explicit blockers and creates no publication candidate instead of dropping or compressing that work.

The following remain separate future work-item/compiler milestones:

- multiple caption cues and caption animation;
- transitions and visual timing cues;
- SFX, music ducking, cleanup/mix, and other audio operations;
- color correction, grading, and shot matching;
- provider-backed assets, visual assets, and provider clip timing;
- speed changes, retiming, non-contiguous selects, and richer segment operations;
- deployed workers, distributed recovery, real-user storage/tenancy, public delivery, and production operations.

## Explicit non-authority

This milestone does not enable Supabase changes, provider calls, customer pricing or credits, billing, wallet mutation, production settlement, deployment, public rendering, Motion Studio, or MS-001. The synthetic reservation is private test authority only. All product, external-beta, final-export, public-delivery, and production readiness flags remain false.
