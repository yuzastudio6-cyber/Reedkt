# Living Frame canonical offline ComfyUI image private internal test

Status: exact offline package materialization, image build, and confined
installed-layout verification passed; SBOM, vulnerability, signature, L4, and
release gates remain closed.

## Scope

This host-specific proof consumes the exact source/package contract frozen by
canonical backend commit
`bffa1ec0632fe26cd72ec4b8fe373bdcb38e353b`. It does not copy the backend
worktree, change the shared registry or operation router, or grant dispatch,
asset, cost, billing, public-delivery, or production authority.

The private build inputs were:

- 35 exact Linux `amd64` wheels, totaling `486,459,097` bytes, with every
  digest matching `requirements.lock.txt`;
- deterministic Git archives for ComfyUI revision
  `093d571b83e7a79833200e199b46b9f5a62217f9`, generic IP-Adapter revision
  `b188a6cb39b512a9c6da7235b880af42c78ccd0d`, and
  `comfyui_controlnet_aux` revision
  `e8b689a513c3e6b63edc44066560ca5919c0576e`; and
- the canonical no-argument installer, layout verifier, fixed runner,
  model-path projection, and source locks from `bffa1ec0`.

All three generated Git archives matched the locked byte lengths and SHA-256
values exactly:

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| ComfyUI host | 44,175,360 | `dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948` |
| Generic IP-Adapter extension | 778,240 | `8565104c6a20e2e092bc895a72b8dcf588c0165f0de0f4f01dc0f735d2af50ec` |
| ControlNet auxiliary extension | 49,551,360 | `6ab94365c94e7c4a02be19d1ad5921c5ac490c0539bd1b38fc0d1516225d9b4e` |

## Built image

The private internal image is:

```text
reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0
```

The bounded build used the already measured local GPU foundation
`reeditpro/ai-graphics-gpu-worker:proof-local` at SHA-256
`8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4`.
One builder stage installed the exact offline closure; a separate runtime
stage copied only the installed operation root, excluding the wheelhouse and
source archives.

Measured local identity:

```text
SHA-256: 84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b
Architecture: linux/amd64
Image bytes: 11,392,910,414
Default identity: 65532:65532
Production qualified: false
```

The fixed entrypoint is:

```text
/opt/reeditpro/gpu-operations/comfyui/venv/bin/python
-I
-B
/opt/reeditpro/gpu-operations/comfyui/runner.py
```

The build-time installer and final-image layout verifier both passed. The
host-specific smoke then reran the verifier with:

- a read-only root filesystem;
- network disabled;
- all Linux capabilities dropped;
- `no-new-privileges`;
- default UID/GID `65532:65532`; and
- an ephemeral, bounded `/tmp`.

It also verified the exact installed runner, requirements lock,
source-provenance lock, model-path projection, and layout-verifier digests.
The layout contains exactly the two reviewed custom-node source trees and no
model weights. Runtime downloads and production qualification remain false.
The bounded build definition was supplied directly to the local Docker
builder and is not a canonical released Dockerfile. Freezing and reviewing
the final release build definition remains a canonical backend-owner gate.

## Honest scanner result

The local Docker Scout SPDX attempt did not complete. The scanner tried to
copy/index the 11.4 GB image in the host temporary volume and stopped with
`no space left on device` after creating an incomplete 3.1 GB cache. That
incomplete scanner cache was deleted; the image and verified build inputs
were preserved.

This is a scanner-environment failure, not an SBOM pass and not an image
failure. Independent SBOM, vulnerability, license/VCS, provenance, and
signature disposition therefore remain open.

## Remaining gates

This proof closes the former exact offline build-input and private-local image
build gap. It does not prove:

- an independently reviewed, signed, or released image;
- canonical distributed read-only model mounts;
- a real NVIDIA L4 model load or selected-scene generation;
- output persistence or re-read;
- resource/cost evidence;
- alpha, continuity, fact, destination, manifest, or private-review QA;
- canonical operation dispatch;
- customer billing, public delivery, or production readiness.

The next internal execution gate remains one exact selected-scene L4 attempt
using all five model roles and the canonical server-derived request.
