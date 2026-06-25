# AI Graphics Worker Handoff Readiness Contract

Decision: `ai_graphics_worker_handoff_readiness_contract_prepared_with_execution_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This contract prepares the future AI graphics Worker handoff layer after Tool Route planning metadata is selected. It defines the per-tool worker packet requirements needed before any worker queue or execution path can run.

It does not queue workers, execute tools, process media, load model weights, call providers, create artifacts, or unlock beta/production.

## Current Result

- Tools covered: 21.
- Product-facing capabilities covered: 12.
- Worker handoff packets prepared: 21.
- Worker queue-ready tools: 0.
- Worker-executable tools: 0.
- GPU/model tools targeting GPU runtime: 8.
- Heavy tools incorrectly targeting CPU: 0.

## Required Worker Inputs Before Queue

- Approved plan snapshot ID.
- Credit reservation ID.
- Artifact boundary approval.
- Private artifact manifest reference.
- Tool Route approval reference.
- Worker approval reference.
- Idempotency key.
- Worker queue or transport readiness.
- Runtime proof accepted by the beta-readiness gate.
- Internal beta owner approval.

## Blocked Worker Actions

Worker queue enqueue, worker execution, tool execution, provider/model execution, browser/WebGL/canvas runtime execution, GPU/model runtime execution, model weight download/load, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, internal beta, external beta, and production remain blocked.

## No CPU Fallback For Heavy Tools

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background` remain GPU-runtime targeted. The worker packets record `cpuFallbackAllowedForHeavyTool=false`.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no worker was queued, no tool/route/worker/provider executed, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no model weights were downloaded or loaded, no media was processed, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no beta or production gate was unlocked.
