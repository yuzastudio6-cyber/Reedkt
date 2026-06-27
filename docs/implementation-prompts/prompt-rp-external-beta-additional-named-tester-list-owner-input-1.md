# RP-EXTERNAL-BETA-ADDITIONAL-NAMED-TESTER-LIST-OWNER-INPUT-1

Use this prompt only if the owner supplies an explicit additional tester list for the controlled external beta staging lane.

Required inputs:

- Exact tester email addresses.
- Confirmation that each tester may be added to `external-beta-testers@reeditpro.com`.
- Confirmation that access remains staging-only for `reeditpro-staging-api`.
- Confirmation that `allUsers`, `allAuthenticatedUsers`, domain-wide access, production service access, workers, providers, Supabase mutation, SQL, signed/public artifacts, paid billing, final delivery/export, and production unlock remain blocked.

Without those inputs, keep `RP-EXTERNAL-BETA-BOUNDED-TESTER-EXPANSION-DECISION-1` blocked as `blocked_no_additional_named_tester_list`.
