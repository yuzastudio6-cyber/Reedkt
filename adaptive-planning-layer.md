# Adaptive Planning Layer

## Purpose

Adaptive planning means ReeditPro chooses editing style, visuals, layout, tools, and model routes based on the project in front of it, not a rigid category template.

The planner should consider:

- user request
- compiled intent
- reference DNA
- video understanding report
- source order
- professional editing directive
- edit level
- target platform
- credit preference
- QA risk

The result should be an edit strategy that explains why each segment needs a speaker-first moment, b-roll, a card, a chart, a map, Stroke Motion, Real Motion, a visual takeover, or no extra visual.

## Avoid Rigid Templates

Do not hard-code:

- every Storytelling edit uses the same Stroke Motion
- every Education edit uses the same diagram
- every Business edit uses the same product card
- every Documentary edit uses the same evidence board

Instead:

- select per segment
- explain why the visual helps
- choose the best tool or layout for that exact beat
- respect explicit user instructions and tier policy
- keep low-value visuals out of the plan

## Adaptive Strategy Examples

`Money moved through fake accounts`

- choose Graphic Design / VisualExplain
- consider D3, chart tooling, or Remotion later
- avoid random AI video because the viewer needs exact flow clarity

`Person reacts emotionally`

- keep speaker full frame or consider Stroke Motion only if it supports the feeling
- avoid charts, maps, or heavy evidence boards unless the spoken point needs them

`Operation spread across cities`

- choose map animation
- consider MapLibre/Turf later
- let Remotion own composition and captions

`Website dashboard feature`

- choose screen capture or product frame
- consider browser capture later
- use Remotion highlights and speaker PIP only when useful

`Make it premium but not too viral`

- use premium_clean style
- use clean_tight pacing
- avoid aggressive zooms, glitches, or trend-driven cuts unless explicitly requested

## Adaptive Output

The adaptive planner should produce:

- recommended edit strategy summary
- segment-level strategy decisions
- visual support decisions
- layout decisions
- tool strategy hints
- fallback strategy notes
- QA concerns
- credit impact notes

These outputs stay planning-only until the user approves the edit plan and credit estimate.

## Relationship To Later Tool Registry

The adaptive planning layer identifies needs first. A later tool registry can map those needs to specific tools, provider settings, worker capabilities, and execution limits.

This separation keeps ReeditPro from calling tools just because they exist. The plan should explain why the beat needs a tool category before any future worker maps that need to a concrete implementation.
