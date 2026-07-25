# ReEditPro Intelligence Responsibility Orchestration

Status: source-verified role and workflow contract; provider activation and
production qualification remain closed.

## Decision

The supplied multi-model document is used as a responsibility map, not as a
literal provider roster. ReEditPro does not hardcode Luna, Terra, Sol, or any
other replaceable model name into edit-workflow business logic. It assigns the
five responsibilities to the canonical authorities that exist in this product:

| Responsibility | Current ReEditPro authority |
| --- | --- |
| Visual Analyst | Qwen2.5-VL visual-understanding specialist, using bounded source/proxy evidence |
| Creative Director | Ordered Kimi K3 primary, Qwen 3.7 fallback, DeepSeek V4 Pro final-fallback reasoning route |
| Operations Orchestrator | Existing deterministic approved-snapshot work graph, queue, lease, tool dispatch, artifact, checkback, and cost authorities |
| Engineering Specialist | Operator-reviewed engineering boundary; never an automatic customer-job patch or arbitrary shell authority |
| Final Judge | Exceptional recommendation boundary; explicit user approval and canonical policy remain final |

This keeps model replacement centralized. Provider endpoints, exact model
versions, secrets, rate cards, availability, and runtime qualification stay in
their existing server-only registries and evidence gates.

## Routing rules

- One exact task has one responsibility owner.
- Models make bounded decisions; controlled tools and workers perform media
  operations.
- The Visual Analyst cannot choose the final narrative or approve a plan.
- The Creative Director runs only at meaningful planning/review checkpoints.
  Its three reasoning routes are an ordered fallback chain, not three eager
  calls.
- The Operations Orchestrator is deterministic in the current product. It
  cannot silently change creative intent or start expensive work before the
  plan, estimate, user approval, immutable snapshot, and active reservation.
- Engineering escalation is dormant during ordinary edits. It requires
  operator review, sandboxing, allowlists, resource limits, and audit.
- Final judgment is exceptional and recommendation-only. It cannot replace the
  customer’s approval or mutate an approved snapshot.

`ProfessionalSkillPlan` now carries
`intelligenceResponsibilityPlan`. That projection records selected and dormant
responsibilities, candidate model roles, and zero invocation counts. It is
frozen into the ordinary plan/snapshot structure; it is not a second plan,
queue, receipt, or persistence authority.

## Resumable workflow projection

The contract defines the ordered projection:

1. project created;
2. source authority ready;
3. source sequence confirmed, or exact verified idea-first authority;
4. deterministic analysis ready;
5. visual evidence ready, or exact verified idea-first not-applicable status;
6. Brief, Preference, source, and output-frame inputs bound;
7. creative blueprint ready;
8. plan and credit estimate presented;
9. explicit user approval recorded;
10. approved snapshot and active reservation ready;
11. execution package ready;
12. work graph executing;
13. private rough cut ready;
14. technical QA complete;
15. creative review complete;
16. approved corrections complete;
17. final QA complete;
18. private final render ready;
19. private delivery ready.

The evaluator is deliberately non-mutating. Existing canonical journey,
planning, approved-snapshot, queue/lease, artifact, QA, cost, and recovery
authorities persist the real state. The projection rejects skipped stages,
execution before approval, and backwards mutation. A changed source, Brief,
Preference, output frame, creative blueprint, approved plan, or QA evidence
creates the appropriate invalidation point while preserving historical
snapshots.

## Verification

- `npm run smoke:intelligence-orchestration`
- `npm run smoke:professional-skill-planner`
- `npm run smoke:reasoning-model-routing-cost`
- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run check:frontend-boundary`
- `npm run check:secrets`

The adversarial smoke proves that missing route roles block the relevant
responsibility; fallbacks are not eagerly invoked; visual analysis cannot own
creative direction; operations have no model binding; engineering has no
automatic shell authority; final judgment cannot replace user approval;
execution is blocked without approval, snapshot, and reservation; exact replay
is non-mutating; and output-frame changes require a new plan/snapshot cycle.

No provider call, secret read, model request, tool execution, worker dispatch,
render, customer charge, Supabase mutation, cloud change, deployment, or public
delivery is performed by this slice.
