# Living Frame controlled SDXL benchmark request blueprint

Status: controlled, subject-neutral, non-executable source contract. It is
not a prompt, registered tool operation, provider request, work item, GPU
attempt, cost receipt, asset, approval, or production-readiness claim.

## Purpose

The compatibility benchmark specification defines what must be measured, and
the admission audit records why the current repository cannot execute it.
This blueprint fills the narrow gap between those two contracts and a future
private request materializer.

It projects the seven canonical benchmark cases into ordered requirements:

1. exact bundle load;
2. base-only generation;
3. isolated LoRA effect;
4. isolated ControlNet effect;
5. isolated generic IP-Adapter effect;
6. full combined generation; and
7. same-seed full-combined replay.

The blueprint does not include node-execution JSON. It lists only which
server-owned binding slots a future canonical operation must resolve.

## Binding slots

Model slots are drawn from the exact five-role SDXL candidate set:

- base checkpoint;
- ControlNet checkpoint;
- LoRA adapter;
- generic non-FaceID IP-Adapter checkpoint; and
- CLIP Vision checkpoint.

Generation cases additionally require server-owned positive and negative
conditioning. ControlNet cases require a server-owned control-image artifact.
Generic IP-Adapter cases require a server-owned reference-image artifact.

Every slot is emitted as `resolved=false` and `valuePresent=false`. The
serialized contract therefore contains no prompt text, image pixels, model
bytes, filesystem paths, URLs, filenames, credentials, commands, or
caller-selected operation/queue/job identifiers.

## Exact case projection

| Case | Model slots | Conditioning | Fixture image slots |
| --- | ---: | ---: | ---: |
| exact bundle load | 5 | 0 | 0 |
| base-only baseline | 1 | 2 | 0 |
| LoRA effect | 2 | 2 | 0 |
| ControlNet effect | 2 | 2 | 1 |
| generic IP-Adapter effect | 3 | 2 | 1 |
| full combined primary | 5 | 2 | 2 |
| full combined replay | 5 | 2 | 2 |

The ordered total is 41 unresolved binding slots. The two combined cases use
the same slot set and seed but remain distinct attempts so determinism can be
measured.

## Canonical authority boundary

The blueprint independently revalidates both the benchmark specification and
the current registry/artifact admission audit, then checks their exact
lineage. It deliberately does not repeat the expected ComfyUI tool or
operation identifier. Those identities belong to the existing canonical
controlled-illustration operation preflight and future shared operation
registry.

Current output remains:

- `canonicalOperationContractState=not_registered`;
- `requestMaterialized=false`;
- `dispatchReady=false`;
- `benchmarkExecuted=false`;
- `actualAttemptCostEvidencePresent=false`; and
- `productionReady=false`.

An all-green caller packet cannot promote those fields. Even a correctly
re-signed forged packet fails verification because the verifier recreates the
blueprint from the revalidated parents.

## Subject neutrality

The contract branches only on benchmark case and capability composition. It
has no person, vehicle, place, historical event, documentary topic, or visual
style branch. Musashi, helicopters, Hormuz, and other examples are not
fixtures or acceptance criteria.

AuraFace is not a generation binding slot. It remains a separate optional
post-generation continuity-measurement and QA capability.

## Closed gates

Execution still requires the existing canonical owners to provide:

1. exact canonical artifacts and read-only model presentation;
2. one registered ComfyUI controlled-image operation;
3. a dependency-locked, scanned, signed GPU image;
4. a distributed private model mount;
5. server-owned conditioning, control, and reference fixtures;
6. process-private binding-slot materialization;
7. current installed-node schema and allowlist verification;
8. a released GPU attempt and retained internal-cost evidence;
9. canonical metric attestation;
10. license and paid-use approval; and
11. selected-scene, approved-snapshot, work, asset, QA, and private-review
    bindings.

Until then, the blueprint cannot create a work item, call a provider, dispatch
a tool, reserve credits, render an asset, or claim compatibility.
