# Meaning Preservation Validation

## Purpose

Meaning preservation ensures cleanup and trim decisions do not distort the user’s message.

The edit must not change what the speaker meant, remove required context, cut a claim from its qualifier, remove proof/source context, remove required tutorial/product steps, hide important product limitations, remove disclaimers, make documentary/case-study allegations sound verified, remove meaningful emotional pauses, or remove setup needed to understand the outcome.

## Checks

The validator should check:

- claim context preserved
- evidence context preserved
- tutorial steps complete
- product demo sequence complete
- user-marked important clips preserved or reviewed
- optional clips can be removed
- retake selection does not remove the only clear explanation
- aggressive cleanup does not distort the story
- documentary/case-study cuts remain neutral and safe
- privacy-sensitive cuts are flagged
- behind-the-scenes naturalness is preserved when requested

## Risk Levels

- `low`: safe mock decision.
- `medium`: reviewable risk.
- `high`: should be reviewed before approval.
- `blocking`: approval cannot proceed until resolved.

High or blocking cases include cutting proof/evidence context, cutting required tutorial steps, cutting claim qualifiers, cutting user-marked important content, changing emotional/story meaning, removing documentary/case-study source context, or ambiguous retake selection with no user review.

## User Review Triggers

User review is required when mock planning cannot confidently choose between retakes, a cut may change meaning, proof/evidence would be shortened, a tutorial/product step would be removed, privacy-sensitive material is detected, aggressive cleanup is requested for meaning-sensitive footage, source order is unconfirmed, or a user-marked important clip is proposed for cut.

## Non-Goals

No real semantic analysis, transcript comparison, audio analysis, visual analysis, media processing, provider calls, rendering, backend work, or worker execution is implemented here.
