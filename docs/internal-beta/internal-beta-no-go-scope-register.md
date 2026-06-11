# CROSS-BETA-0 No-Go Scope Register

Prompt: `CROSS-BETA-0`

CROSS-BETA-0 is a no-execution gate packet. The following scopes remain no-go.

| Scope | State |
| --- | --- |
| Runtime execution | `blocked` |
| AI tool execution | `blocked` |
| Worker execution | `blocked` |
| Provider/model calls | `blocked` |
| Final render/export | `blocked` |
| Media processing | `blocked` |
| Browser capture | `blocked` |
| Docker/Cloud Run | `blocked` |
| Supabase mutation | `blocked` |
| SQL execution | `blocked` |
| Google Cloud API calls | `blocked` |
| Secret Manager API calls | `blocked` |
| Uploads/storage transfer | `blocked` |
| Signed URL creation | `blocked` |
| Public artifact creation | `blocked` |
| Dependency mutation | `blocked` |
| Raw prompt execution | `blocked` |
| Internal beta unlock | `blocked` |
| External beta unlock | `blocked` |
| Production unlock | `blocked` |
| Broad service-role handler | `blocked` |

## Approval Booleans

```json
{
  "fullInternalBetaApprovedNow": false,
  "externalBetaApproved": false,
  "productionApproved": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "rawPromptExecutionApproved": false,
  "supabaseMutationApproved": false,
  "workerExecutionApproved": false,
  "providerModelCallsApproved": false,
  "finalRenderExportApproved": false,
  "dependencyMutationApproved": false,
  "uploadStorageTransferApproved": false
}
```

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

