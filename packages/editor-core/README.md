# packages/editor-core

`packages/editor-core` owns pure timeline and editor logic that should be reusable by the web app and future desktop app.

## Allowed

- timeline data structures
- edit decision utilities
- pure caption and transcript transforms
- deterministic editor state helpers

## Not Allowed

- direct Cloud Run calls
- direct `gcloud` execution
- provider calls
- service-role storage access
- model or media execution
- browser-only rendering surfaces
