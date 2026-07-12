# Canonical Atomic Work-Item Compilation

Status: authenticated local/private backend execution contract

ReEditPro planning may group a professional tool chain into one planner work
item, but canonical workers execute one unambiguous tool operation and required
output at a time. The backend compiler bridges those layers before plan hashing,
approval, synthetic reservation, snapshot creation, job derivation, dispatch,
or artifact execution.

## Planner input contract

A grouped work item declares its complete tool and output authority at the
normal work-item level and adds `executionInput.canonicalAtomicExecution`:

```json
{
  "schemaVersion": "canonical-atomic-tool-execution-descriptor-v1",
  "steps": [
    {
      "stepKey": "chart",
      "toolId": "d3",
      "operationId": "tool.d3.render_chart_or_diagram.v1",
      "workerClass": "controlled_graphics_worker",
      "expectedOutputKey": "chart-svg",
      "executionInput": {
        "approvedToolOperationIds": ["tool.d3.render_chart_or_diagram.v1"],
        "structuredPayload": {}
      },
      "dependencyStepKeys": [],
      "maximumCreditBudget": 1
    }
  ]
}
```

Each step maps one exact canonical tool/operation to one expected output. The
step carries the exact execution input that the existing single-tool adapter
will later reload from immutable authority.

## Compilation invariants

The compiler fails before publication unless:

- source work-item, step, tool, operation, output, and dependency identities
  are unique and safe;
- every source expected output is mapped exactly once;
- the set of step tools exactly equals the grouped work item's approved tools;
- every tool resolves to one callable canonical operation contract;
- the grouped and per-step operation identities agree exactly;
- internal step dependencies and the source work graph are acyclic;
- per-step maximum credit budgets sum exactly to the grouped work-item budget;
- provider execution is absent; and
- grouped terminal render/final-QA authority is absent.

Tool-free multi-output work, provider-backed grouped work, and grouped terminal
render/final-QA work remain separately gated because they need different
authority, settlement, and review contracts.

## Derived authority

Compilation produces deterministic atomic work-item keys. Every atomic work
item contains one tool, one operation identity, one expected output, one worker
class, and its exact execution input. Internal step dependencies are rewritten
to atomic keys. A downstream planner work item that depends on a grouped node
waits for every terminal atomic branch of that node.

The compiler records content-addressed evidence containing source/compiled
counts, source and compiled draft hashes, deterministic mappings, terminal
keys, tools, operations, outputs, and a compilation hash. That evidence becomes
part of the canonical plan component references and is therefore frozen into
the plan hash and approved snapshot lineage. When publication comes through the
persisted planning-handoff route, the original grouped publication candidate
also remains privately persisted and content-addressed.

## Execution evidence

The bounded private lifecycle proves a grouped D3-to-ECharts planner node is
compiled into two canonical jobs. Both jobs independently pass approved
snapshot/work-item loading, funded synthetic reservation checks, lease claim,
one-use dispatch, exact SVG execution, private persistence, QA, reconciliation,
replay, dependency progression, and package progress recovery. Neither job
uses the legacy multi-tool runtime blocker.

This does not make arbitrary provider chains, public rendering, billing,
distributed workers, external beta, or production execution ready. It changes
no frontend call site and grants no browser execution authority.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
