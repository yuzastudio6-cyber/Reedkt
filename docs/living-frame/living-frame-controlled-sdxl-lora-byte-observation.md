# Living Frame controlled SDXL LoRA byte observation

Status: exact server-owned byte and safetensors-structure observation;
controlled, non-promotable, non-executable.

Contract:
`living-frame-controlled-sdxl-lora-byte-observation-v1`.

## Outcome

The retained controlled observation records a complete independent stream of
the pinned SDXL offset-example LoRA candidate and verified:

- 49,553,604 bytes;
- SHA-256
  `4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f`;
- a 364,180-byte safetensors JSON header;
- 2,364 tensors, all `F16`;
- 49,189,416 tensor-data bytes;
- contiguous, non-overlapping offsets from zero through the complete data
  section;
- every tensor span against its declared shape and two-byte `F16` element
  width;
- the complete sorted tensor-name set;
- 67 metadata keys; and
- exact header, metadata-key-set, and canonical metadata digests.

The exact-artifact smoke reruns that observation only when a server-owned
path is injected through `REEDITPRO_SDXL_LORA_MODEL_PATH`; otherwise it
reports a fail-closed skip and does not claim a new verification. The
artifact reader is process-bound. The serialized observation contains no
path, URL, filename, credential, locator, or raw byte. A copied or caller-
constructed reader cannot pass the capability gate, and the same reader
cannot be consumed twice.

## Material compatibility finding

The exact metadata declares:

| Field | Observed value |
| --- | --- |
| Architecture | `stable-diffusion-xl-v1-base/lora` |
| Base-model version | `sdxl_base_v0-9` |
| Resolution | `1024x1024` |
| Prediction type | `epsilon` |
| Network module | `networks.lora` |
| License text | `CreativeML Open RAIL++-M License` |

The candidate is hosted at the pinned SDXL 1.0 repository revision, but its
own metadata names the earlier `sdxl_base_v0-9`. Co-location and a matching
full checksum therefore do not establish exact compatibility with the
selected SDXL 1.0 base. The bundle must keep
`lora_metadata_base_version_compatibility_review_required` closed until a
controlled load and behavior benchmark resolves that discrepancy.

This is why Living Frame verifies artifact internals before admitting a
model bundle. A model filename or repository folder is not sufficient
compatibility evidence.

## Scope

This observation advances one artifact out of the five-artifact candidate
set:

- independently byte-verified artifacts: 1 of 5;
- safetensors schemas inspected: 1 of 5;
- complete bundle byte verification: false; and
- exact bundle compatibility: unproven.

The base checkpoint, ControlNet checkpoint, generic IP-Adapter checkpoint,
and matching CLIP Vision checkpoint still require independent full-byte and
schema verification.

## Authority boundary

The contract has authority only to report what was observed from the exact
server-owned byte stream. It does not:

- ingest or locate a canonical model artifact;
- install or mount a weight;
- load or execute the LoRA;
- qualify ComfyUI compatibility;
- approve licensing or paid production use;
- select a Living Frame scene;
- create timing, SoundSync, estimate, cost, approval, snapshot, work, queue,
  asset, QA, render, or runtime authority; or
- perform image generation.

The next artifact step is either independent verification of another pinned
candidate or controlled canonical-repository ingest of this exact object.
Neither step may silently promote the complete bundle.
