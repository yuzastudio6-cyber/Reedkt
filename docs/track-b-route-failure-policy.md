# Track B Route Failure Policy

The Phase 44I route manifest fails closed.

Blocked requests return explicit blocker reasons and never fall back to raw execution. Disabled, excluded, unknown, or unversioned routes cannot execute.

Fail-closed conditions include missing artifact scope, public output request, broad media request, arbitrary media request, provider call request without a later approved provider phase, frontend service-role secret request, VLM request, Demucs request, route manifest version mismatch, and direct tool execution from model output.

Future worker orchestration must treat route metadata as advisory eligibility only. It must not reinterpret raw chat, bypass approved plan snapshots, or broaden artifact scopes.
