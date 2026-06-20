# TRACKA-VAPOURSYNTH-NATIVE-POLICY-RESOLUTION-1

Goal: resolve VapourSynth native dependency, plugin, license/security, and worker-lane policy before any install-source change.

Source-of-truth: `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 decision: blocked_pending_native_container_build_confirmation_with_identity_reviews_recorded`

Current readiness: `blocked_pending_vapoursynth_native_dependency_plugin_policy`

Batch-2 records policy review status only. It does not install VapourSynth, plugins, Python packages, OS packages, or native libraries.

Do not run `vspipe`, process media, build Docker, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production/final delivery unless a future approved install-proof plan explicitly permits it.
