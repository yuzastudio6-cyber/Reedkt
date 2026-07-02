# Edit Level API Client

RP-EDITLEVEL-03 adds a browser-safe client shape for the future Edit Level API surface. The core client is transport-agnostic and calls route IDs such as `project.editLevel.profiles.list`, `project.editLevel.compatibility.normalize`, and `project.editLevel.selection.save`.

The mock adapter uses the existing mock transport for smoke coverage. It is not imported by Project setup, New Edit, Edit Brief, `ChatNativeEditor`, live planners, or any visible UI in this milestone.

There is no live UI wiring, no live HTTP transport, no production route call, no runtime implementation, no provider/model call, no media processing, no render/export, no progress update, and no credit reservation/spend.

Recommended next prompt: `RP-EDITLEVEL-04 - UI Cards + Recommendation`.
