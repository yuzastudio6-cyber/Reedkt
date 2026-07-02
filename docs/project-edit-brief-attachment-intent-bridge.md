# Project Edit Brief Attachment Intent Bridge

The RP-EDITBRIEF-08 mock/local intent bridge is conservative. When metadata-only Marker Attachments are present, the bridge may add attachment IDs to marker intent `providedAssetIds`, remove generic missing-asset blockers, and append planner hints that clearly say the attachment is metadata-only.

The bridge never marks a marker `ready_for_plan`, never applies a plan, and never runs a planner. B-roll `needs_asset` can be reduced conservatively to draft intent when metadata is present, but it still does not prove real media availability.

Safety remains unchanged: no upload, no file bytes, no URL fetch, no media processing, no sound runtime, no providers, no workers, no render, no credits, and no Supabase command or write.
