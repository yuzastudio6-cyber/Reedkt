# Sound/Music Planning Contract Checklist

Use this checklist for future SoundSync/music/SFX prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, provider calls, audio generation, music generation, SFX generation, mixing/mastering, render/export, workers, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Universal planning contract inherited | The prompt inherits `skill-planning-contracts.md` and keeps planning-first, approval-gated, credit-aware behavior. |
| Transition contract referenced | Cuts, sound bridges, ambient bridges, beat-aligned cuts, silence, and transition SFX reference `transition-planning-contract.md`. |
| Overlay/compositing contract referenced | Overlay sound support considers visual/audio density and references `overlay-compositing-planning-contract.md`. |
| Graphic design contract referenced | Graphic reveal/title/proof/CTA SFX references `graphic-design-planning-contract.md`. |
| Motion design contract referenced | Beat, rhythm, emphasis, and motion SFX references `motion-design-planning-contract.md`. |
| 3D visual contract referenced | 3D object/hero sound references `three-d-visual-planning-contract.md`. |
| B-roll contract referenced | Source audio, ambience, room tone, and voiceover under B-roll reference `b-roll-planning-contract.md`. |
| Caption contract referenced | Speech clarity, important phrases, and caption readability reference `caption-planning-contract.md`. |
| Sound purpose present | The plan says what job sound does in the moment. |
| Music role present | The plan names music role or explicitly chooses no music. |
| SFX role present | The plan names SFX role or explicitly chooses no SFX. |
| Ambience/room tone role present | The plan states ambience, room tone, source audio, or silence behavior. |
| Source/rights/provenance status present | Non-project music/audio includes source type and rights/provenance status. |
| Mood/energy curve present | Mood, energy level, and energy curve are defined when music is used. |
| Cue points/beat map present | Cue points, beat map, and timing anchors are present when relevant. |
| Ducking/speech safety present | Speech priority, ducking, important phrase windows, and SFX avoidance are defined. |
| Lyrics policy present | Lyrics/vocal policy is explicit, especially under speech. |
| Reference music DNA safety present | Reference influence is limited to broad mood/energy/pacing and forbids copying. |
| Credit/approval behavior present | Premium/generated/custom/licensed work has credit and approval behavior. |
| Lower-cost alternative present | Optional premium/generated/custom sound includes a lower-cost alternative. |
| QA checks present | Speech clarity, lyrics, rights, reference copying, room tone, repetition, density, and approval are checked. |
| Revision options present | Safe revisions are listed. |
| StoryTiming handoff present | Timing, density, conflict, and QA handoff to `RP-SKILLS-11` is explicit. |
| Runtime/provider actions avoided | The prompt avoids runtime code, providers, workers, audio generation, mixing, render/export, migrations, TypeScript, packages, Supabase, and app behavior. |

## Required Pseudo-record Coverage

Future sound/music prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `MusicCuePlan`
- `SoundTimingPlan`
- `DuckingSpeechSafetyPlan`
- `SFXPlan`
- `AmbienceRoomTonePlan`
- `SoundMusicSkillPlan`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Fail The Prompt If

- Sound/music can execute from only a music/SFX name.
- Sound has no story, mood, timing, speech, ambience, transition, or visual-action reason.
- Music is applied everywhere by default.
- SFX are automatic on every visual or transition.
- Speech safety is missing.
- Ducking strategy is missing where speech exists.
- Lyrics policy is missing.
- Lyrics are allowed under speech without approval.
- Reference music is copied.
- Exact track, melody, lyrics, beat sequence, stems, copyrighted audio, creator identity, or protected distinctive style are copied.
- Rights/provenance status is missing for non-project music.
- Unknown source music is treated as licensed or safe.
- Generated/custom music lacks credit estimate.
- Generated/custom music lacks approval.
- Lower-cost alternative is missing for optional premium/generated/custom sound.
- Room tone, ambience, source audio, or B-roll audio continuity is ignored.
- Caption-heavy or claim-heavy sections have distracting music/SFX.
- Browser/app UI SFX implies false interaction from mock or unknown source.
- The prompt adds runtime code.
- The prompt adds TypeScript before the type-contract milestone.
- The prompt adds migration before the schema milestone.
- The prompt installs dependencies.
- The prompt mutates package files.
- The prompt unlocks audio/music/SFX/provider/render/mixing runtime.
- The prompt calls providers, runs workers, connects to Supabase, deploys, starts dev servers, runs audio generation, runs music/SFX generation, runs mixing/mastering, runs render/export, or changes app behavior.

## Future Prompt Footer

Future SoundSync/music/SFX prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Audio generation, music generation, SFX generation, provider calls, mixing/mastering, render/export, workers, Supabase, browser/capture/media runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
