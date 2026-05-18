# Browser Capture Settings Catalog

## Source Settings

- `url`: planned source URL when supplied by the user or scenario.
- `sourceType`: user-provided URL, uploaded screenshot, uploaded screen recording, internal mock, script reference, or unknown.
- `urlPermissionStatus`: authorized, user-provided, needs confirmation, not allowed, unknown, or mock-only.
- `sourceLabel`: visible source label for the edit.
- `userProvided`: whether the user supplied the source.
- `authorizedForCapture`: whether future capture is allowed.
- `captureRequiresLogin`: whether the page appears to require authentication.
- `safeWording`: wording used when source status is uncertain.
- `sourceConfidence`: low, medium, or high.
- `mockCapture`: true when this is a planning-only mock.

## Capture Settings

- `captureMode`: static screenshot, element screenshot, full-page screenshot, viewport capture, scroll sequence, step sequence, before/after capture, mock browser frame, uploaded screenshot only, or future authenticated capture.
- `viewportWidth`: planned browser viewport width.
- `viewportHeight`: planned browser viewport height.
- `deviceScaleFactor`: planned pixel scale.
- `fullPage`: whether full-page capture is planned.
- `selector`: planned CSS selector when element capture is needed.
- `clipRectangle`: planned crop rectangle.
- `imageFormat`: PNG, JPEG, or WebP.
- `imageQuality`: compression quality for lossy formats.
- `waitTimeMs`: planned page wait time.
- `waitForSelector`: selector to wait for before capture.
- `scrollPosition`: planned scroll offset.
- `captureStepIndex`: index for a step sequence.
- `captureSequence`: named planned capture steps.

## Browser Frame Settings

- `browserFrameStyle`: clean frame, dashboard frame, evidence card, product frame, tutorial frame, or custom frame.
- `showAddressBar`: whether to show the address bar.
- `showTabs`: whether to show tabs.
- `showCursor`: whether cursor appears.
- `theme`: light, dark, or auto.
- `cornerRadius`: frame radius.
- `shadowStyle`: shadow treatment.
- `borderStyle`: border treatment.
- `toolbarColor`: browser toolbar color.
- `pageBackgroundColor`: page or panel background.

## Highlight And Motion Settings

- `highlightSelector`: planned element selector.
- `highlightZone`: planned highlight rectangle.
- `highlightColor`: highlight color token or value.
- `highlightStyle`: outline, glow, spotlight, zoom, arrow, callout, or none.
- `zoomTarget`: planned zoom rectangle.
- `zoomScale`: target zoom scale.
- `panDirection`: none, up, down, left, or right.
- `scrollAnimationDuration`: planned scroll duration.
- `stepRevealTiming`: planned reveal timing.
- `cursorMotion`: whether cursor movement is planned.
- `clickPulse`: whether click pulse is planned.
- `annotationStyle`: label/callout treatment.
- `calloutLabel`: short callout text.

## Layout Settings

- `layoutMode`: full visual takeover, screen capture with speaker PIP, side-by-side, lower visual panel, PIP speaker, split comparison, before/after panel, voiceover takeover, evidence board card, or product callout.
- `frameTemplate`: vertical story, horizontal wide, square social, browser card, evidence board, product callout, or custom.
- `browserZone`: browser visual rectangle.
- `speakerZone`: speaker rectangle.
- `captionSafeZone`: caption-safe rectangle.
- `safeMargins`: margin around important content.
- `panelBackgroundColor`: panel background token.
- `labelAvoidZones`: zones labels should avoid.
- `fullTakeoverMode`: whether the browser visual owns the frame.
- `pictureInPictureSpeaker`: whether speaker PIP is planned.

## Redaction / Privacy Settings

- `redactionNeeded`: whether redaction is planned.
- `piiRisk`: none, low, medium, high, or unknown.
- `redactionTargets`: emails, names, addresses, payment info, tokens, private metrics, account numbers, or other sensitive data.
- `redactionStyle`: blur, block, crop, or none.
- `blurStrength`: blur amount.
- `blockColor`: block color.
- `userConfirmationRequired`: whether user confirmation is needed.
- `qaRedactionCheck`: whether QA must verify redaction coverage.

## Evidence / Source Safety Settings

- `evidenceStatus`: not evidence, source provided, reported source, claimed source, mock example, or unknown.
- `claimStatus`: verified, reported, claimed, example, or unknown.
- `sourceNeeded`: whether the plan needs a clearer source.
- `sourceLabel`: label shown on the page visual.
- `neutralTreatment`: whether visual treatment must stay neutral.
- `safeWording`: wording for uncertain source status.
- `avoidMisleadingEvidence`: whether the plan includes misleading-evidence avoidance.
- `mockOrExampleLabel`: visible mock/example label where needed.

## Tier Presets

Basic:

- `uploaded_screenshot_card`
- `simple_browser_frame`
- `simple_page_highlight`

Pro:

- `saas_dashboard_feature_capture`
- `product_page_focus`
- `tutorial_step_capture`
- `side_by_side_browser_demo`
- `browser_highlight_zoom`

Premium:

- `multi_step_dashboard_walkthrough`
- `before_after_website_comparison`
- `documentary_evidence_page_sequence`
- `redacted_sensitive_dashboard`
- `advanced_ui_story_sequence`

## QA Thresholds

Browser/app visual QA should check text readability, screenshot sharpness, face/caption collision, redaction completeness, visible source labels, visible mock/example labels, misleading evidence warnings, safe-zone compliance, browser frame clutter, and readable zoom targets.
