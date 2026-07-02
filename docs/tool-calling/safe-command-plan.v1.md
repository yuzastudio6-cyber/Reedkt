# Reeditpro Safe Command Plans v1

## Purpose

Safe command plans are planning-only command intents. They describe what a future approved worker may translate into controlled execution, but they are not shell commands and they do not execute tools, process media, call providers, mutate Supabase, run SQL, create signed URLs, or unlock beta/production behavior.

This layer sits after adapter planning. Adapter plans describe selected tools and artifacts; safe command plans add allowlisted command intent IDs, typed parameter schemas, resource limits, sandbox policy, input artifact requirements, output artifact expectations, and validation policy.

## Boundary

- Safe command plans do not replace `server/tool-registry`.
- Safe command plans do not replace adapter contracts.
- Safe command plans do not replace `server/workers/production/production-worker-router.ts`.
- Safe command plans do not import execution command builders under `server/workers/**`, `server/activation/**`, or `server/cli/**`.
- Safe command plans must not contain raw shell strings, arbitrary args, local output paths, signed URLs, raw prompt text, service-role context, provider keys, or secret values.

## Artifact And Snapshot Rules

Safe command plans use artifact requirements and output expectations only. Input requirements are private artifact references. Output expectations are artifact types and storage bucket purposes, never local paths.

Future execution must require an approved snapshot and must route through existing worker routing.

## Initial Intent Policies

Milestone `REEDITPRO-TOOL-CALLING-SAFE-COMMAND-PLAN-1` adds allowlisted command intent policies for the current adapter contract layer and the four initial pipeline patterns. These policies cover metadata inspection, proxy creation, audio extraction, scene detection, frame analysis, safe-zone checks, transcription, captions, timeline validation/conversion, render planning, export planning, QA planning, OCR, masking, enhancement, slow motion, and color planning.

Pending external tools remain excluded until they become first-class `ProductionToolId` entries.
