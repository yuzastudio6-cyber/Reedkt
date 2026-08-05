# Canonical SoundSync evidence mount

## Outcome

The Caption specialist can now continue the same approved sound-support job only
after the canonical SoundSync owner supplies an authenticated result with exact
audio-asset reread and dialogue-protected final-mix QA.

Caption still requests only semantic cue intent. It does not choose a provider,
sound asset, trim, mix, loudness, or final frame timing. StoryTiming remains the
frame owner and SoundSync remains the cue, asset, trim, and mix owner.

## Canonical sequence

1. Caption emits one HQ-mediated `caption-sound-cue-request-v1` and returns
   `needs_followup`.
2. The shared sequential-resume repository rereads the exact prior Caption call,
   result, and first pending SoundSync request.
3. A process-admitted canonical context reader rereads the immutable approved
   snapshot, Caption scene graph, motion plan/lock, StoryTiming resolution,
   MasterTiming reference, and Caption approval envelope twice.
4. The closed Caption parser revalidates every cue intent against that context.
5. A process-admitted SoundSync owner reader rereads the exact result twice.
6. The SoundSync result is persisted create-only and reread before projection.
7. Caption derives its admission. Only `authenticated_private_ready` with a
   reread final mix, passed voice clarity, and no cue masking dialogue proceeds.
8. One authenticated owner projection and one closed evidence record are each
   persisted create-only and reread.
9. The canonical resume owner injects only the current SoundSync result into the
   same Caption job, which reruns Caption's own admission and completes.

## Fail-closed behavior

The mount rejects unadmitted readers, caller-supplied context/results,
non-current support requests, crossed owners/scopes, stale MasterTiming or
StoryTiming, changed context or SoundSync evidence between rereads, contract-only
fixtures, missing audio/final-mix evidence, failed voice protection, digest
tampering, unsafe serialized text, and create-only collisions.

No provider, sound runtime, media bytes, asset mutation, cost/billing, final-QA,
public-delivery, or production authority is added by this bridge.

## Internal qualification evidence

`npm run smoke:canonical-caption-soundsync-support` verifies the complete
source-level owner-reread, persistence, admission, projection, and sequential
resume chain plus adversarial refusal cases. It does not run audio or model
runtime; actual SoundSync evidence must still come from the canonical owner in an
authorized internal runtime window.
