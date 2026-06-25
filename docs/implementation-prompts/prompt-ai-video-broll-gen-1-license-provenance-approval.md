# AI-VIDEO-BROLL-GEN-1 License / Provenance Approval Prompt

Goal: review AI video B-roll model code licenses, weight licenses, model cards, commercial-use terms, redistribution terms, attribution needs, output policies, and compliance gates for Wan, LTX, Mochi, and HunyuanVideo.

This prompt must not download weights, install runtimes, run inference, generate video, run Docker, call GCP, mutate Supabase, execute SQL, create storage objects, create signed URLs, call providers, dispatch workers, mutate credits, or unlock beta/production.

Inputs:

- `docs/ai-video-broll-generation-owner-lane.md`
- `docs/ai-video-broll-generation-model-candidate-matrix.md`
- `docs/ai-video-broll-generation-model-selection-decision.md`
- `docs/ai-video-broll-generation-license-provenance-plan.md`

Exit criteria:

- Each candidate has source URL, license URL, model card URL, weight source, commercial-use risk, redistribution risk, territory notes, attribution needs, output policy notes, and owner decision.
- No model is runtime-approved unless compliance and model-weight owners explicitly accept it.
- Next prompt remains weight source/checksum planning unless a license conflict blocks.
