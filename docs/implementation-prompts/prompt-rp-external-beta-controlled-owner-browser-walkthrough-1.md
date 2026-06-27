# RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1

## Goal

Perform a controlled owner browser walkthrough against the private staging Cloud Run UI surface for `aiediting@reeditpro.com`.

## Required Source Inputs

- `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY`
- Cloud Run service `reeditpro-staging-api`
- Google group `external-beta-testers@reeditpro.com`
- Owner/tester account `aiediting@reeditpro.com`

## Scope

The walkthrough may inspect authenticated browser-visible pages and user-facing mock/beta gates only. It must not broaden IAM, create public access, mutate Supabase, run SQL, call providers/models, dispatch workers, process media, create signed/public artifacts, charge credits, process Stripe payments, or unlock paid production/final delivery.

## Expected Outcome

Record whether the private staging browser UI is acceptable for the next controlled external beta gate, or record the exact blocker.
