# Beta Readiness API Deployment Preflight - aa49

Decision: `beta_readiness_api_deployment_preflight_passed_ready_for_deployed_evidence_input_manifest`

Source SHA: `aa49cef9ed6dad971f0163ea80ebb34de0e65d67`

Based on deploy evidence: `docs/beta-readiness/api-staging-deploy-current-source/2026-06-29-aa49-api-staging-deploy.json`

The API deployment preflight passed for the current staging API source, service, image tag, expected URL, service account, and secret-binding presence confirmations.

## Planned Service

- Service: `reeditpro-api-staging`
- Region: `us-east1`
- Project: `reeditpro`
- Runtime service account: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`
- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-aa49cef9ed6d-20260629T1300Z`
- Expected base URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`

## Remaining Gate

The deployed evidence input manifest is still blocked by missing operator inputs. The current manifest readback requires 58 remaining inputs, including bearer/token-bearing values and platform/launch evidence fields that must stay outside source control.

## Boundary

This preflight did not call the deployed backend, write evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.
