# Planner Regression Validation

## Purpose

ReeditPro planning now combines compiled intent, professional editing directives, visual asset planning, provider routing, renderer planning, segment operations, QA planning, provider prompt previews, character consistency, fact safety, credit estimates, and approved snapshot architecture.

Regression validation exists so future changes do not silently break the hard product rules that keep this planning stack professional and safe.

The validator checks structured mock plans, not rendered media. It is a planning safeguard for the frontend prototype and a future unit-test target when the project adds a test runner.

## What Validation Checks

The mock validator checks:

- model routing rules
- tier restrictions
- provider prompt rules
- frame and matching-background rules
- approval gate rules
- credit estimate rules
- visual asset plan existence
- renderer plan existence
- professional editing directive existence
- segment operation existence
- QA plan existence
- character consistency planning
- documentary fact safety planning
- demo scenario coverage
- approved snapshot completeness, when a mock snapshot is available

## Non-Goal

Planner regression validation is not real media QA.

It does not:

- inspect rendered video
- inspect source footage
- run caption OCR
- run audio analysis
- call AI providers
- call OpenAI, GPT-Image-2, Wan, Hailuo, or Veo
- call Remotion
- replace future backend QA
- reserve or deduct credits

It only checks the structured mock plan that ReeditPro already builds in the frontend.

## Hard Blocker Rules

These are blocking failures:

- Basic route contains Veo.
- Pro route contains Veo.
- Veo is the primary model anywhere.
- Premium uses Veo outside final fallback/rescue.
- Seedance appears in launch routing.
- Any route or prompt defaults to `1080P`.
- Wan primary routes are not `720P`.
- Hailuo primary routes are not `768P`.
- Veo prompt or route uses anything other than `720P`.
- Plan has no credit estimate.
- Plan has no approval-required flag.
- AI-video prompt asks for transparent background by default.
- Documentary / Case Study plan with named claims has no active fact-safety plan.
- Approved snapshot is missing exact plan version, credit estimate, tier constraints, or matching-panel policy.

## Warning Rules

These are warnings:

- missing character consistency plan for recurring character scenarios
- missing prompt preview for an asset
- missing renderer layer notes
- missing lower-cost alternatives when estimate is high
- visual asset plan has too many AI-video scenes for Basic
- Basic has too many expensive assets
- no frame template selected
- no source order confirmation
- demo scenario expectations are not clearly reflected in the plan

Warnings mean the mock plan can still be inspected, but the planning stack may need polish before production use.

## Implemented Frontend Checks

`validateMockEditPlan` checks a single `EditPlan` and returns a typed `PlanValidationReport`.

It validates:

- compiled intent
- professional directive
- visual asset plans and provider routes
- renderer composition plan
- segment operations
- QA plan
- credit estimate and approval requirement
- Basic/Pro no-Veo routing, prompts, and QA fallback
- Premium fallback-only Veo
- no primary Veo
- no default `1080P`
- matching panel background and no transparent AI-video default
- prompt ownership boundaries
- documentary fact safety
- character consistency

`runPlannerRegression` runs the validator across every launch demo scenario and returns a `PlannerRegressionReport`.

It also checks global scenario coverage:

- at least five launch scenarios
- at least one Basic scenario
- at least one Pro scenario
- at least one Premium scenario
- at least one Documentary / Case Study scenario
- at least one Education / Explainer scenario
- at least one Storytelling scenario

`InlinePlannerRegressionCard` displays this report in the chat-native mock flow. The card is informational for now. It flags blocker issues, but does not start or block real generation because no real generation exists in this prototype.

## Future Automated Testing

If a test runner is added later, these validation checks should become unit tests around:

- provider router behavior
- prompt builder behavior
- demo scenario plan generation
- approved snapshot completeness
- Basic/Pro/Premium tier policy regressions

No new test runner is added by this task.
