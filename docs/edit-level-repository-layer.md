# Edit Level Repository Layer

RP-EDITLEVEL-03 adds a mock repository for the future Normal, Premium, and Ultra Premium Edit Level system. This is a mock repository only; it is not wired into Project setup, New Edit, Edit Brief, live planners, UI behavior, workers, providers, render/export, progress, or credit execution.

## Operations

The repository supports profile list/get, source-aware compatibility normalization, UI card model creation, recommendation create/get/list, selection save/get/update/clear, tool routing summary, Qwen routing summary, QA profile summary, estimate summary, fallback summary, readiness create/get, application log append/list, and repository summary.

All results preserve the RP-EDITLEVEL-03 side-effect flags: `mockOnly: true`, `providerCallMade: false`, `mediaProcessingStarted: false`, `workerJobCreated: false`, `renderJobCreated: false`, `creditReservedOrSpent: false`, `supabaseReadMade: false`, `supabaseWriteMade: false`, `fileBytesRead: false`, and `externalUrlFetched: false`.

## Boundary

There is no runtime implementation, no production repository, no Supabase persistence, no migration, no provider/model call, no media processing, no render budget execution, and no credit spend. Current runtime `basic | pro | premium` behavior remains unchanged.

Recommended next prompt: `RP-EDITLEVEL-04 - UI Cards + Recommendation`.
