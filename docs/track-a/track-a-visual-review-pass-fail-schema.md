# Track A Visual Review Pass/Fail Schema

Status: `schema_documentation_only`

This is JSON-style documentation only. It is not a database schema, API schema, migration, or runtime validator.

```json
{
  "reviewId": "tracka-visual-review-2-YYYYMMDDTHHMMSS",
  "reviewer": "human_reviewer_name_or_role",
  "reviewedAt": "ISO-8601 timestamp",
  "sourceEvidencePacket": {
    "pr": 390,
    "decision": "tracka_current_source_1_passed_ready_for_tracka_visual_review_1",
    "baseMerge": "91253ad36db92a0772a706fdfd68886c269780a2"
  },
  "artifactReviews": [
    {
      "artifactId": "tracka-visual-review-1-birefnet-masking",
      "capabilityId": "birefnet_masking",
      "sourcePrs": ["#22", "#23", "#24", "#25", "#26"],
      "refStatus": "recorded_private_ref | artifact_ref_not_recorded_in_current_source",
      "reviewStatus": "pass | pass_with_warnings | fail | blocked_missing_artifact | blocked_privacy_issue",
      "reviewerNotes": "required when not pass"
    }
  ],
  "capabilityReviews": [
    {
      "capabilityId": "birefnet_masking",
      "scores": {
        "compositionQualityScore": 1,
        "segmentationMaskQualityScore": 1,
        "textBehindSubjectScore": 1,
        "enhancementQualityScore": 1,
        "interpolationSmoothnessScore": 1,
        "colorImageQualityScore": 1,
        "captionBurninReadabilityScore": 1,
        "timelineConsistencyScore": 1,
        "renderExportIntegrityScore": 1,
        "visualArtifactsGlitchesScore": 1,
        "professionalPolishScore": 1,
        "privacySafetyScore": 1,
        "artifactSourceConsistencyScore": 1
      },
      "reviewerNotes": "required"
    }
  ],
  "overallDecision": "pass | pass_with_warnings | fail | blocked_missing_artifact | blocked_privacy_issue",
  "requiredFollowUps": [],
  "approvedNextPhase": "none | oldstack_closure | private_e2e_revalidation_planning",
  "explicitNonApprovals": {
    "production": false,
    "external_beta": false,
    "final_delivery": false,
    "public_artifacts": false,
    "signed_url_source_of_truth": false,
    "broad_media": false,
    "arbitrary_user_media": false,
    "runtime_execution": false
  }
}
```

## Schema Rules

- `approvedNextPhase=oldstack_closure` is only a recommendation for a later explicit owner-approved closure prompt; it does not close PRs.
- `approvedNextPhase=private_e2e_revalidation_planning` is only a planning recommendation; it does not approve private E2E execution.
- Every `explicitNonApprovals` value must remain false.
- TRACKA-VISUAL-REVIEW-1 does not fill this schema with a completed review outcome; TRACKA-VISUAL-REVIEW-2 records the outcome later.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
