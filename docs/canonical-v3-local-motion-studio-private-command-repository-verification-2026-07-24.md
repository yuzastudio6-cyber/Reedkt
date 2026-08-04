# Canonical V3 local Motion Studio private command repository verification

Status: `verified_private_local_only`

Date: 2026-07-24

## Outcome

The signed-in local product stack can now create one normal Project and named
Storytelling edit, create or recover its exact Motion Studio production, save
Director artifact revisions through the existing Motion command service, and
reopen the dedicated Director route after reload. The normal Edit Chat editor
is not mounted on that route.

This is a private single-host break-test authority. It is not a production
Motion repository, remote Supabase persistence, cross-device synchronization,
provider runtime, worker runtime, render authority, billing authority, or
public-delivery claim.

## Authority boundaries

- `MotionStudioCommandService` remains the one command compiler and API
  boundary. The runtime port selects a repository; it does not create a second
  command or approval model.
- The private repository accepts only a verified bearer identity in an
  explicit non-production local runtime.
- The exact saved Project/named-edit handoff must durably declare
  `productWorkflow=motion_studio.storytelling` and the canonical dedicated
  Director route before a production can be created.
- Workspace memberships are discovered through a fixed, bounded,
  authenticated-user RLS query. The target workspace is then authorized again
  before a read or mutation.
- Signed-in local Projects use UUID identities so they satisfy the existing
  Motion production schema. Mock-user compatibility IDs remain unchanged.
- Named-edit save binds to the selected canonical exact-edit planning
  authority when that authority is mounted. A canonical result or error never
  falls through to the retired private preference store.
- The registry is actor-scoped, checksum-verified, size/capacity bounded,
  atomically written, and guarded by the existing cooperative private file
  lock.
- Create, artifact, command, and approval mutations retain hashed
  idempotency-key receipts. Exact replay returns the committed response without
  rewriting domain state; changed-request reuse conflicts.
- Artifact versions and approvals are immutable records. Command compare-and-
  swap is serialized, and concurrent writers produce one applied result plus
  one durable conflict receipt.
- Motion approval re-reads the canonical approved snapshot and requires exact
  workspace, Project, named-edit, and approving-user identity.
- Browser request bodies, query parameters, and headers cannot select or
  qualify the repository port. The module exposes no production qualifier.

## Mounted acceptance

The canonical V3 browser stack uses real local Supabase Auth and
workspace-membership RLS while keeping the Motion repository private and
single-host. The fourth mounted journey proves:

1. sign in as workspace owner A;
2. open `/motion-studio/storytelling`;
3. create one Project and named Storytelling edit;
4. create one exact private Motion production;
5. enter Director Chat direction;
6. reload and recover the same direction;
7. return to the Storytelling library;
8. observe one matching story;
9. reopen the exact Director route;
10. verify the normal `ChatNativeEditor` surface is absent.

The same four-test browser configuration also retains the signed-in Edit
Reference library/DNA/QA/approval, private-upload/long-form, and exact-target
prepare/apply/remove journeys.

## Focused evidence

- `npm run smoke:motion-studio-private-local-command-repository`
- `npm run typecheck:server`
- focused ESLint over the runtime, repository, services, smoke, and browser
  proof
- `playwright test --config
  tests/e2e/playwright.edit-reference-canonical-v3-local.config.ts`
- `database/canonical-v3-local/run-local-verification.sh`
- `npm run build`
- `npm run check:frontend-boundary`
- `npm run check:secrets`
- `node database/canonical-v3-local/verify.mjs`
- `git diff --check`

## Closed gates

`productionAuthority=false` and `productionReady=false`.

No provider was called; no worker, render, export, generation, customer-price,
credit, service-fee, billing, remote Supabase, Google Cloud, deployment, push,
or public-delivery action was performed. A future production repository still
requires reviewed transactional database/RLS authority, multi-replica
idempotency and compare-and-swap evidence, cross-device recovery, same-release
qualification, backup/rollback, deployed Auth/IAM, and staging acceptance.
