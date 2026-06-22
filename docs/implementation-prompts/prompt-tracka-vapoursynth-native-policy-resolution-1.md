# TRACKA-VAPOURSYNTH-NATIVE-POLICY-RESOLUTION-1

Goal: preserve #624's resolved core VapourSynth native policy and hand off any future install-source proof to the explicit install-proof packet.

Source-of-truth: `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 decision: blocked_pending_native_container_build_confirmation_with_identity_reviews_recorded`

Current readiness: `resolved_vapoursynth_native_policy_ready_for_future_install_proof`

#624 source-of-truth: future proof may cover core VapourSynth only; plugins remain separately reviewed, wheel/package scoped, and not installed here.

Next install-source work belongs in `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3`. Do not run `vspipe`, process media, build Docker, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production/final delivery unless a future approved install-proof plan explicitly permits it.
