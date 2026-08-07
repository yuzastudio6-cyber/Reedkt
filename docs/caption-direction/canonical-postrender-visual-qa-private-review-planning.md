# Canonical Caption post-render visual QA and private-review planning

Status: source-complete approval, execution-consumer, and private-review
admission coverage; real post-render evidence remains an execution-time
internal gate

This milestone removes a circular approval requirement. A post-render visual
review result cannot exist before the approved captioned render exists, so the
canonical plan now freezes the review work and its downstream private-review
dependencies before approval without claiming either result has completed.

`canonical-caption-postrender-visual-qa-work-binding-v2` requires one exact
chain:

1. the libass caption overlay and Remotion final-canvas binding;
2. the final private MP4;
3. deterministic FFprobe final QA for that exact MP4; and
4. one server-owned post-render Visual Intelligence reconciliation work item.

The active post-render coordinator is bound to
`visual-intelligence.inspect_edit` / `final_render_visual_qa` and
`canonical-caption-postrender-visual-intelligence-result-v1`. The earlier
Caption support lane remains separately bound to `caption_layout_qa`; it is
planning/layout evidence and is not relabelled as the final-render review.
Visual Intelligence must semantically cover every exact requested timeline
range with Gemini 3.1 Pro Preview evidence. It must not claim that the model
inspected every frame or exact pixel. Deterministic every-frame technical QA
remains a separate required authority. The coordinator accepts no caller
prompt, cannot use browser-local completion, and receives no provider
dispatch, timeline, asset, QA-approval, repair, billing, public-delivery, or
production authority.

Its resource placement is now
`caption_postrender_visual_qa_owner_reconciliation`: a tool-free internal job
that is runnable only as a consumer of an injected canonical shared-owner
result. Its frozen placement remains `privateExecutionReady: false` until the
execution runner receives the exact active-owner result port. The hosted Visual
Intelligence composition now mounts separate durable owner-result and Caption
create-only evidence stores, but that source mount does not prove an approved
provider invocation or a real owner result. The authenticated read side includes
a digest-bound provider-neutral result, Caption evidence record, create-only
repository contract, exact reread service,
and mounted signed-in route preserving not-found, pending, passed, repair,
human-review, and reconciliation-blocked states. The private job adapter can
reconcile those exact records into the approved Caption work item, but it never
dispatches Visual Intelligence. Without the qualified owner/read port, it
fails closed before execution. Planning and synthetic fixtures still cannot
masquerade as runtime evidence.

This slice deliberately does not hide the remaining orchestration gap. The
Caption work graph schedules reconciliation of an already admitted Visual
Intelligence result; it does not itself schedule or dispatch the provider. A
canonical approved workflow owner must still create the exact inspection
requirement/request package, bind estimate and reservation authority, invoke the
existing Visual Intelligence lifecycle, finalize the owner result, and only
then allow Caption reconciliation. Until that one-writer path is exercised with
the real private render, the internal end-to-end visual-review gate remains
open.

The bounded internal owner-to-resume harness now source-proves the latter half
of that sequence: existing Visual Intelligence inspection, exact report/spatial
reread, owner finalization, Caption reconciliation, create-only persistence,
and idempotent replay. That proof also corrected a durable-store identity bug
that made richer exact locators hash to a different object name than the
six-field output identity used at write time. The harness remains test-only and
its controlled cache replay is not model evidence. The real run still requires
the canonical private Visual Intelligence release and account-effective-rate
authorities plus an exact approved private render; none was fabricated here.

The retired Qwen wire remains readable only through the explicit historical
`canonical-caption-postrender-visual-qa-work-binding-v1` and work-input V1
decoders. New planning cannot emit or execute it, and no V1 record is cast or
relabelled as Visual Intelligence evidence.

`canonical-caption-private-review-dependency-binding-v1` then freezes the
three artifacts that the existing canonical private-review owner must consume:

- the final captioned MP4;
- its deterministic final-QA report; and
- the qualified complete-time visual-review lifecycle result.

It binds the existing private-review assembly, manifest, decision, and
revision contracts. It does not create an assembly, record an acceptance, or
promote Caption to the independent QA owner. Every required artifact still
needs create-only persistence, independent artifact QA, and reconciliation
before the canonical private-review service may assemble it.

The frozen `canonical-caption-private-review-evidence-projection-v1` remains
the compatibility lane for historical Qwen records. Active Visual Intelligence
results use the additive
`canonical-caption-private-review-evidence-projection-v2`. V2 carries the exact
`canonical-caption-postrender-visual-intelligence-result-v1` identity and
digest; it never casts or relabels that result as the retired Qwen evidence
record. The authenticated service rereads the immutable execution package and
approved snapshot, then requires the same owner, workspace, project, edit,
snapshot, output, confirmed frame, rendered artifact, deterministic-QA
artifact, visual-review work item, review manifest, and review decision. Its
digest is recomputed; browser state cannot complete it. Terminal qualification
and qualification-run assembly project the exact V1-or-V2 visual evidence ref
instead of manufacturing one fixed legacy version.

The existing private-edit preparation coordinator consults that projection
before it assembles a Caption review. A visual `repair_required` or
`blocked_evidence_reconciliation` result now stops review readiness. A `passed`
or `needs_human_review` result may enter the existing canonical private-review
owner. Only `passed` plus an exact persisted
`accept_private_internal_review` decision is eligible for terminal Caption
qualification. Human acceptance after an AI uncertainty remains truthfully
recorded but does not relabel the AI result as passed. Revision decisions require
a new approved snapshot and never mutate the prior one.

For a selected Caption plan with exact render, deterministic QA, scheduled
visual review, and private-review dependencies, the Caption-specific planning
coverage blockers are now closed. Approval can therefore happen in the correct
order. Terminal Caption qualification remains blocked until the real shared
owner produces and rereads the Visual Intelligence result, independent private review
accepts the exact output, and the terminal projection consumes those canonical
records. The terminal projection builder now requires one accepted evidence
projection per confirmed output; a truth-shaped terminal input by itself is no
longer sufficient.

No provider or media runtime was executed by this source milestone. The
authenticated route smoke uses only synthetic lifecycle data and controlled
in-memory create-only repositories. The focused active-owner proof covers the
exact Gemini profile/model, immutable owner reread, crossed-work refusal,
create-only replay/conflict, authenticated reload, coordinator consumption,
private-review admission, semantic overclaim refusal, and closed authority.
