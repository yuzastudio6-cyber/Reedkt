# Batch 1 Dependency Baseline Validation

Decision input: npm ci validation for the no-install/no-lock-mutation proof packet.

- Command: `npm ci --ignore-scripts --no-audit --no-fund`
- Run by packet: `true`
- Exit code: `0`
- Package lock changed: `false`
- Baseline clean: `true`
- Dependency install requested: `false`

No npm lifecycle scripts, package-lock mutation, Supabase writes, GCS upload, public artifacts, or signed URLs are authorized by this validation.
