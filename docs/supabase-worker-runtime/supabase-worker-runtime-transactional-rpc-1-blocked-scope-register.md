# Supabase Worker Runtime Transactional RPC 1 Blocked Scope Register

Register status: `planning_only`

## Blocked In This Phase

- Supabase mutation
- SQL execution
- migration file creation
- migration deployment
- schema/RLS/policy changes
- Secret Manager payload access
- Supabase URL/key/JWT/secret value exposure
- worker execution
- job claim execution
- lease acquisition
- heartbeat execution
- route/tool/provider/model execution
- Track A runtime/media execution
- private artifact or GCS access
- signed URL creation
- public artifact creation
- billing or credit mutation
- Stripe checkout/webhook/payment processing
- dependency mutation
- package-lock mutation
- raw prompt execution
- final render/export
- internal beta unlock
- external beta unlock
- paid production unlock
- production unlock
- broad media unlock
- broad service-role handler

## Blocked Scope Preserved From Track A

The excluded/deferred Track A scope remains blocked: BiRefNet/text-behind-subject/masking, SAM2, Real-ESRGAN, FILM, OpenColorIO/OpenImageIO production color, broad media, public artifacts, signed URL source-of-truth, final delivery/export, external beta, paid production, and production.

## Status Flags

executionAllowedInThisPhase: false

routeExecutionAllowedNow: false

rawPromptExecutionAllowed: false

signedUrlSourceOfTruthAllowed: false

publicArtifactAllowed: false

finalDeliveryAllowed: false

externalBetaAllowed: false

productionAllowed: false

internalBetaUnlockAllowed: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
