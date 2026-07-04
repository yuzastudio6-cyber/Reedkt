# ProjectEditBrief Repository Transition Plan

RP-EDITBRIEF-03 prepares the Edit Brief persistence seam without introducing runtime behavior. The transition path stays conservative:

1. RP-EDITBRIEF-03: mock repository only, MockDatabase collections added, Supabase skeleton disabled.
2. RP-EDITBRIEF-04: mock API routes plus browser-safe client layer, still no production HTTP routes.
3. Future UI milestone: optional Brief route and timeline/marker UI after owner review.
4. Future persistence milestone: owner-approved Supabase schema rooted in `edit_briefs`, `edit_cues`, child cue tables, and `edit_session_export_settings`, plus RLS, explicit Data API grants, service boundary, migration, and typegen.
5. Future planner milestone: only confirmed markers become planner hints, after safety/do-not-copy policy checks.

The repository keeps ProjectEditBrief distinct from ProjectEditSession and Edit Preference:

- ProjectEditSession / Edit Chat is the persistent workspace.
- ProjectEditBrief is an optional timeline instruction layer inside an Edit Chat.
- Marker Chat is scoped to one marker.
- Edit Preference remains reusable style/DNA, not a session or brief.
- Export settings belong to ProjectEditSession.

This transition step has no API handlers, no UI routes, no runtime behavior, no migration, no direct Supabase CLI, no staging, no commit, and no cleanup.
