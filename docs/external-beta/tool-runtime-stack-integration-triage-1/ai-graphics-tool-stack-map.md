# AI Graphics And Tool Stack Map

AI Graphics/tool stack status: `blocked_pending_stack_split_repair_or_retirement_plan`

Open AI Graphics/tool PR count: `153`

Non-draft AI Graphics/tool PR count: `0`

Draft AI Graphics/tool PR count: `153`

Mergeable/CLEAN AI Graphics/tool PR count: `151`

Dirty or unknown AI Graphics/tool PR count: `2`

## Lower Stack Edge

- #428 `[tools] AI_TOOLS_CREATIVE_GRAPHICS batch 1 QA review`
- #432 `[tools] AI_TOOLS_CREATIVE_GRAPHICS batch 2 approval packet`
- #437 `[tools] AI_TOOLS_CREATIVE_GRAPHICS batch 2 QA review`
- #438 `[tools] AI_TOOLS_CREATIVE_GRAPHICS batch 3 approval packet`
- #445 `[tools] AI_TOOLS_CREATIVE_GRAPHICS batch 3 QA review`

## Upper Stack Edge

- #787 `[tools] AI graphics browser runtime proof`
- #791 `[tools] AI graphics satori font runtime proof`
- #833 `[tools] AI graphics GPU model install build targets`
- #856 `[tools] AI graphics GPU model runtime readiness gate`
- #862 `[tools] AI graphics tool call readiness contract`

## Decision

Do not promote this stack directly. It is large, fully draft in the inspected set, and contains dirty/unknown PRs. The safe next action is a separate `AI_GRAPHICS_TOOL_STACK_SPLIT_REPAIR_RETIREMENT_TRIAGE_1` packet that classifies which branches should be retired, repaired, or replaced by a fresh integration-based source.
