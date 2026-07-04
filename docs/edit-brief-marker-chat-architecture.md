# Edit Brief Marker Chat Architecture

Status: architecture/docs only. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Marker Chat Scope

Marker Chat is scoped to one Marker and one `ProjectEditSession`. It is not the main Edit Chat and should not spam the main Edit Chat.

## Future Saved Data

- Raw marker messages.
- Structured marker intent.
- Confirmation summary.
- Clarification status.
- Intent revision history.
- Marker status update.

## Future Message Behaviors

- User message.
- Mock assistant confirmation later.
- Clarifying question later.
- Intent summary.
- Confirmation summary.

## AI Modes

- `off`
- `confirm_only`
- `ask_clarifying_questions`
- `suggest_options`

Recommended default: `confirm_only`, owner approval pending. No Qwen, DeepSeek, provider, worker, or model call is allowed in this architecture milestone.

## Main Chat Summary

The main Edit Chat may later show summarized events only, for example: `Marker 00:18 updated: Add city B-roll while keeping original audio.`
