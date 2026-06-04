# Staging Synthetic Fixture Plan

Prompt 21 defines fixture requirements only. No staging fixture is created in this milestone.

## Fixture Principles

- synthetic fixtures only;
- cleanupable rows only;
- deterministic IDs and names;
- workspace/project isolation for every domain;
- no private media, signed URLs, provider keys, service-role keys, Stripe values, raw PII, production data, or real provider request IDs;
- no worker/provider/render/tool/storage/credit execution.

## Domain Fixture Requirements

| Domain | Fixture requirement | Cleanup requirement |
| --- | --- | --- |
| auth/profile/workspace/project | Synthetic auth/profile/workspace/project users, owner/member/non-member cases, and non-member denial assertions. | Remove or rollback all synthetic auth/profile/workspace/project rows. |
| storage records without real media | Storage object record rows with fake bucket/path metadata only; no object upload, download, transfer, or signed URL. | Delete synthetic records and verify no storage object transfer occurred. |
| approved snapshots | Approved snapshot-like records tied to synthetic projects only. | Delete synthetic records in dependency order. |
| credits | Synthetic estimates/reservations only, no wallet mutation and no Stripe. | Delete synthetic records and verify no production credit mutation. |
| jobs/workers | Synthetic job/readiness rows only; no claims, leases, heartbeats, or worker execution. | Delete rows and verify no job execution side effects. |
| media readiness | Metadata-only fixtures; no media processing, transcript, OCR, VLM, audio, or timing worker execution. | Delete metadata fixtures. |
| render/export | Readiness-only fixtures; no render job, final export, storage write, or signed delivery URL. | Delete readiness rows. |
| QA/revision | QA/revision readiness fixtures only; no fallback, repair, revision, or QA worker execution. | Delete readiness rows. |
| tool/provider/compliance/observability | Static readiness or blocker fixtures only; no tool execution, provider call, legal approval, audit persistence, external telemetry, or cost enforcement. | Delete blocker/readiness fixtures and preserve redacted evidence only. |

## Isolation Cases

Every approved staging fixture set must include:

- an owner user;
- a normal workspace member;
- a project editor if the selected test requires editor behavior;
- a non-member user;
- one in-scope workspace/project pair;
- one out-of-scope workspace/project pair;
- explicit non-member denial checks.

## Cleanup Gate

Cleanup must be approved before staging validation starts. A future staging prompt must record:

- cleanup owner;
- cleanup method;
- verification query or reviewer method in redacted form;
- evidence retention path;
- blocker handling if cleanup does not complete.

