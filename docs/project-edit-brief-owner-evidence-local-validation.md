# Project Edit Brief Owner Evidence Local Validation

## Decision

`project_edit_brief_owner_evidence_local_validation_passed_ready_for_owner_evidence_preflight`

## Scope

RP-EDITBRIEF-15D adds an operator-safe local validation command for Project Edit Brief owner evidence. It helps reviewers test a filled owner evidence intake before proposing a reviewed PR. It does not approve any owner input, does not collect private evidence, does not write Supabase, and does not enable external beta, real-user-media beta, paid production, uploads, providers/models, workers, render/export, or credits.

## Command

Use the default checked-in template in allow-blocked mode:

```bash
npm run check:project-edit-brief-owner-evidence-readiness
```

Use a local filled evidence file in strict mode:

```bash
npx tsx scripts/validation/project-edit-brief-owner-evidence-readiness-cli.ts --input /absolute/path/to/local-owner-evidence.json
```

Strict mode exits non-zero unless every required input is approved or waived with owner, evidence reference, reviewed timestamp, and notes.

## Safety Rules

The command fails closed when evidence fields contain:

- secret-like values,
- signed URL-like values,
- raw prompt-like values,
- private/media artifact-like paths.

Evidence references should point to durable review records, not credentials, raw prompts, signed URLs, media files, or private artifacts committed to source control.

## Output

The command prints a JSON readiness summary with:

- `decision`,
- `readyForRpEditBrief16`,
- `supabasePersistenceImplementationAllowed`,
- launch booleans for external beta, real-user-media beta, and paid production,
- missing/rejected/invalid inputs,
- safety scan findings,
- next milestone.

## Current State

The checked-in intake remains intentionally blocked. A local filled file can pass the evaluator only when the ten owner inputs are complete and safety-clean. Passing this command permits a reviewed evidence PR and RP-EDITBRIEF-16 planning; it does not permit production launch by itself.
