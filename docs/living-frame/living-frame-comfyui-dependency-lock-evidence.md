# Living Frame ComfyUI dependency-lock evidence

Status: controlled, local, non-promotable evidence only.

This slice closes the earlier uncertainty about whether the observed ComfyUI
host depended on an unrepeatable `pip install` resolution. It does not release
a production runtime.

## What was locked

The controlled rebuild used the existing Linux amd64 Ubuntu 22.04 GPU-worker
base image with digest
`8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4`.
That base already contained Python 3.10.12, CUDA 12.4-family PyTorch, and the
shared GPU image-processing stack.

The exact ComfyUI delta was measured by comparing installed distribution
inventories between the base and the earlier temporary ComfyUI host. The delta
was 35 distributions and no changed or removed base distributions.

All 35 exact Linux amd64 wheel artifacts were downloaded without installation,
measured independently, and bound by:

- exact distribution name and version;
- exact wheel artifact name;
- exact byte length;
- exact SHA-256;
- an ordered 35-entry manifest digest;
- an exact total of 486,459,097 bytes.

The ordered wheel-manifest digest is:

`cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9`.

The following source archives were also created with `git archive` at the
already reviewed revisions:

| Source | Revision | Tree | Files | Bytes | Archive SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| ComfyUI | `093d571b83e7a79833200e199b46b9f5a62217f9` | `15652258f4c49f079158fd492479d379aedbc240` | 991 | 44,175,360 | `dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948` |
| Generic IP-Adapter extension | `b188a6cb39b512a9c6da7235b880af42c78ccd0d` | `8e16f8055ae089c28a68c2d9711c1d5d93bb52b8` | 35 | 778,240 | `8565104c6a20e2e092bc895a72b8dcf588c0165f0de0f4f01dc0f735d2af50ec` |
| ControlNet auxiliary extension | `e8b689a513c3e6b63edc44066560ca5919c0576e` | `d2ca43d24a80346e9604df26fb1f2d2db58bd07b` | 746 | 49,551,360 | `6ab94365c94e7c4a02be19d1ad5921c5ac490c0539bd1b38fc0d1516225d9b4e` |

Repository metadata was not copied into the rebuilt image.

## Offline rebuild

The controlled image was rebuilt with:

- Docker build networking disabled;
- only the exact local wheel artifacts available;
- pip index access disabled;
- pip dependency resolution disabled;
- the three exact source archives copied into the image;
- no model weights;
- no credentials or secret mounts;
- no provider, cloud, database, billing, or deployment action.

The resulting local candidate image digest is
`1de2c0415c477537dc4035a0550cec1859b8e5c5719647a64c0172962a770a64`.
It is not canonical, scanned, signed, deployed, or production-ready.

Its frozen Python inventory contains 168 lines. Because the 35 wheels were
installed from the offline wheelhouse, the frozen entries include their wheel
SHA-256 identities. The inventory digest is
`ae56ebd7ca96226994383da7a09c5a3b25b8d1424e863ee2ef9ef90f020fa738`.

## Runtime compatibility proof

The rebuilt candidate was run under controlled CPU emulation with:

- no network;
- read-only root filesystem;
- all Linux capabilities dropped;
- no new privileges;
- bounded CPU, memory, and process count;
- temporary output/cache filesystems only;
- no host data, model, credential, or secret mount.

The combined host exposed 920 node classes. The complete sorted node-name set
digest was
`1b0a6e1fb0e6e2d779705d6f005bdf0138fb62350a20a38f0ad5c5988e1f1454`.
The exact schemas of twelve selected stock and admitted extension nodes had
digest
`070e5fa7190218fe6fae2067915b6e5e751817308878e8d6de583b5b1df24dd0`.

Those twelve nodes cover:

- stock image input and output;
- stock ControlNet loading and application;
- stock LoRA loading;
- generic IP-Adapter model loading and application;
- Binary, Canny, Color, and Standard Lineart preprocessing.

Five subject-neutral 64 by 64 Prompt API graphs ran twice each:

| Probe | PNG SHA-256 | RGBA-pixel SHA-256 | Repeat |
| --- | --- | --- | --- |
| Stock empty image | `ec15c9fa32513d982029a8c661deb6317998b1fac1442c19f17983d9c3d022fb` | `723f9d9221380fadb5265868cc50aff79ce6bedb7fc597aee99c3e5a1b7624d9` | exact |
| Binary preprocessing | `2c1958477a6912519336db96d5b12f47f5371422b5ed0fe2357fad989849b326` | `b138b2711074fd813701a19f4a971002ff91174d90ab916a4f11eaf367ae6034` | exact |
| Canny preprocessing | `693f16dffb0027511a3857484ea814efd45e8e09db89ab9b8c22401a2d752b4b` | `43154ce7d8ac7329e7cd80742c9bc9a09550f32e90bd007ec4a410c7b97f6cd3` | exact |
| Color preprocessing | `665b68e425b5efae6a8a9987825404635f1391c7de59c7dd47738d789891118c` | `238f78120812cc57a49fe5abe162147f190297863886f8bc13ced27a8cce5102` | exact |
| Standard lineart preprocessing | `a52f4d26ab1896d80d7bbb971ded96dd32abc58931a12538de967af2a9c7c3ed` | `40204ef1d43aa182df37913a00cc032f3f9ad588fdb549c04fc3153fdb56ca9b` | exact |

This proves deterministic host and bounded preprocessor behavior for the
measured inputs. It does not prove generated-image quality.

## What remains closed

The evidence intentionally does not:

- put wheels or source archives in the canonical artifact repository;
- create or sign a canonical production image;
- run on a qualified GPU worker;
- mount a base model, VAE, CLIP Vision, IP-Adapter, ControlNet, or LoRA;
- execute an SDXL generation;
- prove reference-image identity/style consistency;
- prove ControlNet adherence in decoded image space;
- admit the complete custom-node surface;
- expose FaceID, InsightFace, or other identity-generation nodes;
- select a Living Frame scene;
- estimate or spend customer credits;
- mutate approval or an approved snapshot;
- create work, queue, asset-manifest, or rendering state;
- grant provider, tool-route, runtime, or production authority.

The next meaningful runtime gate is a canonical, read-only artifact mount on a
GPU-qualified worker, followed by bounded subject-neutral generation
benchmarks and canonical security, license, performance, and cost evidence.
