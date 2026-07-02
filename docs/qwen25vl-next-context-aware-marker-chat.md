# Qwen2.5-VL Next Context-Aware Marker Chat

RP-QWENVL-BETA-01 stops at visual summary availability. The next context-aware Marker Chat milestone should decide how Qwen 3.7 receives compact visual summaries, how much context is retained, and how conflicting transcript/audio/visual signals are resolved.

Future Qwen 3.7 input should include the user marker message, compact marker context, and Qwen2.5-VL visual summaries only. It should continue to exclude raw video/audio bytes, provider headers, secrets, full project history, worker commands, render commands, and credit actions.

Recommended next track: keep RP-MEDIA-01 browser-local preview stable, implement Qwen2.5-VL runtime owner config hardening, then proceed to RP-VIDEOCTX-04 for full context-aware Marker Chat.
