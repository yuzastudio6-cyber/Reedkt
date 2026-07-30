# Source-Led Chat Kimi/Terra Runtime

Status: private internal runtime verified; edit execution remains approval-gated.

## Active route

The source-led edit chat uses this exact ordered route:

1. `kimi-k3` through `kimi_k3_primary`
2. `gpt-5.6-terra` through `gpt_5_6_terra_fallback`

Kimi remains the primary chat model. GPT-5.6 Terra is invoked only after an
eligible terminal Kimi result:

- credential unavailable;
- model unavailable;
- provider rate limit;
- provider timeout or unknown outcome;
- transient provider failure; or
- malformed structured output.

An explicitly rejected Kimi credential is terminal and does not cascade into
another provider call. The stored exchange preserves the safe Kimi attempt
evidence and the exact fallback trigger.

## Credential boundary

Both credentials are server-only and loaded from explicitly versioned Google
Cloud Secret Manager references:

- `projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2`
- `projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/2`

No raw provider credential is copied into frontend environment variables,
persisted chat records, logs, receipts, or canary output. Local private testing
uses the installed `gcloud` identity; non-local execution uses workload
identity.

## GPT-5.6 Terra request boundary

The fallback uses the OpenAI Responses API with:

- model `gpt-5.6-terra`;
- `store: false`;
- low reasoning effort for the bounded acknowledgement task;
- strict structured output;
- no tools;
- a 1,024-token output ceiling;
- a 60-second outcome-unknown boundary;
- hashed safety and cache identifiers; and
- no claims that editing, rendering, generation, approval, or credit mutation
  occurred.

The returned assistant text is accepted only when the strict payload confirms
that the direction was saved while execution, plan creation, and credit
changes remain false. Provider error bodies are discarded without logging.

## Evidence

The controlled smoke verifies credential caching, the exact request envelope,
strict response parsing, unsafe completion refusal, eligible fallback,
terminal credential rejection, failed-fallback lineage, usage reconciliation,
and stored receipt validation.

The private live transport canary completed on 2026-07-30 using the pinned
OpenAI secret version:

- route: `gpt_5_6_terra_fallback`;
- model: `gpt-5.6-terra`;
- provider and model calls observed: true;
- input tokens: 345;
- output tokens: 65;
- total tokens: 410;
- assistant content observed but deliberately not serialized; and
- plan creation, edit execution, and credit mutation: false.

This proves the private source-led fallback transport and structured response
boundary. It does not prove source-media analysis, plan compilation, work-graph
execution, rendering, or final delivery.

## Remaining routing reconciliation

The broader canonical reasoning policy still contains historical
Kimi → Qwen → DeepSeek head-routing records. A separate versioned migration
must make GPT-5.6 Terra the active head-reasoning fallback while retaining Qwen
only for explicitly assigned specialist or compatibility roles. Frozen
historical records must not be silently relabeled.
