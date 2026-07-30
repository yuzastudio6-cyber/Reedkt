# Conversation Decision Ledger

This ledger separates binding direction from examples, corrections, and unresolved choices. Precedence follows security and legal constraints, `AGENTS.md`, current user requirements, final conversation decisions, these CAP-00 documents, current approved repository contracts, older documents, then examples.

## Binding decisions

| ID | Decision | Classification | Consequence |
| --- | --- | --- | --- |
| CD-001 | Stable target key is `caption_design`; user-facing name is Caption Direction. | final | Do not create a competing `caption_direction` key except as an alias. |
| CD-002 | `caption_design` becomes a composite Creative Skill assembled from reusable mini skills. | final | Extend the existing creative/professional-skill model through an adapter and relationship schema; do not add a disconnected taxonomy. |
| CD-003 | `no_captions` remains a valid restraint choice. | final | Restraint is a first-class result, not a failure to plan. |
| CD-004 | Captions are early-planned, mid-edit reserved, late-resolved, late-rendered. | final | Final choreography requires picture lock and final-frame evidence. |
| CD-005 | StoryTiming is the only final timing authority. | final | Caption systems propose requirements/events; StoryTiming resolves executable frames. |
| CD-006 | One immutable canonical transcript drives every projection. | final | Creative, accessible, translated, and delivery tracks retain source-word and transformation provenance. |
| CD-007 | Synthetic word timing cannot drive final word-locked animation. | final | Final kinetic word motion blocks without qualified timing provenance. |
| CD-008 | A video may use multiple caption modes and simultaneous tracks. | final | A scene graph replaces a single-style/single-track assumption. |
| CD-009 | Creative typography may be beside, behind, in front of, or intentionally occluded by subjects/objects. | final correction | Replace the blanket “captions always above masks” rule with track-specific depth policy and QA, while preserving a complete accessible projection. |
| CD-010 | Full accessible wording remains available when creative text is condensed, transformed, or occluded. | final | Creative and accessible projections are siblings of the same transcript, not substitutes for one another. |
| CD-011 | Caption-to-Visual and Living Frame handoffs coordinate separate owners. | final | Typed handoff contracts; no Caption Direction-owned map, diagram, illustration, or Living Frame renderer. |
| CD-012 | Caption sound is choreographed after caption motion lock and must protect dialogue. | final | SoundSync owns mix execution; captions submit eligible cues and restraint budgets. |
| CD-013 | Models produce structured observations and proposals, never executable renderer code. | final | Deterministic validators and typed render specs gate execution. |
| CD-014 | Remotion owns creative caption composition; libass owns stable subtitle fallback/delivery; FFmpeg packages outputs. | final | Canvas-aware, pinned, deterministic render paths with accessibility parity. |
| CD-015 | CAP-00 is documentation-only and originally stopped for owner review. | superseded milestone instruction | CAP-00 itself made no runtime, package, provider, media, migration, billing, secret, or deployment change. CD-016 replaces the later milestone pause. |
| CD-016 | After evidence-backed milestone self-review, continue automatically without a separate development owner-approval stop. | latest explicit user decision | CAP-01 and later CAP milestones proceed when their documented checks pass. This does not bypass user-facing edit-plan/credit approval or external security, spending, deployment, migration, secret, and dependency gates. |

## Corrections and supersessions

| Earlier/current statement | Final treatment |
| --- | --- |
| Current repository rule: captions remain above foreground masks and graphics. | Superseded as a universal rule. Retain it as the default for the accessible/stable track and as a safe fallback; allow approved creative tracks on typed depth planes. |
| Current caption segmentation uses fixed word/character bounds. | Retained as deterministic fallback only. Semantic phrasing and language-aware shaping become primary after qualified evidence exists. |
| Current timing planners can evenly distribute words across a phrase. | Retained for mock/blocking preview only; prohibited for final word-locked motion. |
| Flat `captions.*` professional skills act as caption capability owners. | Preserved through compatibility mapping into `caption_design` mini skills until consumers and snapshots migrate. |
| A possible `caption_direction` key appeared in exploratory discussion. | Not canonical. It may be an alias to `caption_design` only. |
| “Captions are a final pass.” | Refined: strategy and reservation occur earlier; exact choreography, sound, render, and QA occur late. |

## Examples, not product defaults

Musashi-style brush typography, Strait of Hormuz/map transformations, energetic short-form captions, documentary typography, text-behind-subject shots, persistent lists, and full-screen hero words are reference patterns. They are not templates, defaults, or permission to copy a creator's design.

## Unresolved owner decisions

1. Whether `caption_design` should be introduced as a new canonical ID with aliases from current `captions.*` IDs, or whether the existing registry should gain a namespace-compatible parent identifier.
2. Which service becomes the canonical transcript authority after the raw migration baseline is reconciled.
3. Which provider-neutral Head Intelligence route is approved, including whether any named model is selected.
4. Which WhisperX, pyannote, FontTools, OpenType Sanitizer, shaping, and font packs pass license/security/runtime qualification.
5. Exact Caption Approval Envelope fields and which changes require plan reapproval versus local caption approval.
6. The general PictureLockManifest owner and compatibility with existing approved snapshots.
7. The production Remotion/browser versions and renderer tolerance thresholds.
8. Font-upload product policy, retention, licensing attestation, and malware/quarantine process.
9. Credit policy for analysis, complex typography, repair, re-render, localization, and accessible deliverables.
10. Whether raw reference assets can be supplied for canonical reference analysis.

No unresolved decision may be silently converted into runtime behavior.
