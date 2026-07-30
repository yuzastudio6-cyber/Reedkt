# Living Frame ComfyUI hardened runtime closure internal test

Status date: 2026-07-30

Status:
`ephemeral_dependency_and_import_compatibility_verified_image_not_built`

## Purpose

This private-only slice closes the critical/high Python runtime package
selection gap discovered in the canonical ComfyUI image. It does not release
or dispatch a GPU runtime.

The exact parent remains:

```text
reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0
sha256:84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b
```

The parent uses the canonical fixed ComfyUI runner from backend commit
`bffa1ec0632fe26cd72ec4b8fe373bdcb38e353b`, runs as UID/GID
`65532:65532`, and denies `sam2` imports inside the operation.

## Closure correction

The earlier four-artifact hardening matrix was a valid starting point but not
a complete installable replacement. The parent also contains
`torchaudio 2.5.1+cu124`, whose metadata requires `torch==2.5.1`.

The private internal closure therefore adds:

- `torchaudio 2.6.0+cu124`, requiring `torch==2.6.0`;
- Pillow `12.3.0`, the fixed version from the frozen vulnerability report;
- Transformers `5.5.0`, the fixed version for both frozen Transformers
  findings;
- the complete exact Transformers `5.5.0` dependency subgraph used by Python
  3.10; and
- `exceptiongroup 1.3.1`, which AnyIO requires on Python 3.10.

The runtime keeps `packaging 23.2` because the inherited DeepFilterNet package
requires `packaging<24`. The runtime-unnecessary `wheel` distribution is
removed after the offline install, eliminating its conflicting
`packaging>=24` requirement. The obsolete Ubuntu `python3-pip`,
`python3-setuptools`, and `python3-wheel` packages are purged so their old
metadata cannot remain an active runtime package.

## Exact build inputs

Three simultaneously read-only wheel mounts are required:

| Mount | Wheels | Purpose |
| --- | ---: | --- |
| Hardened core | 4 | Torch, TorchVision, Triton, cuSPARSELt |
| Remediation | 2 | TorchAudio and Pillow |
| Transformers closure | 27 | Transformers and its exact Python 3.10 dependency subgraph |

All 33 archives are individually SHA-256 locked in the three committed
manifests. The installer:

- accepts no arguments;
- requires build-root;
- verifies every mount is read-only from `/proc/self/mountinfo`;
- verifies exact wheel counts;
- verifies every archive SHA-256;
- uses `--no-index`, `--no-deps`, and `--no-cache-dir`;
- performs no runtime download;
- removes runtime-unnecessary build packages;
- requires `pip check` to pass; and
- reruns the canonical installed-layout verifier.

## Real bounded compatibility result

The exact closure was installed into an ephemeral writable container overlay
derived from the frozen parent while:

- network mode was `none`;
- all three package inputs were read-only bind mounts;
- the container was CPU-, memory-, and process-bounded;
- no model, source media, prompt, credential, provider, or cloud resource was
  mounted;
- no ComfyUI graph was executed; and
- the container was removed after the test.

The final non-root verifier observed:

```text
UID/GID: 65532:65532
Torch: 2.6.0+cu124
Torch CUDA build: 12.4
TorchVision: 0.21.0+cu124
TorchAudio: 2.6.0+cu124
Pillow: 12.3.0
Transformers: 5.5.0
Hugging Face Hub: 1.5.0
pip check: no broken requirements
canonical runner digest: unchanged
canonical layout-verifier digest: unchanged
sam2 import denial: preserved
```

This proves package, import, lineage, and dependency compatibility under the
measured CPU-emulated container. It does not prove CUDA inference, checkpoint
compatibility, node-schema compatibility, or generated-image quality.

## Local image-build boundary

Docker Desktop BuildKit did not resolve the locally stored linux/amd64 parent
as a `FROM` source and attempted a registry lookup instead. The source
Dockerfile therefore retains an explicit host precondition: the local parent
tag must resolve to the exact frozen image digest before any build starts.

No hardened image was created by this slice. The canonical backend owner may
replay the build where its image source is available through a controlled
local/OCI build context.

## Still open

- source-bound hardened image build;
- complete independent merged-filesystem SBOM and vulnerability scan;
- OS, filesystem, license, VCS, signature, and provenance disposition;
- canonical private package repository ingest and distributed mounts;
- Torch 2.6 SAM2 checkpoint/load/inference regression;
- Torch 2.6 ComfyUI node-schema and five-model graph regression;
- real L4 resource, output, persistence, QA, and private-review evidence.

Operation registration, dispatch, asset creation, cost admission, customer
billing, public delivery, and production remain false.
