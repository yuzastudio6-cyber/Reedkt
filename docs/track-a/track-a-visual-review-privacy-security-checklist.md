# Track A Visual Review Privacy/Security Checklist

Status: `checklist_ready_review_not_completed`

The human reviewer must confirm every item before any future review outcome can be recorded.

## Checklist

| Check ID | Required Confirmation | Pass Field |
| --- | --- | --- |
| `private_ref_only` | Artifact references are private refs copied from #390 or recorded docs/PR bodies. | `privateRefOnlyConfirmed` |
| `no_signed_url_source_truth` | No signed URL is treated as source-of-truth. | `noSignedUrlSourceTruthConfirmed` |
| `no_public_artifacts` | No public artifact is required or accepted as evidence. | `noPublicArtifactConfirmed` |
| `no_raw_prompt` | No raw prompt is reviewed as source-of-truth. | `noRawPromptConfirmed` |
| `no_raw_provider_response` | No raw provider/model response is reviewed as source-of-truth. | `noRawProviderResponseConfirmed` |
| `no_sensitive_media_exposure` | Review evidence must not expose private user media outside approved internal access. | `noSensitiveMediaExposureConfirmed` |
| `no_secret_material` | Review packet contains no DB URLs, provider keys, bearer tokens, JWTs, service-role payloads, or Stripe keys. | `noSecretMaterialConfirmed` |
| `no_runtime_claim` | Review outcome must not approve runtime/tool/worker/provider/route execution. | `noRuntimeClaimConfirmed` |
| `no_beta_prod_claim` | Review outcome must not approve internal beta, external beta, production, paid production, or final delivery. | `noBetaProdClaimConfirmed` |
| `no_pr_mutation_claim` | Review outcome must not merge, close, retarget, or comment on old PRs. | `noPrMutationClaimConfirmed` |

## Blocking Outcomes

- Any missing private ref for required evidence should set `overallDecision=blocked_missing_artifact`.
- Any privacy/security issue should set `overallDecision=blocked_privacy_issue`.
- Any request to use signed URLs, public artifacts, raw prompts, or raw provider outputs as source-of-truth should fail review.

## Supabase Classification

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

Milestone sync: `blocked_current_branch_missing_sync_layer`

Next Supabase action: `none`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
