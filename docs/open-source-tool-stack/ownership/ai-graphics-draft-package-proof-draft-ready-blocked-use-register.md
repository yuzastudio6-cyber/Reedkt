# AI Graphics Draft Package Proof Draft-Ready Blocked-Use Register

Decision: `ai_graphics_draft_package_proof_draft_ready_approval_passed_with_warnings`

The following remain blocked:

- marking any PR ready now
- merging PR #425, PR #433, or PR #441
- retargeting or closing source PRs
- canonical promotion before source PRs are merged through an approved stack
- installing dependencies or mutating `package-lock.json`
- rerunning import smoke, synthetic fixtures, manifest proof, or tool proof
- executing tools, workers, routes, providers, browser/WebGL/canvas, GPU, model weights, media, Remotion, or resvg
- mutating Supabase, running SQL, uploading to GCS, creating signed URLs, or creating public artifacts
- unlocking internal beta, external beta, or production

No generic dry-run pass claim or generated local fixture pass claim is recorded.
