# Architecture Boundary Matrix

This matrix freezes which layer may own or request each production capability. It is a docs-only contract and does not enable production execution.

Values: `owns`, `can request`, `can read`, `backend-only`, `worker-only`, `blocked`, `future`, `never`.

| Capability | Frontend | Backend API | Supabase | Worker | Provider gateway | Storage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User chat | owns | can request | owns | never | never | never | Frontend collects; Supabase stores records through allowed paths. |
| Upload UI | owns | can request | can read | never | never | never | Frontend selects files and starts upload intent flow. |
| Upload intent | can request | owns | owns | never | never | can read | Backend validates project/workspace before creating intent. |
| Signed upload URL | can request | owns | can read | never | never | backend-only | Signed URLs are temporary events, not canonical storage truth. |
| Storage object record | can read | owns | owns | can read | never | owns | Canonical record stores bucket/path only. |
| Source clip order | can request | owns | owns | can read | never | never | Source order must remain auditable. |
| Media probe | can read | can request | owns | worker-only | never | can read | Worker probes canonical storage objects after job claim. |
| Transcript alignment | can read | can request | owns | worker-only | never | can read | Future worker output; no real alignment in frontend. |
| Visual observations | can read | can request | owns | worker-only | never | can read | Future worker output for planning. |
| Intent analysis | can request | owns | owns | future | never | never | Backend turns chat into structured records. |
| Edit plan | can request | owns | owns | can read | never | never | Plan remains structured and approval-aware. |
| Credit estimate | can read | owns | owns | can read | never | never | Backend calculates/persists; frontend displays. |
| Credit approval | can request | owns | owns | never | never | never | Frontend submits approval; backend validates and records. |
| Credit reservation | can read | backend-only | owns | can read | never | never | Transactional backend mutation only. |
| Approved snapshot | can read | backend-only | owns | can read | can read | never | Backend-only creation; immutable execution contract. |
| Job creation | can request | backend-only | owns | can read | never | never | Requires snapshot, idempotency, authorization, and gates. |
| Worker claim | can read | backend-only | owns | worker-only | never | never | Worker claims through backend-safe path. |
| Worker heartbeat | can read | backend-only | owns | worker-only | never | never | Worker heartbeat is sanitized status only. |
| Provider request | can read | backend-only | owns | can request | owns | can read | Gateway enforces model/tier/credit/storage gates. |
| Tool call intent | can request | owns | owns | can read | never | never | Intent is not execution permission. |
| Tool execution | never | can request | can read | worker-only | never | can read | Future backend/worker only after readiness and compliance gates. |
| Remotion render | never | can request | owns | worker-only | never | can read | Remotion is future compositor worker path. |
| FFmpeg export | never | can request | owns | worker-only | never | can read | Future worker postprocess/export only. |
| QA report | can read | can request | owns | worker-only | never | can read | Required QA can block preview/export. |
| Preview review | owns | owns | owns | can read | never | can read | Frontend submits review; backend persists structured record. |
| Revision request | can request | owns | owns | can read | never | never | Material revisions require new approval/snapshot. |
| Final export | can request | backend-only | owns | worker-only | never | owns | Requires approved snapshot, ready assets, QA pass, and export gates. |
| Audit event | can read | owns | owns | worker-only | future | never | Append-only sanitized audit/event records. |
| Admin override | never | backend-only | owns | never | never | never | Future audited admin-only path; not available in frontend. |
