# AI Video B-roll Generation Product Integration Plan

Status: `ai_video_broll_gen_0_product_integration_plan_no_execution`

This is planning only. No generated B-roll is created, no user media is processed, no route executes, no worker dispatch occurs, no provider/model call is made, and no beta/runtime readiness is claimed.

## When To Generate B-roll

Future generated B-roll may be considered only when the user provides insufficient footage, uploaded B-roll does not support the edit intent, a visual support opportunity is important, and deterministic cards/graphics are not enough.

## When To Ask For Footage Instead

Ask the user for footage when the scene requires a real person, real place, product accuracy, legal proof, documentary evidence, brand-controlled visuals, sensitive claims, medical/legal/financial topics, minors, likeness, trademarks, or any case where synthetic visuals could mislead.

## Prompt Sources

Future prompts must derive from structured agent findings, edit intents, visual support opportunities, approved plan snapshots, product context, user constraints, and safety policies. Raw chat must not become direct model input or worker payload.

## Shot Intent Extraction

Extract shot purpose, subject, environment, mood, camera motion, duration, aspect ratio, realism/stylization target, avoid rules, provenance needs, and approval requirements. Keep generated B-roll tied to a timeline segment and story function.

## Storyboard / Timeline Integration

Generated B-roll must remain a candidate visual layer until user approval and owner gates. Track A owns final composition and export. Track B owns media processing. AI_VIDEO_BROLL_GENERATION owns candidate generation planning only.

## Duration / Aspect Ratio Policy

Default future planning should prefer short clips, platform-safe aspect ratios, and timeline-driven duration. Exact duration, frame rate, and resolution must be model-specific future decisions and must not be inferred as runtime readiness in Gate 0.

## User Approval Policy

Generated B-roll must be shown as planned or candidate-only until explicit user approval, credit approval, safety approval, and owner gate acceptance exist. No automatic generation is allowed from this plan.

## Watermark / Provenance Metadata Policy

Future generated B-roll must carry provenance metadata, model/source references, approval references, and disclosure policy. Public delivery remains blocked until public artifact policy is accepted.

## Artifact And Handoff Policy

Future private artifacts require manifest, checksum, approved snapshot reference, private storage path, QA evidence, and Track A/Track B handoff. Signed URLs are not source of truth.
