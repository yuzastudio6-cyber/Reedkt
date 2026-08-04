# Canonical Living Frame Kimi API contract observation

## Status

`SOURCE_OBSERVED_REQUEST_SHAPE_COMPATIBLE_TRANSPORT_BLOCKED`

The server now has a controlled, content-addressed observation of the current
official Kimi K3 Markdown and OpenAPI sources captured on 2026-07-27. It also
has a deterministic compatibility assessment between that observed API shape
and the existing private Living Frame Kimi request material.

This is not a live-source reader, provider API request, credential read,
submission, response, cost receipt, or runtime qualification.

## Official source set

The observation pins exact byte lengths and SHA-256 values for ten official
documents:

1. Kimi K3 quickstart;
2. Chat Completions API;
3. Structured Output;
4. Reasoning Effort;
5. API Overview;
6. API Errors;
7. Automatic Reconnection;
8. List Models;
9. the complete OpenAPI document; and
10. Kimi K3 pricing.

The captured OpenAPI document declares version `1.0.0` and maps model
`kimi-k3` to its K3-specific Chat Completions request schema. Because provider
documentation can change, these hashes are historical controlled evidence,
not current transport authority. A future transport must reread the current
official source and compare it with a separately reviewed current-source
record.

## Compatible request mapping

The observed API shape supports a deterministic mapping from the current
internal material:

- `POST https://api.moonshot.ai/v1/chat/completions`;
- server-held bearer authentication;
- `model = "kimi-k3"`;
- the fixed system instruction as a UTF-8 string;
- the provider-neutral payload serialized as stable canonical JSON in the user
  message string;
- top-level `reasoning_effort = "max"`;
- `stream = false`;
- `response_format.type = "json_schema"`;
- `response_format.json_schema.strict = true`;
- the exact existing strict output schema;
- omitted empty tools; and
- omitted fixed K3 sampling fields.

Only `choices[0].message.content` is eligible for final JSON parsing.
`reasoning_content` must not be parsed as the result or retained by this lane.
A successful canonical response must later require exactly one expected
choice, `finish_reason = "stop"`, a strict-schema-valid result, and reconciled
usage evidence. `length` and `tool_calls` cannot be accepted as a Living Frame
semantic result.

The compatibility assessment does not create the API body. It binds only the
request-material digest, source-observation digest, output-schema digest, and
OpenAPI document digest.

## Exact blockers

### Mutable model identity

The official List Models response documents model ID, creation timestamp,
owner, context length, and capability flags. It does not document an immutable
provider model revision or model aggregate hash. The `created` timestamp is not
treated as model-revision authority. Therefore `kimi-k3` matches the canonical
route name, but it is not an immutable runtime identity.

### No safe synchronous replay contract

The current Chat Completions operation documents neither an idempotency header
nor an idempotency request-body field. A completion ID is returned on a
successful response, but no synchronous Chat Completions retrieval endpoint is
documented. Batch retrieval is a different API and cannot reconcile an
unknown synchronous request.

The provider's reconnection example resubmits requests. ReeditPro must not copy
that behavior for a one-use, cost-bearing attempt. Once a canonical transport
may have submitted the request, a lost response must move the attempt to
unknown-outcome operator reconciliation. Automatic resubmission and fallback
remain forbidden.

### Schema and output ceiling

Strict Structured Output requires Moonshot Flavored JSON Schema. The official
documentation recommends static validation and an actual target-model
compatibility call. Neither has been completed for the exact Living Frame
schema.

K3 currently defaults `max_completion_tokens` to 131,072 and permits up to
1,048,576. The canonical request material does not yet carry an approved
completion-token ceiling. A future adapter must derive and bind a materially
smaller ceiling from the exact schema and internal-cost budget instead of
silently accepting the provider default.

## Runtime blockers

Transport remains blocked on all of the following:

1. current official-source reread;
2. authenticated current-account model availability;
3. immutable provider model revision or an explicitly approved mutable-alias
   policy with equivalent release evidence;
4. exact-schema MFJS validation;
5. a bounded live target-model schema probe;
6. a canonical completion-token ceiling;
7. a distributed one-use attempt lifecycle;
8. a least-privilege provider credential capability; and
9. unknown-outcome operator reconciliation.

The source observation cannot grant API-contract qualification, provider
request reservation, submission, transport, credential, provider-call,
observation, attempt-cost, fallback, customer price, credits, approval,
snapshot, work, queue, render, runtime, or production authority.

## Cost and execution boundary

The captured official pricing remains consistent with the existing internal
Kimi rate card: cache-hit input `$0.30`, cache-miss input `$3.00`, and output
`$15.00` per one million tokens. This observation does not update the rate
card, reconcile an invoice, calculate a customer price, or mutate credits.

No provider call, cloud mutation, database mutation, billing action,
deployment, or push was performed. GPU-heavy models remain restricted to
qualified Google Cloud Run GPU workers; this text API observation runs no
model locally and adds no CPU fallback.

## Verification

The focused lifecycle smoke proves:

- exact source-document identity, ordering, byte lengths, and digests;
- exact K3 endpoint, model, reasoning-effort, strict-schema, and non-streaming
  mapping;
- explicit omission of tools and fixed sampling fields;
- immutable revision, idempotency, retrieval, MFJS, live-probe, token-ceiling,
  credential, and lifecycle gates remain closed;
- a correctly re-digested source-document substitution fails;
- a correctly re-digested all-green compatibility packet fails; and
- no provider body, credential, call, transport, cost, commercial, or
  production authority appears.
