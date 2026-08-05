# Canonical Caption post-render visual QA and private-review planning

Status: source-complete approval, execution-consumer, and private-review
admission coverage; real post-render evidence remains an execution-time
internal gate

This milestone removes a circular approval requirement. A post-render visual
review result cannot exist before the approved captioned render exists, so the
canonical plan now freezes the review work and its downstream private-review
dependencies before approval without claiming either result has completed.

`canonical-caption-postrender-visual-qa-work-binding-v1` requires one exact
chain:

1. the libass caption overlay and Remotion final-canvas binding;
2. the final private MP4;
3. deterministic FFprobe final QA for that exact MP4; and
4. one server-owned post-render visual-QA coordinator work item.

The coordinator is bound to the existing
`canonical-postrender-visual-qa-work-request-v1` and
`canonical-postrender-visual-qa-shared-lifecycle-result-v1` contracts and to
the Caption authenticated reread contracts. It requests complete-time visual
coverage, accepts no caller prompt, cannot use browser-local completion, and
does not receive provider dispatch, asset mutation, QA approval, billing,
public-delivery, or production authority during planning. Actual sample frames
may be created only after the exact rendered artifact and deterministic QA are
persisted and reread.

Its resource placement is now
`caption_postrender_visual_qa_owner_reconciliation`: a tool-free internal job
that is runnable only as a consumer of an injected canonical shared-owner
result. Its frozen placement remains `privateExecutionReady: false` until that
port is mounted by the backend owner. The authenticated read side includes a digest-bound normalized result,
Caption evidence record, create-only repository contract, exact reread service,
and mounted signed-in route preserving not-found, pending, passed, repair,
human-review, and reconciliation-blocked states. The private job adapter can
reconcile those exact records into the approved Caption work item, but it never
dispatches Qwen. Without the qualified shared lifecycle owner/read port, it
fails closed before execution. Planning and synthetic fixtures still cannot
masquerade as runtime evidence.

V1 can mark complete-time visual review as passed only when exact full-motion
sample evidence covers every render frame. Sampling every segment is not
enough. Edits longer than the 4,096-frame V1 ceiling require a future
full-review-video contract and remain blocked in this lane.

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

`canonical-caption-private-review-evidence-projection-v1` now joins those
planned dependencies to the actual persisted Caption visual-evidence envelope
and the existing canonical review assembly/decision records. The authenticated
service rereads the immutable execution package and approved snapshot, then
requires the same owner, workspace, project, edit, snapshot, output, confirmed
frame, rendered artifact, deterministic-QA artifact, visual-QA work item, review
manifest, and review decision. Its digest is recomputed; browser state cannot
complete it.

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
owner produces and rereads the Qwen lifecycle result, independent private review
accepts the exact output, and the terminal projection consumes those canonical
records. The terminal projection builder now requires one accepted evidence
projection per confirmed output; a truth-shaped terminal input by itself is no
longer sufficient.

No provider or media runtime was executed by this source milestone. The
authenticated route smoke uses only synthetic lifecycle data and a controlled
in-memory create-only repository. Its focused proof covers 24 authenticated
visual/review assertions, and the terminal proof covers 33 contract assertions.
