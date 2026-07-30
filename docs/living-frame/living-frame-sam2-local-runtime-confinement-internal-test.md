# Living Frame SAM2 Local Runtime-Confinement Internal Test

Status: `controlled_non_promotable_local_runtime_passed`

## Outcome

The existing local Linux/amd64 GPU-worker proof image contains an importable
SAM2 runtime matching the selected internal candidate:

- parent image SHA-256:
  `8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4`;
- SAM2 source revision:
  `2b90b9f5ceec907a1c18123530e92e794ad901a4`;
- selected native Meta config SHA-256:
  `0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55`;
- source license SHA-256:
  `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`;
- SAM2 distribution version `1.0`;
- Torch `2.5.1+cu124`;
- TorchVision `0.20.1+cu124`; and
- CUDA build `12.4`.

The internal test derives a model-free compatibility wrapper from that exact
local parent, installs a fixed Python entrypoint, and runs it under Docker
Desktop Linux/amd64 CPU emulation. It proves source/config/runtime packaging
and local confinement. It does not load a checkpoint or run SAM2 inference.

## Fixed Local Launch

The wrapper defaults to UID/GID `65532:65532` and accepts no caller command or
arguments. The smoke starts it with:

- `--platform linux/amd64`;
- network `none`;
- read-only root;
- every Linux capability dropped;
- `no-new-privileges`;
- `256` process limit;
- `1` CPU;
- `2 GiB` memory;
- one `256 MiB` no-exec temporary filesystem; and
- no bind or model mounts.

The entrypoint clears the inherited environment and rebuilds an exact offline
environment. It verifies the source record, source revision, license, selected
config, SAM2 package, native video-predictor builder, Torch, TorchVision, and
CUDA build before exposing a loopback-only readiness endpoint.

## Adversarial Coverage

The smoke rejects:

- any caller argument;
- a root UID/GID override;
- an unexpected `.pt` model mount;
- a changed source revision;
- a changed source/license/config/direct-source digest;
- a different SAM2/Torch/TorchVision/CUDA version;
- an absent native video-predictor builder;
- a writable root or weakened host confinement;
- model, checkpoint, inference, output, dispatch, cost, billing, public, or
  production claims; and
- reuse of the process-bound one-shot observation port.

The evidence receipt contains no path, URL, prompt, credential, checkpoint
bytes, media bytes, or output bytes.

## Honest Boundary

Passing this test proves only that the model-free SAM2 source/config/runtime
can start inside the measured local confinement boundary.

It does not prove:

- canonical signed/scanned image release;
- the approved `184,416,285`-byte checkpoint repository ingest;
- read-only checkpoint distribution or mount;
- exact source-config/checkpoint deserialization;
- NVIDIA L4 availability;
- CUDA inference;
- private source/prompt reads;
- temporal mask creation;
- mask edge, coverage, contact-object, or temporal-stability QA;
- resource/cost evidence;
- canonical dispatch, artifact persistence, or private review; or
- customer/public/production readiness.

Canonical backend commit `576ca54b` separately freezes the correct
FFmpeg-to-SAM2 work admission. That commit and this local runtime observation
still need later one-writer reconciliation with the dependent Living Frame
chain. Neither authorizes execution.

## Run

```bash
npm run smoke:living-frame-sam2-local-runtime-confinement-internal-test
```

When the exact parent image is unavailable, the smoke skips rather than
building or downloading a substitute.
