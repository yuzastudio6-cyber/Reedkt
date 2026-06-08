# Creative Graphics Generated/Local Worker Envelope Candidates

Status: `generated_local_fixture_candidate_prepared`

Worker/tool-call envelopes are candidate shapes only. Fixture execution remains blocked until future gates explicitly approve a controlled execution prompt.

## Generic Candidate Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "<EDIT_INTENT_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "<TOOL_ID_PLACEHOLDER>",
  "candidateId": "<CANDIDATE_ID_PLACEHOLDER>",
  "privateArtifactScope": {
    "localArtifactPath": "<LOCAL_ARTIFACT_PATH_PLACEHOLDER>",
    "privateArtifactManifest": "<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>",
    "privateGcsPath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
    "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
    "checksum": "<CHECKSUM_PLACEHOLDER>"
  },
  "qaEvidence": "<QA_EVIDENCE_PLACEHOLDER>",
  "trackAHandoff": "<TRACK_A_HANDOFF_PLACEHOLDER>",
  "fixtureExecution": "blocked_until_future_gate",
  "requiredFutureApproval": "<FUTURE_EXECUTION_APPROVAL_PLACEHOLDER>",
  "rawPromptExecution": "blocked"
}
```

## Static Candidate Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "synthetic static chart or card fixture",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "d3_dataviz",
  "candidateId": "gd3_d3_dataviz_generated_local_candidate",
  "privateArtifactScope": "<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>",
  "fixtureExecution": "blocked_until_future_gate",
  "requiredFutureApproval": "<FUTURE_EXECUTION_APPROVAL_PLACEHOLDER>",
  "rawPromptExecution": "blocked"
}
```

## Motion Candidate Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "synthetic temporal overlay fixture",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "lottie_web_overlays",
  "candidateId": "gd3_lottie_web_overlays_generated_local_candidate",
  "privateArtifactScope": "<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>",
  "fixtureExecution": "blocked_until_future_gate",
  "requiredFutureApproval": "<FUTURE_EXECUTION_APPROVAL_PLACEHOLDER>",
  "rawPromptExecution": "blocked"
}
```

No envelope may use raw prompt execution, real media, provider/model calls, worker execution, render/export, browser capture, media processing, Docker/Cloud Run, Supabase mutation, SQL, Google Cloud, Secret Manager, public artifacts, signed URLs, storage transfer, or production/beta unlock.
