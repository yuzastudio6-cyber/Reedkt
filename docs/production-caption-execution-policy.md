# Production Caption Execution Policy

Caption execution converts transcript and word timestamp artifacts into deterministic caption segments and SRT, WebVTT, and ASS text. Caption files remain private artifacts before preview/export.

ASS output is controlled by server-side style presets. Unsafe override tags are rejected; font files are not bundled or exposed by this milestone.

Caption artifacts use private storage refs only. M13 does not perform final render/export.

Production-ready caption metadata is allowed only when an approved backend gateway request supplies transcript segments or word timestamps. The render-worker and QA-worker metadata paths may build private SRT, WebVTT, ASS, caption segment, and caption QA artifact records, but they must not run speech transcription, download models, write local files, burn captions into video, create previews, or permit final export.
