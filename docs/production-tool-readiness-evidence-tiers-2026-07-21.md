# Production Tool Readiness Evidence Tiers

Status: source-owned contract implemented; production image and deployed release gates remain closed.

## Why this exists

ReEditPro retains real, bounded private execution proof for many tools, but that proof is not the same as proving an immutable production worker image or a deployed release. The old static readiness summary collapsed those states into one `missing` label, which could incorrectly suggest that proven tools such as FFmpeg and Remotion had no execution evidence at all.

The canonical readiness report now preserves three independent evidence tiers:

1. **Canonical private lifecycle evidence** — source-owned, single-host private runner/lifecycle/job-adapter proof retained in the proven tool identity catalog.
2. **Production image qualification** — a future same-source immutable-image receipt proving the exact image role, required/forbidden tool checks, and license/model gates.
3. **Deployed release qualification** — a future receipt proving that the same qualified image was deployed behind verified service identity, private storage, observability, and release approval.

No lower tier promotes a higher tier.

## Current retained truth

- Production registry profiles: 50.
- Confined private runner proof: 50.
- Canonical private end-to-end proof: 50.
- Canonical private job-adapter proof: 50.
- Non-end-to-end candidate capabilities in the separate audit: 22.
- Runner foundations excluded from the tool count: 3.
- Same-source production image qualifications supplied: 0.
- Deployed release qualifications supplied: 0.

The retired 72 figure was an exploratory catalog size. The historical 53
figure combined the 50 tools with three runner foundations and was never a
product tool count.

The report therefore remains `blocked` for external beta and production, while accurately showing the private execution progress already earned.

## Contract boundaries

Every tool summary now carries:

- `statusScope = production_image_and_release_qualification`;
- exact catalog identity/proof hashes and private runner/E2E/job-adapter booleans;
- a closed `production-container-qualification-receipt-v1` projection;
- a closed `production-tool-deployment-release-receipt-v1` projection.

The static builder accepts no caller-authored production receipt and has no insertion path that can promote either production tier. A later reviewed adapter must verify a same-source commit, immutable image digest, exact image role, required and forbidden tool checks, and license/model gates. Deployment must then prove the same image digest plus service identity, private storage, observability, and release approval.

The bounded human-run probe and non-promotable candidate format are defined in `docs/production-container-qualification-candidate-contract-2026-07-21.md`.

Static source declarations, local binaries, old Docker images, private lifecycle proof, adapter contracts, and copied JSON are insufficient.

## Safety boundary

This slice does not build or run production containers. It does not call providers, read secrets, mutate Supabase/GCS/cloud resources, deploy services, process user media, publish artifacts, charge customers, mutate credits, or open external-beta/production traffic.

Internal production tool cost remains separate from future customer price, customer credits, service fee, wallet, and billing authority.

## Verification

- `npm run smoke:prod-readiness-evidence-tiers`
- `npm run smoke:prod-readiness-validation`
- `npm run smoke:prod-container-readiness`
- `npm run smoke:proven-tool-identities`
- `npm run smoke:prod-tool-registry`
- `npm run prod:readiness:summary`
- `npm run prod:readiness:action-plan`
- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run check:frontend-boundary`
- `npm run check:secrets`

The focused adversarial smoke proves that FFmpeg can simultaneously be canonical-private-E2E verified and production-image/deployment blocked; all 50 tools carry closed production projections; candidate and runner-foundation evidence cannot enter the production registry; and the source contains no Docker, child-process, cloud, provider, database, or deployment execution path.
