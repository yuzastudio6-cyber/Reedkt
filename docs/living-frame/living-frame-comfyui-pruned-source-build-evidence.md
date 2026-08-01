# Living Frame ComfyUI pruned source-build evidence

Status date: 2026-07-30

Historical status: this checkpoint remains immutable audit evidence. The later
`living-frame-comfyui-pruned-no-sam2-source-build-evidence-v1` image rebuild
supersedes it for private L4 image selection by removing the unused inherited
direct-VCS `sam-2` distribution and repeating every complete scan.

## Disposition

The source-defined, network-disabled pruned ComfyUI image build completed from
feature commit `b871bfee33837f00eac297a1f05e866246e9abb0` and exact parent
digest
`84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b`.
The resulting Linux AMD64 image is
`12,657,934,444` bytes, defaults to UID/GID `65532:65532`, retains the fixed
runner entrypoint, contains 33 runtime distributions, and contains no model
weights.

Strict runtime verification passed with a read-only root filesystem, all
capabilities dropped, no-new-privileges, no network, a bounded no-exec tmpfs,
the `sam2` import denial, and the exact hardened Torch/CUDA package matrix.
No model load or graph execution occurred.

This evidence makes the image eligible for the next private internal L4 review
stage from the image-security perspective. It does not ingest the image into a
canonical repository, mount the five model roles, grant operation or dispatch
authority, execute a GPU, create an asset or cost receipt, or approve billing,
public delivery, or production.

## Complete image scan

Pinned Trivy `0.72.0` was used by exact image digest. The complete OS and
Python vulnerability scan produced:

- 877 findings across two result targets;
- zero critical findings;
- zero high findings;
- 745 medium findings;
- 132 low findings;
- 398 findings with a fixed version and 479 without one; and
- 227 unique vulnerability identifiers.

The critical/high admission gate passes. Full vulnerability clearance remains
false pending explicit medium/low disposition.

The SPDX 2.3 SBOM contains 691 packages and 1,432 relationships:

- 498 OS packages;
- 191 Python packages;
- one OCI package; and
- 137 packages whose declared or concluded license remains `NOASSERTION`.

The complete full-file license scan found 6,718 license observations across
five result targets:

- 809 restricted observations;
- 24 reciprocal observations;
- 567 unknown observations;
- 5,294 notice observations; and
- 24 unencumbered observations.

Those scanner categories are license-review signals, not vulnerability
severities. They do not grant or deny a legal license by themselves. Manual
package/source/file disposition remains mandatory, and license approval stays
false.

## Frozen evidence boundary

The typed evidence stores only exact digests, byte counts, package and finding
counts, security observations, and closed authority flags. It does not store
local paths, report bytes, model bytes, prompts, credentials, commands, URLs,
or customer pricing.

Open gates are:

1. medium/low vulnerability disposition;
2. full manual license disposition;
3. direct-VCS distribution disposition;
4. signed image and provenance-attestation verification;
5. canonical private image ingestion;
6. canonical atomic five-model mount distribution;
7. real private L4 graph execution and resource receipt; and
8. private output persistence, alpha/continuity/fact QA, and review.

The source-build evidence is compiled by
`server/living-frame/living-frame-comfyui-pruned-source-build-evidence.ts`
and verified by
`smoke:living-frame-comfyui-pruned-source-build-evidence`.
