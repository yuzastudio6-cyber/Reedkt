# B-roll active-route retirement map

Status: M10 active-route retirement completed and statically enforced.

Canonical orchestra runtime: `server/edit-skills/b-roll/b-roll-capability-manifest.ts`

Canonical provider operation: `provider.google.generate_b_roll_candidate.v1`

Historical doctrine and compatibility vocabulary do not confer runtime
authority.

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

## M10 final inventory

| Relevant surface | Final classification | Enforced result |
| --- | --- | --- |
| `server/edit-skills/b-roll/**` | Keep canonical | The only `b_roll@1.0.0` manifest and handler registration. |
| `server/providers/google/gemini-omni-broll/**` | Keep canonical | The only B-roll provider route is `gemini_omni_flash` through the V5 operation. |
| `server/services/canonical-broll-plan-component-service.ts` | Keep canonical integration | Content-addressed plan/snapshot/execution-package bridge only. |
| `server/tool-execution/**` B-roll operation allowances | Keep shared adapters | Exact FFmpeg/FFprobe/Remotion and objective-QA operation pairs, not route selectors. |
| `src/lib/edit-operation-planner.ts` `b_roll` operation | Keep as internal edit-operation vocabulary | It is not registered as an orchestra skill and cannot select the canonical B-roll provider. |
| `src/lib/professional-editing-ontology.ts` B-roll policies | Keep as intent vocabulary | Meaning, restraint, and source-first guidance only; no B-roll runtime authority. General non-B-roll AI-video tier policy remains untouched. |
| `src/lib/professional-integration/**` and B-roll UI cards | Keep as local/mock presentation | They remain non-executable display/planning surfaces and do not register a skill or provider. |
| `src/lib/mock-creative-skill-records.ts` `b_roll_planning` | Supersede | Explicitly `superseded`, `not_routed`, and `docs_only`; retained only as compatibility vocabulary. |
| 140-skill Creative Skill canonical seed B-roll rows | Archive/historical metadata | All nine `b_roll` family rows keep `metadata_json.runtime_enabled = false`. |
| `docs/creative-skills/b-roll-planning-contract*.md` | Supersede as runtime source; keep doctrine | Each file points to the canonical architecture and is marked historical. |
| `docs/creative-skills/implementation-handoff.md` | Archive/historical | Its earlier docs-only statements are explicitly time-scoped and point to the canonical runtime. |
| `docs/creative-skills/README.md` B-roll rows | Refactor | The index identifies the old contract/checklist as historical compatibility material. |
| Motion Studio/general visual-generation Wan/Hailuo/Veo routes | Keep unrelated ownership | They are not B-roll skill routes and were not changed. Static validation prevents the canonical B-roll runtime from importing them. |
| Historical V1-V4 provider registries and hashes | Keep immutable | Existing authority smoke continues to require the exact historical hashes. |
| Historical migrations, attempts, artifacts, and evidence | Keep immutable | No history or accepted evidence was rewritten or deleted. |

## Absence and cleanup findings

The reconciled integration base contains no provider-specific B-roll file whose
name combines B-roll with Wan, Hailuo, Veo, Kling, SAM, or stock-library
runtime markers. It also contains no active B-roll package script, environment
variable, model cache, downloader, installer, external-agent wrapper, or
provider selector for those retired routes. Consequently M10 did not delete a
historical branch or fabricate a replacement tombstone; it superseded the
remaining active-looking metadata and documentation claims in place.

The repository-wide validator walks active B-roll source boundaries, package
scripts, production registrations, historical metadata, documentation
markers, and repository filenames. It rejects:

- Wan, Hailuo, Veo, Kling, stock-library, provider-gateway, or generic
  generated-video B-roll route identities;
- retired provider or tracking-implementation imports;
- retired B-roll environment-variable authority;
- provider-specific B-roll runtime/cache/script filenames;
- a second orchestra-callable `b_roll` registration;
- any active provider operation other than the canonical Gemini Omni V5
  operation;
- an alternate provider fallback;
- Creative Skill B-roll metadata becoming runtime-enabled; and
- historical B-roll docs losing their canonical supersession marker.

Injected retirement fixtures prove that Wan, Hailuo, Veo, Kling, and stock
routes fail the validator. The validator intentionally does not alter valid
non-B-roll provider systems or any Track All implementation.
