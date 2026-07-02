# Edit QA Architecture

## Purpose

QA prevents ReeditPro from producing random, sloppy, or user-mismatched edits. It checks whether the planned or produced edit matches the compiled user intent, professional standards, model policy, frame rules, and approval gate.

This milestone creates QA planning only. It does not inspect real media, run render checks, call providers, or execute fallback jobs.

## QA Comparison Sources

QA checks should compare output against:

- user must-follow rules
- user avoid rules
- compiled intent
- edit level standards
- selected professional style
- visual asset plan
- provider routing rules
- frame layout rules
- source order confirmation
- credit approval

The approved plan and credit estimate remain the gate. QA should never imply generation or rendering started before approval.

## QA Categories

QA categories include:

- `user_intent_match`
- `source_order_and_structure`
- `pacing_and_cuts`
- `captions`
- `color_grade`
- `b_roll`
- `sound_sync`
- `transitions`
- `visual_assets`
- `frame_layout`
- `model_tier_policy`
- `credit_approval`
- `safety_and_claims`
- `render_composition`

These categories make QA explainable and traceable across future workers.

## Example QA Checks

- Captions do not cover faces, products, or AI visual panels.
- Caption style matches the compiled directive.
- Color grade matches the selected style.
- B-roll supports spoken meaning.
- Transitions match edit style and do not feel random.
- Audio is clean and music/SFX do not overpower the voice.
- Source order changes were shown and approved.
- Basic and Pro do not use Veo.
- Premium uses Veo only as final fallback.
- No primary model is Veo.
- No route defaults to 1080P.
- AI visuals stay inside frame panels.
- Generated backgrounds match frame panels.
- User approval happened before generation.
- Real people and claims are treated safely in Documentary / Case Study edits.

## QA Outcome Statuses

QA outcome statuses include:

- `not_checked`
- `passed`
- `warning`
- `failed`
- `needs_user_review`
- `retry_allowed`
- `blocked`

Planning usually starts as `not_checked` because real media QA is not implemented in this frontend milestone.

## QA And Fallback

QA failure can trigger:

- retry same model
- use an allowed fallback model
- simplify prompt
- split scene
- convert to still
- convert to motion design
- manual review
- ask the user for approval

Basic and Pro can never fall back to Veo. Premium may use Veo Lite only as final fallback/rescue after Wan/Hailuo or simpler fallbacks are unsuitable or fail QA.

If the fallback would change credits, output, or scope beyond the approved plan, ReeditPro should ask for approval before proceeding.
