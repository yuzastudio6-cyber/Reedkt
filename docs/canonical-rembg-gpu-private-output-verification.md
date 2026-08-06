# Canonical rembg GPU Private-Output Verification

## Outcome

WeEditPro now has the bounded server-only seam that rereads the three fixed
files described by a structurally verified rembg GPU result:

1. `mask.png`;
2. `mask-analysis.json`; and
3. `mask-qa-measurement.json`.

The seam does not accept caller bytes, caller paths, URLs, or credentials.
A server-created, process-bound reader supplies the fixed private outputs once.
After every receipt, byte length, digest, PNG pixel, metric, and lineage field
has been recomputed, a separate process-bound consumer receives cloned bytes
out of band. The serialized verification receipt contains no output bytes or
host path.

This adds no tool. The production registry remains exactly 50 tool identities,
and `rembg` remains one of those 50.

## Grayscale PNG Verification

The mask decoder accepts only the runner's exact bounded profile:

- PNG signature;
- one first-position `IHDR`;
- source-exact width and height;
- 8-bit grayscale color type `0`;
- standard compression and filtering;
- non-interlaced rows;
- contiguous `IDAT` chunks;
- exact `IEND` and no trailing bytes;
- valid CRC for every chunk;
- no unknown critical chunks; and
- an inflated byte length of exactly `(width + 1) * height`.

All five PNG row-filter modes are reversed with the correct one-byte grayscale
pixel stride. The verifier then recomputes:

- decoded mask SHA-256;
- minimum and maximum mask values;
- unique-value count;
- zero, partial, and 255 pixel populations;
- population accounting against exact dimensions; and
- the count at the fixed `0.5` / byte-value `128` threshold.

Constant masks and masks with no partial values fail closed. Wire-reported
metrics cannot substitute for the decoded pixels.

## Process-Evidence Verification

Both JSON files must use the exact stable byte encoding emitted by the pinned
runner. Whitespace variants, duplicate representations, unknown keys, malformed
UTF-8, schema changes, and reordered QA gates fail closed.

`mask-analysis.json` must bind the exact source-artifact PNG digest, decoded
source RGBA digest, mask digest, source dimensions, recomputed mask populations,
fixed confidence threshold, and recomputed threshold population.

`mask-qa-measurement.json` must bind the exact analysis and mask digests and
declare the existing two QA gates:

```text
mask_edge_quality
mask_subject_coverage
```

The file remains measurement-only. `qaPassAuthority` must be literal `false`.
An empty finding list is not treated as a canonical QA pass.

## Process-Bound Ports

The output reader and verified-output consumer are both genuine only inside the
creating Node process. Object spread, structured cloning, JSON serialization,
or a second use cannot reproduce their authority.

The reader is bound to the exact admission digest, runtime request binding,
dispatch intent, response digest, mask digest, analysis digest, and QA
measurement digest. It is consumed before reading. The consumer is consumed
before delivery. Reader, consumer, digest, file-set, and callback failures all
fail closed.

The current evidence classes remain either a controlled source fixture or a
fixed GPU subprocess whose release qualification is still open. This seam does
not claim a live Cloud Run attempt.

## Authority Boundary

Implemented:

- exact runtime-result candidate reread;
- process-bound one-shot output reader;
- process-bound one-shot verified-output consumer;
- full grayscale PNG decode and pixel recomputation;
- exact output receipt length and digest verification;
- exact stable JSON evidence recomputation;
- source, mask, request, response, and dispatch lineage binding; and
- byte-free serialized verification receipts.

Still required:

- canonical worker and completion receipts;
- released Cloud Run image, service identity, IAM, and actual L4 execution;
- private mask artifact persistence and immutable manifest commitment;
- independent edge-quality and subject-coverage QA;
- artifact reconciliation into the existing asset manifest;
- attempt GPU-active and internal-cost evidence; and
- downstream work, caption/SoundSync, Remotion, private review, and final
  composition admission.

This verification grants no artifact, QA, work, queue, manifest, approval,
snapshot, render, runtime, or production authority. CPU fallback remains
forbidden.

## Focused Evidence

Run:

```bash
npx tsx \
  server/smoke/canonical-rembg-cloud-run-gpu-execution-admission-smoke.ts
```

The smoke uses a deterministic source-sized grayscale mask and exact runner
evidence bytes, verifies out-of-band consumer delivery, and adversarially
rejects CRC damage, unsupported critical chunks, copied/replayed capabilities,
receipt drift, consumer failure, and process-level QA-authority promotion.
