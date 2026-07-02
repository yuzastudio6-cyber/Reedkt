# ProjectEditBrief Persistence Lifecycle

The RP-EDITBRIEF-03 lifecycle is mock/local:

1. `createMockDatabase` starts with empty ProjectEditBrief collections.
2. `MockProjectEditBriefRepository` seeds RP-EDITBRIEF-02 fixture records when the collections are empty.
3. Repository operations mutate only in-memory `MockDatabase` arrays.
4. Count/link maintenance runs after marker, attachment, message, intent, and conflict changes.
5. Timeline, drawer, bundle, and summary outputs are projected from repository state using RP-EDITBRIEF-02 mappers.
6. Disabled Supabase operations return blocked results with all side-effect flags false.

Future lifecycle work needs owner approval before any durable schema exists. Until then, this package is mock repository only and explicitly includes no API handlers, no UI routes, no migration, no direct Supabase CLI, no storage uploads, no external URL fetches, no media processing, no provider/model calls, no workers, no rendering, no credits, no staging, no commit, and no cleanup.

Recommended next step after owner review: RP-EDITBRIEF-04 — API Routes + Client Layer.
