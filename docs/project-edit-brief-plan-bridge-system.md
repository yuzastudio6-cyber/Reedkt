# Project Edit Brief Plan Bridge System

RP-EDITBRIEF-11 adds mock/local Edit Brief Plan Hints. Confirmed and QA-safe markers can be converted into a `ProjectEditBriefPlannerInputPackage` for future planner milestones.

This system creates structured instructions only. It does not run the real edit planner, create an edit plan, start render/progress/export jobs, call Qwen, call DeepSeek, call providers, run workers, process media, read file bytes, fetch URLs, spend credits, run Supabase commands, or write remote persistence.

Priority order:
1. Safety / do-not-copy / policy
2. Confirmed Edit Brief markers
3. Main Edit Chat instructions
4. Edit Preference / Preference DNA
5. Auto Professional suggestions
6. Default editing style

Owner review remains pending before real planner integration.
