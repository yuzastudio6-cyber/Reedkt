# SFX Library Growth

## Purpose

This document defines how ReeditPro can start without an internal SFX library, generate project-only sounds, QA them, and slowly promote safe reusable sounds into a future internal library.

This is architecture only. It does not create storage, tables, migrations, backend services, provider integrations, license enforcement, or audio files.

## No Library At Launch

ReeditPro may launch with no internal sound library. That is acceptable.

Starting workflow:

```text
No approved library sound exists
-> generate sound for project
-> store full generated file
-> store final trimmed version
-> store context, prompt, provider, timing, mix, QA
-> use in project only
-> mark as library candidate if reusable
```

Over time:

```text
more users
-> more generated SFX
-> more QA data
-> bigger ReeditPro internal library
-> fewer repeated generations
-> lower cost
-> faster edits
```

## Asset Storage Concept

Future SFX asset records should distinguish:

- full generated file
- final trimmed file
- waveform analysis metadata
- timing alignment metadata
- mix metadata
- QA result
- provenance and licensing metadata
- reuse scope

The full generated file is useful for retrim or future alternate versions. The final trim is the approved project-use asset.

## Lifecycle States

SFX library lifecycle states:

- `project_generated`
- `approved_for_project`
- `candidate_for_library`
- `reuse_review`
- `approved_internal_library`
- `workspace_only`
- `blocked_from_reuse`
- `requires_terms_review`

Default state is `project_generated`.

## Promotion Rules

Promote only when:

- QA passed
- sound is general-purpose
- no private/user-specific content
- provider/license allows reuse
- no reference-copy risk
- metadata/tags are complete
- commercial usage is allowed when relevant
- ads usage is allowed when relevant

Do not promote sounds just because they were generated successfully.

## Project-Only And Workspace-Only Rules

Keep as project-only or workspace-only when:

- user brand sound
- private event
- client/product-specific sound
- user voice
- custom branded audio
- licensed/restricted input
- provider terms unclear
- prompt includes private or sensitive context
- reference-copy risk exists

Generated SFX should not automatically become shared library assets when based on private or client-specific context.

## Provenance Metadata

Store provenance:

- provider
- model
- prompt
- negative prompt
- terms status
- license notes
- reuse permission
- commercial allowed
- ads allowed
- workspace/project scope
- source context
- QA report ID
- trim metadata
- mix metadata
- approved snapshot ID

Do not claim provider outputs can be reused across all users unless terms are confirmed.

## Tagging

Reusable SFX candidates need tags:

- target layer
- taxonomy category
- style
- intensity
- duration
- transient type
- tail length
- volume profile
- mood/tone
- room/space feel
- edit levels allowed
- avoid contexts

Tags help future library-first routing select useful sounds without regenerating.

## Future Library-First Strategy

At launch:

`generate when needed`

Later:

`search approved internal library first -> if no good match, generate new sound -> store new sound -> QA -> promote if useful`

For Basic/Pro long-term:

`library first -> MMAudio fallback/draft if needed -> Mirelo only for production important moments`

For Signature/Premium:

`Mirelo for key SFX -> library for common SFX -> MMAudio for draft or synced helper`

## Usage Learning

Future library ranking can learn from:

- QA pass rate
- user acceptance
- mix adjustment frequency
- trim success
- provider artifact rate
- repeat use across projects
- edit-layer fit
- tone fit by category
- credit savings

Usage learning must not override privacy, licensing, approval, or user intent.

## RP-SFX-08 QA Input

RP-SFX-08 can recommend future library replacement when a generated cue fails QA but a common approved internal cue would be safer. This is only a recommendation. It does not promote assets, mark sounds reusable, or assume a launch library exists.

RP-SFX-09 should use QA reports, adjustment history, provenance, privacy review, license scope, and user acceptance before any generated SFX becomes a library candidate.

## RP-SFX-09 Mock Services

RP-SFX-09 implements this layer locally with mock services for internal library search, project-only storage decisions, usage records, provenance review, reuse policy, candidate evaluation, usage learning, and chat summaries.

The services keep generated SFX project-only by default. They create candidates only after QA, privacy, provenance, timing, mix, and tag checks. `approved_internal_library` is only allowed in explicit mock approval scenarios; normal reusable sounds become candidates or require terms review.
