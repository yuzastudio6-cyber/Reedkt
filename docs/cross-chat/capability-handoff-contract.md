# Capability Handoff Contract

Status: `docs_only`.

Use this template when one workstream hands a capability, artifact, or decision to another workstream.

## Required Fields

| Field | Required value |
| --- | --- |
| `sourceWorkstream` | Registry workstream ID that owns the source capability. |
| `targetWorkstream` | Registry workstream ID that must consume or continue the work. |
| `artifactType` | Manifest, schema, plan snapshot, QA record, private artifact reference, prompt record, or status update. |
| `artifactScope` | Planning-only, fixture-only, internal testing, internal beta candidate, or blocked. |
| `approvalState` | Draft, reviewed, approved for planning, approved for execution, blocked, or superseded. |
| `privateArtifactPolicy` | Private `gs://` references only; no public URLs or signed URLs as source of truth. |
| `schemaManifestReference` | Path to canonical schema, manifest, or source-of-truth doc. |
| `blockedUses` | Explicit list of forbidden uses. |
| `validationEvidence` | Diagnostics, smoke, QA, PR, CI, GCS evidence, or blocked reason. |
| `ownerConfirmation` | Source owner and target owner confirmation state. |
| `nextPromptOwner` | Workstream that owns the next prompt. |

## Rules

- Handoffs are metadata contracts, not runtime execution.
- Handoffs must cite private artifacts by bucket/path or repo doc path, not signed URLs.
- If ownership is unclear, create a coordination prompt before implementation.
- Workers may execute only approved plan snapshots in later approved runtime phases.
- XCHAT-0 creates the contract only and does not approve any runtime handoff.
