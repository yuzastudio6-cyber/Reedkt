# Project Edit Brief Owner Evidence Example Generator

## Decision

`project_edit_brief_owner_evidence_example_generator_passed_ready_for_safe_owner_evidence_drafting`

## Scope

RP-EDITBRIEF-15G adds a safe local generator for owner-evidence intake drafts. It does not approve any owner evidence, does not edit the checked-in template, does not start RP-EDITBRIEF-16, and does not enable external beta, real-user-media beta, paid production, Supabase persistence, uploads, providers/models, workers, render/export, or credits.

## Default Draft

Run:

```bash
npm run --silent generate:project-edit-brief-owner-evidence-draft
```

The default output is a draft-to-fill JSON object. It keeps all owner inputs `missing`, adds review-group guidance and minimum evidence notes from the RP-EDITBRIEF-15C review packet, and remains readiness-blocked.

## Strict Synthetic Example

For local format testing only:

```bash
npx tsx scripts/validation/project-edit-brief-owner-evidence-example-generator.ts --mode strict-example --stdout
```

This mode creates a synthetic strict-format example that can pass the readiness evaluator. It uses placeholder `example.com` evidence references and must not be committed as real owner evidence.

## Safety

Generated examples are safety-scanned before output. The generator fails if it creates secret-like evidence, signed URL-like evidence, raw prompt-like evidence, or private/media artifact-like evidence.

## Current State

The checked-in owner evidence intake remains missing and blocked. This generator only makes the external owner-evidence collection step easier to complete correctly.
