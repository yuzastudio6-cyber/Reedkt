# Qwen2.5-VL Structured Visual Response

The validated visual response contains `visualSummary`, `setting`, `visibleObjects`, `visiblePeople`, `actions`, `cameraMotion`, `visibleText`, `layoutNotes`, `brollOpportunities`, `visualRisks`, `doNotCopyNotes`, `confidence`, `timeRange`, and `sampledFrameCount`.

The validator rejects missing required fields, invalid arrays, invalid confidence, and unsafe fields such as render instructions, worker instructions, credit actions, credentials, secrets, raw provider payloads, authorization headers, or chain-of-thought.

Only structured visual summary metadata may be stored on a marker. The summary can be displayed in Marker Chat as available or fallback-used, but full Qwen 3.7 Max context-aware prompt integration remains a future milestone.
