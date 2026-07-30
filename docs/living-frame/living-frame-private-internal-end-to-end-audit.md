# Living Frame private internal end-to-end audit

## Purpose

Run:

```text
npm run smoke:living-frame-private-internal-end-to-end-audit
```

This audit is the aggregate private internal checkpoint for Living Frame. It
does not reinterpret individual test evidence. It reruns the frozen planning,
contract, selected-scene, real-render, persistence, QA, private-review, and
fail-closed temporal-mask fixtures and requires every expected result.

The audit deliberately distinguishes:

- verified private internal execution;
- verified source and lineage contracts;
- an expected shared-interface conflict; and
- model runtimes that are still impossible to exercise safely because their
  approved artifacts or canonical discriminator do not exist.

It is not a customer-production readiness audit.

## Required cases

The aggregate audit executes:

1. canonical planning evidence and closed runtime authorities;
2. parent and reusable mini-skill contracts;
3. the subject-neutral capability matrix;
4. selected-scene private ComfyUI prompt materialization without dispatch;
5. selected-scene private operation-request compilation plus exact
   reconciliation into the canonical ComfyUI candidate-input shape without
   invoking the canonical compiler or dispatch;
6. exact partial vulnerability evidence for the canonical-offline ComfyUI
   image, including the fail-closed critical/high finding disposition and
   explicit absence of full-image or OS coverage;
7. the exact official Torch `2.6.0` / TorchVision `0.21.0` / Triton `3.2.0`
   / cuSPARSELt `0.6.2` shared-parent hardening candidate and current-parent
   dependency delta, without package download or build admission;
8. the sanitized local hardened derivative through strict non-root,
   read-only-root, zero-network verification, with its incomplete full-image
   scan and release denial preserved;
9. the exact digest-bound `docker save` archive-input scan attempt, its
   no-report timeout, and complete temporary artifact cleanup;
10. the source-defined pruned hardened image build, strict non-root
    verification, complete OS/Python vulnerability scan with zero
    critical/high findings, SPDX SBOM, and complete full-file license scan,
    while manual vulnerability/license and every execution authority remain
    closed;
11. a real Remotion render covering all five Living Frame modes, deliberate
   non-use, multiple depth styles, attention, caption priority, sound, and
   fallbacks;
12. real portrait and custom non-square confirmed-frame renders without square
   substitution;
13. the complete selected-scene PixiJS environmental-particle slice through
   Remotion, create-only persistence, media QA, and private-review evidence;
14. the real Musashi illustration through alpha, exact destination composite,
   base/sword-arm/hair/robe decomposition, deterministic bounded shoulder-plate
   reconstruction, a synchronized articulated strike, Remotion, captions,
   sound, media QA, and retained review frames;
15. real generated flat-editorial and paper-collage alpha fixtures through
   adaptive flat and shallow-2.5D Remotion scenes, measured spatial behavior,
   caption priority, create-only persistence, and retained review frames;
16. semantic sound timing reconciliation;
17. canonical private-review lineage;
18. the exact selected-scene source-video → normalized subject prompt → SAM2
    temporal-mask work-admission candidate;
19. the exact SAM2 runtime/parent/Torch vulnerability admission gate, including
    the required versioned hardened source/runtime replacement;
20. a real gray8 FFV1 temporal-mask output through decode, stability
    measurement, create-only persistence, and review frames; and
21. the exact temporal-mask work-graph conflict.

Every subprocess is bounded, uses the pinned workspace `tsx` executable, and
returns only an output digest plus structured status to the aggregate receipt.
The aggregate receipt does not expose artifact bytes, local paths, prompts,
credentials, commands, or customer pricing.

The aggregate includes a portable verifier for the exact frozen partial
vulnerability receipt. The actual image extraction and Trivy execution remain
host-specific adjacent evidence. When that exact image is present,
`smoke:living-frame-comfyui-local-confinement-internal-test` additionally
proves model-free startup with a default non-root derived image, fixed
entrypoint, scrubbed environment, `sam2` denial, the reviewed two-node
allowlist, read-only root, zero network, zero capabilities, and no prompt,
model, GPU, artifact, dispatch, or cost action. It does not discharge the
five-model/L4 gate, and the independently extracted metadata now blocks the
image pending a hardened rebuild and complete scan.

