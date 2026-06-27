# Edit Level Qwen Profile Contract

RP-EDITLEVEL-02 defines Qwen routing profiles as fixtures only. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, or media workers.

| Level | Qwen 3.7 | Qwen2.5-VL |
| --- | --- | --- |
| Normal | `standard` reasoning. | `targeted` visual context. |
| Premium | `deep` reasoning. | `key_moments_and_marker_windows`. |
| Ultra Premium | `multi_pass` reasoning. | `scene_level` visual depth. |

DeepSeek remains `not_user_reasoning`; future tool-code or Remotion draft use is gated to later milestones.

## Boundary

These profile fields are not consumed by runtime planners in RP-EDITLEVEL-02.
