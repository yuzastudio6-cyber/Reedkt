# Tool Usage Planning UI

The Tool Usage UI shows why ReeditPro plans controlled tools for a video. It helps users and developers understand what a tool is planned to do, what output it produces, which settings and preset it uses, whether it is launch-core/planned/future/license-review, whether execution would be inside Remotion or a future worker, and that nothing runs before approval.

## User-Facing Summary

Guided chat should stay concise:

- Map animation planned.
- Chart or diagram planned.
- Website capture planned.
- Color cleanup planned.
- Audio cleanup planned.
- Remotion will compose the final layout.

The UI should explain why a controlled tool is better than AI generation when exact maps, labels, screenshots, charts, captions, color, audio, or QA matter.

## Developer Detail

Detailed/developer views can show tool IDs, chain IDs, settings, execution modes, presets, input/output types, fallback tools, QA checks, license notes, adoption stage, and worker notes.

Guided mode should hide or collapse tool strategy details. Detailed mode should show tool chains and reasons with settings collapsed. Developer mode can expose settings, input/output, fallback, QA, and license notes.

## Planning-Only Rule

The UI must clearly say this is planning only. It must not imply that tools were installed, executed, rendered, processed media, called providers, started workers, or bypassed plan and credit approval. Future workers may execute approved plan snapshots after approval.
