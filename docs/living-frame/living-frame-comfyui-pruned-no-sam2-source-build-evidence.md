# Living Frame ComfyUI pruned no-SAM2 source-build evidence

Status date: 2026-07-30

## Disposition

The source-defined pruned ComfyUI image was rebuilt from feature commit
`8f88f6d702781aec64b5b5795fc12c65619d93b0` after removing the unused
inherited direct-VCS `sam-2` distribution. This evidence supersedes
`living-frame-comfyui-pruned-source-build-evidence-v1` for the private image
candidate while retaining the earlier checkpoint as audit history.

The resulting Linux AMD64 image:

- has digest
  `51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e`;
- is `12,657,937,701` bytes;
- defaults to UID/GID `65532:65532`;
- retains the fixed supervised runner;
- contains 33 approved runtime distributions and no model weights; and
- retains the runner's fail-closed `sam2` import denial.

Strict verification passed with a read-only root filesystem, all capabilities
dropped, no-new-privileges, no network, and a bounded no-exec tmpfs. No model
was loaded and no graph was executed.

## Exact direct-VCS removal

The build helper first validates the exact inherited distribution before
removal:

- name `sam-2`;
- version `1.0`;
- source revision `2b90b9f5ceec907a1c18123530e92e794ad901a4`;
- metadata license `Apache 2.0`;
- 114 installed files; and
- installed-file-list digest
  `e0056305b664ab9f54cf1b4a7f5886a6bcacb389195fe8f1c07aee3547b8e468`.

It may remove only `sam2`, `training`, and `sam_2-1.0.dist-info`. The final
image verifier proves the distribution metadata, `sam2` module, and `training`
module are absent. The repeated SPDX SBOM contains zero exact `sam-2` package
identities, and the repeated license report contains zero observations owned
by that package or its removed paths. The separate Living Frame SAM2 operation
is unaffected.

This closes the inherited direct-VCS distribution disposition for this private
ComfyUI image. It does not grant legal approval for the rest of the image.

## Repeated complete image scan

Pinned Trivy `0.72.0` was used by exact scanner and target-image digests.

The complete OS and Python vulnerability scan produced:

- 877 findings across two result targets;
- zero critical findings;
- zero high findings;
- 745 medium findings;
- 132 low findings;
- 398 findings with a fixed version and 479 without one; and
- 227 unique vulnerability identifiers.

The critical/high admission gate passes. Full vulnerability clearance remains
false pending explicit medium/low disposition.

The SPDX 2.3 SBOM contains 690 packages and 1,431 relationships:

- 498 OS packages;
- 190 Python packages;
- one OCI package; and
- 137 packages with a declared or concluded `NOASSERTION` license.

The full-file license scan contains 6,716 observations:

- 809 restricted observations;
- 24 reciprocal observations;
- 567 unknown observations;
- 5,292 notice observations;
- 24 unencumbered observations;
- 1,924 OS-package observations;
- 190 Python-package observations; and
- 4,602 loose-file observations.

Scanner categories are review signals, not automatic legal decisions. Manual
package/source/file disposition remains mandatory, and license approval stays
false.

## Frozen evidence boundary

The typed evidence records immutable digests, counts, verification flags, and
closed authority flags. It serializes no local paths, report bytes, model
bytes, prompts, credentials, commands, URLs, or customer-pricing data.

Open gates are:

1. medium/low vulnerability disposition;
2. full manual license disposition;
3. signed image and provenance-attestation verification;
4. canonical private image ingestion;
5. canonical atomic five-model mount distribution;
6. real private L4 graph execution and resource receipt; and
7. private output persistence, alpha/continuity/fact QA, and review.

The image is eligible for the next private internal L4 review from the
image-evidence perspective. This checkpoint does not register an operation,
dispatch work, mount models, execute a GPU, create an asset or cost receipt,
charge a customer, deliver publicly, or approve production.

The contract is compiled by
`server/living-frame/living-frame-comfyui-pruned-no-sam2-source-build-evidence.ts`
and verified by
`smoke:living-frame-comfyui-pruned-no-sam2-source-build-evidence`.
