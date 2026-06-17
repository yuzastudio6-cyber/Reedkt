# AI Graphics Metadata Local Fixture Plan

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

## Source Evidence

- PR #457: Tool Route AI graphics metadata integration QA, open draft, mergeable clean at `add9d8bb74afd697e281726d7434c1a200b58b48`; decision `tool_route_ai_graphics_metadata_integration_qa_passed_with_warnings`.
- PR #456: Tool Route AI graphics metadata integration approval, open draft, mergeable clean at `36efdcd678fc6bd69fe7569268af9bb4a81a6aa8`.
- PR #454 and PR #451: AI graphics route-manifest QA and approval.
- PR #449, PR #445, PR #437, and PR #428: AI graphics Batch 4, Batch 3, Batch 2, and Batch 1 QA evidence.
- PR #404 and PR #398: merged Tool Route context for local fixture planning and metadata dry-run review.
- PR #164: Track B route-manifest policy context only.

## Plan

Tool Route may plan metadata-only local fixture templates for the 13 accepted AI graphics tools. The templates are contracts for a later approval lane; they are not executable route, tool, worker, provider, browser, WebGL, canvas, render, rasterization, storage, beta, or production payloads.

Every future fixture must include placeholder references for an approved plan snapshot, scoped tool-call manifest, owner capability id, private artifact manifest, checksum, QA evidence, observability evidence, cleanup evidence, and worker handoff expectation. Every future fixture must fail closed if the requested capability is outside the accepted metadata/manifest scope.

## Supabase Classification

- update required: `no write`
- update status: `docs_only`
- environment touched: `none`
- SQL executed: `none`
- migration deployed: `no`
- milestone sync: `not_performed`

No npm install, new dependency addition, package-lock mutation, new import smoke execution, new synthetic fixture execution, local fixture execution, rasterization, Remotion render/export, browser runtime, WebGL runtime, canvas runtime, actual tool execution, route execution, worker execution, provider/model calls, Supabase mutation, SQL, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
