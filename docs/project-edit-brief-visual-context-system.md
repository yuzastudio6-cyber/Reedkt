# Project Edit Brief Visual Context System

Marker Visual Context is a marker-scoped beta system in the Project Edit Brief drawer. It analyzes sampled frames around a saved marker and returns structured visual metadata for user review.

The system stores `metadata.latestVisualContext` on the mock/local marker only. It does not persist raw frames, raw provider payloads, full video, storage objects, render jobs, worker jobs, or credit reservations.

Qwen2.5-VL is the visual/video specialist. Qwen 3.7 Max remains the Marker Chat reasoning brain and only sees visual availability in this milestone. RP-VIDEOCTX-04 owns full context-aware Marker Chat prompt integration.
