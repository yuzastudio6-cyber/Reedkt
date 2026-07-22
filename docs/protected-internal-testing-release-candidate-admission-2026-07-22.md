# Protected internal-testing release-candidate admission

Status: `source_admission_ready_external_activation_not_run`

Contract: `protected-internal-testing-release-candidate-admission-v1`

## Purpose

ReEditPro previously had strong but separate source checks for the canonical
product UI, Edit Preferences, the private editing pipeline, 50 tool identities,
large media, Google API Gateway, private GCS storage, GitHub Pages, and Google
sign-in. A deployment operator could run the individual workflows without one
compact receipt proving that all three workflows were using the same reviewed
source boundary.

This contract adds one deterministic, source-only admission receipt. It is not
a deployment, production-readiness result, or substitute for live staging
evidence. It blocks the private storage, gateway, and Pages workflows before
their first mutation or deployment step unless the exact reviewed source SHA
passes the same admission policy.

## Exact source gates

The verifier requires:

- explicit source ref `codex/backend-workflow-pipeline-continuation`;
- an exact 40-character source SHA matching `HEAD`;
- a resolved Git tree and clean worktree;
- no tracked or untracked AppleDouble source files;
- the strict 11-check canonical product UI source gate;
- an isolated standard Playwright server on port 5203, `--strictPort`, and no
  implicit reuse of a server from another checkout;
- eight dedicated browser suites excluded from the generic mock suite and run
  through their own authenticated or runtime-specific configurations;
- 72 registered profiles, 60 callable candidates, 53 confined runner proofs,
  at least 50 canonical end-to-end tool identities, and at least 50 canonical
  job-adapter identities;
- every tool record still marked `productReady=false`,
  `externalBetaReady=false`, and `productionReady=false`;
- the routine two-hour professional long-form profile at 7,200 seconds and 127
  jobs;
- the separate six-hour release-stress profile at 21,600 seconds and 255 jobs,
  retained but never executed by this admission or the routine pipeline;
- checksum integrity for all 19 migrations and 169 files declared by the
  isolated canonical V3 local manifest;
- the canonical V3 database evidence remaining explicitly `local_only`, with
  `remoteMutationAllowed=false` and `productionAuthority=false`;
- raw `supabase/migrations` retaining the reviewed
  `blocked_by_parallel_foundations` status;
- exact package-script entrypoints for the source gates; and
- the same admission command placed after immutable dependency installation
  and before cloud authentication or static-app build in all three activation
  workflows.

## Commands

The adversarial source-contract smoke is:

```sh
npm run smoke:protected-internal-testing-release-candidate-admission
```

The strict exact-SHA verifier is:

```sh
REEDITPRO_INTERNAL_TESTING_SOURCE_REF=codex/backend-workflow-pipeline-continuation \
REEDITPRO_INTERNAL_TESTING_SOURCE_SHA="$(git rev-parse HEAD)" \
npm run internal-testing:verify-protected-release-candidate
```

The strict verifier exits nonzero for a dirty tree, wrong branch/SHA, missing
workflow gate, altered browser isolation, fewer than 50 proven tool identities
or adapters, routine six-hour execution, manifest drift, or any local database
claim that crosses into remote/production authority.

## What the receipt means

An admitted receipt means only:

`admitted_for_owner_authorized_same_sha_protected_internal_testing_activation`

It means the exact source is structurally eligible to enter the separately
authorized storage -> gateway -> Pages -> interactive Google-session sequence.
The receipt is content-addressed, contains the exact SHA/tree and evidence
digests, performs no network access, starts no database, reads no credential,
and causes no provider, cloud, billing, or deployment effect.

## Gates that remain closed

The source admission always records all of the following as false:

- remote Supabase schema/RLS verification;
- remote Supabase Google OAuth configuration;
- real Gmail sign-in, reload, protected-route readback, and sign-out;
- GCS storage activation evidence;
- Cloud Run/API Gateway activation evidence;
- distributed worker execution;
- provider execution;
- customer billing;
- Pages deployment;
- public delivery; and
- production readiness.

Those gates require owner-authorized, same-SHA external execution and retained
evidence. Local canonical V3 proof must never be relabeled as remote Supabase
or production evidence, and the six-hour stress fixture does not need to be
paid on every implementation iteration. The two-hour profile is the routine
break/fix proof; six hours remains a release-capacity rehearsal.
