# Production Smart Cut Foundation

Milestone 8 adds evidence-based smart cut planning for the production runtime. It uses structured media analysis, transcript segments, word timestamps, filler candidates, repeated-take candidates, silence/dead-space signals, caption segments, and scene safety metadata.

This milestone does not cut media, overwrite source files, render previews, export final videos, call providers, run GPU tools, or use Revideo.

Milestone 9 can consume `SmartCutPlan` and timeline cue metadata for SoundSync planning, music ducking, and SFX density decisions. Audio planning does not change smart cut decisions.

Milestone 10 adds OpenTimelineIO and core render/readiness declarations for future timeline handoff checks. M10 does not import OpenTimelineIO runtime in smart cut code, cut media, or render/export.

Milestone 14 builds on this foundation by turning `SmartCutPlan` metadata into a validated execution plan. It blocks mid-word cuts, protected segment removal, unsafe overlaps, and final export attempts before any local-dev proxy preview can run.

## Outputs

- `SmartCutPlan`: deterministic keep/remove/protect decisions with reasons, confidence, warnings, and required QA gates.
- cut boundary records aligned to word timing where available.
- meaning preservation findings that warn about possible context, story, or emotional pause loss.
- QA gate records for cut smoothness, transcript alignment, audio sync placeholder, and render timeline integrity placeholder.
- timeline input for the Milestone 8 timeline foundation.

## Evidence Rules

Smart cut decisions must be based on evidence, not raw chat. Missing transcript or scene evidence makes the plan conservative. No mid-word cut is allowed. Repeated-take cleanup must keep at least one version. Emotional/natural pauses are protected unless approved intent and pacing profile clearly allow tighter cleanup.
