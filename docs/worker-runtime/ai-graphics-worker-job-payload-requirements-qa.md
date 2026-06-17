# AI Graphics Worker Job Payload Requirements QA

Decision: `worker_ai_graphics_metadata_handoff_qa_passed_with_warnings`

QA result: `accepted_with_warnings`

The PR #478 job payload requirements are acceptable for future shape approval because they require approved snapshots, scoped manifests, private artifact refs, checksum/provenance refs, owner ids, and capability ids. They do not approve a job claim or live Worker Runtime execution.

Future payload shape approval must keep `<WORKER_JOB_PAYLOAD_FIXTURE>`, `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`, `<SCOPED_TOOL_CALL_MANIFEST_REF>`, `<PRIVATE_ARTIFACT_MANIFEST_REF>`, and `<CHECKSUM_REF>` as placeholder/source-of-truth references until a later explicit execution gate exists.