The adjacent shared-parent hardening candidate freezes the exact official
Torch `2.6.0+cu124`, TorchVision `0.21.0+cu124`, Triton `3.2.0`, and
cuSPARSELt `0.6.2` wheel identities plus the current-parent CUDA dependency
delta. It downloads no packages and does not claim a complete offline closure,
build, scan, compatibility result, or L4 admission.

The host-specific adjacent core-cache test has now downloaded and rehashed all
four artifacts, validated each ZIP archive, reproduced every embedded
distribution-metadata digest, and verified the wheel tags. Because the backup
volume still projects the files as owner-writable after `chmod`, the cache is
explicitly mutable and not build-admitted. Canonical repository ingest,
pre/post-consumer rehash, and an atomic read-only mount remain required.

A follow-on sealed ephemeral-container test found and corrected the missing
TorchAudio companion dependency, added the fixed Pillow and Transformers
packages plus the complete Python 3.10 Transformers subgraph, removed
runtime-unnecessary wheel tooling, and passed `pip check` plus non-root import
and canonical-runner-lineage verification. This is compatibility evidence,
not an image build, scan, model load, graph execution, or runtime admission.

When the exact five private model artifacts are also present,
`smoke:living-frame-comfyui-five-model-local-mount-internal-test` runs a
second adjacent bounded proof. It presents all five artifacts simultaneously
as individual read-only mounts, independently rehashes the complete
`11,700,367,157`-byte bundle inside one fixed-entrypoint container lifetime,
preserves the `sam2` import denial and full confinement policy, and stops at
the hard CUDA-required boundary with exit `78`. It submits no prompt, loads no
graph, performs no inference, creates no output, dispatch, cost, billing, or
production evidence. This closes the former local artifact-presence and
atomic-mount uncertainty; the released image, complete L4 load, generation,
resource receipt, persistence, and QA gates remain open.

`smoke:living-frame-comfyui-canonical-offline-image-private-internal-test`
runs a third host-specific ComfyUI proof. The exact 35-wheel/three-source
offline closure now builds successfully from canonical backend commit
`bffa1ec0`; both the installer and final-image layout verifier pass. The
11,392,910,414-byte `linux/amd64` image defaults to UID/GID `65532:65532`,
uses the fixed canonical runner entrypoint, contains the exact two reviewed
custom-node source trees, contains no model weights, and passes a read-only,
network-disabled, capability-free, no-new-privileges layout probe. The local
full-image scanners did not complete because Docker Desktop could not export
the 11.4 GB image within their bounded resource/time windows. A separate
network-off, read-only, non-root metadata extraction was independently scanned
with checksum-verified Trivy `v0.72.0`. It produced a 186-package SPDX 2.3
projection and found 40 unique Python findings, including one critical and
16 high findings. OS and full-filesystem coverage remain false. The current
image is therefore explicitly blocked pending a hardened rebuild, complete
Linux-host image scan, finding/license/VCS disposition, signature, distributed
mount, L4, output, resource, persistence, and QA evidence.

That former rebuild-and-scan gap is now narrowed by the adjacent
`living-frame-comfyui-pruned-source-build-evidence-v1` checkpoint. A
source-defined, network-disabled Linux AMD64 image was built from the exact
hardened parent and pruned closure, then verified under UID/GID `65532:65532`,
a read-only root, no network, no capabilities, and no-new-privileges. Pinned
Trivy `0.72.0` completed OS and Python vulnerability scanning with 877 total
findings and zero critical/high findings, emitted an SPDX 2.3 SBOM with 691
packages, and completed a full-file license scan with 6,718 observations.
Manual medium/low vulnerability, restricted/reciprocal/unknown license,
direct-VCS, signature/provenance, and canonical-ingest disposition remain
open. The evidence permits the next private L4 review from the image-security
perspective but does not itself dispatch, mount models, execute a graph, create
an asset/cost receipt, or grant customer/public/production authority.

