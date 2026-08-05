# Canonical Caption terminal evidence assembly mount — 2026-08-05

## Outcome

The terminal qualification path now has a concrete source-ready one-writer
assembly mount. Previously the terminal service accepted an admitted read
port, but only the smoke supplied that port with an in-memory closure. The new
`canonical-caption-terminal-evidence-assembly-v1` composition is the exact
backend-facing implementation of that port.

This closes a source integration gap. It does **not** claim that one complete
Caption qualification run exists.

## Contracts

- `canonical-caption-terminal-input-read-port-v1`
- `canonical-caption-terminal-private-review-read-port-v1`
- `canonical-caption-terminal-evidence-bundle-repository-v1`
- `canonical-caption-terminal-evidence-assembly-v1`

The existing terminal wire remains unchanged:

- `canonical-caption-terminal-qualification-request-v1`
- `canonical-caption-terminal-evidence-bundle-v1`
- `canonical-caption-terminal-qualification-record-v1`

## Exact behavior

For one exact terminal request, the assembly:

1. rereads an already-completed canonical Caption work/shared-owner input;
2. rereads the same input a second time and requires byte-identical data;
3. rereads canonical private-review projections for the exact output set;
4. rereads them a second time and requires byte-identical data;
5. passes both through the existing closed V2 terminal validators;
6. constructs the existing terminal evidence bundle;
7. persists it create-only under the request digest;
8. exact-rereads and compares the persisted bundle;
9. exposes only the admitted terminal evidence read port;
10. serves later replay from the persisted bundle without rerunning assembly.

The terminal qualifier then persists and rereads its own qualification record
through the already-existing separate repository.

## Fail-closed behavior

The focused regression rejects:

- an unadmitted source input reader;
- a caller-supplied evidence bundle or unknown request field;
- canonical input that changes between exact rereads;
- private-review evidence that changes between exact rereads;
- crossed scope/package/output data through the existing bundle validator;
- non-identical create-only persistence;
- missing canonical evidence without creating a terminal record.

The assembly accepts no raw chat, media bytes, local paths, URLs, credentials,
commands, prices, provider claims, browser-local completion, or truth-shaped
caller evidence.

## Ownership

The canonical backend work graph and five existing shared owners remain the
only sources of work and owner evidence. The canonical postrender visual-QA and
private-review owners remain the only sources of review evidence. Caption gains
no scheduling, dispatch, provider, model, asset, final-QA, credit, billing,
public-delivery, or production authority.

No second work graph, dispatcher, review owner, or terminal owner was added.

## Verification

The focused canonical terminal smoke now passes 17 assertions. It proves two
source rereads, two review rereads, create-only bundle replay, terminal-service
consumption, caller-injection refusal, changed-between-reread refusal, and
closed authorities.

Full server typecheck passes with the repository's established 8 GB Node heap.
The initial default 4 GB attempt exhausted memory after the focused smoke had
already passed; that was a tooling-memory limit, not a TypeScript failure.

## Remaining actual evidence

Both source readers remain fail-closed until actual canonical records from one
common private run exist. The current evidence progress therefore remains:

- 41/41 Caption source paths ready;
- five actual-evidence gates with independently observed evidence;
- 0/9 terminal gates satisfied by one exact run;
- 0/41 jobs terminally qualified.

Public SaaS production, billing activation, and the central Orchestra are not
required for the private internal target.
