# Living Frame AuraFace Artifact Requirements

Status: exact controlled artifact-identity expectation implemented; bytes,
runtime, legal approval, continuity measurement, cost evidence, and production
gates closed.

AuraFace is the sixth Living Frame controlled-illustration capability. It is a
separate, optional post-generation continuity measurement—not a ComfyUI node,
image generator, identity-conditioning adapter, or likeness approval system.

## Exact controlled artifact set

The contract binds the existing controlled source observation at revision
`af6d057c9b0ec4071d4c49c80e3539258798b609` and records only the two artifacts
needed for face detection/alignment and embedding comparison:

| Role | Controlled identity | Byte length | SHA-256 |
| --- | --- | ---: | --- |
| Embedding measurement | `glintr100_onnx` | 260,694,151 | `a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60` |
| Face detection and landmark alignment | `scrfd_10g_bnkps_onnx` | 16,923,827 | `5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91` |

The exact identities are dated controlled observations from the pinned
Hugging Face repository metadata:

- <https://huggingface.co/fal/AuraFace-v1/tree/af6d057c9b0ec4071d4c49c80e3539258798b609>
- <https://huggingface.co/fal/AuraFace-v1/blob/af6d057c9b0ec4071d4c49c80e3539258798b609/glintr100.onnx>
- <https://huggingface.co/fal/AuraFace-v1/blob/af6d057c9b0ec4071d4c49c80e3539258798b609/scrfd_10g_bnkps.onnx>

They are not downloaded, ingested, independently rehashed, mounted, or loaded
by this slice. The gender/age model and other repository files are excluded.
No URL, filename, host path, artifact bytes, or embedding enters the
browser-shareable contract; only closed identity codes and digests do.

## Measurement-only policy

The eventual operation may compare an approved reference embedding with a
candidate embedding. It may not:

- generate or condition a face;
- approve a likeness, identity, or historical truth;
- turn an illustrative interpretation into verified history;
- serialize or persist embedding bytes;
- persist an identity reference through this contract;
- use one universal threshold across projects or demographics; or
- silently pass no-face or multiple-face inputs.

No-face and multiple-face cases require review. Thresholds require
project-specific calibration and fairness evaluation.

## Legal and safety boundary

The pinned model card labels the repository Apache-2.0 and describes commercial
training data, intended use, limitations, demographic variance, and privacy
responsibility. Those are publisher statements, not independent proof of
weight origin, training-data rights, consent, or production suitability.

The repository's unresolved provenance discussion reinforces the need for a
fail-closed legal review:

- <https://huggingface.co/fal/AuraFace-v1/blob/af6d057c9b0ec4071d4c49c80e3539258798b609/README.md>
- <https://huggingface.co/fal/AuraFace-v1/blob/af6d057c9b0ec4071d4c49c80e3539258798b609/LICENSE.md>
- <https://huggingface.co/fal/AuraFace-v1/discussions/8>

Real-person use still requires explicit consent, public-figure and documentary
safety review, minor protection, anti-impersonation safeguards, retention and
deletion policy, access control, and demographic fairness review.

## Runtime and cost lineage

The intended placement is a bounded private CPU continuity-QA attempt using
the existing workflow-neutral model-artifact repository and read-only mount
authority. Runtime downloads and network fetches remain forbidden. InsightFace
preprocessing/runtime code, ONNX Runtime, the detector/embedding pairing,
confinement, and performance must be qualified independently.

AuraFace is excluded from the shared ComfyUI L4 attempt and, when actually
used, is one separate CPU measurement attempt. Exact reusable continuity
evidence adds no new attempt. Failed and unknown attempts must remain
attributable through the existing internal tool-cost authority. This contract
contains no price, credits, service fee, reservation, wallet, or ledger data.

## Closed gates

Current source truth, legal review, training-data rights, consent, artifact
ingest/mount, dependency lock, operation registration, dispatch, completion,
actual-cost receipt, customer estimate, scene selection, MasterTiming,
SoundSync, approval, snapshot, work, queue, asset manifest, identity approval,
QA approval, rendering, runtime, and production authority all remain false.
