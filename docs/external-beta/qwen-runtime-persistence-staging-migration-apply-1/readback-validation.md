# QWEN Runtime Persistence Staging Readback Validation

SQL test file: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`

Readback status: `passed`

Readback counts:

- Required runtime baseline tables: `13`
- `media_analysis` job type: `1`
- QWEN constraints: `6`
- `tool_runtime_checks_tool_name_check` includes `qwen_vl`: `1`
- QWEN-specific indexes: `5`
- Existing active claim/lease indexes: `2`
- storage object signed URL columns: `0`
- signed URL event URL value columns: `0`
- runtime raw prompt columns: `0`

The validation proves the staging schema now has the QWEN persistence guards for approved snapshots, credit reservation refs, idempotency refs, private storage refs, sanitized runtime payloads, L4 metadata, QWEN readiness metadata, and no raw prompt / URL / token / secret columns.
