# Canonical Music v3 integrity migration

Status: `standalone_skill_complete`, `orchestra_ready`,
`orchestra_integration_pending_by_design`,
`live_music_provider_activation_pending_external_evidence`

## Baseline audit

The published Music v2 implementation remains the migration source. It already owns the
shared-kernel manifest, canonical service, private artifact flow, rational timebase,
fixture-qualified Lyria adapter, actual audio analysis, MusicSync, public Sound v4 port,
QA, revision, handoff, and legacy retirement boundaries.

The final integrity audit found twelve production-contract gaps that cannot be fixed by
documentation or by weakening qualification:

1. broad write ranges are not atomically segmented from scene, speech, silence,
   ambience, transition, chapter, lock, and cue-constraint boundaries;
2. unlocked cue constraints may be discarded or overlap generated cues;
3. Music technical intent is hashed but not losslessly applied by Sound;
4. route output declarations are not enforced as named runtime bindings;
5. source/library matching is not cue-aware enough to prove professional selection;
6. MusicSync reports anchors but does not make anchor choice authoritative;
7. provider and revision artifact identity is not unique across changed attempts;
8. fixture multi-candidate generation incorrectly models one interaction as multiple
   Lyria outputs;
9. peer acceptance proves only no-Music outcomes;
10. supported-job evidence can be broad rather than exact and invocation-bound;
11. mini-skill declarations do not point to exact implementation evidence; and
12. QA does not yet validate the post-segmentation coverage and technical-intent chain.

## Version decision

Music publishes version `3.0.0`, contract `music.skill_contract.v3`, and v3 request,
result, artifact, route, and receipt identities. Music v2 remains compatibility-only and
immutable.

Sound remains on contract `sound.skill_contract.v4` and publishes compatible skill version
`4.1.0`. A new optional,
versioned `sound.music_technical_automation.v1` request extension and corresponding
receipt are additive. Existing Sound v4 callers keep identical behavior when the
extension is absent. The extension is the only public path by which Music can transmit
the exact technical automation contract; no low-level Sound imports are allowed.

## Migration map

| Surface | Decision | v3 action |
| --- | --- | --- |
| shared edit-skill kernel | retain | reuse schema, registry, qualification, hashes |
| Music v2 public service | migrate | publish v3 boundary and v2 compatibility identity |
| Music context resolver | adapt | provide typed segmentation inputs |
| Music supervision | migrate | atomic segmentation and constraint resolution |
| MusicSync | migrate | anchor-driven placement decisions |
| Music source/library routes | migrate | rights-gated cue-aware matcher |
| Lyria provider | migrate | one interaction per candidate plus candidate groups |
| Music-to-Sound port | migrate | versioned lossless Sound automation extension |
| Music route executor | migrate | named output bindings and exact receipts |
| Music QA and continuity | migrate | validate segmentation and applied Sound evidence |
| localized revision | migrate | attempt- and revision-unique identities |
| Music UI projection | adapt | read-only projection of v3 artifacts and receipts |
| v2 fixtures | fixture_only | retain as regression input, never production authority |
| SOUND_MUSIC_AUDIO | compatibility_only | planning bridge only; no execution authority |
| old provider/worker/UI authority | retire | canonical service remains the sole entry point |
| historical Music SQL | fixture_only | domain inventory only; no migration deployment |

## Invariants

- The Head of Orchestra is not implemented in this migration.
- Music owns creative soundtrack decisions; Sound owns technical audio mutation.
- Whole-video read authority never expands Music write authority.
- Provider generation remains fixture-qualified unless live external evidence exists.
- Generated Music remains project-only by default.
- Final mux, render, export, delivery, and publishing remain outside Music.

## Closure result

All twelve integrity gaps are closed in Music v3:

- authorized writes are divided into exact non-overlapping atomic segments;
- cue constraints have explicit authority and resolution receipts;
- the public Sound port applies and returns the complete technical automation contract;
- every route step publishes validated named output bindings with lineage;
- source and library candidates are rights-gated and ranked independently of input order;
- MusicSync selects source and target anchors from measured boundaries;
- generated candidates and localized replacements have attempt- and revision-unique identities;
- each Lyria candidate is one independent provider interaction inside an attempt group;
- all five peer-shaped callers produce real Music or a typed professional non-Music result;
- all 35 supported jobs have unique planning evidence and only exactly exercised direct modes
  retain fixture/private execution qualification;
- all 41 mini-skills cite real implementation symbols and explicit execution boundaries; and
- QA validates segment coverage, constraint resolution, actual cue-to-track placement, actual
  Sound output receipts, measured technical evidence, and whole-video continuity.

The canonical manifest is Music `3.0.0`, contract `music.skill_contract.v3`, hash
`f723bcdba273e56051ea384084bf311330db2b03f14e6eb2cb5f865f0288d11b`.
The top-level qualification remains `planning_qualified` because live provider and subjective
judgment gates remain intentionally unresolved. Four exact fixture job modes and eight exact
private-internal job modes have direct acceptance evidence; all production modes remain blocked.
