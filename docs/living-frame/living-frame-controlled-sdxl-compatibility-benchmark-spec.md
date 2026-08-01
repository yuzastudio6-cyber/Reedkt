# Living Frame controlled SDXL compatibility benchmark specification

`living-frame-controlled-sdxl-compatibility-benchmark-spec-v2` defines the
subject-neutral GPU evidence that the controlled illustration route must
produce before its exact model bundle can be treated as compatible.

This specification replaces the older design that depended on a separate
Living Frame preflight package and a separate Living Frame runtime-evidence
authority. It consumes the current canonical Living Frame contracts instead:

- the five-role controlled SDXL candidate set;
- the exact ComfyUI model-artifact requirement projection;
- the current stock ControlNet/LoRA graph plus generic IP-Adapter merged
  graph;
- the current model-family coherence binding; and
- the pinned offline ComfyUI dependency-lock evidence.

It is a deterministic specification only. It does not mount model bytes,
admit a GPU job, execute ComfyUI, measure output, create an asset, select a
scene, or authorize production.

## Seven required probes

The benchmark has one fixed ordered case set:

1. load all five exact artifacts with network access disabled;
2. generate a base-only baseline;
3. compare the same-seed LoRA result with the baseline;
4. compare the same-seed ControlNet result with the baseline;
5. compare the same-seed generic IP-Adapter result with the baseline;
6. generate with the complete five-artifact graph; and
7. replay the complete graph with the same seed.

The isolated probes change one controlled capability at a time. ControlNet,
generic IP-Adapter, and LoRA therefore must demonstrate a measurable effect
without one capability hiding another. The complete pair proves that the
combined graph can run and replay deterministically.

All cases use:

- 1024 by 1024 output;
- `dpmpp_2m`;
- `karras`;
- 24 steps;
- CFG 5.5; and
- denoise 1.

The isolated probes use seed `19791104`. The combined primary and replay use
seed `420042`.

## Required measurements

The specification requires:

- exact model-load integrity;
- network-off confinement;
- decoded output validity;
- finite pixel population;
- replay normalized MAE at or below `0.005`;
- LoRA effect normalized MAE from `0.01` through `0.35`;
- ControlNet edge-F1 improvement of at least `0.1`;
- generic IP-Adapter reference-similarity improvement of at least `0.05`;
- peak GPU memory at or below `23000 MiB`;
- cold bundle load at or below `300000 ms`; and
- warm generation at or below `180000 ms`.

These are admission thresholds, not evidence that the bundle has passed.
Only a future canonical GPU attempt and result binding may populate the
measurements.

## Fixture boundary

The specification records three subject-neutral fixture recipes:

- conditioning text supplied later through a server-owned bounded fixture;
- a deterministic Canny control image; and
- a deterministic reference image for generic IP-Adapter.

The contract contains recipe identities and digests only. It contains no raw
prompt, image bytes, path, URL, filename, credential, provider ID, tool ID,
operation ID, work item, queue item, cost event, or commercial route.

Musashi, helicopters, Hormuz, or any other story subject are not encoded in
this benchmark. They remain examples of what the general Living Frame system
may visualize, not routing rules or test fixtures.

## Still-closed gates

Before execution, a later admission binding must independently revalidate:

- the exact five-artifact canonical repository binding;
- the unresolved LoRA base-version observation;
- single-use read-only mounts;
- the signed and scanned dependency-locked GPU image;
- current GPU node schemas;
- server-owned fixture artifacts;
- GPU placement and no-CPU-fallback policy;
- canonical attempt and internal-cost evidence;
- license and paid-use review; and
- the existing approved snapshot, work, asset, QA, and private-review
  authorities.

This specification cannot promote any of those gates.
