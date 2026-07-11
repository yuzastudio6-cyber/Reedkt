# Database Expansion Plan

This document outlines future database milestones only. It does not implement migrations, run Supabase, add RLS policies, create storage buckets, connect credentials, or wire production data.

## RP-DB-11: Footage Prep + Source Understanding

Expected tables:

- `footage_prep_sessions`
- `asset_analysis_reports`
- `transcript_segments`
- `transcript_words`
- `scene_segments`
- `silence_regions`
- `retake_groups`
- `retake_group_candidates`
- `source_quality_flags`
- `source_understanding_maps`

Why it exists:

This milestone stores the assistant-editor understanding layer. It lets ReeditPro preserve what the AI learned about speech, scenes, silence, retakes, quality, privacy, hooks, CTA moments, and source structure before creative planning begins.

## RP-DB-12: Cleanup Plan + Clean Assembly

Expected tables:

- `cleanup_plans`
- `cleanup_plan_items`
- `clean_assemblies`
- `clean_assembly_segments`
- `source_time_mappings`
- `cleanup_review_cards`
- `cleanup_review_item_states`
- `cleanup_review_operations`

Why it exists:

This milestone stores non-destructive cleanup decisions and the Clean Assembly. It solves the production problem of preparing messy source footage while keeping raw media immutable and preserving raw-to-clean-to-final timing relationships.

## RP-DB-13: Edit Brief + Edit Cues

Expected tables:

- `edit_briefs`
- `edit_brief_operations`
- `edit_cues`
- `edit_cue_operations`
- `edit_cue_anchors`
- `edit_cue_assets`
- `edit_cue_remap_results`
- `edit_cue_conflicts`
- `edit_cue_conflict_operations`
- `edit_cue_plan_mappings`
- `edit_cue_chat_cards`

Why it exists:

This milestone stores optional user direction after prep. It lets users add goals, style notes, asset instructions, avoid rules, and time/scene/transcript-based cues without turning those cues into raw render commands.

## RP-DB-14: Professional Integration Plans

Expected tables:

- `professional_integration_plans`
- `asset_treatment_plans`
- `broll_integration_plans`
- `overlay_composition_plans`
- `cue_compliance_checks`

Why it exists:

This milestone stores the professional treatment layer between user direction and render execution. It explains how each cue becomes polished editing behavior, including placement, crop, timing, audio, color, safe zones, privacy blur, readability, and QA expectations.

## RP-DB-15: Edit Map / Edit Graph

Expected tables:

- `edit_documents`
- `edit_systems`
- `edit_groups`
- `edit_elements`
- `edit_element_instances`
- `edit_element_dependencies`
- `edit_operations`
- `edit_versions`

Why it exists:

This milestone stores the editable post-preview representation. It solves the production problem of letting users revise a generated preview through connected systems, groups, and elements instead of disconnected timeline boxes.

## Migration Rules

- Migrations must be additive and reviewable.
- Include RLS policies.
- Include indexes for project/user/workspace lookup paths.
- Include comments for important tables.
- Include `updated_at` triggers where relevant.
- Avoid storing secrets.
- Avoid storing long-lived signed URLs.
- Keep raw media immutable.
- Store source-to-clean-to-final timing mappings.
- Connect cue records to plan/render/edit-map records.
- Store enough audit information to debug what the AI did and why.
