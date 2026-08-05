# Caption Scene Graph

## Purpose

`CaptionSceneGraph` is the deterministic late-bound description of visible caption composition. It is not a timeline authority and contains no executable model-authored code.

## Proposed graph

```text
CaptionScene
├── frameContext
│   ├── outputFrameRef
│   ├── pictureLockRef
│   ├── occupancyManifestRef
│   └── colorProxyRef
├── tracks[]
│   ├── projectionRef
│   ├── role / priority / renderer
│   ├── phrases[]
│   │   ├── sourceWordIds[]
│   │   ├── transformationRefs[]
│   │   ├── typographyRole
│   │   └── StoryTimingRequirementRef
│   └── nodes[]
│       ├── text or grapheme runs
│       ├── measured layout
│       ├── region / anchor / depth plane
│       ├── occlusion policy
│       ├── typed motion primitives
│       └── legibility treatment
├── constraints[]
├── handoffs[]
├── fallbackVariants[]
└── evidenceRefs[]
```

## Depth planes

Suggested logical planes:

1. background/environmental typography;
2. behind-subject creative typography;
3. source/B-roll/graphic content;
4. within-scene/object-anchored typography;
5. in-front creative typography;
6. safe accessible/stable captions;
7. fact-safety and mandatory delivery notices.

The render stack may implement more layers, but logical meaning remains stable.

## Determinism

Approved graphs contain:

- exact font asset/version and measured glyph layout;
- exact output frame and color space;
- exact frame ranges from StoryTiming references;
- typed motion primitives with numeric values;
- immutable mask/anchor/evidence versions;
- deterministic random seed only where explicitly allowed;
- renderer version and tolerance profile.

The Captions Specialist may propose graph structures inside its bounded job.
Deterministic validation must reject invalid text lineage, unsupported layout,
unsafe depth, missing glyphs, unresolvable timing, or unapproved renderer
behavior before execution.
