# Canonical Living Frame Kimi preapproval request material

## Status

The server can now deterministically compile the exact prepared Living Frame
semantic request and first-attempt reservation into private Kimi K3 request
material. This is an internal adapter boundary, not a provider API request,
transport, credential read, submission, observation, result, or cost record.

## Inputs and lineage

The compiler accepts only:

1. the verified canonical prepared reasoning run; and
2. its exact verified first-attempt reservation.

It revalidates the reservation against the prepared run and current semantic
admission before compiling anything. The output binds:

- the prepared-run and provider-envelope digests;
- the attempt-reservation digest and attempt identity;
- the provider-neutral payload and strict output-schema digests;
- route authorization and one-use submission idempotency digests;
- route-data assurance; and
- the controlled internal-budget admission.

The exact route remains `kimi_k3_primary` using model ID `kimi-k3`. The old
Kimi-to-GPT route, Qwen2.5-VL substitution, caller-selected providers, and
media-provider operations cannot enter this boundary.

## Internal material

The material contains two structured internal messages:

- one fixed server-owned instruction requiring exactly one strict JSON object
  and forbidding hidden reasoning or downstream authority; and
- the already validated provider-neutral Living Frame payload.

It also carries the exact strict scene-proposal JSON schema, an empty tool
tuple, no sampling overrides, no streaming request, no raw transcript, and no
raw media. The canonical byte length and SHA-256 are recomputed from stable
JSON.

This material is process-bound. It is not browser-shareable, loggable, or
persisted by this module. Compilation also does not prove that its source
authority is still current at a later transport boundary. A transport service
must reread the prepared run, reservation, source evidence, speech evidence,
and route-data assurance immediately before any separately authorized request.

## Intentionally unqualified provider details

The current source does not claim a reviewed live Kimi API contract or an
immutable provider model revision. Those fields remain exactly `null`, and the
following gates remain explicit:

- provider API contract qualification;
- immutable provider model revision and aggregate identity;
- current source-authority reread at the transport boundary;
- a distributed durable reasoning lifecycle;
- provider credential capability; and
- one-use submission authority.

A later transport slice must translate the internal material through a
reviewed provider API adapter, bind an immutable current model/API identity,
reserve a durable provider-request record under distributed CAS, consume one
submission authority exactly once, and reconcile an unknown outcome before it
can issue a fallback.

## Closed authority

Compilation does not create a provider API body, provider-request record,
credential, provider call, observation, checkback, fallback, attempt cost,
reasoning result, selected scene, timing, SoundSync, estimate, customer price,
credits, approval, snapshot, work graph, queue entry, tool route, render,
runtime, or production authority.

GPU-heavy model work remains restricted to qualified Google Cloud Run GPU
workers. This text-reasoning adapter performs no inference and introduces no
CPU fallback for any heavy local model.

## Verification

The focused lifecycle smoke proves:

- exact run, envelope, reservation, payload, schema, route, assurance,
  idempotency, and budget lineage;
- deterministic replay;
- fixed instruction and empty-tool behavior;
- provider API and model-revision fields remain unqualified;
- material is neither persisted nor browser-shareable;
- correctly re-digested payload detachment is rejected; and
- forged API qualification, model revision, credentials, submission,
  provider-call, or all-green production authority is rejected.
