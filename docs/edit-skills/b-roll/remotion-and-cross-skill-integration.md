# B-roll Remotion and cross-skill integration

Status: internally implemented and tested; not production-qualified

Canonical runtime identity: `b_roll`

## Execution boundary

The M9 integration executor accepts one exact content-addressed B-roll plan and
one selected artifact. A generated selection must be the final accepted M8
candidate version with its immutable QA report and attempt evidence. An
existing-source selection must be the exact M5 result with passed source QA.
Both paths must provide the private FFV1/NUT artifact produced by the approved
normalization recipe. Raw provider MP4 output and unapproved source bytes are
not valid Remotion inputs.

Before rendering, the executor revalidates the assignment and plan hashes,
manifest reference, tenant/project/workspace scope, exact authorized range,
selected artifact checksum, normalized frame count, caption overlay scope, and
all required dependencies. When the plan requires tracking, only a
scope-bound, content-addressed model-neutral `track_graph_v1` artifact is
accepted. Missing tracking returns the B-roll Track All dependency failure; no
SAM2, SAM 3.1, or tracking execution is part of this skill.

## Normalized media handoff

Chromium cannot consume the QA FFV1/NUT candidate directly. The existing
pinned, network-disabled FFmpeg runtime therefore applies the fixed
`approved_b_roll_remotion_preview_proxy_matroska_v1` technical recipe:

- input must be the exact QA-normalized `video/x-nut` artifact;
- output is a checksum-bound VP9 Matroska private preview proxy;
- frame count, frame rate, dimensions, and BT.709 intent are preserved;
- audio and metadata are removed;
- no creative grade, editorial trim, transition, or composition decision is
  introduced.

The proxy is an implementation detail. The layer manifest and result receipt
continue to identify the selected QA-normalized B-roll artifact as editorial
authority.

## Layer manifest

`BrollRemotionLayerManifest` binds the exact assignment and capability
manifest references, plan and selected artifact lineage, source trim, timeline
start/end frames, crop, scale, position, speaker visibility, caption-safe
behavior, layer order, audio disposition, required Track All reference, output
QA reference, transition/color/sound handoffs, private preview reference, and
`outsideAuthorizedRangeModified: false`.

The seven supported treatments use fixed, validated geometry:

| Treatment | Geometry and order |
| --- | --- |
| Full-frame takeover | 100% frame, foreground layer 10 |
| Short full-frame cutaway | 100% frame, foreground layer 10 |
| Inset | x 60%, y 8%, width/height 34%, layer 10 |
| Picture-in-picture | x 65%, y 6%, width/height 30%, layer 10 |
| Split-screen | right half, layer 10 |
| Partial overlay | x 55%, y 45%, width 40%, height 45%, layer 10 |
| Background layer | 100% frame, opacity 0.45, layer 0 |

All treatments use absolute positioning, scale `1`, and `contain` fitting.
Remotion validates and applies the geometry rather than accepting caller-owned
CSS or arbitrary layout instructions.

## Ownership and QA

B-roll owns selection, its range-bounded layer, and B-roll integration QA.
Sound, Color, Transition, Captions, Track All, and Render retain final
authority. Strict, content-addressed Sound/Color/Transition handoffs record
that ownership; generated candidate audio is never promoted into the final
mix.

The integration QA report must pass all eleven checks:

1. exact authorized range;
2. no outside-range mutation;
3. primary-visual ownership;
4. caption collision behavior;
5. transition handoff;
6. color handoff;
7. sound handoff;
8. layer order;
9. visual density;
10. private preview integrity;
11. complete content-addressed lineage.

The result receipt records selected route/version, exact timing, layer and QA
references, integration QA, all final-owner handoffs, provider/candidate and
integration infrastructure cost evidence, immutable attempt history,
capability manifest hash, private preview, and
`outsideAuthorizedRangeModified: false`. Idempotent replay reopens and rehashes
the receipt, layer, QA, handoffs, and preview before returning committed
evidence.

## Qualification boundary

The smoke test executes real pinned FFmpeg normalization/proxy work and an
actual private Docker-confined Remotion render. It proves the exact M9 source
route, treatment mapping, preview, replay, dependency failure, and tamper
failure with zero provider requests. It does not prove live provider output,
production semantic visual intelligence, public delivery, final export,
billing, wallet mutation, Supabase, or production qualification. The current
`internal_execution_qualified` status is backed by the generated exact-commit
qualification receipt. Production qualification remains blocked by the five
live production fixtures.
