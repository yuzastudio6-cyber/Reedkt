# Tool License Risk Policy

This document is not legal advice. It records planning assumptions and review gates for ReeditPro's future worker/tool stack. Production use requires legal, security, dependency, build, and quality review before any tool is installed, executed, deployed, or exposed to users.

## Updated Launch Tool Stack

| Tool | Production class | Working license assumption | Launch status | Review needed | Notes |
| --- | --- | --- | --- | --- | --- |
| VapourSynth | worker_tool | LGPL v2.1 working assumption | approved_candidate | needs_lgpl_compliance_review, needs_plugin_review | Worker-only frame pipeline candidate. Plugins require separate review. |
| FFmpeg LGPL Configuration | required_worker_export_tool | LGPL-safe configuration only | required_candidate | needs_build_config_review, needs_codec_patent_review | Configure flags and codecs must be documented. Do not enable GPL/nonfree flags unless approved. |
| AudioFlux | worker_audio_analysis_tool | MIT working assumption | approved_candidate | needs_accuracy_benchmark | Launch SoundSync analysis candidate for onset, rhythm, beat/drop, and audio feature planning. |
| Signalsmith Stretch | worker_audio_stretch_tool | MIT working assumption | approved_candidate | needs_audio_quality_benchmark | Launch time-stretch/pitch candidate for moderate music bed fitting. |
| Sharp + libvips | worker_asset_image_tool | Sharp Apache 2.0; libvips LGPL working assumption | approved_candidate | needs_lgpl_compliance_review, needs_dependency_security_review | Asset/image candidate for thumbnails, resize, overlays, watermarks, and image prep. |
| Essentia | future_evaluation_tool | Review required before production | not_selected_for_launch | blocked_until_review | Replaced by AudioFlux for launch audio analysis planning. |
| Rubber Band | future_evaluation_tool | Review required before production | not_selected_for_launch | blocked_until_review | Replaced by Signalsmith Stretch for launch stretch/pitch planning. |

## Policy Rules

- Provider models are separate from open-source tools.
- Tool execution belongs in future approved backend/worker milestones, never in the frontend planning prototype.
- Workers must execute approved plan snapshots, not raw chat.
- User approval and credit reservation are required before any future worker execution.
- Browser-safe previews are not production rendering.
- License assumptions are not approval. Use cautious statuses such as `approved_candidate`, `needs_lgpl_compliance_review`, `needs_build_config_review`, `needs_codec_patent_review`, `needs_dependency_security_review`, `needs_accuracy_benchmark`, `needs_audio_quality_benchmark`, `needs_plugin_review`, `not_selected_for_launch`, and `blocked_until_review`.

## Launch Replacement Rule

AudioFlux is the launch candidate for SoundSync audio analysis. Signalsmith Stretch is the launch candidate for music stretch/pitch planning. Essentia and Rubber Band are not launch defaults and must not appear in default audio/tool strategy chains.
