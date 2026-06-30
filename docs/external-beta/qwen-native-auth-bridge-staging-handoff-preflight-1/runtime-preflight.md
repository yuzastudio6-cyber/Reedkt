# Runtime Preflight

Run ID: `2026-06-30T08-14-05-042Z-ced056a2`

Output directory: `/tmp/reeditpro-rp-external-beta-qwen-native-auth-bridge-staging-handoff-preflight-1/2026-06-30T08-14-05-042Z-ced056a2`

Sanitized report:

- `qwen-native-auth-bridge-staging-handoff-preflight-report.json`
- bytes: `1986`
- SHA-256: `17ef496b7f5e67de6fed059e4b59675fc4741687795c8103bcca1139f2981c1e`

Sanitized manifest:

- `qwen-native-auth-bridge-staging-handoff-preflight-manifest.json`
- bytes: `689`
- SHA-256: `dbcb2055874587093d11499bd22191f6ec64d315ce0fa41536c864b6888e094e`

Result:

- Supabase tester sign-in HTTP status: `200`
- Supabase user JWT observed in memory: `true`
- Token printed: `false`
- Token persisted in repo: `false`
- Route HTTP status: `202`
- Route decision: `completed_qwen2_5_vl_product_route_backend_job_handoff_source_contract`
- Route status: `ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture`
- Backend handoff prepared: `true`
- Provider runtime executed now: `false`
- Provider/model call allowed now: `false`
- Worker dispatch allowed now: `false`

Safety result from route response:

- Provider call: `false`
- Model call: `false`
- Worker dispatch: `false`
- Cloud Run job execution: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`
