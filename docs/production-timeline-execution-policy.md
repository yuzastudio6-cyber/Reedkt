# Production Timeline Execution Policy

M14 builds a timeline execution manifest from the approved `SmartCutExecutionPlan`.

The manifest includes clip source ranges, timeline ranges, source/proxy references, caption refs, audio placeholders, color placeholders, render notes, preview notes, and QA references. OpenTimelineIO-style JSON, Hyperframe bridge metadata, and Remotion composition metadata are produced without importing those runtimes.

No full Remotion render, final export, Revideo execution, color processing, mask processing, or audio cleanup runs in M14.
