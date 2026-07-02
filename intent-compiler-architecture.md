# Intent Compiler Architecture

## Purpose

The Intent Compiler converts natural user chat into structured editing intent. The chat is where the user talks naturally; the Intent Compiler is the planning layer that turns that request into explainable, executable editing instructions.

Example user request:

`Make this clean and premium, don't make it too viral, use small captions, add b-roll only when it helps, and keep the color nice.`

Compiled intent:

- Edit style: `premium_clean`.
- Pacing: `clean_tight`.
- Caption style: `small_premium_subtitle`.
- B-roll policy: `support_key_points`.
- Color grade: `premium_clean`.
- Avoid: overly viral effects, clutter, random visuals.
- Must-follow: clean premium look, small captions, meaningful b-roll only.

ReeditPro must not edit randomly. Every user request should become structured, explainable, executable editing intent before plan generation.

## Instruction Hierarchy

The compiler resolves instructions in this order:

1. Explicit user instructions from chat.
2. User-confirmed settings inside chat.
3. Uploaded clip/source order confirmation.
4. Reference video DNA, if provided.
5. Editing category defaults.
6. Edit level quality standard.
7. Professional editing ontology defaults.
8. Provider/model/frame constraints.
9. Safety and QA constraints.

User instructions win unless they conflict with safety, platform, tier, model policy, or technical constraints.

Example: if a Pro user asks for Veo, the compiler should not enable Veo. It should store:

- Requested: Veo-like premium rescue.
- Constraint: Pro cannot use Veo.
- Response: "Veo Lite is Premium-only. I can use Wan/Hailuo in Pro or you can upgrade to Premium for Veo final fallback."

## What The Compiler Extracts

The compiler should extract:

- Goal summary.
- Editing category.
- Edit level.
- Target platform.
- Aspect ratio.
- Frame template.
- Professional edit style.
- Pacing style.
- Cut intensity.
- Transition family.
- Color grade style.
- Caption style.
- B-roll policy.
- Sound style.
- Visual preference.
- Signature system preferences.
- Must-follow rules.
- Avoid rules.
- Custom directives.
- Unclear items.
- Clarifying questions.
- Confidence scores.

## Clarifying Question Policy

The AI should ask questions only when the missing answer changes the edit.

Useful questions:

- "Is this for Shorts/Reels/TikTok or YouTube?"
- "Are these clips in the right source order?"
- "Should this be Basic, Pro, or Premium?"
- "Should I keep the edit natural or make it high-retention?"
- "Are the names in this documentary/case-study video verified facts or allegations?"
- "Do you want captions small and premium or bold social?"

Unnecessary questions:

- Asking for every transition choice when category/style already implies it.
- Asking for every color parameter.
- Asking random stylistic questions that do not affect the plan.

The compiler should limit questions and prioritize blocking ones.

## Custom Directive Handling

If the user asks for a style not in the ontology:

- Do not fail.
- Interpret the request.
- Map it to closest known presets.
- Store custom overrides.
- Store must-follow and avoid rules.
- Ask one clarifying question only if needed.

Example user request:

`Make it feel like a serious courtroom breakdown but with modern social pacing.`

Compiler mapping:

- Mapped edit style: `documentary_evidence`.
- Pacing: `clean_tight` or `high_retention`.
- Color: `documentary_neutral`.
- Transitions: `documentary_evidence_transitions`.
- Custom directive: serious courtroom breakdown tone.
- Avoid: comedy, playful colors, childish motion.

The database and ontology guide the AI. They do not limit the AI.

## Output Shape

Future structured output should use a `CompiledEditingIntent` shape with:

- `goalSummary`
- `resolvedSettings`
- `professionalEditingDirective`
- `customDirectives`
- `mustFollowRules`
- `avoidRules`
- `clarifyingQuestions`
- `confidence`
- `lockedTierConstraints`
- `qaImplications`

The compiled intent should be shown to the user as "What I understood" before the full edit plan when useful.

## Tier And Model Constraints

The compiler must always enforce launch constraints:

- Basic cannot use Veo.
- Pro cannot use Veo.
- Premium can mention Veo only as final fallback/rescue.
- Veo must never be primary or default.
- Generated AI video should never default to 1080P.
- AI video generation should use matching frame/panel backgrounds by default.
- Editing, generation, rendering, and credit deduction require edit plan and credit estimate approval.

## Database Future

Future database tables may store:

- Intent snapshots.
- Intent messages.
- Compiled settings.
- Custom directives.
- Clarifying questions.
- User confirmations.
- Approved intent snapshot.

This task does not create migrations, backend logic, persistence, provider calls, model calls, rendering, billing, or export jobs.
