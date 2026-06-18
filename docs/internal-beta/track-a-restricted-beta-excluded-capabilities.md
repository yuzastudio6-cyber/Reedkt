# Track A Restricted Beta Excluded And Deferred Capabilities

## Excluded Or Deferred Capability Matrix

| Capability ID | Decision | Reason | Re-entry Path |
| --- | --- | --- | --- |
| `birefnet_text_behind_subject_masking` | `excluded_from_first_restricted_internal_beta` | insufficient visual proof for first beta scope | `TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1` |
| `sam2_segmentation_runtime` | `excluded_from_first_restricted_internal_beta` | segmentation runtime is not part of first caption/render beta | future segmentation-specific approval |
| `real_esrgan_enhancement` | `excluded_from_first_restricted_internal_beta` | before/after proof missing | `TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1` |
| `film_interpolation_runtime` | `excluded_from_first_restricted_internal_beta` | not needed for first caption/render beta | future motion/runtime expansion |
| `opencolorio_openimageio_production_color_management` | `deferred_from_first_restricted_internal_beta` | sample-level evidence only; production color proof is incomplete | future color-management proof packet |
| `public_artifact_delivery` | `blocked` | restricted internal beta remains private-only | separate public-delivery approval |
| `signed_url_source_of_truth` | `blocked` | signed URLs are not source-of-truth | separate storage/security approval |
| `final_delivery_export` | `blocked` | final delivery/export remains outside this scope | final-delivery readiness packet |
| `broad_user_media` | `blocked` | arbitrary real-user media is not approved by controlled Track A proof | private E2E and broader media readiness |
| `external_beta` | `blocked` | external beta is outside first restricted internal beta scope | external-beta readiness gate |
| `production_paid_launch` | `blocked` | paid production is outside this phase | production readiness and billing gates |

## Decision Values

trackARestrictedInternalBetaScopeDecision: `approved_for_private_e2e_revalidation_planning`

trackAInternalBetaUnlocked: false

productionReady: false

externalBetaReady: false

finalDeliveryReady: false

## Scope Expansion Rule

BiRefNet/text-behind-subject and Real-ESRGAN/enhancement remain excluded unless the owner explicitly re-enters them through `TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1`. SAM2 and FILM remain excluded from the first restricted beta and require their own future approval path.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
