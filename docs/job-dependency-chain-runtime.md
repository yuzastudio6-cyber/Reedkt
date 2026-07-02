# Job Dependency Chain Runtime

RP-FIX-10 adds local dependency-chain helpers for queue readiness.

## Chains

Music generation:

```text
edit_plan_approved
-> credit_reserved
-> music_prompt_ready
-> music_generation_job
-> music_qa_job
-> music_mix_job
```

SFX generation:

```text
edit_plan_approved
-> credit_reserved
-> sfx_prompt_ready
-> sfx_generation_job
-> sfx_trim_alignment_job
-> sfx_mix_job
-> sfx_qa_job
-> sfx_library_candidate_job
```

Render preview:

```text
edit_plan_approved
-> timing_map_ready
-> render_manifest_ready
-> required_assets_ready
-> preview_render_job
-> qa_job
```

Signature generation:

```text
edit_plan_approved
-> credit_reserved
-> signature_route_ready
-> prompt_spec_ready
-> generation_job
-> qa_job
```

These chains are mock metadata. Production dependency enforcement still belongs in backend job tables and worker leases.

## RP-FIX-11 Lease Boundary

Dependency readiness is not enough to run a worker. Future production dispatch must also claim a worker lease, maintain heartbeat, and verify idempotency before any provider/render side effect.
