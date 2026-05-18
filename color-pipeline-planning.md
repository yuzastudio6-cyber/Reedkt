# Color Pipeline Planning

## Purpose

ReeditPro needs a professional color pipeline so every edit, including Basic, has clean, consistent color. The color pipeline plans exposure correction, white balance, contrast curve, highlight recovery, shadow control, skin tone protection, saturation/vibrance, noise reduction when useful, sharpening/clarity when appropriate, shot matching, LUT/look strength, generated asset color matching, AI video panel color consistency, output consistency, and QA checks.

This is planning only. The frontend does not run real color analysis, FFmpeg, OpenColorIO, OpenImageIO, OpenCV, Sharp, media processing, rendering, backend jobs, or provider calls.

## Basic Is Still Professional

Basic includes clean natural correction, exposure and white balance correction, natural contrast, controlled saturation, skin tone protection, basic shot matching, and generated asset color consistency. Basic must not be described as ungraded, sloppy, washed out, overprocessed, random, low quality, or LUT-heavy.

Basic should avoid ugly LUTs, crushed blacks, over-sharpening, blown highlights, extreme saturation, and mismatched generated asset colors.

## Pro Color Behavior

Pro includes the Basic baseline plus style-specific grading, stronger shot matching, category-aware looks, better face and skin priority, highlight/shadow control, generated image matching, AI clip matching, and stronger QA.

## Premium Color Behavior

Premium includes Pro plus scene-by-scene color planning, secondary correction planning, stronger look development, generated asset harmonization, AI video panel matching, stronger QA/fallback notes, manual-style review notes, and deeper future OpenColorIO/OpenImageIO planning.

## Color Grade Styles

- `clean_natural`: Default Basic, talking head, education, and simple creator edits.
- `premium_clean`: Pro creator, business, polished brand videos, and restrained premium work.
- `warm_lifestyle`: Lifestyle, family, food, travel, and warm human content.
- `cinematic_contrast`: Emotional story, cinematic story, and dramatic moments with protected detail.
- `documentary_neutral`: Documentary, case study, scam/fraud, and evidence tone.
- `luxury_real_estate`: Property, luxury products, bright interiors, and premium spaces.
- `corporate_neutral`: SaaS, training, business, and internal professional content.
- `bright_social`: High-retention social and energetic creator work with controlled brightness.
- `moody_dramatic`: Suspense, conflict, and heavy story tone.
- `film_emulation_light`: Premium cinematic lifestyle/story with subtle film feel.
- `muted_editorial`: Serious editorial, documentary, fashion, and brand work.
- `high_key_clean`: Beauty, education, and clean lifestyle.
- `monochrome`: Flashbacks, memory, serious emphasis, or stylized sections.
- `custom`: User-defined style mapped to known presets plus a custom directive.

## Tool Responsibilities

FFmpeg future worker plans trim/scale/export processing, LUT application, color filters, basic correction, output transforms, and final color pass.

OpenColorIO future worker plans professional color management, ACES/display/look transforms, generated asset look matching, and Pro/Premium color pipeline depth.

OpenImageIO future worker plans image asset conversion, still/keyframe color management, image QA, and VFX-style still processing.

OpenCV and Sharp future QA plan histogram/color comparison, panel background match, generated asset consistency checks, blur/quality checks, and image preparation.

Remotion composes layers, places generated assets, previews color-treated assets, and preserves the final canvas. Remotion does not replace a full professional grading pipeline.

## Generated Asset Color Matching

Generated GPT-Image-2 stills, keyframes, cards, maps/charts when styled, Wan/Hailuo/Veo clips, Real Motion clips, and Stroke Motion panels should match the edit color grade style, panel background color, category mood, source video look, and final frame layout.

## AI Video Panel Color Consistency

AI video clips should use the matching panel background, avoid lighting/style drift, preserve the chosen style mode, match the final grade where possible, and be checked in QA for mismatch.

## Color QA

Color QA checks exposure, white balance, skin tones, shot matching, generated asset consistency, AI video panel consistency, documentary neutrality, Basic professional polish, Pro/Premium style fit, and avoidance of random overprocessed LUT looks, crushed blacks, clipping, or overexposure.

## Non-Goals

This document does not implement real FFmpeg, OpenColorIO, OpenImageIO, OpenCV, Sharp, real color grading, media processing, render/export, backend workers, or provider calls.
