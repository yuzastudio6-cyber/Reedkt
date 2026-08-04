# CAP-12 Living Frame V1/V2 Compatibility Correction

## Disposition

The published CAP-12 checkpoint reused the frozen V1 request, response, and
adapter identities for a materially different domain-ref schema. This follow-up
corrects that identity collision additively; the published commit is not
rewritten.

## Preserved V1

The exact frozen V1 Caption-owned public source was restored from its documented
working-tree receipt after verifying the supplied SHA-256 values:

| File | Verified SHA-256 |
| --- | --- |
| `src/types/caption-direction-living-frame.ts` | `04170d82b83db613c2e578849a2b32f6cb0676fdc7982f65a1477776373c78aa` |
| `src/lib/caption-direction/caption-living-frame-adapter.ts` | `9198601b7fb64bf9a16cdc0dd19d6e634f0fa3ba5578923201fc916fcf681e77` |
| `src/types/caption-direction.ts` | `c1f85365d2110343bd740b23d6c583d35e680355c1e79393afb250e908668ed0` |
| `src/lib/sha256.ts` | `2984e4d39bd832b40bceb40312db79bd9c358cd5b4dbdcf90553980f066b78b1` |
| `src/lib/caption-direction/closed-contract-validation.ts` | `85a0e3ffd2cb05313cb2cf4fb1267ab99bcda1a3e1f375d5b074cbc5ff32b8e8` |

The active branch keeps its newer, stricter neutral closed-tree validator. The
V1 adapter imports it through the exact one-line Caption re-export. The neutral
`picture-lock` type dependency is present only to satisfy the exact frozen
Caption public type surface. No Living Frame server implementation or broad
backup-tree content was copied.

V1 remains:

- `caption-direction-living-frame-request-v1`
- `living-frame-caption-direction-response-v1`
- `caption-direction-living-frame-adapter-v1`
- `caption-direction-living-frame-public-type-receipt-v1`

Its `sha256:<64 lowercase hex>` digest rules, approved-snapshot bindings,
staleness checks, exact confirmed-frame checks, closed authority boundary, and
one-request-to-multiple-scenes semantics remain unchanged.

## Separately versioned V2

The CAP-12 domain-ref schema is now:

- `caption-direction-living-frame-request-v2`
- `living-frame-caption-direction-response-v2`
- `caption-direction-living-frame-adapter-v2`

The new `caption-direction-living-frame-v1-v2-compatibility-binding-v1` bridge
requires both complete payloads. It validates each payload with its own parser,
then cross-checks their shared scope and lineage. It cannot synthesize one
version from the other because each version intentionally carries fields the
other does not.

V2 component and semantic-projection refs are nullable for non-supported
dispositions. Supported dispositions still require both refs and one or more
selected scenes. This preserves frozen V1 declined/blocked responses that omit
their optional component refs without weakening supported-response validation.

## Verification

The CAP-12 smoke passes 41 checks. It covers independent V1 and V2 validation,
explicit request and response compatibility bindings, exact V1 support-envelope
admission, two-scene selection preservation, and adversarial refusal of stale
digests, cross-frame evidence, stale compatibility bindings, and collapsed
multi-scene results. It also covers `declined_not_applicable` and
`blocked_stale_authority` in both directions with absent V1 component and
semantic refs, zero selected scenes, restored Caption ownership, and closed
authorities. Runtime, dispatch, asset, QA approval, billing, public
delivery, and production authority remain false.
