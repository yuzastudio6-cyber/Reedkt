# Living Frame controlled SDXL benchmark admission audit

`living-frame-controlled-sdxl-benchmark-admission-audit-v2` joins the
subject-neutral compatibility specification to current canonical readiness
without creating a GPU job.

The audit accepts either:

- no exact artifact evidence, which is the current default and fails closed;
  or
- a server-revalidated exact five-artifact canonical binding plus a
  single-use read-only local model-source presentation.

When exact evidence is injected, the service independently revalidates all
five full-stream checksums and repository identities. It then requires the
read-only presentation to refer to the same artifact record, revision,
checksum, role, order, and aggregate byte length. Caller paths, URLs, model
bytes, mount aliases, and booleans cannot satisfy this branch.

## Current registry observation

The server currently observes:

- `comfyui` exists only in the non-E2E capability catalog;
- it is evaluation-only;
- its candidate profile requires a GPU and forbids CPU fallback;
- exact model-weight review remains required;
- it is not a `ProductionToolId`;
- `tool.comfyui.generate_controlled_image.v1` is not registered; and
- no private GPU runner is verified.

This is the intended intermediate state. ControlNet, generic IP-Adapter,
LoRA, and external control-image preparation remain capabilities inside the
one host attempt rather than fabricated tool identities. AuraFace remains a
separate continuity-measurement operation.

## Why exact artifacts are still not enough

The existing local read-only source-presentation contract proves lease
creation, single consumption, and pre/post checksum verification. It does
not prove a distributed private model mount inside a Cloud Run GPU worker.

Even after exact evidence is injected, the audit therefore remains blocked
on:

- LoRA base-version disposition;
- canonical ComfyUI production identity and operation;
- signed/scanned dependency-locked GPU image;
- distributed private model mount;
- current node-schema revalidation;
- server-owned benchmark fixtures;
- canonical GPU attempt and internal-cost evidence;
- measured benchmark result;
- legal and paid-use review; and
- existing selected-scene, snapshot, work, asset, QA, and private-review
  authorities.

The audit never produces a request, attempt, result, cost receipt, asset, or
production authority.
