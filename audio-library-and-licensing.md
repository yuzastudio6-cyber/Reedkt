# Audio Library And Licensing

## Purpose

This concise planning note supports RP-SFX-09 generated SFX library growth. It defines conservative mock rules for provenance, reuse, attribution, and terms review before any generated audio can become reusable.

This is documentation only. It does not confirm real provider terms, grant reuse rights, store secrets, call providers, connect to Supabase, or promote real assets.

## Default Rule

Generated audio is project-only until QA, privacy, provenance, and license review prove a broader reuse scope is safe.

Do not claim generated SFX can be reused across all users unless provider terms and provenance explicitly allow it.

## Provenance Fields

Future generated audio records should track:

- provider
- model
- prompt and negative prompt
- generation date
- project/workspace context
- license provenance ID
- commercial allowed
- ads allowed
- client work allowed
- cross-user reuse allowed
- attribution required
- terms review status
- proof/reference path when available

## Terms Review

Use `requires_terms_review` when:

- provider reuse terms are unclear
- provenance metadata is missing
- cross-user reuse is not confirmed
- attribution requirements are unknown
- commercial, ads, or client-work use is not confirmed

## Reuse Limits

Keep audio project-only, workspace-only, or blocked from reuse when it includes:

- private event context
- user voice or identity
- client-specific brand motion
- custom brand sound
- confidential business content
- restricted reference material
- source-action SFX added without explicit full sound design

## Library Approval

Internal library approval requires QA pass, general-purpose usefulness, complete tags, low privacy risk, low reference-copy risk, and approved provenance. RP-SFX-09 only models this as mock metadata.
