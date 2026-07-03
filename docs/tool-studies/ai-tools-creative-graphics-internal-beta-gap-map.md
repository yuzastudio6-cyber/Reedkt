# AI_TOOLS_CREATIVE_GRAPHICS Internal Beta Gap Map

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

This owner study can support metadata review, but it does not unlock internal beta, external beta, paid production, production, provider calls, tool execution, route execution, worker execution, image generation, image editing, media processing, public artifacts, signed URLs, or Supabase writes.

## Gaps Before Any Route Execution

- Approved plan snapshot fields for creative graphics must be finalized.
- Provider gateway must approve model aliases, secret refs, cost guards, redaction, schema validation, and fail-closed behavior.
- Worker runtime must approve intake and lifecycle for approved snapshots only.
- Track A must approve render/export, final composition, private artifact storage, and delivery rules.
- Copyright/IP/brand/provenance policy must cover style transfer, reference imagery, logos, real people, and generated/edited image usage.
- Visual QA must cover safe zones, face obstruction, typography, contrast, caption collision, source truth, and documentary fact-safety.
- Public artifacts and signed URL delivery remain blocked until a separate artifact/delivery policy.

## Internal Review Allowed Later

Only a later explicitly approved metadata review may inspect:

- creative graphics route metadata
- prompt-to-intent mappings
- approved snapshot fixture fields
- private placeholder artifact refs
- QA checklist coverage
- blocker and owner handoff completeness

## Still Blocked

- image generation runtime
- image editing runtime
- provider/model execution
- tool/route/worker execution
- public artifact creation
- signed URL source-of-truth use
- Supabase writes
- production, external beta, paid production
- raw prompt execution
