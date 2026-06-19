# AI Graphics Implementation Responsibility

Owner id: `atlas_ai_graphics_worker_owner`

Atlas owns responsibility for AI graphics package proof planning, model-weight/runtime boundary documentation, metadata fixture planning, and coordination with Tool Route and Worker Runtime for scoped metadata handoff.

## Included Responsibility

- Import/version proof planning for declared AI graphics and ML/CV packages.
- Synthetic or manifest-only fixture policy for AI graphics metadata.
- Model-weight boundary documentation for Torch/TorchVision, Transformers, SAM2, BiRefNet, and Real-ESRGAN.
- Duplicate review across AI graphics, Tool Route, and Worker Runtime draft metadata lanes.
- Future proof-plan recommendations that keep runtime execution separately gated.

## Excluded Responsibility

- Track A render/export tools and runtime.
- Track B media processing tools and runtime.
- Sound/Music/Audio tools and runtime.
- Map/Geospatial tools and runtime.
- Provider Gateway APIs, provider/model runtime, model calls, raw prompt execution, and production/beta unlocks.

Supabase classification remains `no write` / `docs_only`; environment `none`; SQL `none`; migration `no`; milestone sync `not_performed`.
