# Private Internal Tool Runtime Activation

## Outcome

ReEditPro's canonical private tool catalog is activated as one verified internal
runtime set when the private-review workspace starts.

The current catalog contains 50 canonical executable identities. They resolve
through 15 runner classes and 14 shared runtime authorities. Every catalog
identity must have:

- an exact canonical operation;
- a pinned, confined runner;
- canonical lifecycle evidence;
- a server-derived job adapter;
- one matching active runtime authority.

The catalog size is derived from distinct canonical executable identities. It
is not a permanent 50-tool cap.

## Internal Readiness Meaning

`ready_for_private_internal_execution` means the exact local image and runtime
authority were revalidated and the canonical dispatcher may reference the
operation after the existing approved-snapshot, reservation, lease, artifact,
and QA gates pass.

It does not mean:

- browser-side execution;
- public or customer availability;
- external beta readiness;
- deployed worker-fleet readiness;
- billing or settlement authority;
- product or production promotion.

Model-dependent runtimes outside the canonical 50-tool set, including
controlled ComfyUI and SAM2 GPU operations, keep their independent model,
mount, signed-image, GPU, resource, output, and QA gates. They must report the
specific missing resource rather than being mislabeled as a generic unavailable
canonical tool.

## Startup Boundary

`server/private-workspace-index.ts` calls
`activateCompletePrivateInternalToolRuntimeSet()` when the private-review
runtime is enabled. Startup fails closed if any current canonical identity is
missing, duplicated, mapped to the wrong operation, or backed by an authority
whose private-internal readiness boundary does not revalidate.

No caller can select a subset, provide image tags, change commands, inject
environment, or relax confinement through this activation API.

## Authenticated UI Status

The read-only route
`GET /v1/edit-executions/private-internal-tool-runtime-readiness` inspects the
authorities already active in the current backend process. It returns bounded
canonical tool names, operation IDs, runtime-family labels, and internal
readiness only. Image identities, authority hashes, commands, paths,
environment, and credentials stay server-only.

The advanced chat card reads this route instead of displaying the historical
frontend planning catalog as package readiness. It lists every current
canonical identity as `Ready` only after the backend proves complete coverage.
If the authenticated private backend is not connected, the card asks for that
connection and does not invent a readiness result from mock or planning
metadata. Edit-level labels are not part of this internal runtime status.

## Verification

Run:

```text
npm run smoke:private-internal-tool-runtime-activation
```

The smoke activates all fixed runtime families, proves complete catalog
coverage, verifies every tool reports
`ready_for_private_internal_execution`, rereads the authenticated browser
route, and confirms all customer/product/external-beta/production authority
remains false.
