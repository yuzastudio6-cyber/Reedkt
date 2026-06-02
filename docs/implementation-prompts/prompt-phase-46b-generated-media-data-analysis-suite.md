# Phase 46B Generated Media/Data Analysis Suite Prompt

You are continuing ReeditPro. Use Codex, not Cursor.

Track B only. Do not work on Track A.

This prompt is for Phase 46B generated media/data analysis suite. Use Phase 46A evidence as the source of truth.

Allowed only after Phase 46A passes:

- Generated synthetic fixtures for OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars.
- Private QA artifacts only.
- Package/runtime image installation only if explicitly approved in Phase 46B.

Do not:

- Process real media.
- Accept arbitrary media paths.
- Run VLM.
- Call providers.
- Create public artifacts.
- Mutate GCP/IAM unless explicitly approved for Phase 46B private artifacts.
- Unlock beta or production.
- Touch Track A.

Expected outputs:

- Generated fixture manifest.
- Tool-specific generated fixture reports.
- Cross-tool private QA manifest.
- Storage/privacy verification.
- Smoke/report CLIs.
- Readiness updates.

Phase 46C controlled real-video media/data suite remains blocked until Phase 46B passes.
