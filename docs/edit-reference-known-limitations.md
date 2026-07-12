# Edit Reference Known Limitations

Status: `feature_complete_except_external_blocker`

These limitations are explicit product/runtime boundaries. None may be presented as implemented or production-ready.

| ID | Limitation | Current safe behavior | Required future evidence | Release impact |
| --- | --- | --- | --- | --- |
| LIM-01 | Production Supabase persistence is disabled | backend-local repository; production seam fails closed | approved migration chain, reset, RLS, tenancy, transactions, staging/remote proof | Blocks production |
| LIM-02 | Cross-device/distributed durability is unverified | single-host private aggregate and browser reload only | distributed repository, concurrency, backup/recovery | Blocks production |
| LIM-03 | Reference-video semantic evidence is partial | private upload, FFprobe structure, and FFmpeg ephemeral frame planning are verified; semantic findings stay separately blocked/degraded | approved capability-specific semantic adapters, cost, privacy, and runtime proof | Limits beta study depth |
| LIM-04 | Speech/pacing media study is blocked | exact blocked reason and independent fallback findings | transcript/alignment/audio worker and privacy proof | Limits beta study depth |
| LIM-05 | Visual/story live adapters are not invoked by Edit Reference Gate 8 | deterministic fallback is labelled; separate live adapter readiness remains registered | approved per-study routing, cost, credentials, private samples, observability | Limits live intelligence |
| LIM-06 | Caption/color/audio/graphics study is manual/fallback | typed evidence and conservative rules only | capability-specific OCR/frame/audio/motion adapters | Limits study precision |
| LIM-07 | Chat `@reference` authority is backend-local | apply/compare/replace/remove and overrides use canonical application history | production application repository, RLS, tenancy, and cross-device proof | Blocks production, not local feature completion |
| LIM-08 | Initial New Edit target/session persistence is browser-mock | approved selector creates one canonical backend-local application and reload recovery reconstructs the minimum mock shell | production target-session repository and atomic application transaction | Blocks production, not local feature completion |
| LIM-09 | Automatic retention/deletion is not implemented | archive and immutable history are explicit; private path limits apply | retention scheduler, deletion/audit, legal policy, remote storage proof | Blocks production privacy claim |
| LIM-10 | Provider/media/worker/render/export/credit/billing execution is absent | all side-effect flags remain false | approved runtime workflows, costs, QA, recovery, billing policy | Blocks production |
| LIM-11 | Project Edit Session/Edit Brief target authority is mock/backend-local | exact receipt and bounded context are validated | production project/edit identity and remote repository | Blocks production |
| LIM-12 | Full browser proof is local Chromium | 60 deterministic local tests with five workers | staging browsers, network/failure matrix, accessibility/manual audits | Blocks release claim |
| LIM-13 | Production monitoring and operations are unverified | local logs/audit records only | traces, metrics, alerts, incident/recovery runbooks | Blocks production |
| LIM-14 | No PR or remote review exists yet | local commits and inventory only | owner-approved push and review | Blocks merge, not PR readiness |

## Non-Limitations

The following are complete for backend-local PR review:

- creation, Study Chat, evidence versions, findings, DNA, QA, approval;
- selector-based target adaptation and not-copy behavior;
- Project Edit Session/Edit Brief/Marker/Plan/QA handoff;
- reload, replacement, removal, immutable history, and invalidation;
- typed provenance, fallback truth, stale response protection, and browser accessibility regressions.

## Decision Effect

The limitations do not hide local wiring gaps in the supported selector/chat backend-local workflow. They keep `productionReady` false and prevent public/staging/production claims. Final decision is `feature_complete_except_external_blocker`.
