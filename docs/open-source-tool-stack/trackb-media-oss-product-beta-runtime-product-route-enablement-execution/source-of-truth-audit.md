# source-of-truth-audit

```json
{
  "schema": "reeditpro.trackbMediaOss.productRouteEnablementExecution.v1",
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "decision": "trackb_media_oss_product_beta_runtime_product_route_enablement_execution_passed_ready_for_product_route_enablement_qa_review",
  "previousDecision": "trackb_media_oss_product_beta_runtime_product_route_enablement_plan_passed_ready_for_product_route_enablement_execution",
  "nextPrompt": "TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_QA_REVIEW",
  "sourceSha": "bfd406a3f847ff5c5b7e2e7f26d38d9186fdedaf",
  "sourceHead": "338cb8c0b7288974360d7f6664eef9dfe25c0db3",
  "trackBTotals": {
    "owned": 16,
    "boundedAcceptedProven": 16,
    "blockedNotInstalledProven": 0,
    "productReady": 0
  },
  "productReadyCount": 0,
  "supabaseClassification": "no write / environment none / SQL none / migration no",
  "report": "source-of-truth-audit",
  "sourceEvidence": [
    {
      "pr": 932,
      "state": "MERGED",
      "mergeCommit": "bfd406a3f847ff5c5b7e2e7f26d38d9186fdedaf",
      "head": "338cb8c0b7288974360d7f6664eef9dfe25c0db3",
      "decision": "trackb_media_oss_product_beta_runtime_product_route_enablement_plan_passed_ready_for_product_route_enablement_execution"
    },
    {
      "pr": 930,
      "state": "MERGED",
      "decision": "trackb_media_oss_product_beta_runtime_product_ready_proof_execution_blocked_by_product_route_disabled_backend_required"
    }
  ],
  "duplicateExecutionPrOpen": false,
  "unrelatedExternalDriftContext": [
    {
      "pr": 933,
      "state": "MERGED_EXTERNALLY",
      "touchedByThisLane": false
    }
  ],
  "protectedHashesCaptured": true,
  "cleanWorktreeAtStart": true,
  "noDuplicateRouteEnablementExecutionPr": true
}
```
