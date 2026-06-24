# VapourSynth Owner Decision

Tool row: `vapoursynth_frame_pipeline`

Policy decision: `resolved_vapoursynth_native_policy_ready_for_future_install_proof`

Scope: `core_vapoursynth_only_plugins_excluded`

Owner decision: `blocked_no_owner_approval_for_core_vapoursynth_package_source`

Plugin status: `plugins_not_installed_separate_review_required`

Readiness: `blocked_pending_owner_approved_package_source`

Allowed future install source: `none_until_owner_approval`

Install-source status: `not_changed_in_this_phase`

Runtime execution: `not_run`

## Decision

#624 resolved core VapourSynth policy for future planning, while preserving separate plugin review. #697, #702, #706, and #713 then preserved the conservative blocked path because current evidence does not identify a safe current-base source for the render-worker base and no owner/environment approval was supplied.

This owner decision confirms that no explicit owner approval has been supplied for any core VapourSynth source class, including `render_worker_debian_bookworm_os_package`, `render_worker_bookworm_backports_os_package_owner_approved`, `owner_approved_core_vapoursynth_python_package_with_native_dependency_plan`, third-party repository setup, pip package installation, plugin installation, binary download, or `owner_approved_pinned_official_vapoursynth_source_build_plan`.

Official source findings remain:

- Current render-worker base is `node:24-bookworm`.
- Debian bookworm `python3` baseline is 3.11.2.
- VapourSynth install docs recommend pip with Python 3.12+ and Debian packages via deb-multimedia.
- VapourSynth plugins remain excluded and separately reviewed.

No VapourSynth, `vspipe`, Docker, FFmpeg/FFprobe, GStreamer, MKVToolNix, media, worker, route, Supabase, or SQL execution occurred in this phase.
