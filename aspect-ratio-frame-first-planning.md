# Aspect Ratio Frame-First Planning

## Purpose

Aspect ratio is the foundation of every ReeditPro edit. It affects the final canvas, source crop or padding strategy, speaker framing, captions, visual zones, lower panels, side-by-side layouts, picture-in-picture, maps, charts, browser placement, depth-aware overlays, foreground masks, image generation prompts, AI video prompts, Remotion composition, export settings, credit estimates, approved snapshots, and future worker runtime.

## No Silent Default Rule

ReeditPro must never silently default to an aspect ratio.

The system may recommend an aspect ratio:

- TikTok / Reels / Shorts: `9:16`
- YouTube standard: `16:9`
- Square social: `1:1`
- Portrait feed/social: `4:5`
- Classic/documentary/archive: `4:3` when the user asks

A recommendation is not confirmation. The user must explicitly confirm the output frame before approval.

## Chat-Native Gate

The chat should ask: “Where is this video going?”

Then it should offer clear output-frame options:

- TikTok / Reels / Shorts: `9:16`
- YouTube: `16:9`
- Square social: `1:1`
- Portrait feed: `4:5`
- Classic / documentary / archive: `4:3`

The plan remains draft until the output frame is confirmed.

## Draft Planning Vs Approved Planning

Before aspect ratio confirmation, ReeditPro can show draft planning, but it must not allow approval, generation, render planning as ready, credit approval, credit deduction, worker execution, or final export planning.

After confirmation, layout, prompt, tool, render, credit, approved snapshot, and worker-runtime planning must use the confirmed target frame.

## Source Ratio Vs Output Ratio

Uploaded source ratio is not the final output ratio unless the user confirms it. ReeditPro must plan crop, contain, pad, blur background, panel background, smart reframe, speaker-safe crop, product/object-safe crop, caption safe zones, and visual safe zones where needed.

## Planner Effects

Visual Asset Plan: generated images, cards, and keyframes must fit the target visual zones.

Speaker/Visual Layout: `9:16` favors top/bottom, lower panel, and PIP; `16:9` favors side-by-side and full visual takeovers; `1:1` favors centered panels and PIP; `4:5` favors portrait feed-safe layouts; `4:3` favors classic documentary/archive treatments.

Depth-Aware Overlay: masks and overlays must fit the confirmed frame and safe zones.

Map/DataViz/Browser: label density and layout depend on the available frame space.

Provider Prompt Plans: prompts must mention target frame, visual zone, safe margins, caption safe zone, panel background, Remotion ownership, and asset-only scope. AI clips should fit assigned visual zones and matching panel backgrounds.

Renderer Plan: Remotion canvas size and zones must be derived from the confirmed aspect ratio.

Credit Estimate: aspect ratio can change asset count, layout complexity, render strategy, and export settings.

Approved Snapshot: confirmed aspect ratio, canvas, frame template, safe zones, panel background, and source-to-output fit plan must be frozen.

Worker Runtime: future workers use the confirmed frame setup from the approved snapshot.

## Aspect Ratio Changes Reset Approval

If the user changes aspect ratio after planning, ReeditPro must reset approval, progress, preview, and approved snapshot state. A later backend version should create a new plan version, recalculate credit estimates, and rebuild layout, prompt, tool, renderer, and worker plans.

## Non-Goals

This document does not implement real rendering, provider calls, backend, Supabase, migrations, billing, worker execution, or media processing.
