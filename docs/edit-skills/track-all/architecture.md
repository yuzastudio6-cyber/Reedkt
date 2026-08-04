# Track All architecture

## Public boundary

Track All is `track_all@1.0.0` on `track_all.skill_contract.v1`. The future
head orchestra resolves it through the generic edit-skill plugin registry and
uses only `planAssignment`, `compileApprovedWorkGraph`,
`acceptDependencyArtifact`, `validateWorkItemResult`, and
`finalizeSkillResult`. This implementation does not add the head orchestra.

The public boundary carries model-neutral manifests, assignments, dependency
requests, work items, artifact references, QA lineage, and receipts. It does
not expose prompt builders, SAM sessions, checkpoints, GPU choices, commands,
paths, URLs, OpenCV internals, FFmpeg arguments, or Remotion internals.

## Private planning pipeline

The current pure planning pipeline is:

1. Validate the generic and Track All assignments plus all exact input roles.
2. Interpret the bounded target and decide no-action, dependency, review,
   blocked, deterministic, or SAM-backed work.
3. Derive shot-aware chunks from the qualified frame ceiling, shot boundaries,
   privacy risk, motion, occlusion, target size, and object count.
4. Select an initialization frame from visibility, target size, sharpness,
   blur, occlusion, ambiguity, edge truncation, stability, and optional text
   readability.
5. Allocate explicit 16-object multiplex buckets and exact chunk/session
   counts.
6. Compile a bounded prompt strategy containing no raw chat or caller-selected
   model/path authority.
7. Compile one-writer, mandatory-close, no-unknown-retry session authority.
8. Estimate all selected deterministic, GPU, overlap, treatment, preview, QA,
   and repair work without customer markup.
9. Apply time and credit ceilings before freezing the plan; a ceiling fallback
   removes chunks, sessions, initialization, propagation, visible work, time,
   and cost.
10. Derive 24 hashed planning QA findings from a strict evidence input and
    content-address the aggregate report.

The private modules are not exported from the Track All package index and are
not orchestra-callable skills.

## Qualification boundary

Passing planning smokes establishes tested planning behavior, not a frozen
qualification receipt. The manifest remains `implementation_pending` until the
evidence issuer introduced by the qualification milestone binds the exact
commit, source tree, manifest, shared authorities, command results, and fixture
results. SAM inference remains separately blocked on real private checkpoint,
image, GPU, quality, cost, and privacy evidence.
