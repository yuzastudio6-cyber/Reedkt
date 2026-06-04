# Phase 44K Rollback And Blocker Policy

Rollback policy:

- Revert Phase 44K status to `blocked` if any required evidence source is invalidated.
- Revert Phase 44K status to `blocked` if route execution, worker execution, sidecar execution, tool execution, public output, provider calls, broad media, VLM runtime, Demucs runtime, or Track A scope appears.
- Require a fresh handoff and explicit approval before any live route execution, worker execution, local sidecar process, or tool runtime is enabled.

Blocker policy:

- Missing evidence blocks the gate.
- Any execution unlock blocks the gate.
- Any public artifact, provider, broad-media, raw-chat execution, frontend secret, VLM, Demucs, or Track A unlock blocks the gate.
- Product-wide internal beta, external beta, paid production, and production remain blocked.
