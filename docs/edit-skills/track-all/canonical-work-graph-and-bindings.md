# Track All canonical work graph and runtime bindings

## Public and plugin graphs

The generic approved graph contains one public dispatch item per supported
manifest job. Each public item binds the exact job type, operation ID, worker
class, input/output artifact contract, phase, qualification, approval, range,
attempt, credit, and QA authority.

The approved graph also carries an exact `pluginWorkGraphRef` for the persisted
`track_all_work_graph_v1` artifact. The future orchestra can read that public
artifact without importing Track All private code. It contains strict,
content-addressed atomic steps and dependencies for assignment/target checks,
source inspection, shot and camera analysis, initialization, chunking,
Object Multiplex budgeting, SAM, mask normalization, stitching, anonymous
identity, graph construction, output QA, treatments, private previews,
integration QA, handoffs, and result projection.

Every atomic item binds the assignment, plan, manifest, source checksum,
approval hash, exact range, dependencies, fixed operation/worker, strict
artifacts, QA lineage, cost slice, attempt ceiling, private-output rule, and
no-retry/no-alternate-model policy. Dependencies must refer to earlier items;
the sum of item credit ceilings cannot exceed the approved maximum.

Non-executable plans contain only assignment/target validation, no-action, and
result projection. They contain no SAM, GPU, or media-creation work.

## Runtime binding classes

All 13 manifest-supported jobs have exactly one registered
`internal_qualification_adapter`. The adapters validate their exact binding
and emit fixture evidence with zero model/provider requests, public artifacts,
or production mutations. They are not production workers and do not claim real
SAM inference.

`createTrackAllCanonicalPrivateRuntimeBindings` is dependency-injected and
requires an explicit executor. Its bindings require durable private artifact
authority and the job's exact qualification. No canonical-private binding is
registered by the normal internal fixture runtime.

No Track All `production_worker_adapter` exists. Production bindings remain
absent until production qualification, a durable private store, exact model
and tool authorities, monitoring, and release approval exist.

Run:

```sh
npm run test:track-all-runtime-bindings
```

The test validates manifest coverage, static adversarial cases, all 13 fixture
dispatch receipts, adapter-class separation, missing production bindings, and
no-action, selected, privacy, planar, focus, and reframe atomic graphs.
