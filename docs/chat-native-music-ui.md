# Chat-Native Music UI

## Purpose

SoundSync music planning appears inside the ReeditPro chat editor. It is not a separate music dashboard, audio timeline, or traditional DAW-style interface. The user sees only the music decisions that matter before generation: context, cue sheet, prompt preview, credit approval, mock progress, QA, mix plan, and revision options.

## Chat Flow

The current mock flow starts from a compact `Plan music with SoundSync` action in the chat. When opened, ReeditPro shows:

1. Music context analysis.
2. Music cue sheet summary.
3. Collapsed cue detail cards.
4. Lyria Pro prompt preview.
5. Music credit estimate.
6. Mock generation progress after approval.
7. Music QA result.
8. Mix and ducking plan.
9. Revision options.

This keeps music intelligence in the same approval-first chat pattern as video editing.

## Card Responsibilities

The context card explains scene type, setting, speech, montage, ambience, and user music instructions. The cue sheet shows why SoundSync recommends multiple cues instead of one track. Cue cards stay collapsed by default and expose duration, mood, energy, vocal policy, speech safety, and credit impact when expanded.

The Lyria prompt preview card is developer/approval detail. It shows the prompt and negative prompt without calling Lyria. The music credit card makes clear that credits are not spent and music generation does not start until approval.

QA and mix cards show whether the music is safe for dialogue, aligned with context, and ready for mix. Lyrics under dialogue are shown as a clear warning with an instrumental-only regeneration recommendation.

## Approval Gate

The mock flow has a separate music plan approval and music credit approval. Mock progress starts only after both are approved. This mirrors the product rule that ReeditPro should not generate music or spend credits before the user approves the plan and estimate.

## Revision Options

Revision buttons update local mock chat state only. They do not call providers or regenerate music. They represent future chat-native instructions such as make instrumental, lower energy, remove vocals, use ambience only, keep cue, or allow montage vocals only.

## Mock-Only Boundaries

This UI does not integrate Lyria, call Google APIs, add keys, connect to Supabase, create migrations, render audio/video, charge credits, or perform real music generation. It uses existing local mock SoundSync services and deterministic data only.

## Next Step

Future work can connect this UI to real backend music jobs and persisted approved music plan snapshots while preserving the same chat-native approval and QA gates.
