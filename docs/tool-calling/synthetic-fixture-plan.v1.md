# Synthetic Fixture Plan v1

## Purpose

Synthetic fixture plans define the tiny future artifacts needed to safely test tool execution. They are requirements only. They are not generated fixture files, they do not run tools, and they do not process media.

This layer sits after safe command planning. Safe command plans define structured command intent; synthetic fixture plans define what future controlled dry-runs will need as private input artifacts, expected output artifacts, validation gates, and safety limits.

## Runtime Boundary

- No fixture generation in this milestone.
- No tool, shell, worker, provider, media, Supabase, SQL, migration, signed URL, beta, or production execution.
- No real user media is involved.
- No local paths, output paths, remote URLs, signed URLs, raw prompts, service-role context, arbitrary args, command strings, or provider secrets are allowed in fixture plans.
- Future fixture generation must happen only in `REEDITPRO-TOOL-CALLING-SYNTHETIC-FIXTURE-DRY-RUN-1` or another controlled fixture execution milestone.

## Catalog Boundary

The catalog defines 12 future-only synthetic fixture requirements covering the current command intent families: tiny video, audio, transcript JSON, caption JSON, timeline JSON, render manifest JSON, checkerboard image, mask image, enhancement proxy, slow-motion pattern, and final delivery manifest.

Existing fixture helpers under `server/media`, `server/e2e`, and `server/workers` are execution or smoke-test helpers. This planning layer does not import them and does not replace them.

## Integration

Synthetic fixture plans reuse safe command plans, adapter plans, production registry IDs, runtime artifact types, storage bucket purposes, QA gates, fallback policy output, and the existing worker-router boundary. They do not create a second registry, adapter registry, command policy, worker router, QA policy, fallback policy, runtime contract table, tool execution table, or worker job table.

## Future Dry-Run Requirements

Future controlled dry-runs must consume approved snapshots and private artifact references, generate only tiny synthetic artifacts, and keep all tool execution behind the existing production worker and runtime safety gates.
