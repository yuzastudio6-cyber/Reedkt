# Rate-Limit, Abuse Prevention, and Cost-Control Contract

Prompt 17 defines policy-preview and fail-closed boundary behavior. It does not enforce production rate limits, block users, charge users, mutate credits, or create billing records.

## Shared Fields

- `routeId`
- `routeGroup`
- `actorType`
- `workspaceId`
- `projectId`
- `userId`
- `plan` or `tier` when available
- `requestCountWindow`
- `mutationCountWindow`
- `expensiveOperationCountWindow`
- `estimatedCreditExposure`
- `estimatedStorageExposure`
- `estimatedProviderExposure`
- `estimatedRenderExposure`
- `abuseRiskSignals`
- `blockReason`
- `retryAfterSeconds`
- `manualReviewRequired`
- `escalationPolicy`
- `auditEvent`
- `userMessage`

## Policy Boundaries

- Rate-limit policy previews can describe intended windows and retry guidance, but production enforcement requires future backend persistence.
- Abuse-prevention policy previews can classify request metadata and escalation needs, but user blocking requires future human-reviewed policy and records.
- Cost-control policy previews can summarize estimated credit, storage, provider, and render exposure, but paid billing and credit mutation remain blocked.
- Usage summaries are request-metadata previews only until future metering records exist.

## Route-Group Risk Classification

- `low`: static GET summaries with no side effects.
- `medium`: authenticated POST previews or backend-required mutation boundaries.
- `high`: service-role or persistence-dependent route groups.
- `critical`: provider, Stripe, admin, worker execution, render/export, or production unlock surfaces.

## Fail-Closed Response

Fail-closed responses include `status`, `canProceed`, blockers, warnings, required records, and `nextAction`. They must not create execution records, charge users, send external telemetry, or unlock runtime behavior.
