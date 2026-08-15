# Canonical private ComfyUI operation package

This directory is the source-controlled, offline package and runtime boundary
for one private GPU operation:

`tool.comfyui.generate_controlled_image.v1`

The operation may load ComfyUI, `comfyui_controlnet_aux`, one ControlNet,
generic IP-Adapter/CLIP Vision, and one PEFT/LoRA adapter during the same
supervised process. Those are in-process capabilities, not separate tool
identities or separately charged attempts. AuraFace is not part of this GPU
operation.

The released image must materialize the exact 35-wheel and three-source
closure described by the lock files without network access, then expose the
fixed layout under `/opt/reeditpro/gpu-operations/comfyui`. Model weights are
never baked into the image: the five exact model objects are mounted read-only
under `/mnt/reeditpro/model-artifacts` for one attempt and rehashed before and
after inference.

`runner.py` accepts one strict server-compiled JSON request on stdin. It owns
the fixed loopback ComfyUI process, submits exactly one allowlisted API graph,
captures one `SaveImageWebsocket` PNG, verifies the opaque output, and writes
it create-only beneath `/mnt/reeditpro/private-output`. The response contains
digests and measurements only.

The runtime must be non-root UID/GID `65532:65532`, read-only, capability-free,
no-new-privileges, network-disabled, and provided only ephemeral writable
operation roots. The operation-scoped import guard denies inherited `sam2`.
There is no active SAM2 operation: immutable historical records remain
readable only through their original evidence contracts, while every new
segmentation/tracking plan uses the separately qualified SAM 3.1 owner path.

These sources do not authorize a production registry entry, dispatch, model
ingest, customer charge, asset-manifest mutation, QA approval, public
delivery, or production promotion. Those remain downstream canonical gates.
