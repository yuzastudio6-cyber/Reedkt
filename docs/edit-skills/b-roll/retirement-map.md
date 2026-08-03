# B-roll active-route retirement map

Status: audited at M0; retirement enforcement is completed in M10.

## Keep as canonical owners

| Surface | Decision | Reason |
| --- | --- | --- |
| `server/edit-architecture/canonical-provider-work-authority.ts` V1-V4 | Keep immutable | Historical provider identities and hashes must not change. |
| Canonical approved snapshot, execution-package, package queue, lease, dispatch, attempt, artifact, QA, reconciliation, and cost services | Keep and integrate | These are the current private backend authority boundaries. |
| Canonical source-led compiler source-only behavior | Keep unchanged when no B-roll component exists | Explicit source-only intent must continue to suppress B-roll. |
| FFmpeg, FFprobe, Remotion, private artifact, and objective QA services | Keep and reuse through bounded adapters | They already carry safer execution and evidence boundaries. |
| Legacy creative doctrine in `docs/creative-skills/b-roll-planning-contract.md` | Keep as product doctrine | Meaning-first, source-first, proof safety, restraint, timing, and caption/audio coordination remain valid. |
| Existing source inventory, edit preference, Reference DNA, timing, layout, and cue types | Keep as context inputs | They are upstream or cross-skill authority, not competing B-roll runtimes. |

## Refactor or supersede

| Surface | M0 finding | Target owner |
| --- | --- | --- |
| `src/lib/edit-operation-planner.ts` atomic `b_roll` operation | Planner metadata exists but is not an executable top-level skill contract. | Project into one manifest-bound B-roll assignment/plan component; retain compatibility projection only. |
| `src/lib/professional-integration/cue-treatment-planner.ts` and `BrollIntegrationPlanCard.tsx` | Useful user-facing source treatment model, but not orchestra/provider authority. | Consume canonical B-roll result/layer summaries; no runtime authority. |
| `src/lib/edit-map/edit-map-builder.ts` B-roll groups/elements | Useful display projection with fallback mock entries. | Read canonical B-roll plan/result; remove active fallback authority. |
| `src/lib/generation/mock-credit-estimator.ts` fixed per-item B-roll estimate | Mock-only count-based estimate. | Resolve manifest estimator keys and immutable estimate evidence. |
| `src/lib/professional-editing-ontology.ts` B-roll policies | Valuable vocabulary but broad and partly legacy. | Map into canonical manifest roles/source strategy without becoming a second runtime. |
| Old unified skill capability registry branch | A flat tool/readiness lookup, no immutable manifest or qualification lineage. | Selectively reuse vocabulary only; do not merge the branch. |

## Retire from active B-roll routing

| Surface | Retirement rule |
| --- | --- |
| Legacy Wan B-roll branches and model/cache/inference scripts | Historical branches remain untouched, but none may be imported, scripted, configured, or selected by the active B-roll runtime. |
| Wan, Hailuo, Veo, Kling, generic provider-gateway generated-video routes | Static validation rejects them as B-roll routes or fallbacks. Other skills' valid routes are not modified. |
| Stock/library and fake-stock paths | No active B-roll manifest route. Historical text remains readable. |
| Atomic `b_roll` operations acting as independent orchestra runtime entries | Superseded by one top-level `b_roll` skill assignment. Compatibility display/projection is allowed only when bound to the canonical manifest reference. |
| Caller-selected provider, model alias, executable, command, path, URL, or credential | Rejected at schemas and runtime gates. |
| Direct SAM2 or SAM 3.1 import from B-roll | Forbidden statically. Only `track_graph_v1` may cross the skill boundary. |

## Historical evidence preservation

No remote branch, migration, provider attempt, accepted evidence hash, or
historical artifact identity is deleted or rewritten. Retirement means that a
path cannot be selected for new B-roll planning or execution. It does not
reinterpret old records.
