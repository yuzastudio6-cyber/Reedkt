# AI Graphics Controlled No-Op Worker Gate Fail-Closed Policy

The future controlled no-op execution lane must fail closed if committed
evidence or local outputs contain:

- generic `dry_run_passed` or `generated_local_fixture_passed` claims,
- real URLs, signed URL markers, public artifact references, secrets, raw
  prompt text, provider raw output, or real user data,
- true live runtime booleans,
- executable Worker, route, tool, provider, Supabase, GCS, browser, WebGL,
  canvas, Remotion, or resvg instructions.

Blocked evidence must use a blocked decision state and must not fabricate pass
results.
