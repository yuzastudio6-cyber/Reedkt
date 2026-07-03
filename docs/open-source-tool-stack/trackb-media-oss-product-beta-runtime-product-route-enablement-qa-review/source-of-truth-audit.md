# source-of-truth-audit

```json
{
  "schema": "reeditpro.trackbMediaOss.productRouteEnablementQaReview.v1",
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "decision": "trackb_media_oss_product_beta_runtime_product_route_enablement_qa_passed_ready_for_product_route_enablement_closeout",
  "previousDecision": "trackb_media_oss_product_beta_runtime_product_route_enablement_execution_passed_ready_for_product_route_enablement_qa_review",
  "nextPrompt": "TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_CLOSEOUT",
  "sourcePr": 939,
  "sourceSha": "cf355808b4f6f75cd96d84bffda2ae3f088ce0d1",
  "sourceHead": "93dfe24b68ce4f601fbf7228cfae531f179714d9",
  "trackBTotals": {
    "owned": 16,
    "boundedAcceptedProven": 16,
    "blockedNotInstalledProven": 0,
    "productReady": 0
  },
  "productReadyCount": 0,
  "supabaseClassification": "no write / environment none / SQL none / migration no",
  "report": "source-of-truth-audit",
  "centralSourceSha": "cf355808b4f6f75cd96d84bffda2ae3f088ce0d1",
  "acceptedPrEvidence": [
    {
      "pr": 939,
      "state": "MERGED",
      "head": "93dfe24b68ce4f601fbf7228cfae531f179714d9",
      "mergeCommit": "cf355808b4f6f75cd96d84bffda2ae3f088ce0d1",
      "acceptedAs": "bounded_local_staging_route_harness_execution_evidence"
    },
    {
      "pr": 932,
      "state": "MERGED",
      "acceptedAs": "route_enablement_plan_source_truth"
    },
    {
      "pr": 930,
      "state": "MERGED",
      "acceptedAs": "route_disabled_backend_required_blocker_source_truth"
    }
  ],
  "duplicateOpenQaPrFound": false,
  "protectedFileHashesCaptured": true,
  "routeDefinitionsRemainDisabled": true,
  "workerContractsRemainExecutionDisabled": true,
  "runtimeMutationReviewed": false
}
```
