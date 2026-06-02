# Staging Smoke Fixture Contract

Fixtures for Prompt 18 and future staging smoke tests must be synthetic, resettable, scoped, and safe. Prompt 18 creates the contract only; it does not create staging records.

## Required Fixture Classes

| Fixture | Purpose | Required fields | Safety rules |
| --- | --- | --- | --- |
| Fake user | Auth smoke owner. | Synthetic user ID, email-like label, profile ID. | No real user PII. |
| Workspace | Workspace scope. | Workspace ID, owner/member IDs. | Synthetic names only. |
| Project | Project scope. | Project ID, workspace ID, status. | No customer project data. |
| Source media metadata | Media readiness input. | Media asset ID, content type, duration, dimensions. | Metadata only; no private media file. |
| Storage object | Private artifact reference. | Bucket label, object path, checksum placeholder. | No signed URL or real object transfer. |
| Upload intent | Storage boundary input. | Intent ID, purpose, expiry placeholder. | No real signed upload. |
| Approved snapshot | Execution contract reference. | Snapshot ID, version, hash placeholder. | Synthetic plan only. |
| Credit estimate | Credit gate reference. | Estimate ID, amount, status. | No real money or wallet state. |
| Credit reservation | Execution gate reference. | Reservation ID, amount, status. | No reserve/spend/refund mutation. |
| Job | Worker readiness reference. | Job ID, job type, approved snapshot ID. | No queue execution. |
| Worker claim | Worker contract reference. | Claim ID, lease ID, status. | No real claim token. |
| Render | Render readiness reference. | Render ID, status, snapshot ID. | No render artifact. |
| QA | QA readiness reference. | QA report ID, blocker status. | No media inspection. |
| Tool-call | Tool readiness reference. | Tool intent ID, tool ID, blocked state. | No tool runtime. |
| Provider gateway | Provider readiness reference. | Provider key, model key, route purpose. | No provider request ID unless sanitized future staging data. |
| Compliance | Compliance readiness reference. | Subject type/key, review status. | AI output is not legal approval. |
| Observability | Runtime safety reference. | Request ID, route ID, audit preview ID. | No external telemetry or persistent audit row. |

## Universal Fixture Rules

- Fixtures must be synthetic or local-only.
- Fixtures must be resettable and cleanup-ready.
- Fixtures must not include private media, raw user PII, raw transcript excerpts, signed URLs, service-role keys, provider secrets, Stripe secrets, private env values, or real credit/money values.
- Fixtures must not store raw webhook payloads or real provider request IDs unless a future staging validation prompt provides sanitized data rules.
- Fixture paths must include workspace/project scope where storage path shape is represented.
- Fixture records must be impossible to confuse with production customer data.

## Cleanup Expectations

Future staging smoke tests must include a cleanup plan for every fixture class. Cleanup evidence should list fixture IDs, workspace/project scope, records removed or retained for audit, and any blocker that prevented cleanup.
