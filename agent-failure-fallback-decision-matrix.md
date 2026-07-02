# Agent Failure/Fallback Decision Matrix

## Purpose

The failure/fallback matrix tells ReeditPro what to do when a provider, tool, asset, timing, render, or QA step fails.

The editing agent must not blindly continue after a failed output. It should isolate local failures, continue independent work where possible, and use only approved fallback paths.

## Failure categories

The matrix covers:
- provider failures: timeout, error, policy rejection, bad output,
- prompt/visual mismatches: prompt, style, character, duration, aspect ratio, background,
- asset failures: missing required asset, storage failure, asset QA failed,
- tool/workflow failures: tool worker, map, chart, browser capture, mask, audio, color,
- render/timing/trim failures: render preflight, render, timing validation, trim meaning,
- review/policy failures: user review, credit/budget issue, policy violation, unknown.

## Fallback action types

Fallback actions include:
- retry same,
- retry with simpler prompt,
- switch to fallback provider,
- switch to still card,
- switch to motion design,
- switch to Remotion-only,
- switch to tool-generated asset,
- static map/chart,
- uploaded screenshot,
- placeholder preview only,
- simpler layout, lower panel, or side-by-side,
- remove optional asset,
- request user review,
- request new approval,
- block final render,
- cancel work item,
- future credit restore/refund note,
- custom reviewed fallback.

## Tier fallback rules

Basic:
- no Veo,
- prefer Remotion/card/tool fallback,
- remove optional assets if approved,
- no expensive rescue loops.

Pro:
- Wan primary,
- Hailuo fallback where allowed,
- no Veo,
- use card, motion design, or controlled tool fallback when better.

Premium:
- Wan primary,
- Hailuo fallback,
- Veo final fallback only for approved AI video assets,
- never for maps, charts, browser captures, captions, timing, or masks,
- stronger QA and user-review notes.

## Examples

Image generation failure:
- retry same,
- retry with simpler prompt,
- use Remotion-only card,
- ask user review if required.

AI video failure:
- retry Wan,
- use Hailuo fallback if allowed,
- convert to still/motion design,
- Premium may use Veo as final fallback only when approved,
- Basic/Pro never use Veo.

Map failure:
- static map card,
- lower panel or location card,
- ask review for source uncertainty,
- never AI video for exact maps.

Chart failure:
- static chart,
- Remotion table/card,
- simpler future D3/ECharts spec,
- never AI video for exact data.

Browser capture failure:
- uploaded screenshot,
- mock browser frame only if not evidence,
- user review/source authorization,
- never bypass auth, paywall, or CAPTCHA.

Mask failure:
- lower panel,
- side-by-side,
- simplify layout,
- block final render if required depth effect has no fallback,
- never use Veo to solve mask.

Timing validation failure:
- simpler timing,
- phrase cuts only,
- reduced beat sync,
- fewer SFX/cues,
- approval blocked if frame/timing base is missing.

Trim meaning failure:
- preserve range,
- ask user review,
- use less aggressive cleanup,
- approval blocked if meaning risk is unresolved.

## Credit/fallback policy

Fallback actions can affect future fallback allowance, credit estimate, refund/restore policy, and user approval when exceeding the approved plan. No real billing or deduction occurs in this milestone.

## Non-goals

No real fallback execution, retries, provider calls, worker execution, rendering, storage, backend, billing, or media processing is implemented.
