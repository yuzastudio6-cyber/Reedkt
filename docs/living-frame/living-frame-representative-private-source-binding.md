# Living Frame Representative Private Source Binding

## Contract

`living-frame-representative-private-source-binding-v1` is a namespaced,
byte-free source-only candidate. It bridges the existing private finalized
upload authority and canonical source-selection evidence to one exact Living
Frame representative source candidate.

It does not upload, download, transcribe, crop, copy, persist, dispatch, render,
approve, or expose media. It also does not replace the canonical source,
approved-snapshot, MasterTiming, work-graph, asset-manifest, renderer, QA, or
private-review owners.

## Inputs revalidated

- exact `private-upload-media-authority-v1` media and storage records;
- matching tenant, project, upload, media, and storage identities;
- source-media purpose, content type, byte length, and server-computed SHA-256;
- the exact seven-source representative candidate set and candidate digest;
- a transcript-backed video segment, bounded still crop, or cited data rows;
- license, attribution, person/publicity, and documentary fact-safety refs;
- exact approved snapshot, selected scene, MasterTiming, confirmed frame,
  approved work item, and asset-manifest entry refs.

Every reference declares that the canonical owner must reread it. The video
selection consumes source-led analysis only as an opaque versioned digest; this
feature branch does not copy or reinterpret the canonical analysis owner.

## Output boundary

The output carries IDs, media metadata, selection geometry, review refs,
canonical lineage refs, and content-addressed digests. The storage provider
identity is hashed. Bucket, object path, file name, source bytes, URLs, raw
transcript, raw chat, prompts, credentials, commands, and environment are not
serialized.

`canonicalConsumptionPending:true` and every operation, dispatch, runtime,
asset, billing, delivery, and production authority remain false. The smoke is
contract evidence only; it is not evidence that representative source bytes
have been ingested or approved.

## Per-case admission

`living-frame-representative-case-source-admission-v1` consumes the exact
private-source bindings required by one of the twelve active representative
cases. It preserves their shared workspace, project, snapshot, selected scene,
MasterTiming, and confirmed-frame lineage while requiring a unique approved
work and manifest-entry reference per source.

The candidate order and count come from the frozen seven-source case map.
Missing, extra, duplicate, reordered, cross-case, or stale common-lineage
sources are rejected. The output records which required visual asset roles the
source set can support and which caption, SoundSync, mask, final-artifact, or
other non-source dependencies must still be supplied by their canonical
owners. It does not perform that asset-role reconciliation itself.

## Exact probe and frame binding v2

The later semantic-routing audit invalidated v1 representative admissions. It
also exposed a separate timing defect: the v1 video selection literally stores
`fps: 30`, even when the exact source may use `30000/1001`, another constant
rate, or variable timing. V1 remains readable as historical contract evidence,
but it cannot drive representative rendering.

`living-frame-representative-private-source-binding-v2` is the additive,
source-only replacement candidate. It binds one source to one exact corrected
semantic route and requires:

- immutable private media ID, byte length, and server-computed SHA-256;
- an exact canonical FFprobe or still-probe evidence reference;
- exact video dimensions, codec, pixel format, decoded frame count, rational
  frame rate, rational time base, and duration in time-base ticks;
- a constant-frame-rate source or a later canonical normalization step;
- exact inclusive/exclusive source-frame selection;
- exact rational MasterTiming rate and destination frame range;
- either identical-frame mapping or deterministic duration-preserving CFR
  resampling with 1:1 playback speed and half-up frame-duration rounding;
- exact still orientation/dimensions before crop geometry; or
- exact structured-data media identity, selected rows, and citation lineage.

The compiler rejects substituted 30-fps metadata, variable frame rate,
probe/source-byte mismatch, selection beyond decoded frames, source-duration
mismatch, destination-duration drift, caller-selected speed changes, semantic
cross-topic substitution, extra URL/path fields, stale reviews, and stale
canonical lineage. It consumes the existing FFprobe and Sharp identities; it
does not create a probe tool, timing owner, or source registry.

The v2 result retains `canonicalConsumptionPending:true`. It does not probe,
download, ingest, select, render, dispatch, persist an asset, approve QA, charge
a customer, or authorize public/production use. Its focused smoke includes an
exact `30000/1001` source-rate case only to prove contract math and refusals.

## Semantic-route case admission v2

`living-frame-representative-case-source-admission-v2` consumes only exact v2
private bindings. For each of the twelve active cases it derives the required
ordered source IDs from the semantic-routing correction, not from the retired
v1 seven-source case map. It revalidates every binding and requires:

- the exact case and semantic topic on every source;
- the exact route, provenance, visual-fixture, and source-binding digests;
- identical workspace, project, approved snapshot, selected scene,
  MasterTiming, and confirmed-frame lineage across the case;
- a unique approved work ref and asset-manifest ref for every source;
- exact source-probe or structured-snapshot evidence per assignment; and
- the owner pause on character animation and mechanical rigging.

The admission distinguishes primary A-roll from topic-matched supporting
B-roll and preserves archive, map, diagram, data, static-illustration, and
non-character-still source uses. Missing, extra, reordered, duplicated,
cross-case, cross-topic, cross-snapshot, or v1 bindings fail closed. Source
coverage is reported separately from caption, SoundSync, temporal-mask,
renderer, and final-review dependencies, which remain with their canonical
owners.

The current v1 visual fixture still asks the Hybrid Expansion and Attention
cases for an `approved_non_character_still`, while the corrected semantic route
supplies topic-matched source B-roll. V2 admission reports that role as pending;
it does not pretend that a video segment is already an approved still. A later
versioned visual-fixture/derived-frame decision must reconcile that mismatch
before either case can render.

The focused source-only proof compiles all twelve corrected routes and 26 v2
private bindings, including four cases that use the topic-matched NASA B-roll.
It creates no work item or asset and grants no runtime, QA, cost, delivery, or
production authority.

## Visual-fixture v2 source-role correction

The canonical product disposition is to let Hybrid Expansion and Attention use
the exact approved topic-matched B-roll range directly. The system must not
manufacture a still merely to satisfy the old v1 fixture schema.

`living-frame-representative-visual-fixture-v2` is the namespaced source-only
candidate for that later owner reconciliation. For the two affected cases it
removes `approved_non_character_still` and requires
`approved_topic_matched_source_broll_video` instead:

- Hybrid Expansion requires a content-analysis-verified non-character source
  segment because the active scope is explicitly non-character.
- Attention requires an exact topic-matched source segment and may preserve its
  original approved source motion.

Neither case may generate living-subject motion, rig a living or mechanical
subject, or automatically substitute a derived still. Head Intelligence may
choose a deliberate freeze/hold later, but that requires separate frame
extraction, immutable bytes, work, manifest, deterministic QA, and private
review lineage.

V1 fixture cases stay blocked. The v2 candidate does not mutate the shared
canonical fixture, and every case still requires an exact case-source admission
v2 digest plus canonical content-analysis reread before runtime. All execution,
asset, cost, QA approval, public, and production authorities remain false.
