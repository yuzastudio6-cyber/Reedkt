# Edit Level Contract Boundary

RP-EDITLEVEL-02 adds:

- types/profiles/fixtures only;
- source-aware legacy compatibility helpers;
- deterministic summary/recommendation mappers;
- request/response-only backend contracts;
- mock scenarios and an orchestrator;
- smoke coverage.

RP-EDITLEVEL-03 now adds a mock-only repository, mock local API route metadata/handlers, and a browser-safe client boundary on top of those RP-EDITLEVEL-02 fixtures.

The combined RP-EDITLEVEL-02 and RP-EDITLEVEL-03 boundary still does not add:

- no runtime behavior;
- no production repository;
- no production API route;
- no UI behavior;
- no credit spend;
- no render;
- no migration;
- Supabase command;
- provider call;
- media worker;
- progress start.

The current `basic | pro | premium` runtime surface remains unchanged.
