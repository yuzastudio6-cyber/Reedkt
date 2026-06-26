# Runtime Contract

Runtime status: `local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime`

The local chain creates deterministic metadata for one narrow internal beta path:

1. approved snapshot metadata
2. approved credit reservation metadata
3. local job batch/job/dependency/event metadata
4. private artifact manifest/checksum/QA-link/cleanup metadata
5. private artifact access policy metadata
6. Remotion private preview/export request metadata
7. QA cleanup observability and rollback-gate metadata

This is a backend-local chain smoke only. It does not register or execute HTTP routes, service-role routes, Supabase writes, SQL, storage access, signed URL creation, public artifact creation, worker dispatch, worker execution, provider/model calls, Remotion execution, FFmpeg/FFprobe execution, media processing, or beta unlock.

The chain uses a local approved-snapshot reservation bootstrap because the existing local approved snapshot runtime requires a credit reservation id while the local credit reservation runtime also references an approved snapshot id. The final downstream records use the generated approved snapshot id and generated credit reservation id consistently from the credit reservation step onward. A future transactional service-role runtime must replace this bootstrap with an atomic approved snapshot plus reservation transaction before internal beta can unlock.