When the exact two private AuraFace ONNX artifacts and a synthetic
single-person portrait are injected,
`smoke:living-frame-auraface-canonical-mount-host-session` runs the optional
CPU continuity-QA path as a third adjacent host-specific proof. It ingests the
exact 277,617,978-byte pair into the canonical model-artifact repository,
keeps both models mounted read-only during one network-isolated container
session, executes real detector, landmark-alignment, and 512-dimensional
embedding inference, verifies both objects before and after the consumer,
rejects post-inference mutation, and serializes no image, embedding, model
path, or mount path. This proves the private-local CPU execution path; it does
not approve identity, likeness, thresholds, fairness, privacy, distributed
mounts, actual cost, customer billing, public delivery, or production use.

The exact local GPU-worker proof image is likewise host-specific. When it is
present,
`smoke:living-frame-sam2-local-runtime-confinement-internal-test`
additionally proves the pinned SAM2 source revision, selected native Meta
config, Apache-2.0 license bytes, native video-predictor builder, Torch
2.5.1+cu124, TorchVision 0.20.1+cu124, and CUDA 12.4 build under a derived
fixed-entrypoint, non-root, read-only, zero-network, zero-capability
confinement. It rejects caller arguments, root override, and unexpected model
mounts. It loads no checkpoint, performs no inference, and does not discharge
the checkpoint/L4 gate. The fixed runner also requires Torch `2.5.1+cu124`.
The independently verified vulnerability evidence binds that exact version to
critical `CVE-2025-32434`, fixed in Torch `2.6.0`. Therefore a new versioned
SAM2 source/runtime contract with a compatible TorchVision/CUDA matrix,
hardened image, complete scan, and repeated checkpoint/runtime validation is
required before any real L4 attempt.

## Honest result

Passing this audit proves that the currently executable private Living Frame
pipeline works together across its selected-scene and renderer boundaries. A
pass must still report two open internal runtime gates:

1. exact ComfyUI controlled generation needs independent image disposition
   and real L4 execution evidence. Exact private-local five-model byte
   identity and simultaneous read-only mounting are verified; canonical
   backend commit `bffa1ec0` freezes the full-frame-capable
   runtime/source/router bridge and complete 15-node controlled graph. The
   feature chain now also consumes its existing private operation lease and
   reconciles canonical aliases, input-image dimensions, work-item hash, and
   pending dispatch/attempt lineage into an exact process-private
   `canonical-comfyui-gpu-runtime-request-candidate-v1` input lease without
   invoking or duplicating the canonical compiler. The exact offline package
   now builds into a fixed non-root private image.
   A checksum-verified partial metadata scan found one unique critical and 16
   unique high Python findings; full-image and OS coverage are still absent.
   The image is therefore blocked pending a hardened rebuild, complete
   independent Linux-host scan, finding/license/VCS disposition, signature,
   and complete L4 model load, output, resource, persistence, and QA evidence;
   and
2. advanced temporal Living A-Roll subject masking has an exact namespaced
   source-video/SAM2 work-admission candidate, a verified byte-output and
   downstream QA path, canonical backend work-graph admission frozen at
   `576ca54b`, and a fixed runner/router plus exact private checkpoint
   read-only-mount/CUDA-refusal handoff frozen at backend commit `3e59ce45`.
   That frozen runner requires vulnerable Torch `2.5.1+cu124`, so a versioned
   hardened parent plus compatible Torch/TorchVision/CUDA contract must be
   released and revalidated before model inference. It then still needs a real
   L4/CUDA run, private output persistence, a resource receipt, and measured
   mask QA.

These are genuine internal execution dependencies. They are not waived merely
because customer release is out of scope. Until both exist, the audit status is
`passed_with_explicit_blocked_model_runtimes` and
`internalEndToEndReadyForOwnerReview` remains false.

Customer billing, public delivery, and production authority remain false
throughout.
