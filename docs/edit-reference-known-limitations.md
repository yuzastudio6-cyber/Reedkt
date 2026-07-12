# Edit Reference Known Limitations

Status: `documented_nonblocking_for_pr_review`

These limitations are explicit product/runtime boundaries. None may be presented as implemented or production-ready.

| ID | Limitation | Current safe behavior | Required future evidence | Release impact |
| --- | --- | --- | --- | --- |
| LIM-01 | Production Supabase persistence is disabled | backend-local repository; production seam fails closed | approved migration chain, reset, RLS, tenancy, transactions, staging/remote proof | Blocks production |
| LIM-02 | Cross-device/distributed durability is unverified | single-host private aggregate and browser reload only | distributed repository, concurrency, backup/recovery | Blocks production |
| LIM-03 | Reference-video evidence is metadata only | UI says video not studied; no upload/fetch/open | approved private upload, sampling, analysis, deletion, provenance | Limits beta study depth |
| LIM-04 | Speech/pacing media study is blocked | exact blocked reason and independent fallback findings | transcript/alignment/audio worker and privacy proof | Limits beta study depth |
| LIM-05 | Visual/story live adapters are not invoked by Edit Reference Gate 8 | deterministic fallback is labelled; separate live adapter readiness remains registered | approved per-study routing, cost, credentials, private samples, observability | Limits live intelligence |
| LIM-06 | Caption/color/audio/graphics study is manual/fallback | typed evidence and conservative rules only | capability-specific OCR/frame/audio/motion adapters | Limits study precision |
| LIM-07 | Chat `@reference` tagging is not implemented | approved-reference selector in Project Edit Session is the supported lane | structured tag parsing, selection, persistence, browser proof | Nonblocking because selector lane is complete |
| LIM-08 | Initial New Edit form has no Edit Reference selector | connect after the target Edit Chat exists | initial-form integration and target context availability | Nonblocking for current workflow |
| LIM-09 | Automatic retention/deletion is not implemented | archive and immutable history are explicit; private path limits apply | retention scheduler, deletion/audit, legal policy, remote storage proof | Blocks production privacy claim |
| LIM-10 | Provider/media/worker/render/export/credit/billing execution is absent | all side-effect flags remain false | approved runtime workflows, costs, QA, recovery, billing policy | Blocks production |
| LIM-11 | Project Edit Session/Edit Brief target authority is mock/backend-local | exact receipt and bounded context are validated | production project/edit identity and remote repository | Blocks production |
| LIM-12 | Full browser proof is local Chromium | 58 deterministic local tests | staging browsers, network/failure matrix, accessibility/manual audits | Blocks release claim |
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

The limitations do not hide failures in the supported selector-based backend-local workflow. They keep `productionReady` false and prevent public/staging/production claims. Final decision remains `ready_for_pr_review`.
