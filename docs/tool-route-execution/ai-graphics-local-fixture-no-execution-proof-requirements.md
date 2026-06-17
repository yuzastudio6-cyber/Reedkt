# AI Graphics Local Fixture No-Execution Proof Requirements

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

The future validation lane must prove that validation is local/static and metadata-only. The proof must show:

- no route handler import;
- no tool runtime import;
- no worker runtime import;
- no provider/model client import;
- no browser/WebGL/canvas runtime;
- no resvg rasterization;
- no Remotion render/export;
- no Supabase or SQL access;
- no GCS/storage transfer;
- no signed URL creation;
- no public artifact creation;
- no media, render, browser, canvas, or WebGL output;
- no raw prompt execution;
- no beta or production unlock.

The proof may inspect committed docs and JSON templates only. It must not create `.local-artifacts` in this approval packet and must not execute the validation runner until `TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_EXECUTION` is separately approved.
