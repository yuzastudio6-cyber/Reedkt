# Edit Reference End-to-End Goal

Status: `complete_backend_local`

Authority date: 2026-07-11

Canonical worktree: `/Volumes/backup/REeditpro-beta-integration-4`

Canonical branch: `codex/beta-integration-reconcile`

Starting commit: `48540ee9b3d14c8345b0cedf11b6b449424324c3`

Machine-readable status: `docs/edit-reference-goal-status.json`

## Product Goal

Edit Reference is the complete ReEditPro workflow for studying reference evidence, converting transferable editing principles into versioned Preference DNA, reviewing that DNA for quality and copy risk, approving it, and adapting it to a different target edit.

The permanent product rule is:

> Reference style must be adapted to the target video, never copied blindly.

Completion requires a tester to move from a new study through evidence, DNA, QA, approval, target-specific application, reload, replacement, removal, and verified Project Edit Session/Edit Brief/Marker Chat/Plan Hint/QA handoffs. The canonical definition is in `docs/edit-reference-definition-of-done.md`.

## Authoritative Definitions

- **Edit Reference:** a reusable editing-intelligence profile derived from user direction and studied reference evidence.
- **Edit Preference:** the saved user-facing profile that owns approved Preference DNA.
- **Edit Reference Study:** the workflow that studies reference videos, previous approved edits, user instructions, and supporting evidence.
- **Preference DNA:** structured, transferable editing intelligence.
- **Preference DNA QA:** the safety and quality layer that checks copy risk, transferability, missing evidence, contradictions, confidence, and review requirements.
- **Preference Application:** the target-specific adaptation of approved Preference DNA to one Project Edit Session.
- **Workspace Defaults:** broad defaults for new edits. Dropdown/default controls belong here and are not the primary Edit Reference feature.

## Source-Truth Order

1. The canonical worktree and its committed tests.
2. The current canonical route, Project Edit Session, Edit Brief, Marker Context, Marker Chat, Preference Video, and Preference DNA contracts.
3. Proven local/live runtime evidence in the canonical worktree.
4. Read-only reference implementations, used only as adaptation sources after explicit reconciliation.
5. Historical documentation and compatibility data.

The read-only repositories are:

- `/Volumes/backup/REeditpro`
- `/Users/macuser/Developer/REeditpro`

They must never be mutated by this goal.

## Reconciliation Findings

| Surface | Canonical finding | Reference finding | Decision |
| --- | --- | --- | --- |
| Primary `/preferences` route | Routes to the imported mock Edit Preference profile library | The current reference repo has a newer dropdown-based Saved Edit Preferences page | **replace** the canonical primary presentation with Edit References; **extend** the newer default controls into the Workspace Defaults tab |
| Imported Edit Preference profile library | Mock-browser session, in-memory MockDatabase, reusable handles/tags/version summaries | Historical repo contains the same core files; target includes newer beta alignment | **reuse** types and compatibility records; **replace** component-only/mock-session authority with the Edit Reference repository/API/client boundary |
| Preference Video Study | Typed metadata-only stages, evidence items, tool registry, contracts, orchestrator, smoke | Historical repo matches canonical file content | **extend** in later evidence gates; Gate 1 must not claim that its skills ran |
| Preference DNA builder | Evidence-first layered mock builder with transferability, conflicts, signal candidates, contract hints, and Qwen bridge | Historical repo matches canonical file content | **reuse** the layer vocabulary and safety contracts; later **extend** behind versioned study evidence |
| Preference DNA QA | Copy-risk, evidence, confidence, transferability, do-not-copy, identity, side-effect, and review checks | Historical repo matches canonical file content | **reuse** as the canonical QA vocabulary and **extend** to durable DNA versions |
| Preference DNA application | Mock resolver/project setup/edit-plan/creative-system bridges | Historical repo matches canonical file content | **extend** into target-specific application; never treat hints as execution |
| Project Edit Session preference bridge | Current canonical beta bridge applies mock DNA/legacy fallback into session metadata, memory, history, and snapshots | Historical repo contains the same imported bridge | **retain and upgrade** as downstream application plumbing |
| Edit Brief and Marker Context | Canonical target has preference/DNA summaries in marker-scoped context packages | Absent from both older reference lineages | **reuse** canonical implementation only |
| Context-aware Marker Chat | Canonical target has marker-scoped Qwen prompt/response bridge, live and fallback evidence, and no main-chat pollution | Historical implementation is older | **reuse** canonical implementation; later accept only bounded approved application context |
| Source Video Understanding | Canonical metadata package excludes raw video/frames/provider payloads | Not present in older lineage | **reuse** for bounded context; it is not media analysis |
| Qwen 3.7 reasoning | Backend live-provider and deterministic fallback paths have prior proof | Older reference implementation differs | **reuse** only through server-only runtime gates; fallback must remain labelled fallback |
| Qwen visual reasoning | Live backend path resolved to `qwen3-vl-flash`; browser path remains bounded/fallback-aware | Older historical path has an earlier version | **reuse** canonical server adapter only; raw frames remain ephemeral and unpersisted |
| Production media tools | 49 registered profiles plus local/private proofs at varying readiness | Current reference has newer private execution authorities | **blocked/degraded** per individual tool until the Edit Reference adapter, proof, privacy, and provenance criteria pass |
| Private-local Preference Intelligence | Missing from canonical target | Current read-only repo contains routes, service, checksummed aggregate store, validation, idempotency, and an authority smoke | **historical-only adaptation source** for Gate 1; port reviewed concepts into canonical public contracts instead of creating a competing backend |
| Supabase Preference DNA repository | Explicit disabled skeleton only | Raw migration baseline is also blocked in current reference | **blocked** until canonical migration/RLS gates pass; no Gate 0/1 migration |
| Existing mock DNA labels/handles | Static compatibility labels such as mock DNA status and legacy no-DNA options | Same imported compatibility data in historical repo | **retire as engine authority**; retain only as compatibility fixtures |

