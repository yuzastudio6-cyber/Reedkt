# Beta Readiness Source Freshness Preflight - e6fa Blocked

Decision: `beta_readiness_source_freshness_preflight_blocked_deploy_evidence_source_stale`

The hard blocker policy now allows forward progress, but it must still block stale evidence. Current source truth is newer than the recorded staging API deploy evidence:

- Current source SHA: `e6fa65329dc91b42458261bb224df14c2ffbab3c`
- Recorded staging API deploy source SHA: `d997d567d40853f59741763c8e9ca8b2c361148a`
- Recorded deploy packet: `docs/beta-readiness/api-staging-deploy-current-source/2026-06-28-d997-api-staging-deploy.json`
- Recorded deployment preflight: `docs/beta-readiness/api-deployment-preflight/2026-06-28-d997-api-deployment-preflight-passed.json`
- Recorded deployed evidence manifest policy: operator-supplied current deployed source SHA required

## Result

- `readyForOwnerApprovalIntake`: `false`
- `readyForDeployedEvidenceInputManifest`: `false`
- Value gap: current source `e6fa65329dc91b42458261bb224df14c2ffbab3c` does not match deployed evidence source `d997d567d40853f59741763c8e9ca8b2c361148a`.

This is not a blanket block. The gate passes as soon as current source and deployed evidence source match.

## Next Safe Commands

1. Refresh the guarded staging API deploy evidence for the current source with the workflow-dispatch path from `.github/workflows/beta-readiness-api-staging-deploy.yml`.
2. Run `npm run beta:readiness:api-deployment-preflight`.
3. Run `npm run beta:readiness:source-freshness-preflight`.
4. Generate owner inputs with `npm run beta:readiness:owner-approval-env-template`.
5. Validate owner inputs with `npm run beta:readiness:owner-approval-intake-preflight`.

Owner notes may be drafted, but deployment-owner acceptance, deployed evidence input manifest, external beta evidence collection, and operator readback must use fresh matching source evidence.

## Boundary

This preflight did not deploy, call `gcloud`, call the deployed backend, record evidence, run tools, process media, write Supabase, write GCS, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.
