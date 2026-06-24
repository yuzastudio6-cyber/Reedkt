# AI Graphics Canonical Agent Selection Runtime Boundary QA Planning-Only Policy

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_qa_passed_with_warnings`

QA accepts planning/study metadata selection only. The agent may select, rank, eliminate, fallback, and explain missing proof. The agent may not execute tools, routes, workers, providers/models, browser/WebGL/canvas runtime, GPU/model runtime, storage, signed URLs, or public artifacts.

- agentCanSelectForPlanning: true
- agentCanExecuteToolsNow: false
- runtimeReadyNow: false
- internalBetaReadyNow: false
- productionReadyNow: false
