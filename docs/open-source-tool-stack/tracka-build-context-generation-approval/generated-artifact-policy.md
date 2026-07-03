# Generated Artifact Policy

- Future phase may create outputs locally: `true`
- Current phase generated outputs: `false`
- Generated outputs may be committed: `false`
- Exact cleanup command: `rm -rf dist-server dist-remotion-worker dist-staging-fixture-worker dist-staging-real-video-export-worker`
- Git status guard: git status --short must show no tracked or staged dist-* output before commit
- `.gitignore` mutation allowed: `false`
- Dockerfile mutation allowed: `false`
- Package-lock mutation allowed: `false`
