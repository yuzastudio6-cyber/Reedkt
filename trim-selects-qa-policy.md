# Trim + Selects QA Policy

## Purpose

Trim QA checks whether source cleanup decisions preserve meaning, respect user preference, and improve pacing without distorting the footage.

## QA Checks

Trim/select QA must check:

- no cut changes meaning
- no important step is removed
- no evidence or proof context is removed
- no user-marked important clip is removed without warning
- optional clips can be removed if useful
- retakes are handled cleanly
- duplicate points are removed or merged
- filler is removed only when the selected style supports it
- emotional pauses are preserved when important
- behind-the-scenes naturalness is preserved when requested
- tutorial and product steps remain complete
- documentary claims are not distorted
- privacy-sensitive moments are flagged
- final duration matches user/platform goal where possible

## User Review Triggers

Require user review when:

- a cut may change meaning
- an evidence/proof section might be shortened
- a tutorial/product step might be removed
- a privacy or sensitive moment is detected
- aggressive cleanup is requested
- source order is unclear
- the AI cannot confidently choose between retakes in mock planning

## Mock-Only Boundary

This policy validates structured cleanup plans only. It does not run transcript analysis, silence detection, FFmpeg, VapourSynth, AudioFlux, image analysis, audio analysis, provider calls, Remotion rendering, or media processing.

## Trim Review QA

`TrimReviewPlan` is the structured QA bridge between cleanup decisions and final timing. It must include retake selection confidence and meaning preservation validation. Blocking meaning checks or unresolved risky retake review prevent approval and approved snapshots.
