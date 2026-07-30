# Controlled ComfyUI GPU package inputs

This directory defines the source-controlled portion of the offline ComfyUI
package used by Living Frame controlled illustration. It does not contain
model weights, source archives, wheel binaries, credentials, or a runtime
download path.

The package represents one GPU-hosted operation:

`tool.comfyui.generate_controlled_image.v1`

That operation may use five capabilities during the same attempt:

1. ComfyUI host execution.
2. ControlNet auxiliary preprocessing.
3. ControlNet conditioning.
4. Generic IP-Adapter conditioning.
5. PEFT/LoRA loading.

They are capabilities inside one GPU attempt, not six new tool identities and
not five separately billed attempts. AuraFace is excluded and remains an
optional, separately metered CPU continuity check.

`Dockerfile.local-confinement-candidate` and
`local-candidate-confinement-entrypoint.py` are a separate internal-test-only
compatibility wrapper for the exact already measured local image. They prove
default non-root startup, a fixed entrypoint, environment scrubbing,
operation-scoped `sam2` denial, the two-node allowlist, and container
confinement under CPU emulation. They do not implement the canonical offline
package layout, mount model artifacts, run inference, authorize dispatch, or
define the released L4 image.

## Offline build inputs

The future canonical image build must receive, through a reviewed build-input
authority:

- the exact 35 Linux `amd64` wheel files listed by
  `requirements.lock.txt`;
- the exact ComfyUI source archive declared by `source-provenance.lock`;
- the exact generic IP-Adapter extension source archive;
- the exact ControlNet auxiliary extension source archive.

The wheelhouse installation must use all of:

```text
--no-index
--no-deps
--require-hashes
```

Repository metadata is excluded. The runtime must not use `pip`, Git, model
hubs, package indexes, or network downloads.

`install-offline.sh` is the fixed build-time installer. It accepts no
arguments or caller-selected paths. It requires the package inputs under
`/opt/reeditpro/build-inputs/comfyui`, verifies the exact wheelhouse count and
byte total, verifies all three source-archive byte lengths and SHA-256
identities, installs the locked wheels with `--no-index --no-deps
--require-hashes`, and creates the exact package layout expected by the
server-owned process supervisor:

```text
/opt/reeditpro/gpu-operations/comfyui/
├── venv/
├── source/
├── custom_nodes/
│   ├── ComfyUI_IPAdapter_plus/
│   └── comfyui_controlnet_aux/
├── runtime/
├── verify-installed-layout.sh
└── extra_model_paths.yaml
```

The installer finishes by running `verify-installed-layout.sh`. The verifier
accepts no arguments and checks the fixed Python and package versions, exact
two-node allowlist, exact empty runtime directories, read-only source trees,
copied lock-file hashes, empty private input directory, and absence of baked
model files under the fixed model-artifact root. It is a build-time image
layout gate only; it does not qualify the image, mount runtime artifacts, run
inference, or authorize production.

The model-path file maps only fixed operation directories beneath
`/mnt/reeditpro/model-artifacts`. The installer does not copy model weights
into the image. The future canonical operation consumer must project each
verified single-use artifact from the existing canonical read-only source
authority into its server-selected role directory; a caller cannot choose a
path.

## Runtime boundary

The server-side process supervisor owns the fixed executable, source root,
loopback address, port, private input/model locations, custom-node allowlist,
CUDA device, startup deadline, bounded logs, and cleanup. Callers cannot
override commands, arguments, environment variables, paths, URLs, endpoints,
credentials, model locations, custom nodes, or download policy.

The fixed isolated Python bootstrap also installs a server-owned meta-path
guard that denies the inherited top-level `sam2` module and every `sam2.*`
submodule before loading ComfyUI. This guard is specific to the controlled
ComfyUI operation; it does not change or authorize ReeditPro's separately
governed SAM 2 mask/tracking operation. The source contract binds the exact
denied-import set and rejects an empty or relaxed policy.

The model artifacts are not baked into this directory. They must be supplied
through the canonical checksum-verified, read-only model-artifact mount
authority. The generated result is opaque PNG only; transparency requires the
existing segmentation/matting, edge-decontamination, alpha-QA, destination
composite, asset-manifest, and private-review chain.

All five model sources must be presented through one atomic canonical
mount/host session. Their verified source callbacks stay open while the
backend adapter creates the fixed read-only mounts, starts the one supervised
ComfyUI process, executes the one prompt, captures its result, and stops the
process. Only after shutdown may the callbacks unwind and reverify every
canonical object. A preflight mount receipt or direct private loopback call is
not execution evidence. The source contract for this boundary is
`living-frame-controlled-sdxl-comfyui-canonical-mount-host-session.ts`; the
distributed/container mount adapter and L4 qualification remain open.

## Closed gates

These source files do not authorize:

- installation into the shared GPU image;
- a canonical operation-router entry;
- cloud dispatch or a GPU attempt;
- model-artifact ingest or mounting;
- provider calls;
- actual-cost or customer-credit records;
- output persistence or asset-manifest mutation;
- QA approval, rendering, delivery, or production use.

The image still requires a clean pinned build, vulnerability scan, signature,
L4 startup and generation benchmarks, exact model compatibility checks,
license review, official resource-cost evidence, and canonical private
end-to-end review. The pruned source-build candidate now removes the exact
inherited direct-VCS `sam-2` distribution at build time after validating its
revision and complete installed file set; the resulting digest and removal
still require independent scan/evidence before canonical admission.

The internal compatibility wrapper also currently needs bounded stop
escalation under Apple-host CPU emulation. Its receipt preserves that finding
and keeps the released process-shutdown contract open.
