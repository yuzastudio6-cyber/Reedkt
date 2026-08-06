# Edit Level Supabase Boundary

RP-EDITLEVEL-03 includes a disabled Supabase repository skeleton for future architecture alignment. The skeleton always reports `supabase_disabled` and returns blocked/disabled results.

Supabase disabled means:

- no Supabase client is constructed;
- no service-role client is imported or initialized;
- no table read or write is attempted;
- no SQL migration is created;
- no Supabase CLI command is run;
- no environment secret is read.

The active RP-EDITLEVEL-03 path is the mock repository backed by MockDatabase. There is no runtime implementation, no production repository, no backend persistence, no provider/model call, no media worker, no render/export, and no credit spend.

Recommended next prompt: `RP-EDITLEVEL-04 - UI Cards + Recommendation`.
