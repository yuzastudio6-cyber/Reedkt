# Blocked Scope Register

Packet: `TRACKA-FILM-GPU-POLICY-AI-GRAPHICS-COORDINATION-1`

Decision: `blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_and_model_weight_policy`

| Scope | Status |
| --- | --- |
| FILM install source | `blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_and_model_weight_policy` |
| FILM runtime | `blocked_pending_ai_graphics_owner_acceptance_gpu_runtime_policy_model_weight_policy_and_worker_runtime_lane` |
| AI Graphics / Worker ownership | `required_for_model_runtime_model_weights_gpu_execution_and_ml_dependency_policy` |
| Model weights | `not_accessed_and_not_approved` |
| GPU runtime | `not_configured_and_not_approved` |
| TensorFlow/PyTorch or equivalent heavy ML runtime | `not_installed_not_approved` |
| Worker execution | `blocked` |
| Provider/model call | `blocked` |
| Media processing | `blocked` |
| FFmpeg/FFprobe | `blocked` |
| Docker build/push/deploy | `blocked` |
| Remotion execution | `blocked` |
| Supabase/SQL | `blocked` |
| Signed/public artifacts | `blocked` |
| Beta/production/final delivery | `blocked` |

Product-ready end-to-end local OSS tools: `0`
