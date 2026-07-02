# Project Edit Brief Plan UI

The Brief workspace shows a `Brief Plan Hints` panel after Marker QA. The panel displays readiness, eligible/skipped/warning/blocked counts, instruction cards, skipped marker reasons, export settings summary, priority policy, application-log summary, and the mock/local boundary.

The button label is `Prepare Plan Hints`. The UI avoids language such as generate, render, start edit, run planner, or spend credits.

Preparing plan hints appends an Edit Brief application log through the existing mock API client. No real planner runs. It does not update marker status, create an edit plan, start progress, render, provider calls, workers, credits, media processing, or Supabase.
