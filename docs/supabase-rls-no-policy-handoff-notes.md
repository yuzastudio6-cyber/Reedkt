# Supabase RLS No-Policy Handoff Notes

Prompt 26D is owned by SUPABASE_RLS_STORAGE_DATABASE. It creates classification and policy contracts only. It does not implement AI Tools, map/geospatial, sound/music, worker runtime, provider execution, final render/export validation, staging approval, or production/beta unlock.

## Workstream Handoffs

| Workstream | Affected tables | Handoff note | Prompt 26D decision |
| --- | --- | --- | --- |
| SUPABASE_RLS_STORAGE_DATABASE | All six tables | Owns final RLS policy implementation, rollback design, and local/staging SQL test contracts. | Keep raw tables denied to clients until reviewed. |
| WORKER_RUNTIME_JOBS | `activation_artifacts`, `activation_qa_gates`, `activation_runs` | Activation records may affect future runtime gates and worker readiness. | Treat as backend/service-role-only by default. |
| AI_TOOLS_CREATIVE_GRAPHICS | `tool_capabilities` | Tool capability rows may affect tool readiness/catalog visibility. | No raw client access; future static catalog route requires non-secret field review. |
| OBSERVABILITY_AUDIT_COST | `activation_qa_gates`, `readiness_snapshots` | Readiness and gate records may become operational status or audit views. | Backend-only raw access; future redacted status route requires separate contract. |
| COMPLIANCE_SECURITY | `feature_gates`, `tool_capabilities` | Feature/tool visibility could imply runtime approval, entitlement, or compliance state. | No raw client access until safe visibility is reviewed. |
| FRONTEND_PRODUCT_UX | `feature_gates`, `tool_capabilities`, readiness summaries | Frontend must not assume raw table visibility. | Use future backend summary/catalog routes only after policy contract is approved. |
| PROVIDER_GATEWAY_MODELS | `tool_capabilities`, readiness summaries | Provider/tool capability wording must not imply provider execution is enabled. | Keep raw rows backend-only/no-client. |
| TRACK_A_RENDER_EXPORT | readiness summaries | Render/export readiness may depend on future snapshots or activation gates. | No raw table dependency in frontend until API boundary exists. |
| SOUND_MUSIC_AUDIO | readiness summaries and tool capability visibility | Audio/tool readiness summaries may need future catalog data. | No direct raw table access. |
| MAP_GEOSPATIAL | readiness summaries and tool capability visibility | Map/geospatial tool status may need future catalog data. | No direct raw table access. |

## Duplicate Work To Avoid

- Do not create broad tool/runtime policies outside this RLS contract.
- Do not implement AI Tools, map stack, sound stack, worker execution, provider execution, or render/export behavior.
- Do not mutate Supabase.
- Do not add active migrations.

## Handoff Output

- Table classification contract: `docs/supabase-rls-no-policy-table-classification.md`.
- Access model contract: `docs/supabase-rls-no-policy-access-model-contract.md`.
- Policy intent contract: `docs/supabase-rls-no-policy-table-policy-contract.md`.
- Test contract: `docs/supabase-rls-no-policy-test-contract.md`.
- Migration readiness checklist: `docs/supabase-rls-no-policy-migration-readiness-checklist.md`.

## Next Handoff

Prompt 26E should convert this classification into a draft migration plan only. Prompt 23A and Prompt 24D remain separately required before any staging execution.
## Prompt 26E-1 handoff

Prompt 26E-1 affects these workstreams:

- `SUPABASE_RLS_STORAGE_DATABASE`: owns the local candidate and catalog-only validation path.
- `WORKER_RUNTIME_JOBS`: should treat activation/readiness raw tables as browser-denied until future backend summaries are approved.
- `AI_TOOLS_CREATIVE_GRAPHICS`: should treat `tool_capabilities` raw rows as no-client-access until a safe static catalog surface is reviewed.
- `OBSERVABILITY_AUDIT_COST`: should treat readiness evidence as backend-only until redaction and immutability are reviewed.
- `COMPLIANCE_SECURITY`: should review service-role handling, no-secret docs, and no public/authenticated writes before staging.
- `PROVIDER_GATEWAY`, `RENDER_EXPORT`, `SOUND_MUSIC`, and `MAP_GEOSPATIAL`: no direct execution changes; use this candidate only as access-control context.

