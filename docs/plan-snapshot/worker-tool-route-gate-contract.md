# Worker Tool Route Gate Contract

Status: `ready_for_owner_review`.

This gate contract records the future prerequisites for worker, tool, route, and provider execution. It does not approve execution now.

## Gate Defaults

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

## Future Gate Requirements

A later prompt must provide:

- owner approval for the exact execution class;
- approved snapshot ID or dry-run fixture snapshot ID;
- source-of-truth refs using `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`;
- private artifact manifest refs and checksum refs;
- QA evidence plan;
- observability and cost guardrails;
- cleanup and rollback owner;
- worker/tool/provider/route scope declaration;
- no raw prompt execution path.

## Fail-Closed Conditions

Future gates must fail closed on:

- missing approved snapshot;
- missing artifact manifest or checksum;
- unresolved workstream blocker;
- route/tool/provider not explicitly approved;
- public artifact request;
- signed URL source-of-truth request;
- Supabase or SQL mutation without a dedicated approved prompt;
- production or beta unlock claim.

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.
