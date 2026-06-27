# RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1

## Goal

Run the next controlled external beta gate only after an exact named invited tester identity is supplied or source-approved.

## Required Source Inputs

- `RP-EXTERNAL-BETA-CONTROLLED-OWNER-GO-NO-GO-1`
- `RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1`
- Cloud Run service `reeditpro-staging-api`
- Google Group `external-beta-testers@reeditpro.com`

## Scope

The gate may add or confirm only the named tester identity in the owner-managed Google Group if a later prompt explicitly authorizes that access mutation. It must then run authenticated browser/product-flow checks for that exact identity. It must not grant `allUsers`, `allAuthenticatedUsers`, domain-wide access, production access, worker access, provider/model access, Supabase access, payment access, or public artifact access.

## Expected Output

Record either:

- `completed_named_invited_tester_walkthrough`, or
- an exact blocker such as `blocked_missing_named_invited_tester_identity`, `blocked_named_invited_tester_auth_unavailable`, or `blocked_named_invited_tester_walkthrough_failed`.
