# Living Frame controlled SDXL benchmark result binding

Status: controlled, subject-neutral threshold evaluation. This contract does
not execute ComfyUI, attest a GPU attempt, create internal cost evidence, or
qualify the exact model bundle.

## Purpose

The benchmark specification defines seven cases and eleven fixed thresholds.
The request blueprint defines the unresolved inputs for those cases. This
binding defines how a future server-owned observation can be validated and
evaluated without letting caller JSON fabricate live execution.

An observation is accepted only through a process-bound reader created inside
the server process. The service reads it twice and requires both full values
and digests to match. The serialized result contains no reader capability.

## Cross-checks

The observation must contain:

- all seven case observations in specification order;
- load-integrity and network-off values only on the load probe;
- one controlled output-observation digest for each generation case;
- decoded-output and finite-pixel values on every generation case;
- bounded duration and peak-memory measurements;
- all eleven metric observations in threshold order; and
- exact specification and request-blueprint lineage.

The evaluator cross-checks aggregate metrics against the case observations:

- exact model-load integrity and network confinement match the load probe;
- decoded-output and finite-pixel booleans summarize all generation cases;
- peak memory is the maximum across all cases;
- cold-load duration matches the load probe; and
- warm-generation duration is the maximum generation-case duration.

Effect and replay metrics are retained as bounded controlled observations and
evaluated against the specification thresholds.

## Passed thresholds are not production approval

The source smoke includes one all-passing and one intentionally failing
controlled fixture. Neither represents a released GPU attempt. Even when all
eleven controlled thresholds pass, the result keeps these fields false:

- released GPU attempt;
- canonical metric attestation;
- canonical internal attempt-cost evidence;
- exact bundle compatibility;
- LoRA/base mismatch resolution;
- selected scene;
- promotion permission; and
- production readiness.

A correctly re-signed all-green forgery still fails because verification
rereads the process-bound observation and recreates the result from the
revalidated specification and request blueprint.

## Pricing boundary

This result contract does not change Living Frame pricing. The controlled
illustration generation graph remains one shared GPU-host attempt, while
AuraFace remains an optional separate CPU continuity measurement. Actual
cost exists only after the canonical attempt-cost authority records a real
completed, failed, or unknown attempt. Failed and unknown costs remain
internal and non-billable under the existing settlement contract.

## Subject neutrality

The evaluator knows only benchmark cases, metrics, and capability
composition. It has no person, vehicle, place, map, historical event,
documentary topic, or example-specific branch.

## Closed gates

Before this result can contribute to a compatibility decision, the canonical
backend must still provide:

1. a registered ComfyUI controlled-image operation;
2. a signed, dependency-locked GPU image and distributed private mount;
3. server-owned fixtures and private request materialization;
4. current installed-node schema verification;
5. a released GPU attempt receipt;
6. canonical metric attestation and actual internal-cost evidence;
7. explicit exact-bundle and LoRA/base compatibility disposition;
8. license and paid-use approval; and
9. selected-scene, approved-snapshot, work, asset, QA, and private-review
   binding.
