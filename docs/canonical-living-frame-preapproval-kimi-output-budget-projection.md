# Canonical Living Frame Kimi output-budget projection

## Status

`REQUEST_SPECIFIC_OUTPUT_BUDGET_VALIDATED_TRANSPORT_BLOCKED`

The server can now narrow the existing Kimi MFJS provider schema to the exact
current Living Frame semantic request and calculate a conservative upper bound
for the canonical JSON result. The same record proves that the largest
currently observed Kimi input and completion charges remain below the existing
server-owned internal-cost ceiling.

This is not a Kimi request body, approved completion-token ceiling, live model
probe, credential read, submission, response, or transport authorization.

## One result contract

The projection does not create a second result DTO. The canonical
`living-frame-semantic-scene-proposal-result-v1` Zod schema and its semantic
cross-validator remain the only acceptance authorities.

The provider-only schema starts from the exact MFJS projection and narrows:

- decision kinds to those requested by the current semantic payload;
- scene modes to the current allowed modes;
- segment and evidence references to exact current IDs;
- safe generated identifiers to 96 characters;
- ordinary derived summaries to 160 characters and the scene summary to 200;
- result cardinality to one bounded preapproval scene; and
- per-scene structure to the fixed profile below.

| Field | Provider-only maximum |
| --- | ---: |
| decisions | 4 |
| scene proposals | 1 |
| segment contexts per scene | 1 |
| components | 8 |
| component dependencies | 28 |
| mini-skill activations | 12 |
| semantic timing constraints | 5 |
| attention constraints | 5 |
| semantic scale constraints | 8 |
| semantic sound constraints | 6 |
| QA expectations | 19 |

Eight components represent one focal group plus seven supporting groups.
Twenty-eight dependencies are the complete directed-acyclic pair bound for
eight groups. Twelve activations permit eight component-oriented activations
plus four orchestration or QA activations. Timing and attention retain their
complete five-value semantic phase vocabularies, scale permits one entry per
component, and sound retains all six semantic purposes.

The one-scene profile is an adapter policy, not an assertion that a multi-scene
source is complete. Multi-scene batching and aggregation remain unauthorized.

For the controlled current request, the provider schema is 15,161 stable-JSON
bytes with SHA-256
`1183ba843a61b535f18e5ab757d5ae851fed27a6dbd732e6918ece52bd5948ce`.
The existing controlled Musashi result satisfies this narrower schema without
changing the result object.

## Canonical JSON byte bound

The bound calculator operates on a canonical-profile mirror that preserves the
original regex and literal constraints. It counts:

- every required object property;
- every array at its maximum;
- the longest serialized enum member;
- a conservative 32 UTF-8 bytes for every unrestricted finite number;
- six UTF-8 bytes per unrestricted Zod string code unit, covering escaped
  surrogate worst cases; and
- one byte per character only for the canonical ASCII safe-ID and SHA-256
  patterns.

It deliberately does not use graph, focal-primary, reference, or semantic
cross-validation rules to make the number smaller. For the controlled request,
the resulting canonical minimal-JSON upper bound is **118,246 UTF-8 bytes**.

This does not bound every equivalent raw JSON lexeme. Extra whitespace,
unnecessary escapes, or unusual numeric spellings can consume more output
tokens. A truncated or invalid response must fail closed; it is never repaired
into authority.

## Controlled tokenizer observation

The public source observation pins
[`moonshotai/Kimi-K3`](https://huggingface.co/moonshotai/Kimi-K3) revision
`9f62e4e9fffbd0a83ddd60e1c209d828994b3569`, last modified
2026-07-27T16:29:18Z.

The observed tokenizer artifacts are:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `tokenization_kimi.py` | 16,145 | `f28ea66e2d862a2a5814970b2ce40c2f7d8296ff09aed90a7e7def689b906944` |
| `tokenizer_config.json` | 3,478 | `5d0803c94db9cd78763499e0956c95fd5a225c14a727e5a6cf5db3f96f010a6e` |
| `tiktoken.model` | 2,795,286 | `b6c497a7469b33ced9c38afb1ad6e47f03f5e5dc05f15930799210ec050c5103` |

The mergeable-rank file has 163,584 entries and contains all 256 one-byte
tokens. For this observed byte-level tokenizer, any visible UTF-8 text has no
more tokenizer tokens than UTF-8 bytes because every byte is independently
representable and merges can only reduce token count.

That theorem is controlled source evidence only. The Kimi API exposes the
mutable `kimi-k3` alias without an immutable model revision, so the record
explicitly sets current API-tokenizer equivalence to false. It also does not
bound chat framing or hidden reasoning tokens.

## Completion ceiling and headroom

The current official API observation reports a default
`max_completion_tokens` value of 131,072. The projection records 131,072 as a
candidate hard cap and compares it with the controlled visible-JSON bound:

```text
131,072 proposed completion tokens
-118,246 controlled visible-JSON token upper bound
-------------------------------------------------
  12,826 observed-tokenizer headroom
```

Kimi reasoning tokens share the completion ceiling. No current evidence proves
that 12,826 tokens are sufficient for hidden reasoning or that the live API
alias uses the observed public tokenizer. Therefore:

- `completionTokenCeilingAuthority = false`;
- `hiddenReasoningTokenSufficiencyAuthority = false`;
- `currentApiTokenizerAuthority = false`; and
- a bounded live target-model schema/completion probe remains mandatory.

The provider body is still not created.

## Conservative internal-cost proof

The calculation consumes the current immutable reasoning rate-card identity and
the prepared run's exact 5,000,000 normalized-USD-micro internal budget. It
uses a deliberately conservative full-context cache-miss input bound rather
than relying on the not-yet-created provider body:

| Bound | Calculation | Cost micros |
| --- | --- | ---: |
| input | 1,000,000 tokens × 3,000,000 / 1M | 3,000,000 |
| completion | 131,072 tokens × 15,000,000 / 1M | 1,966,080 |
| combined | conservative sum | 4,966,080 |
| authorized | prepared internal budget | 5,000,000 |
| remaining | authorized − combined | 33,920 |

This overcounts input because it treats the whole context window as
cache-miss input even while separately charging the full completion ceiling.
The calculation is internal cost only. It creates no customer price, service
fee, credit estimate, reservation, wallet mutation, or actual attempt receipt.
The current rate card must be reread before transport.

## Remaining blockers

Transport still requires:

1. current official API and public tokenizer-source reread;
2. proof that the current account's API model uses the reviewed tokenizer, or
   an approved alias-change policy;
3. current account access and an immutable model revision;
4. a bounded live MFJS schema and completion probe;
5. transport qualification of the candidate completion ceiling;
6. distributed one-use attempt state;
7. least-privilege provider credential capability; and
8. unknown-outcome operator reconciliation.

No provider call, cloud mutation, database mutation, billing action,
deployment, or push occurred. GPU-heavy inference remains restricted to
qualified Google Cloud Run GPU workers; this projection executes no model and
adds no CPU fallback.
