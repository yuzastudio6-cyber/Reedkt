# Living Frame character PixiJS internal runtime

Status: actual private internal component-runtime evidence. Operation
registration, canonical dispatch, canonical asset persistence, billing,
public delivery, and production remain false.

## What this proves

`living-frame-character-pixijs-internal-runtime-v2` uses the existing
`pixijs` tool identity and the existing generic operation identity:

```text
tool.pixijs.render_pixi_scene.v1
```

The fixed runtime:

- derives its request on the server and accepts no caller input;
- binds the exact Musashi whole-character RGBA artifact and route-decision
  digest;
- starts the pinned offline browser graphics image as non-root with no network,
  read-only root filesystem, dropped capabilities, no caller command, no
  caller mounts, and no caller environment;
- executes the real PixiJS `Application.init`, `Texture`, `Sprite`, pivot, and
  stage-render path;
- renders 120 transparent `640 x 360` PNG component frames;
- restores the exact source pose at the final frame;
- verifies temporal variation, subject-anchor continuity, bounded
  protected-face coverage, exact dimensions, alpha, and PNG byte commitments;
  and
- emits only a process-bound, single-use private sequence lease plus a
  byte-free report.

The qualified intent is deliberately narrow:

```text
restrained_whole_character_drift
```

PixiJS owns component animation only. Remotion still owns the final scene,
captions, audio, layout, and export.

## Actual final-canvas evidence

The private composite follow-up consumes the 120-frame sequence through its
single-use lease and executes the real pinned Remotion renderer:

```text
real PixiJS whole-character PNG sequence
  -> server-injected private PNG streams
  -> eight bounded Remotion compositions
  -> exact 120-frame FFmpeg package
  -> FFprobe media QA
  -> create-only private persistence and exact reread
```

Every final frame uses the matching PixiJS PNG bytes. The source/background
plate remains separate, and the approved caption plane remains above Living
Frame. Remotion therefore remains the final canvas rather than PixiJS,
ComfyUI, Blender, or OpenToonz.

The private visual-review set includes frames `0`, `52`, and `119` plus all
eight chunk boundaries. It confirms the complete character remains intact,
the caption stays readable, motion is restrained, and the final pose returns
to the source pose. A dedicated protected-caption region is also decoded and
compared across all 120 final frames so a missing, erased, or occluded caption
cannot pass on the strength of three sample frames alone. The rejected
sword-arm composite is not used anywhere in this render.

## What this does not prove

This evidence does not approve the extracted arm/sleeve/hand/sword cutout shown
in the rejected composite. That component still has three blocking findings:

1. moving it exposes an unreviewed reconstructed source plate;
2. its extracted boundary is not professionally prepared; and
3. the tested movement path crosses Musashi's protected face.

The route decision therefore sends that exact action to:

```text
ComfyUI controlled component preparation
  -> reviewed plate and clean component
  -> reviewed protected-face path
  -> PixiJS rigid cutout when sufficient
  -> Remotion final composition
```

ComfyUI does not need to generate every animation frame. It prepares missing or
contaminated source material and, for larger pose changes, may generate a small
number of controlled anchor poses. Deterministic tools then animate and
composite those approved assets.

## Tool boundary

The implementation does not create another tool identity. Browser code,
container runner, adapter, image fixture, pivot logic, and QA are capabilities
inside the existing PixiJS execution boundary.

The following remain false:

- operation registration;
- canonical selected-scene admission;
- approved-snapshot mutation;
- MasterTiming mutation;
- work-graph dispatch;
- canonical asset or manifest creation;
- canonical or private-review approval;
- actual cost and customer billing;
- public delivery; and
- production readiness.

## Verification

```text
npm run smoke:living-frame-character-animation-route-suitability
npm run smoke:living-frame-character-pixijs-internal-runtime
npm run smoke:living-frame-character-pixijs-remotion-composite-internal-test
npm run typecheck:server
npm run lint
```

The current internal review frames are written only under:

```text
/tmp/reeditpro-living-frame-character-pixijs-internal-runtime/
/tmp/reeditpro-living-frame-character-pixijs-remotion-composite-internal-test/
```

They are disposable local evidence, not canonical assets.
