# RP-EDITBRIEF-01 Edit Brief Product Flow

Status: architecture/docs only. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

Product model: Project = workspace/container. `ProjectEditSession` = persistent video editing session inside a project. Edit Chat = user-facing name for `ProjectEditSession`. Edit Brief = optional timeline-based instruction layer inside an Edit Chat. Marker = time-specific or range-specific instruction inside an Edit Brief. Marker Chat = scoped conversation for one marker. Edit Preference = reusable style/DNA that can be applied to an Edit Chat. Export Settings = session-level output settings, accessible from Chat and Brief.

## Simple User Path

1. Upload raw video later through approved storage/source lifecycle.
2. Tell ReEditPro what to do in the main Edit Chat.
3. ReEditPro plans the edit in a later milestone.
4. User approves later.

The simple path never requires Edit Brief. Chat remains the default path.

## Advanced User Path

1. Open an Edit Chat.
2. Optionally open the Brief tab.
3. Play or inspect the mock video/preview shell.
4. Add a Marker at an exact time or range.
5. Write an instruction.
6. Attach B-roll, image, music, SFX, voiceover, document, reference label, or reference URL metadata where needed.
7. Optionally use Marker Chat.
8. ReEditPro captures raw Marker Chat messages and structured intent in a future milestone.
9. Marker status becomes `draft`, `needs_clarification`, `needs_asset`, `confirmed`, `conflict`, or `ready_for_plan`.
10. User closes Brief.
11. Main Edit Chat stays clean, with only summary events later if approved.
12. Planner later uses confirmed markers after approval gates.

## Product Rules

- Edit Brief is optional.
- Opening Edit Brief must not mutate the edit by itself.
- Closing Edit Brief without changes has no side effects.
- Markers create structured intent, not immediate execution.
- Marker Chat is not the main Edit Chat.
- Edit Brief is not an Edit Preference.
- Export Settings belong to `ProjectEditSession`, not only to Edit Brief.
- No Qwen, DeepSeek, provider, worker, render, upload, file-byte read, credit, Supabase, or production route behavior is enabled.

## Non-Blocking Missing References

The following packet reference docs were missing during RP-EDITBRIEF-01 planning and should be treated as non-blocking: `docs/project-edit-session-preference-dna-system.md`, `docs/edit-preference-toolchain-map.md`, and `docs/edit-preference-input-to-tool-route-map.md`.
