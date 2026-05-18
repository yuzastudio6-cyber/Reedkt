# Color Grading Settings Catalog

## Correction Settings

- `exposureCorrection`
- `whiteBalanceCorrection`
- `contrastAdjustment`
- `highlightRecovery`
- `shadowLift`
- `blackPoint`
- `whitePoint`
- `saturation`
- `vibrance`
- `temperature`
- `tint`
- `noiseReduction`
- `sharpening`
- `clarity`
- `skinToneProtection`
- `facePriority`
- `shotMatchingEnabled`

## Look / Grade Settings

- `colorGradeStyle`
- `lookIntensity`
- `lutName`
- `lutPath`
- `lutStrength`
- `filmGrain`
- `vignette`
- `colorContrast`
- `warmCoolBias`
- `moodBias`
- `documentaryNeutrality`
- `socialBrightness`
- `luxuryWarmth`
- `cinematicShadowDepth`

## Color Management Settings

- `inputColorSpace`
- `workingColorSpace`
- `outputColorSpace`
- `displayTransform`
- `viewTransform`
- `lookTransform`
- `acesPipelineEnabled`
- `generatedAssetColorMatch`
- `aiVideoAssetColorMatch`

## Shot Matching Settings

- `referenceClipId`
- `matchExposure`
- `matchWhiteBalance`
- `matchContrast`
- `matchSaturation`
- `matchSkinTone`
- `matchBackgroundTone`
- `toleranceLevel`

## Generated Asset Matching Settings

- `matchPanelBackgroundColor`
- `matchSourceFootageGrade`
- `matchDocumentaryNeutralTone`
- `matchBrandTone`
- `matchStrokeStylePalette`
- `avoidColorDrift`

## Tier Presets

`clean_basic_color_pass` uses `clean_natural`, correction only, basic shot matching, skin tone protection, and subtle to balanced intensity.

Pro presets include `premium_clean_color_pass`, `documentary_neutral_color_pass`, `warm_lifestyle_color_pass`, and `business_corporate_color_pass`.

Premium presets include `scene_matched_premium_grade`, `cinematic_story_grade`, `luxury_real_estate_grade`, `generated_asset_match_grade`, and `documentary_case_study_grade`.

## QA Thresholds

Planned QA thresholds include exposure mismatch tolerance, white balance tolerance, panel background tolerance, generated asset mismatch tolerance, skin tone warning, over-saturation warning, crushed blacks warning, and clipping warning.

These are planning settings only. No real color analysis, FFmpeg, OpenColorIO, OpenImageIO, OpenCV, Sharp, media processing, rendering, backend work, or provider calls are implemented by this catalog.
