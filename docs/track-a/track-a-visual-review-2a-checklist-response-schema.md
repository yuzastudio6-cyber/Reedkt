# Track A Visual Review 2A Checklist Response Schema

Status: `schema_documentation_only`

This schema describes the response format for AI-assisted private visual review intake. It is not a database schema, API schema, migration, runtime validator, or completed review outcome.

```json
{
  "intakeId": "tracka-visual-review-2a-YYYYMMDDTHHMMSS",
  "sourceReviewPacket": {
    "pr": 393,
    "baseMerge": "cca57b851a76b866415a1a2bfbe146843d398a08",
    "packet": "TRACKA-VISUAL-REVIEW-1"
  },
  "aiAssistedReviewCanProceed": false,
  "proceedReason": "blocked_pending_uploaded_frames_or_approved_private_artifact_access_bundle",
  "providedEvidence": [],
  "requestedEvidence": [
    {
      "capabilityId": "birefnet_masking",
      "neededEvidence": ["source frame", "mask frame", "cutout or composite frame"],
      "sourceArtifactId": "tracka-visual-review-1-birefnet-masking",
      "refStatus": "recorded_private_ref"
    }
  ],
  "missingEvidence": [],
  "reviewCriteria": [],
  "privacySecurityChecks": {
    "noPublicArtifact": true,
    "noSignedUrlSourceOfTruth": true,
    "noBroadGcsAccess": true,
    "noRuntimeExecution": true,
    "noSupabaseMutation": true,
    "noBetaProductionUnlock": true
  },
  "nextPrompt": "TRACKA-VISUAL-REVIEW-2B — Record AI-assisted private visual review pass/fail outcome",
  "blockedActions": [
    "public_artifacts",
    "signed_urls_as_source_of_truth",
    "broad_gcs_access",
    "track_a_runtime_execution",
    "supabase_mutation",
    "beta_production_unlock"
  ]
}
```

## Response Rules

- `aiAssistedReviewCanProceed` must remain false unless representative frames/clips or an approved private access bundle are present.
- This schema must not record `pass`, `pass_with_warnings`, or `fail` as a completed visual review outcome.
- Completed review outcomes belong in TRACKA-VISUAL-REVIEW-2B after actual evidence exists.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
