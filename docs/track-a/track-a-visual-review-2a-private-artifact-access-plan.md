# Track A Visual Review 2A Private Artifact Access Plan

Status: `plan_only_no_artifact_access`

This plan defines the safe access path that a future prompt must approve before AI-assisted visual review can inspect private artifacts. TRACKA-VISUAL-REVIEW-2A does not access artifacts.

## Access Preconditions

- The requester names exact artifact IDs from `docs/track-a/track-a-visual-review-artifact-index.md`.
- The requested refs are already recorded in #390/#393 or committed docs.
- The access scope names exact objects or files, not broad GCS buckets or prefixes.
- The reviewer confirms no signed URL source-of-truth is used.
- The reviewer confirms no public artifact, download outside approved workspace, or derivative media publication.
- The reviewer confirms the AI assistant may visually inspect only the provided frames/clips or explicitly approved private artifacts.

## Allowed Future Intake Forms

| Intake Form | Allowed In This Phase | Notes |
| --- | --- | --- |
| uploaded representative frame in thread | yes_if_provided | no file was provided for this run |
| uploaded representative clip in thread | yes_if_provided | no file was provided for this run |
| exact private object ref from #390/#393 | plan_only | future prompt must approve access |
| broad GCS prefix or bucket | no | blocked as broad access |
| signed URL | no | blocked as source-of-truth |
| public artifact URL | no | blocked |

## Approved Ref Source List

Only refs already listed in `docs/track-a/track-a-visual-review-artifact-index.md` are eligible for a future private access request. `artifact_ref_not_recorded_in_current_source` remains missing and must not be replaced by an invented ref.

## Required Future Access Record Fields

```json
{
  "accessRequestId": "tracka-visual-review-2a-access-YYYYMMDDTHHMMSS",
  "requester": "human_owner_or_delegate",
  "approvedArtifactIds": [],
  "approvedRefs": [],
  "accessMethod": "approved_internal_private_artifact_access_path",
  "broadGcsAccess": false,
  "signedUrlSourceOfTruth": false,
  "publicArtifact": false,
  "storageTransfer": false,
  "derivativeMediaCreated": false,
  "expiresOrReviewWindow": "human-defined",
  "privacyNotes": "required"
}
```

## Blocked Access

- broad GCS access
- GCS upload or storage transfer
- signed URL creation
- public artifact creation
- private artifact download outside the approved review path
- media processing, rendering, conversion, or extraction
- runtime/tool/worker/provider/route execution

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
