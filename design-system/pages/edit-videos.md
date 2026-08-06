# Edit Videos Page Override

Status: `implemented_normal_edit_library_v1`

Status date: 2026-07-22

## Job

`Edit Videos` is the cross-project library for normal named video edits. It is not the Projects container library and it is not Motion Studio Storytelling.

## Ownership

- Route: `/edit-videos`.
- Normal edit destination: `/projects/:projectId/edits/:editSessionId`.
- Workspace: the existing `EditorPage` → `ChatNativeEditor` normal Edit Chat.
- Inclusion: explicit `productWorkflow = video_edit` plus safe migration of records without a workflow identity.
- Exclusion: explicit `motion_studio.storytelling` and exact retained legacy Motion identities.

The content category does not select the workspace. A normal edit with category `storytelling` remains in Edit Videos and opens normal Edit Chat.

## Hierarchy

1. Compact route header with `New video project`.
2. Search and state filters only when normal video edits exist.
3. Compact recovery truth when account recovery affects trust.
4. Bounded named-edit cards with project context.
5. One state-aware action that opens the exact normal edit.

## Required States

- Loading without trusted data: recovery state, never false empty.
- Empty: explain that the user creates a named edit inside a project; link to Projects.
- Ready: normal edit cards only.
- No results: clearable search/filter state.
- Access denied/unavailable/malformed: explicit resource state.

## Workflow Separation

- Never infer Motion Studio from `category = storytelling`.
- Never redirect normal Edit Chat into Motion Studio.
- Never render a Motion Studio story in this library.
- Combined-source navigation retains a separate Motion Studio destination and dedicated Storytelling workspace/chat.
