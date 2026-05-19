# Next Implementation Plan

Recommended sequence:

1. `RP-CHECK-01 - Repository + Supabase Migration Audit`
2. `RP-TIMING-01 - StoryTiming Engine Architecture`
3. `RP-TIMING-02 - TypeScript Timing Contracts`
4. `RP-TIMING-03 - Supabase Migration: Timing Tables`
5. `RP-AUDIO-03-RESTORE - Restore or recreate SoundSync Music Intelligence migration if still missing`
6. `RP-SUPABASE-01 - Local Supabase Setup + Migration Validation`
7. `RP-SUPABASE-02 - Deploy Migrations to reeditpro Supabase Project`
8. `RP-BE-01 - Real Supabase Client + Backend Runtime Boundary`
9. `RP-BE-02 - Chat/Project/Media API Routes`
10. `RP-AI-01 - Real AI Planning Prompt System`
11. `RP-GCP-01 - Google Cloud Worker Foundation`
12. `RP-RENDER-01 - Render Pipeline Skeleton`

## Why StoryTiming Should Come Before Live Supabase Deployment

StoryTiming appears throughout product language but does not yet have a dedicated master engine or database schema on this branch. Timing affects:

- source sequence interpretation
- cuts and pacing
- captions
- transitions
- Stroke Motion timing anchors
- Graphic Design / VisualExplain motion
- Real Motion placement
- SoundSync music/SFX/ducking
- render layer timing
- QA timing checks

If timing tables are needed, adding them before remote deployment reduces migration churn and avoids retrofitting core edit-plan records later.

## Immediate Next Step

Do not deploy yet. Complete StoryTiming architecture and local Supabase validation first.
