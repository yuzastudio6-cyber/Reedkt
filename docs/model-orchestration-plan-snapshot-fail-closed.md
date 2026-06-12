# Plan Snapshot Fail-Closed Policy

The dry-run validates that invalid JSON, schema mismatches, missing fields, raw prompt execution requests, direct worker/tool execution requests, provider call requests, public artifact requests, signed URL source-of-truth requests, production mutation requests, broad media/runtime requests, and Demucs/VLM runtime requests all fail closed.

Signed URLs are never source of truth. Provider output and plan candidates cannot execute workers, tools, routes, mutations, media processing, public artifacts, or production paths.
