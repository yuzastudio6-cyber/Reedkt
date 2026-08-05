# SAM 3.1 research dossier

Status: verified against official source on 2026-08-04. This document records research; it does not authorize inference.

TRACK-26 reverified the official repository on 2026-08-05 UTC. `HEAD` and
`refs/heads/main` both still resolved to
`96914d2425f90a64f45ca977c2b5165418099543`; the pinned source is therefore
still current and no forward source revision is proposed. The official release
notes still identify Object Multiplex as the SAM 3.1 multi-object video path,
and the official checkpoint page still requires authenticated human access and
offers no hosted inference provider.

## Exact official authority inspected

- Meta repository: `facebookresearch/sam3`
- source revision: `96914d2425f90a64f45ca977c2b5165418099543`
- source tree: `573deb167702e014829a5b830de8ae62abe891d5`
- commit time: `2026-07-30T17:21:37-07:00`
- release: SAM 3.1, 2026-03-27
- checkpoint repository: `facebook/sam3.1`
- repository revision already pinned by ReeditPro: `daa63191845a41281374e725f4c9e51c7a824460`
- file: `sam3.1_multiplex.pt`
- official source hashes independently reproduced: license `4dea99bf...1be`, model builder `d71d6d3e...21c2`, base predictor `e6ac6122...36b`, multiplex predictor `15abe64b...d1c1`

The inspected source and hashes exactly match `canonical-sam3_1-source-runtime-candidate-v3`; no source update is proposed.

Official references: [release notes](https://github.com/facebookresearch/sam3/blob/main/RELEASE_SAM3p1.md), [source](https://github.com/facebookresearch/sam3), [checkpoint card](https://huggingface.co/facebook/sam3.1), [example notebook](https://github.com/facebookresearch/sam3/blob/main/examples/sam3.1_video_predictor_example.ipynb), and [license](https://github.com/facebookresearch/sam3/blob/main/LICENSE).

## Verified behavior

The recommended public entry point is `build_sam3_multiplex_video_predictor`. Object Multiplex jointly processes objects in fixed-capacity buckets; Meta reports approximately seven-times faster inference at 128 objects on one H100 compared with the November 2025 SAM 3 release. This is performance evidence, not a ReeditPro capacity or cost promise.

The public request interface supports:

- `start_session` over a source resource;
- `add_prompt` at any bounded `frame_index` with text, positive/negative points, boxes, labels, and an optional exact object ID;
- `remove_object`;
- `reset_session`;
- `cancel_propagation`;
- `propagate_in_video` in `forward`, `backward`, or `both` direction with a start frame and maximum tracked-frame count;
- idempotent `close_session` with explicit state clearing and optional CUDA cache reclamation.

TRACK-26 reread the exact pinned `Sam3BasePredictor` dispatcher. Its request
keys remain `frame_index`, `points`, `point_labels`, `bounding_boxes`,
`bounding_box_labels`, `obj_id`, `propagation_direction`,
`start_frame_index`, and `max_frame_num_to_track`. The Track All V2 worker maps
only server-compiled normalized prompts to those fields and translates global
authorized frames to the fixed chunk-local source proxy. It accepts no raw
request map from a caller.

The public notebook proves text prompting, point prompting, session reset, object removal, propagation, and close. The base predictor code proves box requests, cancellation, non-zero initialization, and bidirectional propagation. Mask tensors exist inside lower-level tracking code and the checkpoint card describes mask prompts generally, but the public multiplex request dispatcher does not accept a caller mask field. ReeditPro therefore accepts an approved brush-mask artifact only as grounding evidence and does not claim direct multiplex mask prompting until a versioned public entry point is qualified.

The runtime requires Python 3.12+, PyTorch 2.7+, and CUDA 12.6+. The current README example pins PyTorch 2.10/CUDA 12.8. The predictor enters CUDA bfloat16 autocast. FlashAttention 3 and `torch.compile` are optional optimizations and remain disabled in ReeditPro until separately qualified.

## Limits and hazards

- Meta's builder defaults `max_num_objects=16` and `multiplex_count=16`. ReeditPro treats both as bounded policy values, not universal capacity.
- Multi-bucket execution above 16 objects is possible in the architecture but requires explicit budgets and qualification.
- Source loading is resource-path based upstream; ReeditPro must translate an opaque private artifact lease to a fixed mount and must never accept caller paths or URLs.
- Sessions hold significant CUDA state. One writer, bounded TTL, cancellation, and close-on-every-terminal-path are mandatory.
- The official builder uses `strict=False` and prints missing/unexpected keys. ReeditPro forbids promotion unless a separate strict-load gate proves zero missing and zero unexpected keys.
- Public issue [#526](https://github.com/facebookresearch/sam3/issues/526) remained open when inspected and reports source/checkpoint key incompatibility. No guessed key rewriting is allowed.
- The Hugging Face checkpoint is gated, has no hosted inference provider, and requires a human to accept access conditions. Unauthenticated `git ls-remote` failed in this environment; no model bytes were downloaded.
- The SAM License requires legal, privacy, trade-control, redistribution, and checkpoint-term review. Repository metadata does not itself establish ReeditPro commercial approval.

## Track All conclusion

SAM 3.1 is the primary masklet engine behind model-neutral Track All artifacts, but the real route remains blocked until exact gated artifact ingest, strict source/checkpoint compatibility, immutable image, security, private-store, A100/L4, quality, performance, and cost evidence exist. Injected masklets may qualify the public lifecycle and deterministic downstream system only; they never qualify SAM inference.

TRACK-26 added a source-complete V2 private worker and server session owner but
did not run inference. The explicit canary preflight found 10 blocked external
gates, made zero SAM requests, performed zero GPU executions, incurred no paid
action, and produced no public artifact or production mutation.
