# Canonical Pipeline Visual-Calibration QA Coverage

Date: 2026-07-22

Verdict: `AUTHORITATIVE_AGGREGATE_COVERAGE_ADDED_RUNTIME_PROMOTION_BLOCKED`

## Correction

The visual-calibration objective-QA implementation already had dedicated
runner and canonical lifecycle proof, but
`qa:canonical-private-pipeline` did not require that lifecycle proof. The
aggregate could therefore complete without exercising the new dependent QA
job.

`canonical-private-pipeline-verification-v38` adds the required
`canonical-visual-calibration-objective-qa` step. It runs
`smoke:canonical-private-visual-calibration-objective-qa-e2e` immediately
after the visual-calibration provider-attempt receipt and before downstream
multi-source execution.

## Evidence represented in the aggregate

The new step proves one exact provider MP4 dependency flows through the
existing approved package, canonical queue, claim/lease, one-use FFmpeg tool
dispatch, private JSON artifact, deterministic QA, reconciliation, replay and
compact consumer receipt. The receipt carries all ten objective media gates
and keeps provider usage cost, provider-worker infrastructure cost and
QA-worker infrastructure cost as separate internal-production components.

## Closed boundaries

The aggregate addition authorizes no provider request, creative selection,
customer price, credits, service fee, wallet or billing mutation, remote
Supabase or Google Cloud mutation, deployment, public delivery or production
promotion. The retained evidence remains private, injected and
non-promotable until the deployed provider, worker, storage, database and
same-release acceptance gates pass.
