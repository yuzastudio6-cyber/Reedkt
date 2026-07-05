# Project Edit Brief Visual Context UI

The marker drawer now includes a Visual Context panel for saved markers. The panel shows runtime readiness, an Analyze Visual Context button, local source status, boundary copy, structured summary fields, sampled frame count, and fallback or live runtime status.

If no local source video is selected, Analyze Visual Context is disabled and the panel shows "Select local source video first." When config is missing, the panel stores and displays deterministic fallback with an explicit no-Qwen2.5-VL-call summary.

Marker Chat shows whether visual context is available or fallback-used. This is display-only; it does not yet send visual summaries into Qwen 3.7 Max prompts.
