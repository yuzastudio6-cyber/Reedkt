# Agent Recovery + User Review Policy

## Purpose

Some failures should not be auto-fixed. The editing agent should ask the user when a decision affects meaning, cost, source truth, privacy, or final look.

This policy defines when ReeditPro can recover automatically, when it can use an approved fallback, and when user review or new approval is required.

## User review triggers

Require user review for:
- meaning-preservation risk,
- proof/evidence cut risk,
- browser capture authorization,
- privacy/redaction risk,
- ambiguous retake selection,
- character mismatch in important story content,
- generated image/video that does not match user intent,
- Premium fallback to Veo if not already approved in the plan,
- fallback exceeding approved credit allowance,
- final render blocked because a required asset is missing,
- documentary claim/source uncertainty,
- model/provider safety rejection.

## Recovery states

- `auto_recoverable`: failure can be isolated and recovered without user decision.
- `fallback_available`: approved fallback exists and can be used later by workers.
- `needs_user_review`: user must choose or confirm.
- `needs_new_approval`: fallback changes approved cost, route, meaning, or final output scope.
- `unrecoverable_in_current_plan`: current plan cannot continue without revision.

## Communication style

User-facing language should be direct:
- “This asset failed, but I can continue with the rest.”
- “This part needs your review before I cut it.”
- “I can use a simpler card instead of regenerating.”
- “This fallback would change cost/quality, so it needs approval.”

## Non-goals

This milestone does not implement real chat review flows, backend state, provider retry, fallback execution, billing, storage, workers, rendering, or media processing.
