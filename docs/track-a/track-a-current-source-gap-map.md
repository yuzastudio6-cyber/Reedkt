# Track A Current-Source Gap Map

Status: `gap_map_docs_only`

## Gaps

| Gap ID | Area | Current Gap | Impact | Next Step |
| --- | --- | --- | --- | --- |
| `tracka-gap-safe-artifact-refs` | artifact references | safe private refs are not recorded in current source for most historical visual/video items | visual review cannot access artifacts from this packet | TRACKA-VISUAL-REVIEW-1 should request explicit safe refs if owner wants artifact review |
| `tracka-gap-old-bases` | old PR stack | historical PRs remain on old stacked bases | direct merge remains risky without retarget/closure decision | TRACKA-OLDSTACK-CLOSURE-1 must use owner-approved exact PR list |
| `tracka-gap-route-contract-tests` | route planning | TOOL-ROUTE-3 contract tests are not yet implemented | no tool/route execution approval | wait for TOOL-ROUTE-3 |
| `tracka-gap-worker-runtime` | worker runtime | no approved worker runtime for visual/video Track A execution | no render/export, mask, enhancement, color, caption, timeline, or export runtime | future runtime milestone after route tests |
| `tracka-gap-private-e2e` | private E2E | #82 evidence is historical metadata only in current source | full private E2E cannot be considered current-source complete | future revalidation plan |
| `tracka-gap-visual-review` | human review | real-sample and private-E2E outputs are not reviewed in current source | old PR closure targets remain uncertain | TRACKA-VISUAL-REVIEW-1 |
| `tracka-gap-supabase-sync` | Supabase | milestone sync layer is absent on this branch | no registry write/readback | keep docs-only classification |
| `tracka-gap-production-readiness` | production | runtime, QA, observability, rollback, billing, artifact retention, and security gates are missing | production remains blocked | future production readiness sequence |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
