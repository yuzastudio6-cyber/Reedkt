# RP-DATA-03 Storage Artifact Manifest Review

Decision: `completed_static_migration_draft_ready_for_guarded_local_validation`

Storage draft status: `metadata_manifest_only`

## Artifact Manifest Boundary

`artifact_manifests` and `artifact_manifest_items` store private artifact metadata only:

- project/workspace scoped references through `project_id`;
- optional approved snapshot, job, QA, and export references;
- bucket names;
- object paths;
- file roles;
- byte counts;
- SHA-256 checksums;
- cleanup policy JSON;
- retention policy JSON.

They must not store:

- signed URLs;
- public URLs;
- provider secrets;
- service-role keys;
- private credential payloads;
- raw provider payloads;
- media bytes;
- generated files.

## Bucket Boundary

No bucket creation is added in RP-DATA-03. Existing bucket draft/review source remains the prior storage migration chain and RP-DATA-01/RP-DATA-02 readiness packet.

Future storage validation still must prove:

- all internal beta buckets remain private;
- source-media, generated-assets, processed-media, previews, exports, thumbnails, qa-artifacts, and worker-temp access is project/workspace scoped;
- signed URLs are temporary access artifacts only;
- no durable signed URL source-of-truth exists;
- cleanup and retention are explicit before internal beta.

## Internal Beta Status

Private artifact manifestation is now statically drafted, but internal beta remains `not_ready` until migration validation, backend service-role writes, worker queue, private storage access, render preview/export, QA, and cleanup gates pass.
