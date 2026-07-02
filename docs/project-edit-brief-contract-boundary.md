# Project Edit Brief Contract Boundary

RP-EDITBRIEF-02 creates types, browser-safe fixtures, mapper helpers, request/response-only backend contracts, mock scenarios, an orchestrator, and smoke coverage.

Edit Brief is optional inside `ProjectEditSession`; Marker Chat remains scoped to one Marker.

Contracts exist for future API/repository work only. There are no handlers yet, no repository yet, no UI yet, no MockDatabase collection yet, no route wiring yet, no Supabase yet, and no runtime behavior change.

Boundary guarantees:

- no API handler
- no repository
- no UI route
- no ChatNativeEditor change
- no ProjectEditSessionChatPage change
- no migration
- no Supabase command
- no provider/model call
- no media processing
- no upload or file-byte read
- no worker/render/progress/credit effect
- no staging, commit, cleanup, delete, move, or rename

Recommended next milestone after owner review: RP-EDITBRIEF-03 - Mock Repository Layer.
