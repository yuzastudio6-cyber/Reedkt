# WORKER-1 Allowed And Blocked Scope

Status: `ready_with_warnings_for_worker_1`.

## Allowed For WORKER-1

WORKER-1 may draft:

- worker dry-run input contract;
- approved plan snapshot validation contract;
- idempotency and claim/lease hardening plan;
- service-role boundary test plan;
- artifact manifest/checksum validation plan;
- tool readiness dry-run plan;
- route dry-run safety packet;
- observability and QA evidence contract;
- cleanup/rollback plan.

## Blocked Until Later Prompts

WORKER-1 must not approve or perform:

- worker execution;
- tool execution;
- route execution;
- provider runtime;
- raw prompt execution;
- media processing;
- browser capture;
- Docker/Cloud Run execution;
- Supabase mutation;
- SQL execution;
- storage transfer;
- signed URL creation;
- public artifact creation;
- beta unlock;
- production unlock.

## Required False Booleans

```json
{
  "workerExecutionApproved": false,
  "toolExecutionApproved": false,
  "routeExecutionApproved": false,
  "providerRuntimeApproved": false,
  "supabaseMutationApproved": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "rawPromptExecutionApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false
}
```
