# Production Caption Execution Policy

Caption execution converts transcript and word timestamp artifacts into deterministic caption segments and SRT, WebVTT, and ASS text. Caption files remain private artifacts before preview/export.

ASS output is controlled by server-side style presets. Unsafe override tags are rejected; font files are not bundled or exposed by this milestone.

Caption artifacts use private storage refs only. M13 does not perform final render/export.
