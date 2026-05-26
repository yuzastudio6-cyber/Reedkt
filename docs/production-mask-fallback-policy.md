# Production Mask Fallback Policy

Mask fallback protects quality and meaning when foreground extraction is weak.

Fallback chains:

- weak BiRefNet mask: try SAM2 tracking, then OpenCV/Kornia refinement, then image-only transparent-background/rembg when appropriate;
- SAM2 drift: shorten the segment, use keyframe-only cutout, skip text-behind-subject, or request review;
- weak text-behind-subject mask: move text to foreground, side panel, or lower third, and block behind-subject preview.

Unsafe masks must downgrade or skip the effect instead of forcing a bad composition.
