# Creative Graphics GD-7 Local Output Policy

Status: `local_output_policy_created`

GD-7 output path policy:

- Local output folder: `.local-artifacts/ai-tools/gd-7/<run-id>/`
- Git tracking policy: `.local-artifacts/` is ignored and must not be committed.
- Commit policy: commit docs, diagnostics, runner source, and redacted evidence summaries only.
- Artifact policy: generated binary artifacts stay untracked unless a later prompt explicitly approves a tiny, safe, synthetic fixture artifact for review.
- Cleanup policy: local outputs may be deleted after evidence is recorded.

GD-7 must not create public artifacts, signed URLs, GCS uploads, Supabase rows, SQL records, provider/model outputs, worker outputs, Track A final render/export output, browser captures, or real user media.

Production capability enabled: `none; controlled local creative graphics fixture execution only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
