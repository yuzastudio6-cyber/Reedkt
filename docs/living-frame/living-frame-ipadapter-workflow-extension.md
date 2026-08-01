# Living Frame Generic IP-Adapter Workflow Extension

Status: controlled, non-promotable, non-executable graph expectation.

This contract joins a validated stock ComfyUI graph expectation with the
reviewed generic IP-Adapter source boundary. It does not install the extension
or create an executable ComfyUI prompt.

The graph extension contains only:

- the stock `CLIPVisionLoader`;
- the reviewed `IPAdapterModelLoader`; and
- the reviewed `IPAdapterAdvanced`.

It expects the stock model-to-sampler edge to be superseded by:

```text
stock checkpoint or LoRA model
→ IPAdapterAdvanced
→ stock sampler
```

The loader, CLIP Vision, and reference image inputs are content-digest
expectations only. No caller filename, path, URL, raw image, model bytes, or
runtime selection is present.

## Explicit prohibitions

- no unified loader;
- no FaceID node or checkpoint;
- no InsightFace;
- no AuraFace generation conditioning;
- no embed file save/load;
- no arbitrary custom node;
- no runtime download;
- no selected scene, timing, approval, work, dispatch, or render authority.

AuraFace remains a separate continuity measurement and QA candidate. It is not
an IP-Adapter input.

## Remaining gates

The generic model-artifact repository, exact IP-Adapter and CLIP Vision
manifests, base-model compatibility, approved reference-image artifact,
dependency lock, GPL deployment review, offline host confinement, canonical
asset/work/dispatch admission, and quality benchmarks all remain required.
