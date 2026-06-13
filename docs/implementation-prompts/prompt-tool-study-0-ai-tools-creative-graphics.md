# Prompt: TOOL-STUDY-0 AI_TOOLS_CREATIVE_GRAPHICS Capability Routing Study

Continue from this PR and validate the docs/diagnostics-only `AI_TOOLS_CREATIVE_GRAPHICS` owner study.

Do not execute providers, models, image generation, image editing, tools, workers, routes, media processing, browser capture, map rendering, Supabase, SQL, GCS upload, public artifacts, signed URLs, dependency mutation, raw prompts, beta, or production.

Required validation command:

```bash
REEDITPRO_CONFIRM_TOOL_STUDY_0_AI_TOOLS_CREATIVE_GRAPHICS=true \
REEDITPRO_CONFIRM_TOOL_STUDY_DOCS_ONLY=true \
REEDITPRO_CONFIRM_TOOL_STUDY_DIAGNOSTICS_ONLY=true \
REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY=true \
npm run tool-study:ai-tools-creative-graphics:diagnostics
```

Expected decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`.

The next owner phase after this passes is `TOOL-STUDY-0 - TRACK_A_RENDER_EXPORT`. Tool-route execution remains blocked until the remaining owner study is complete and a separate route execution approval packet passes.
