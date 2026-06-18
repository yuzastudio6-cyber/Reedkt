# AI Graphics Controlled No-Op Worker Gate Rollback Cleanup Policy

The approval lane creates no runtime state. Rollback is limited to reverting
docs and diagnostics on the branch.

The future controlled no-op execution lane may write ignored local evidence
only and must verify cleanup by confirming:

- `.local-artifacts/` is not staged,
- package-lock and dependency sections are unchanged unless explicitly approved,
- no generated media, render, browser, canvas, WebGL, public artifact, signed
  URL, or secret-like output is committed.
