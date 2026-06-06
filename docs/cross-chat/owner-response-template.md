# Owner Response Template

Owner responses must use this JSON shape or an equivalent structured follow-up
prompt:

```json
{
  "responseId": "owner-response-<workstream>-<YYYYMMDD>",
  "workstream": "<workstream id>",
  "ownerChat": "<owning chat/workstream>",
  "sourcePhase": "52G",
  "sourceRunId": "phase52g-20260606T033152",
  "handoffPacketRef": "gs://...",
  "responseStatus": "pending",
  "ownerDecision": "pending_owner_response",
  "acceptedScope": [],
  "blockedScope": [],
  "nextPrompt": "<next prompt or pause reason>",
  "evidenceRefs": [],
  "blockers": [],
  "risks": [],
  "contractsChanged": false,
  "supabaseUpdateClassification": {
    "updateRequired": "owner_response_pending",
    "updateStatus": "ready_for_staging_review",
    "environmentTouched": "staging",
    "sqlExecuted": false,
    "migrationDeployed": false,
    "nextSupabaseAction": "milestone sync only through Phase 51D contract"
  },
  "productionReadyAllowed": false,
  "externalBetaAllowed": false,
  "broadMediaAllowed": false,
  "publicArtifactAllowed": false,
  "rawPromptExecutionAllowed": false,
  "signedUrlSourceOfTruthAllowed": false,
  "createdAt": "<ISO timestamp>",
  "updatedAt": "<ISO timestamp>"
}
```

Do not include secrets, DB URLs, signed URLs, provider keys, public artifact
URLs as source of truth, raw provider responses, media blobs, screenshots, or
runtime execution claims.
