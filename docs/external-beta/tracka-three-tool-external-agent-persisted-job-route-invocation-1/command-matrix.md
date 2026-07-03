# Command Matrix

The confirmed local route-invocation proof command is:

```bash
REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION=true \
REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION=true \
npm run tracka:three-tool-external-agent-persisted-job-route-invocation-1
```

Allowed execution in this phase:

- Local guarded persisted job route-invocation service path.
- Delegation to the approved-snapshot generated-fixture runtime proof.
- Controlled generated-fixture checks already scoped by `TRACKA-THREE-TOOL-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1`.

Not allowed in this phase:

- Worker dispatch, worker lease claim, worker process start, or worker execution.
- Persistent queue write or remote service-role job mutation.
- Supabase mutation, SQL execution, secret payload access, signed URL creation, or public artifact creation.
- Private/user media processing, public URL inputs, final render/export, external beta expansion, paid production, or production unlock.
