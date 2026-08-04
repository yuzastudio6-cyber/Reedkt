# CAP-13 — Sound Support Report

Milestone: `CAP-13`

Status: `contract_complete_authenticated_sound_runtime_and_final_mix_qa_gated`

## Outcome

CAP-13 adds a strict, byte-free `CaptionSoundCueRequest` after Caption motion
lock. It converts each of the twelve frozen CAP-11 scene nodes into either an
explicit semantic cue request or an explicit silence decision. The fixture
requests only two restrained hero cues; the other ten nodes remain silent.

Caption owns cue eligibility and semantic intent only. It does not select a
provider or asset, generate audio, trim a cue, mix or duck audio, set loudness,
grant final QA, or dispatch SoundSync directly.

## Owner boundary

```text
Caption Scene Graph soundEligibility
  + Caption Motion Lock
  + StoryTiming semantic event refs
  -> CaptionSoundCueRequest
  -> neutral HQ-mediated SkillSupportRequest(target=soundsync)
  -> injected Sound-owned result
  -> CaptionSoundAdmission
  -> dialogue-protected final-mix dependency
```

- Caption owns semantic cue intent and the silent fallback.
- StoryTiming remains the only final frame/event owner.
- SoundSync remains the only cue selection, generation, trim, mix, ducking,
  loudness, and audio-QA owner.
- The canonical asset manifest remains the sound-asset owner.
- The future HQ/Orchestra injects support results; Caption cannot perform direct
  peer dispatch.

## Density and restraint

The request carries a frame-bounded density budget. The CAP-13 fixture permits
at most two requested cues across the complete scene, permits only one
simultaneous cue, and permanently forbids per-word cue patterns. Normal speech,
active-word treatment, accessible tracks, and persistent supporting elements
remain silent unless a future approved graph explicitly changes eligibility.

Every cue is voice-first, uses a semantic StoryTiming event ref, carries a
lower-cost silent fallback, and avoids provider-specific prompts or asset IDs.

## Injected evidence and fallback

The Sound result surface distinguishes:

- `approved_contract_fixture`: validates the future boundary but cannot claim
  actual runtime, selected assets, trims, mixes, or dialogue-protection QA;
- `authenticated_private_runtime`: must bind exact scope, motion, StoryTiming,
  selected assets, trim/alignment, mix, final-mix reread, and dialogue QA.

The CAP-13 fixture remains `contract_ready_silent_fallback`. If no Sound result
is injected, every cue deterministically resolves to `silent_fallback` without
changing Caption meaning or motion timing. Authenticated results still block
when the dialogue-protected final mix fails voice clarity or cue masking QA.

## Verification

`smoke:captions-specialist-cap-13` passes 31 checks. Positive coverage verifies
twelve node decisions, two eligible requests, ten explicit silence decisions,
the two-cue density ceiling, HQ-mediated support, injected contract evidence,
dialogue-protected final-mix dependency, and the no-result silent fallback.

Adversarial coverage rejects cue requests on forbidden nodes, density budget
overruns, Caption asset authority, direct peer dispatch, Sound admission of a
forbidden cue, Sound refs on silent cues, fixture runtime or asset overclaims, stale motion lineage,
incomplete authenticated evidence, forged runtime-ready admission, and
inherited contract data.

The focused CAP-13 smoke, server typecheck, and focused lint are green. CAP-13
generates no media or audio, so direct playback or raster inspection is not
applicable at this milestone. Actual Sound runtime, audio asset reread, final
mix QA, provider execution, billing, public delivery, and production authority
remain false.

## Next

CAP-14 builds the deterministic multi-track Remotion creative renderer while
preserving StoryTiming frame authority, Remotion final-canvas ownership, reduced
motion, and the direct-inspection requirement for every generated visual.
