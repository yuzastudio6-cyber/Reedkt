# Access Boundary

Packet: `RP-EXTERNAL-BETA-ADDITIONAL-NAMED-TESTER-LIST-DECISION-1`

## Current Access

- Staging service: `reeditpro-staging-api`
- Approved tester group: `external-beta-testers@reeditpro.com`
- Approved tester: `aiediting@reeditpro.com`
- Access status: `go_single_tester_only`

## Not Changed

This packet does not:

- mutate Google Group membership;
- mutate Cloud Run IAM;
- grant `allUsers`;
- grant `allAuthenticatedUsers`;
- grant a domain-wide principal;
- add a new tester;
- deploy Cloud Run;
- run Supabase, SQL, workers, providers, media, render, billing, or production paths.

Future expansion may proceed only when a later packet names exact additional tester identities and preserves the support, rollback, privacy, artifact, billing, credit, and production boundaries.
