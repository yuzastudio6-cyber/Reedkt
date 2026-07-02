# Tool Settings Catalog

## Purpose

The Tool Settings Catalog defines the settings ReeditPro should understand when planning controlled open-source tools. This is a planning catalog only. It does not install packages, execute tools, render video, process media, or call providers.

## Remotion Settings

- compositionWidth
- compositionHeight
- fps
- durationInFrames
- aspectRatio
- frameTemplate
- speakerZone
- visualZone
- captionSafeZone
- layerZIndex
- startFrame
- endFrame
- motionPreset
- transitionPreset
- assetFitMode
- panelBackgroundColor

## FFmpeg LGPL Configuration Settings

- configureProfile
- enableGpl
- enableNonfree
- codecPolicy
- outputContainer
- audioCodec
- videoCodec
- muxingMode

- codec
- bitrate
- crf
- pixelFormat
- resolution
- fps
- trimRanges
- scale
- crop
- pad
- colorBalance
- colorLevels
- lut3dPath
- lutStrength
- brightness
- contrast
- saturation
- loudnessTarget
- truePeakTarget
- audioNormalization
- silenceDetection

## OpenColorIO Settings

- inputColorSpace
- workingColorSpace
- displayTransform
- viewTransform
- lookTransform
- lutPath
- lutStrength
- outputColorSpace
- acesPipelineEnabled

## OpenCV Settings

- faceDetectionConfidence
- objectDetectionThreshold
- cropSafetyMargin
- blurThreshold
- histogramComparisonThreshold
- sceneChangeThreshold
- backgroundColorTolerance
- panelBackgroundMatchTolerance
- templateMatchThreshold
- safeZoneCollisionThreshold

## Sharp + libvips Settings

- resizeWidth
- resizeHeight
- fitMode
- cropPosition
- outputFormat
- imageFormat
- quality
- alphaHandling
- watermarkPosition
- backgroundColor
- compositeLayers
- blur
- sharpen
- metadataHandling
- optionalLoaderPolicy
- untrustedUploadPolicy

## AudioFlux Settings

- sampleRate
- monoStereo
- trimStart
- trimEnd
- onsetDetection
- bpmDetection
- beatPositions
- rhythmFeatures
- energyCurve
- noveltyCurve
- confidenceThreshold
- outputTimingMap

## Signalsmith Stretch Settings

- stretchRatio
- pitchShiftSemitones
- inputSampleRate
- outputSampleRate
- preserveFormants
- qualityMode
- maxRecommendedStretchRatio
- sceneFitTargetSeconds
- qaListenRequired

## VapourSynth Settings

- frameFormat
- colorFamily
- frameRange
- scriptPreset
- cachePolicy
- pluginAllowlist
- outputFrameMode
- pythonMemoryPipeline

## MapLibre Settings

- mapStyle
- centerCoordinates
- zoom
- bearing
- pitch
- cameraPath
- flyDuration
- flySpeed
- curve
- easing
- fitBounds
- padding
- routeLineColor
- routeLineWidth
- pinStyle
- labelStyle
- highlightRegion
- tileSource

## Turf Settings

- routeCoordinates
- distanceUnits
- boundingBoxPadding
- centerPoint
- bufferRadius
- lineSimplification
- interpolationSteps

## D3 Settings

- visualizationType
- dataFields
- scales
- axes
- colorScale
- lineSettings
- barSettings
- nodeLinkSettings
- transitionDuration
- easing
- labelPlacement
- annotationStyle
- svgWidth
- svgHeight

## ECharts Settings

- chartType
- series
- dataset
- xAxis
- yAxis
- legend
- tooltip
- grid
- colorPalette
- animationDuration
- labelStyle
- theme
- responsiveSize

## Playwright Settings

- url
- viewportWidth
- viewportHeight
- deviceScaleFactor
- fullPage
- selector
- clipRectangle
- imageFormat
- quality
- waitTime
- waitForSelector
- theme
- scrollPosition

## Lottie Settings

- animationJson
- loop
- autoplay
- speed
- segment
- renderer
- scale
- opacity
- startFrame
- endFrame

## Three.js Settings

- sceneType
- cameraPosition
- cameraFov
- lightingPreset
- objectModel
- materialStyle
- orbitPath
- renderSize
- backgroundColor

## Audio / SoundSync Settings

AudioFlux launch analysis and future/prototype librosa-style settings:

- sampleRate
- monoStereo
- trimStart
- trimEnd
- bpmDetection
- beatPositions
- onsetDetection
- loudness
- energy
- key
- mood
- fadeDetection

## Tool Presets

- clean_social_caption_layout
- premium_lower_panel
- documentary_evidence_board
- money_flow_diagram
- product_feature_callout
- map_route_reveal
- real_estate_neighborhood_map
- browser_dashboard_capture
- clean_natural_color_pass
- premium_clean_color_pass
- documentary_neutral_color_pass
- voice_cleanup_basic
- soundsync_subtle_premium
- foreground_safe_zone_qa
- panel_background_match_qa

Presets should record tool IDs, setting defaults, best use cases, avoid rules, tier fit, QA notes, and whether any worker/license review is required before production.
