# Creative Graphics Dry-Run Fixture Contract

Status: `manifest_draft`

## Purpose

Dry-run fixtures prove that every creative graphics tool has a safe, synthetic, non-runtime fixture plan before local/generated/staging fixture work begins.

## A Dry-Run May Do

- Validate manifest completeness.
- Validate synthetic input contracts.
- Validate expected output artifact types.
- Validate QA evidence requirements.
- Validate Track A handoff fields.
- Validate blocked-use handling.

## A Dry-Run Must Not Do

- Execute tools.
- Run workers.
- Call providers/models.
- Process real user media.
- Render/export media.
- Capture browsers.
- Use Docker/Cloud Run.
- Touch Google Cloud or Secret Manager.
- Touch Supabase or execute SQL.
- Create public artifacts.
- Create signed URLs.
- Unlock runtime, beta, or production.

## Fixture Requirements

Every owned tool requires a synthetic dry-run fixture. Expected fixture evidence includes tool ID, synthetic input shape, expected artifact type, private artifact placeholder, QA fields, Track A handoff need, blocked uses, and pass/fail criteria.

Dry-run pass criteria:

- Manifest validates against the GD-1 contract.
- Fixture uses synthetic inputs only.
- Expected outputs are private artifact plans only.
- All blocked uses remain blocked.
- Track A receives handoff fields only, not render/export authority.

Recommended next prompt: `Prompt GD-2 - Creative Graphics All-Tools Dry-Run Fixture Pack`.
