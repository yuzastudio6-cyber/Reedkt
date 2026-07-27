# Canonical Living Frame Kimi MFJS schema projection

## Status

`STATIC_MFJS_PROJECTION_VALIDATED_TRANSPORT_BLOCKED`

The server can now derive one deterministic Moonshot Flavored JSON Schema
projection from the exact canonical Living Frame semantic-result schema. The
projection is content-addressed and bound to the current prepared Kimi request
material, official API observation, and API-shape compatibility assessment.

This is not a Kimi request body, live target-model probe, credential read,
submission, response, or transport authorization.

## Why a provider projection is required

The canonical Zod-derived acceptance schema is 16,284 stable-JSON bytes with
SHA-256
`8f59cebee2f24d4c46b97e9f06ec2063f10ec0fa5f4983fdc02a52f99630b686`.
It contains:

- 13 `const` keywords used for contract and all-false authority literals;
- 24 `pattern` keywords used for safe IDs and SHA-256 values; and
- 39 existing `enum` keywords.

Moonshot's official Walle validator describes `const` as unsupported and
`pattern` as planned rather than supported. The exact canonical schema passed
Walle's provider-required permissive `strict` level, but failed its
comprehensive `ultra` level at the first `const`. A strict-only pass therefore
cannot honestly prove that all canonical constraints participate in provider
constrained decoding.

The provider projection applies exactly two transformations:

1. each `const` becomes a same-type singleton `enum`, which preserves the
   literal constraint; and
2. each `pattern` is omitted from provider constrained decoding and remains
   mandatory in the canonical post-parse acceptance schema.

No object property, required field, type, array cardinality, numeric bound,
text-length bound, or existing enum is changed. The projected schema is 15,145
stable-JSON bytes with SHA-256
`ad37256789c35be7a482caac420d7b3f1b5775f49fa4da05731684bc2d44635c`.
It contains 52 enums: the original 39 plus 13 singleton replacements.

The provider projection is deliberately wider than canonical acceptance only
where regex patterns were removed. It can help constrained decoding, but it
can never accept a result. Final content must still be parsed and revalidated
against the original canonical schema and the existing semantic
cross-validator. Invalid IDs, digests, authority literals, graph references,
or semantic relationships still fail closed.

## Controlled validator observation

The observation pins official repository
`https://github.com/MoonshotAI/walle`, release `v0.1.13`, commit
`196bb0ca9c2f2271cfa9623108308f0780e411ee`, and tree
`62bd4d8d001ab64d85fa5dfaeb6e6299cfbfe129`. It also pins the exact source,
rule-document, module, toolchain-archive, and locally built binary hashes used
for the controlled run.

Both stable-serialized schemas were checked with that exact source:

| Input | `strict` | `ultra` |
| --- | --- | --- |
| canonical acceptance schema | pass | fail on `const` |
| provider MFJS projection | pass | pass |

This is immutable controlled evidence captured on 2026-07-27. Runtime
verification recomputes the projection and record digests but does not execute
the external Go validator. A future transport must reread the current
official API and current Walle release before using the observation.

## Remaining blockers

Static projection validation does not close:

1. current official-source reread;
2. current Walle release reread;
3. authenticated current-account access to `kimi-k3`;
4. immutable model revision or an approved mutable-alias policy;
5. a bounded live target-model schema probe;
6. transport qualification of the request-specific
   `max_completion_tokens` candidate;
7. distributed one-use attempt state;
8. least-privilege credential capability; or
9. unknown-outcome operator reconciliation.

The server now derives a separate request-specific single-scene output profile,
canonical JSON byte bound, and conservative internal-cost ceiling without
weakening semantic validation. That closes the controlled static cardinality
and cost calculation only. The public tokenizer observation is not proven
equivalent to the current API alias, hidden reasoning shares the completion
ceiling, and no authenticated bounded target-model probe has run. A provider
request body therefore remains blocked. See
`docs/canonical-living-frame-preapproval-kimi-output-budget-projection.md`.

## Authority boundary

The record grants only deterministic provider-schema projection and controlled
static-validator-observation authority. Current validator, canonical result
acceptance, provider schema compatibility, live probe, token ceiling, API
qualification, model revision, request, submission, credential, transport,
provider call, attempt cost, fallback, commercial, approval, snapshot, work,
queue, render, runtime, and production authority remain false.

No provider call, cloud mutation, database mutation, billing action,
deployment, or push occurred. GPU-heavy inference remains restricted to
qualified Google Cloud Run GPU workers; this schema work executes no model and
adds no CPU fallback.
