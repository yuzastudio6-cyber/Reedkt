# Living Frame Alpha Measurement

## Status

This source slice is a server-side measurement primitive. It is not a new QA
plan, approval gate, worker, queue, provider route, tool registry, renderer, or
production qualification.

The primitive accepts server-owned RGBA bytes and emits a bounded,
content-free report that canonical artifact QA may consume in a later
authorized integration. It never accepts URLs, paths, credentials, provider
choices, tool choices, commands, or caller-authored thresholds.

## Why this exists

Living Frame depends on true transparent components. A rectangular generated
image, a checkerboard drawn into opaque pixels, a contaminated matte edge, or
an invalid premultiplied-alpha asset must not be treated as a usable overlay.

The existing Living Frame planning contracts correctly require alpha QA but
do not inspect artifact bytes. This primitive begins the byte-derived
measurement layer without claiming that measurement alone approves an asset.

## Fixed measurement profile

`fixed_rgba_artifact_measurement_v1` records:

- transparent, semi-transparent, and opaque pixel distributions;
- border transparency and opacity;
- non-transparent bounds and edge contact;
- opaque-rectangle risk;
- a two-tone opaque-pattern score for fake checkerboard diagnostics;
- matte-color contamination among semi-transparent edge pixels;
- premultiplied-alpha channel violations;
- abrupt alpha-transition ratio;
- edge contrast over black, white, mid-gray, and saturated red; and
- optional edge contrast over a same-size server-owned destination raster.

The output contains no raw pixels. It binds an existing artifact identity and
artifact digest supplied by the server-owned artifact authority, records a
separate digest of the exact decoded RGBA bytes that were measured, records a
digest of the optional destination RGB raster, and then hashes the canonical
report for tamper detection. Artifact-file bytes and decoded RGBA bytes are
different identities and must not be conflated.

## Authority boundary

Every report states literal false for:

- planning, timing, SoundSync, estimate, cost, approval, and snapshot
  authority;
- provider, tool-route, work-graph, queue, render, and runtime-promotion
  authority; and
- production authority.

The report uses
`controlled_non_promotable_alpha_measurement`. Canonical artifact QA must
independently reread the actual artifact, verify its lineage, run the
measurement, interpret the findings through the one QA authority, and bind
the result to the approved snapshot and work item. A caller-supplied report
cannot approve an asset.

## Current limitations

The first profile does not prove:

- subject or character identity;
- fine-hair or fabric-detail retention against a reference matte;
- hidden-area reconstruction;
- temporal mask stability;
- motion-blur edge quality;
- color-spill correction quality beyond a known matte-color diagnostic;
- destination-composite correctness across a complete video sequence; or
- production suitability of SAM 2, BiRefNet, rembg, or any controlled
  illustration candidate.

Those remain separate artifact, temporal, model-weight, privacy, license, and
canonical QA gates.

## Integration sequence

```text
approved snapshot and named work item
  -> server-owned artifact reread
  -> exact RGBA byte/digest verification
  -> Living Frame alpha measurement
  -> canonical artifact QA interpretation
  -> asset manifest/reconciliation update
  -> approved fallback or downstream Remotion readiness
```

This sequence must reuse the existing artifact QA, work graph, manifest,
fallback, Remotion, and private-review systems. The measurement primitive
must never become a parallel gate.
