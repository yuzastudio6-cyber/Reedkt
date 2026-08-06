# Editor Copy Style Guide

Prompt 21 defines the copy bar for ReeditPro's chat-first editor.

## Voice Principles

- Short beats long.
- User-facing beats technical.
- One next action beats multiple explanations.
- Calm confidence beats hype.
- Approval and credits stay clear.
- Demo honesty stays present but quiet.
- Advanced/provider details stay collapsed unless the user asks.

## Main Chat

Use short assistant turns that orient the user:

- Good: "I'll use this order as source context and show any stronger structure in the plan."
- Good: "Here's the intent I'll use for the plan."
- Good: "Plan approved. I'm preparing the preview."
- Avoid: long descriptions of planner internals, future workers, or implementation details in Guided mode.

## Buttons

- Prefer two to three words.
- Use verbs first when action matters.
- Keep approval actions direct:
  - "Approve plan"
  - "Lower cost"
  - "Use reference"
  - "Skip"
- Icon-only controls need meaningful `aria-label` and `title` text.

## Helper Text

- Keep helpers to one short sentence.
- Do not repeat what the UI already implies.
- Use helper text for trust, boundaries, or decision impact.
- Do not stack multiple disclaimers in the main flow.

## Approval And Credits

- Required wording idea: credits are only used after approval.
- Good: "Credits are only used after you approve."
- Good: "No credits were approved or used."
- Avoid: "frontend-only mock progress begins after approval gate completion."
- Approval failure should be calm and actionable.

## Demo And Mock Language

- Use "demo" for the main user-facing flow.
- Use "mock" only when precision is required, especially in advanced/details areas or tests.
- Do not use "placeholder" in visible headings.
- Do not imply real provider calls, rendering, storage, billing, or uploads exist.

## Advanced Details

- Technical terms are acceptable inside explicit advanced/details disclosures.
- Keep Guided mode readable.
- Provider names, prompt previews, library routing, and worker readiness should not dominate default visible copy.

## SFX And Music

- SFX copy should focus on timing, subtlety, voice safety, mix, credits, and revision choices.
- Music copy should focus on cue direction, mood, voice-safe mix, credits, and revision choices.
- SoundSync is audio/timing polish, not a visual signature system.
- Keep "no provider called" truth where provider routes or prompt previews are visible.

## Errors

- No blame.
- No alarm.
- No stack/technical terms.
- Say what is blocked and what did not happen.
- Good: "Approval is blocked until one setup item is resolved. No credits were approved or used."