## Duplicate And Contradiction Register

1. `/preferences` means two different things across lineages: the canonical mock profile library versus the newer reference repo's Saved Edit Preferences defaults. The approved resolution is one four-tab Edit Preferences workspace with Edit References as default and Workspace Defaults as the secondary default-control surface.
2. The canonical MockDatabase Preference Video DNA repository and the read-only private-local Preference Intelligence aggregate overlap in artifact ownership. Gate 1 must introduce one canonical Edit Reference repository boundary; the MockDatabase repository remains compatibility/fixture support rather than durable authority.
3. The imported Preference DNA application bridge uses mock labels and synthetic version IDs. It may not become durable identity or approved DNA authority without exact stored IDs and versions.
4. Source Video Understanding is metadata/context packaging, not real transcript, visual, audio, or media study. UI and status copy must preserve that distinction.
5. Live Qwen/Qwen visual proof exists, but no Edit Reference skill is considered executed until its own skill run records the exact runtime source, fallback, evidence, privacy outcome, and provenance.
6. The canonical raw Supabase migration history has 21 files and parallel foundations. It is not an executable production baseline and is unchanged by Gate 0.

## Architecture Decisions

- Keep the main navigation as Home, Projects, and Edit Preferences.
- Use `Edit Preferences` in visible copy; `/preferences` remains the technical route.
- Make Edit References the default `/preferences` tab.
- Preserve broad dropdown defaults under Workspace Defaults.
- Keep Applied Edits and Safety & Privacy as truthful typed views, not decorative pages.
- Use one canonical Edit Reference repository/API/client model. Browser state may cache or draft, but may not be authoritative.
- Reuse the private-local aggregate and atomic/checksum/idempotency ideas from the read-only current repository only after adapting them to canonical types and tests.
- Retain the existing Project Edit Session, Edit Brief, Marker Context, Marker Chat, and Plan Hint bridges as downstream consumers.
- Store approved Preference DNA versions immutably; revisions create new versions.
- Never persist raw provider payloads or sampled frames by default.
- Never start generation, rendering, workers, exports, or credit activity from Edit References.

## Gate Sequence

| Gate | Outcome | Current authority |
| --- | --- | --- |
| 0 | Goal control plane, source-truth reconciliation, UI/skill/persistence/test contracts | Complete — `96ea3ef290c2b6b603655ea579713026f1f783f4` |
| 1 | Durable backend-local Edit Reference and Study Chat vertical slice | Complete — `a46519df7255d360f34bfe1a85d65491d83179f6` |
| 2 | Evidence and Preference Video Study skill orchestration | Complete — `1af64c458a5621434c1ec4397b777910f6d5f3c6` |
| 3 | Versioned Preference DNA synthesis | Complete — `b01b48866ea40f188e40509145bf5e311390b5f7` |
| 4 | Preference DNA QA, correction, review, and approval | Complete — `f64aa2690f9b1865139b70061445f05fdce84615` |
| 5 | Target-video adaptation and Preference Application | Complete — `17b67a871b061df2c7a4327d00a5d37f22512e22` |
| 6 | Project Edit Session/Edit Brief/Marker Context/Marker Chat/Plan Hint/QA integration | Complete — `a09bc3da30de20a5bd80db8e0f89c55f74d3e27d` |
| 7 | Reload, replace/remove, privacy, adaptation, regression, and readiness closure | Complete — `42d34cdc04179c6808a4c3f23286885daf116006` |

Gate numbering after Gate 1 may be refined only by updating this document, the machine-readable status, and the verification log together. No refinement may weaken the definition of done.

The seven-gate backend-local goal is complete. This classification proves the canonical user journey and its local backend/browser/persistence boundaries; it does not override the production blockers below or authorize any remote/provider/worker/render/credit action.

## Permanent Safety Boundaries

- No reference repository mutation.
- No push, PR, remote merge, remote Supabase command, or remote migration without explicit approval.
- No raw provider payload persistence.
- No raw sampled-frame persistence by default.
- No provider, media, worker, render, export, or credit side effect hidden behind a fallback or mock label.
- No React import of backend-only runtime modules.
- No direct-copy instruction may enter an approved DNA version or target application.
- Approved plan and credit gates remain higher-order execution boundaries.
- Local passing tests never set `productionReady` to true.

## Verification Discipline

Before and after each gate, run the repository checks named in this goal, inspect the actual diff, run behavior tests rather than file-presence-only tests, commit the coherent gate, update status, and leave the worktree clean. The permanent log is `docs/edit-reference-gate-verification-log.md`.
