# Chat-Native SFX UI

## Purpose

RP-SFX-10 adds a mock-only chat-native UI for SoundSync SFX Director planning. SFX planning appears as compact inline cards inside the editor chat, not as a separate sound dashboard or audio workstation.

The UI shows what ReeditPro wants to add, why it supports the edit, which provider route would be used later, how prompts/timing/mix/QA/library decisions look, and what still requires approval.

## Why Inline Chat Cards

ReeditPro's chat is the editor. SFX cards appear only when the user opens SoundSync SFX planning, so the main edit plan and credit approval path stay clear.

The cards summarize first and collapse technical details such as full prompts, negative prompts, trim metadata, mix settings, QA issues, and library metadata. This keeps SFX understandable for normal users while preserving developer-facing planning detail.

## Card Flow

The mock SFX chat flow includes:

- `InlineSFXDirectorPlanCard`: high-level edit-layer-only policy, source-footage restraint, volume philosophy, provider strategy, credit rule, and next step.
- `InlineSFXEventCard`: recommended or avoided SFX cues with target layer, use case, anchor, volume profile, reason, status, and credit impact.
- `InlineSFXProviderRouteCard`: future routing among internal library, MMAudio draft/fallback, Mirelo production, and no-SFX.
- `InlineSFXPromptPreviewCard`: provider-specific prompt preview, negative prompt, library tags, duration policy, timing instructions, mix instructions, and prompt warnings.
- `InlineSFXTimingTrimCard`: generated duration, trim window, hit offset, start/hit/end placement, fades, and validation warnings.
- `InlineSFXMixPlanCard`: volume profile, gain hint, ducking, sidechain intent, fades, EQ, stereo width, reverb, room match, and voice-first status.
- `InlineSFXQACard`: scores, issues, recommended action, project approval, library candidate flag, and required adjustment/regeneration states.
- `InlineSFXLibraryCandidateCard`: project-only-first reuse status, candidate reason, quality score, privacy/provenance flags, tags, recommended uses, avoid uses, and notes.
- `InlineSFXCreditEstimateCard`: mock event counts, library search count, future provider counts, timing/mix/QA planning cost, estimated credits, and approval actions.
- `InlineSFXGenerationProgressCard`: mock progress only after local plan and credit approval.
- `InlineSFXRevisionOptionsCard`: local mock revision choices such as quieter, trim again, replace with library, remove SFX, keep ambience only, or no source-footage sounds.

## Provider Route And Prompt Preview

Provider routing remains planning metadata only:

- Mirelo SFX V1.5 is shown as a future production SFX route.
- MMAudio V is shown as a future draft/basic/pro fallback and video-conditioned helper.
- Internal library is shown as reusable approved sounds.
- No SFX is shown as a valid professional choice.

Prompt preview is visible before generation. MMAudio prompts stay short because the model is expected to use video context. Mirelo prompts are more controlled and production-oriented. The UI states that ReeditPro has not called Mirelo or MMAudio.

## Timing, Mix, QA, And Library

Timing cards reinforce that the hit point matters more than file start. Mix cards reinforce voice-first ducking and subtle volume defaults. QA cards show whether the cue can be used, adjusted, regenerated, removed, or replaced later. Library cards show that generated SFX starts project-only and needs QA, non-private context, and provenance review before broader reuse.

## Approval And Progress

The SFX flow has local mock approval state:

1. User approves the SFX plan.
2. User approves the mock SFX credit estimate.
3. The progress placeholder runs through library check, prompt preparation, mock generation, waveform analysis, trim, hit alignment, mix, QA, project asset storage, and library-candidate evaluation.

No real credits are spent and no real generation starts.

## Source-Footage Boundary

The UI explicitly communicates the product rule:

```text
ReeditPro adds SFX for edit-layer polish by default, not every real-world source action.
```

Source-footage-style sounds such as footsteps, water, doors, cars, clothing, plates, crowd beds, or random ambience remain avoided unless the user asks for full sound design, repair, silent B-roll support, Real Motion support, or another clear professional reason.

## Mock-Only Boundary

RP-SFX-10 displays existing mock SFX planning data only. It does not call providers, read secrets, create migrations, connect to Supabase, process audio, render media, upload files, spend credits, promote real library assets, or create mobile UI.

## RP-SFX-11 Worker Handoff

After the chat UI shows plan and credit approval, RP-SFX-11 models the future backend worker that would execute the approved SFX request. The worker enforces edit-plan approval and credit reservation, simulates internal-library or provider output, then runs trim, hit alignment, mix, QA, usage, and library-growth metadata.

The chat UI remains mock-only and does not trigger real workers, providers, storage, Supabase, or credits.
