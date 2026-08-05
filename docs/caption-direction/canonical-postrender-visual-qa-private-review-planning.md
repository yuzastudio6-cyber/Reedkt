# Canonical Caption post-render visual QA and private-review planning

Status: source-complete approval coverage; real post-render evidence remains an
execution-time internal gate

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

Its resource placement remains deliberately
`caption_postrender_visual_qa_lifecycle_pending`, not privately executable.
The authenticated read side is now source-complete: a canonical normalized
decision/evidence record, create-only repository contract, exact reread
service, and mounted signed-in route preserve not-found, pending, passed,
repair, human-review, and reconciliation-blocked states. That read side does
not make the coordinator runnable. The job becomes runnable only after the
canonical provider lifecycle is mounted in the one shared job adapter;
planning and synthetic route fixtures must not masquerade as runtime evidence.

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

For a selected Caption plan with exact render, deterministic QA, scheduled
visual review, and private-review dependencies, the Caption-specific planning
coverage blockers are now closed. Approval can therefore happen in the correct
order. Terminal Caption qualification remains blocked until the real worker
run produces and rereads the Qwen lifecycle result, independent private review
accepts the exact output, and the terminal projection consumes those canonical
records.

No provider or media runtime was executed by this source milestone. The
authenticated route smoke uses only synthetic lifecycle data and a controlled
in-memory create-only repository.
