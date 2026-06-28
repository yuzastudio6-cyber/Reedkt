import { expect, type Locator, type Page } from '@playwright/test'

export async function setViewport(page: Page, width: number, height = 900) {
  await page.setViewportSize({ width, height })
}

export async function expectNoHorizontalOverflow(page: Page, tolerance = 2) {
  // This protects the app-shell no-cutoff rule without relying on pixel-perfect screenshots.
  const metrics = await page.evaluate((overflowTolerance) => {
    const clientWidth = document.documentElement.clientWidth
    const documentScrollWidth = document.documentElement.scrollWidth
    const bodyScrollWidth = document.body.scrollWidth
    const offenders = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          className: element.className.toString(),
          tagName: element.tagName.toLowerCase(),
          width: Math.ceil(rect.width),
          x: Math.floor(rect.x),
        }
      })
      .filter((item) => item.width > clientWidth + overflowTolerance || item.x < -overflowTolerance)
      .slice(0, 8)

    return {
      bodyScrollWidth,
      clientWidth,
      documentScrollWidth,
      offenders,
    }
  }, tolerance)

  expect(metrics.documentScrollWidth, `document horizontal overflow: ${JSON.stringify(metrics.offenders)}`).toBeLessThanOrEqual(metrics.clientWidth + tolerance)
  expect(metrics.bodyScrollWidth, `body horizontal overflow: ${JSON.stringify(metrics.offenders)}`).toBeLessThanOrEqual(metrics.clientWidth + tolerance)
}

export async function expectVisibleInViewport(page: Page, locator: Locator, name: string) {
  await expect(locator, `${name} should be visible`).toBeVisible()
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()

  expect(box, `${name} should have a bounding box`).not.toBeNull()
  expect(viewport, 'viewport should be set').not.toBeNull()

  if (!box || !viewport) {
    return
  }

  expect(box.x + box.width, `${name} should not sit left of viewport`).toBeGreaterThan(0)
  expect(box.x, `${name} should not sit right of viewport`).toBeLessThan(viewport.width)
  expect(box.y + box.height, `${name} should not sit above viewport`).toBeGreaterThan(0)
  expect(box.y, `${name} should not sit below viewport`).toBeLessThan(viewport.height)
}

export async function expectFloatingComposer(page: Page) {
  const composer = page.getByTestId('chat-composer-surface')
  await expectVisibleInViewport(page, composer, 'floating composer surface')

  const box = await composer.boundingBox()
  const viewport = page.viewportSize()

  expect(box, 'composer should have dimensions').not.toBeNull()
  expect(viewport, 'viewport should be set').not.toBeNull()

  if (!box || !viewport) {
    return
  }

  // The composer should remain a floating input, not regress into a hard full-width footer row.
  expect(box.width, 'composer input shell should not span like a full-width footer').toBeLessThanOrEqual(viewport.width - 48)
  expect(viewport.height - (box.y + box.height), 'composer should leave visible page background below it').toBeGreaterThanOrEqual(4)
}

export async function expectFloatingComposerAligned(page: Page, tolerance = 96) {
  const thread = page.getByTestId('chat-thread')
  const layer = page.getByTestId('chat-composer-layer')
  const composer = page.getByTestId('chat-composer')
  const surface = page.getByTestId('chat-composer-surface')

  await expectVisibleInViewport(page, layer, 'composer overlay layer')
  await expectVisibleInViewport(page, composer, 'composer layout wrapper')
  await expectVisibleInViewport(page, surface, 'floating composer surface')

  const threadBox = await thread.boundingBox()
  const layerBox = await layer.boundingBox()
  const composerBox = await composer.boundingBox()
  const surfaceBox = await surface.boundingBox()
  const viewport = page.viewportSize()
  const wrapperStyles = await composer.evaluate((element) => {
    const styles = getComputedStyle(element)

    return {
      backdropFilter: styles.backdropFilter,
      backgroundColor: styles.backgroundColor,
      borderTopWidth: styles.borderTopWidth,
      boxShadow: styles.boxShadow,
    }
  })

  expect(threadBox, 'chat thread should have dimensions').not.toBeNull()
  expect(layerBox, 'composer layer should have dimensions').not.toBeNull()
  expect(composerBox, 'composer should have dimensions').not.toBeNull()
  expect(surfaceBox, 'composer surface should have dimensions').not.toBeNull()
  expect(viewport, 'viewport should be set').not.toBeNull()
  expect(['rgba(0, 0, 0, 0)', 'transparent'], 'composer wrapper should be visually transparent').toContain(wrapperStyles.backgroundColor)
  expect(wrapperStyles.borderTopWidth, 'composer wrapper should not own a border').toBe('0px')
  expect(wrapperStyles.boxShadow, 'composer wrapper should not own a shadow').toBe('none')
  expect(wrapperStyles.backdropFilter, 'composer wrapper should not own backdrop blur').toBe('none')

  if (!threadBox || !layerBox || !composerBox || !surfaceBox || !viewport) {
    return
  }

  const threadCenter = threadBox.x + threadBox.width / 2
  const composerCenter = composerBox.x + composerBox.width / 2
  const surfaceCenter = surfaceBox.x + surfaceBox.width / 2

  expect(surfaceBox.width, 'composer surface should not span the full viewport').toBeLessThanOrEqual(viewport.width - 48)
  expect(Math.abs(composerCenter - threadCenter), 'composer center should align with chat thread center').toBeLessThanOrEqual(tolerance)
  expect(Math.abs(surfaceCenter - threadCenter), 'composer surface center should align with chat thread center').toBeLessThanOrEqual(tolerance)
  expect(Math.abs(composerBox.width - layerBox.width), 'composer shell should match overlay layer width').toBeLessThanOrEqual(4)
  expect(surfaceBox.width, 'surfaced composer should not exceed the layout wrapper').toBeLessThanOrEqual(composerBox.width)
  expect(
    Math.abs(layerBox.width - threadBox.width),
    'composer layer width should align with chat thread width',
  ).toBeLessThanOrEqual(tolerance)
}

export async function expectCompactComposerSurface(page: Page) {
  const thread = page.getByTestId('chat-thread')
  const surface = page.getByTestId('chat-composer-surface')
  const textarea = page.getByTestId('chat-composer-textarea')
  const attachmentActions = page.getByTestId('chat-composer-attachment-actions')

  await expectVisibleInViewport(page, surface, 'compact composer surface')

  const threadBox = await thread.boundingBox()
  const surfaceBox = await surface.boundingBox()
  const metrics = await page.evaluate(() => {
    const surfaceElement = document.querySelector<HTMLElement>('[data-testid="chat-composer-surface"]')
    const textareaElement = document.querySelector<HTMLTextAreaElement>('[data-testid="chat-composer-textarea"]')
    const labelElement = document.querySelector<HTMLElement>('.chat-composer-field > span')
    const helperElement = document.querySelector<HTMLElement>('#chat-composer-helper')
    const attachmentElement = document.querySelector<HTMLElement>('[data-testid="chat-composer-attachment-actions"]')
    const sendElement = document.querySelector<HTMLElement>('[data-testid="chat-composer-send"]')
    const surfaceStyles = surfaceElement ? getComputedStyle(surfaceElement) : null
    const textareaStyles = textareaElement ? getComputedStyle(textareaElement) : null
    const attachmentStyles = attachmentElement ? getComputedStyle(attachmentElement) : null
    const sendStyles = sendElement ? getComputedStyle(sendElement) : null

    return {
      attachmentDisplay: attachmentStyles?.display ?? '',
      helperClass: helperElement?.className ?? '',
      helperRect: helperElement
        ? {
            height: helperElement.getBoundingClientRect().height,
            width: helperElement.getBoundingClientRect().width,
          }
        : null,
      labelClass: labelElement?.className ?? '',
      labelRect: labelElement
        ? {
            height: labelElement.getBoundingClientRect().height,
            width: labelElement.getBoundingClientRect().width,
          }
        : null,
      sendMinHeight: sendStyles?.minHeight ?? '',
      surfaceBackground: surfaceStyles?.backgroundColor ?? '',
      surfaceBorderTopWidth: surfaceStyles?.borderTopWidth ?? '',
      surfaceBorderRadius: surfaceStyles?.borderTopLeftRadius ?? '',
      surfaceBoxShadow: surfaceStyles?.boxShadow ?? '',
      textareaActualHeight: textareaElement?.getBoundingClientRect().height ?? 0,
      textareaBackground: textareaStyles?.backgroundColor ?? '',
      textareaBorderTopWidth: textareaStyles?.borderTopWidth ?? '',
      textareaBoxShadow: textareaStyles?.boxShadow ?? '',
      textareaMaxHeight: textareaStyles?.maxHeight ?? '',
      textareaResize: textareaStyles?.resize ?? '',
    }
  })

  expect(threadBox, 'chat thread should have dimensions').not.toBeNull()
  expect(surfaceBox, 'composer surface should have dimensions').not.toBeNull()
  await expect(textarea, 'composer textarea remains available').toBeVisible()
  await expect(attachmentActions, 'attachment actions should remain integrated').toBeVisible()
  expect(metrics.labelClass, 'composer label should be screen-reader only').toContain('sr-only')
  expect(metrics.helperClass, 'composer helper should be screen-reader only').toContain('sr-only')
  expect(metrics.labelRect?.height ?? 0, 'composer label should not occupy a visible row').toBeLessThanOrEqual(1)
  expect(metrics.labelRect?.width ?? 0, 'composer label should not occupy a visible row').toBeLessThanOrEqual(1)
  expect(metrics.helperRect?.height ?? 0, 'composer helper should not occupy a visible row').toBeLessThanOrEqual(1)
  expect(metrics.helperRect?.width ?? 0, 'composer helper should not occupy a visible row').toBeLessThanOrEqual(1)
  expect(metrics.attachmentDisplay, 'attachment controls should be inline in the compact bar').toBe('flex')
  expect(metrics.textareaBorderTopWidth, 'textarea should not render a nested card border').toBe('0px')
  expect(metrics.textareaBoxShadow, 'textarea should not render a nested card shadow').toBe('none')
  expect(metrics.textareaBackground, 'textarea should be integrated into composer surface').toBe('rgba(0, 0, 0, 0)')
  expect(metrics.textareaResize, 'textarea resize handle should not create form-card behavior').toBe('none')
  expect(metrics.textareaMaxHeight, 'textarea should have a controlled compact max height').toBe('104px')
  expect(metrics.textareaActualHeight, 'textarea should not become a nested multi-row box by default').toBeLessThanOrEqual(44)
  expect(metrics.surfaceBorderTopWidth, 'composer surface should be a single fine glass border').toBe('1px')

  if (!threadBox || !surfaceBox) {
    return
  }

  expect(surfaceBox.height, 'compact composer surface should stay below card-like height').toBeLessThanOrEqual(76)
  const composerBottomGap = (threadBox.y + threadBox.height) - (surfaceBox.y + surfaceBox.height)
  expect(composerBottomGap, 'composer should sit near the lower editor edge').toBeGreaterThanOrEqual(0)
  expect(composerBottomGap, 'composer should sit near the lower editor edge').toBeLessThanOrEqual(16)
}

export async function expectComposerFadeLayer(page: Page) {
  const fade = page.getByTestId('chat-composer-fade')
  const occlusion = page.getByTestId('chat-composer-occlusion')
  await expect(fade, 'composer fade layer should exist').toHaveCount(1)
  await expect(occlusion, 'composer occlusion mask should exist').toHaveCount(1)

  const fadeBox = await fade.boundingBox()
  const composerBox = await page.getByTestId('chat-composer-surface').boundingBox()
  const occlusionBox = await occlusion.boundingBox()
  const threadMaskStyles = await page.getByTestId('chat-thread').evaluate((element) => {
    const styles = getComputedStyle(element)
    const maskImage = styles.maskImage === 'none'
      ? styles.getPropertyValue('-webkit-mask-image')
      : styles.maskImage
    const alphaValues = Array.from(maskImage.matchAll(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/g))
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value))

    return {
      alphaValues,
      maskImage,
      maskMode: styles.maskMode,
      maskRepeat: styles.maskRepeat || styles.getPropertyValue('-webkit-mask-repeat'),
      maskSize: styles.maskSize || styles.getPropertyValue('-webkit-mask-size'),
    }
  })
  const viewport = page.viewportSize()
  const fadeStyles = await fade.evaluate((element) => {
    const styles = getComputedStyle(element)
    const alphaValues = Array.from(styles.backgroundImage.matchAll(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/g))
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value))

    return {
      alphaValues,
      backgroundImage: styles.backgroundImage,
      pointerEvents: styles.pointerEvents,
    }
  })
  const occlusionStyles = await occlusion.evaluate((element) => {
    const styles = getComputedStyle(element)

    return {
      backgroundColor: styles.backgroundColor,
      pointerEvents: styles.pointerEvents,
      zIndex: styles.zIndex,
    }
  })

  expect(fadeBox, 'composer fade should have dimensions').not.toBeNull()
  expect(composerBox, 'composer should have dimensions').not.toBeNull()
  expect(occlusionBox, 'composer occlusion should have dimensions').not.toBeNull()
  expect(viewport, 'viewport should be set').not.toBeNull()
  expect(fadeStyles.pointerEvents, 'composer fade must not intercept pointer events').toBe('none')
  expect(occlusionStyles.pointerEvents, 'composer occlusion must not intercept pointer events').toBe('none')
  expect(occlusionStyles.backgroundColor, 'composer occlusion should block content without becoming visible outside the rail').toBe('rgba(5, 7, 13, 0.9)')
  expect(fadeStyles.alphaValues.length, 'composer fade should expose inspectable alpha stops').toBeGreaterThan(0)
  expect(Math.max(...fadeStyles.alphaValues), 'composer fade alpha should stay too soft to read as a panel').toBeLessThanOrEqual(0.36)
  expect(fadeStyles.backgroundImage, 'composer fade should use a soft blended underlay').toContain('radial-gradient')
  expect(threadMaskStyles.maskImage, 'chat thread should fade its own content before the composer bottom edge').toContain('linear-gradient')
  expect(threadMaskStyles.alphaValues, 'chat thread mask should expose fade alpha stops').toEqual(expect.arrayContaining([0.72, 0.22, 0]))
  expect(threadMaskStyles.maskSize, 'chat thread mask should cover the scroll viewport').toContain('100%')

  if (!fadeBox || !composerBox || !occlusionBox || !viewport) {
    return
  }

  const composerCenter = composerBox.x + composerBox.width / 2
  const occlusionCenter = occlusionBox.x + occlusionBox.width / 2

  expect(fadeBox.height, 'composer fade should be controlled enough to avoid a ghost panel').toBeGreaterThanOrEqual(72)
  expect(fadeBox.height, 'composer fade should be controlled enough to avoid a ghost panel').toBeLessThanOrEqual(96)
  expect(fadeBox.y + fadeBox.height, 'composer fade should reach the lower editor viewport').toBeGreaterThan(viewport.height - 260)
  expect(fadeBox.width, 'composer fade should cover at least the input rail').toBeGreaterThanOrEqual(composerBox.width)
  expect(fadeBox.width, 'composer fade should avoid overflowing the viewport').toBeLessThanOrEqual(viewport.width)
  expect(Math.abs(occlusionCenter - composerCenter), 'composer occlusion should align with input rail center').toBeLessThanOrEqual(1)
  expect(Math.abs(occlusionBox.width - composerBox.width), 'composer occlusion should match input rail width').toBeLessThanOrEqual(1)
  expect(Math.abs(occlusionBox.height - composerBox.height), 'composer occlusion should match input rail height').toBeLessThanOrEqual(1)
}

export async function expectChatCardsFitUnderComposer(page: Page) {
  const composerBox = await page.getByTestId('chat-composer-surface').boundingBox()
  expect(composerBox, 'composer should have dimensions').not.toBeNull()

  if (!composerBox) {
    return
  }

  const cardMetrics = await page.locator('.inline-chat-card').evaluateAll((cards) =>
    cards.map((card) => {
      const rect = card.getBoundingClientRect()

      return {
        className: card.className.toString(),
        width: rect.width,
        x: rect.x,
      }
    }),
  )

  expect(cardMetrics.length, 'editor should render inline chat cards for composer width QA').toBeGreaterThan(0)

  for (const card of cardMetrics) {
    const cardCenter = card.x + card.width / 2
    const composerCenter = composerBox.x + composerBox.width / 2

    expect(card.width, `${card.className} should be no wider than the composer rail`).toBeLessThanOrEqual(composerBox.width)
    expect(Math.abs(cardCenter - composerCenter), `${card.className} should align under the composer rail`).toBeLessThanOrEqual(96)
  }
}

export async function expectCardWithinComposerRail(page: Page, locator: Locator, name: string, tolerance = 96) {
  await expect(locator, `${name} should be visible for card rail QA`).toBeVisible()

  const composerBox = await page.getByTestId('chat-composer-surface').boundingBox()
  const cardBox = await locator.boundingBox()

  expect(composerBox, 'composer should have dimensions').not.toBeNull()
  expect(cardBox, `${name} should have dimensions`).not.toBeNull()

  if (!composerBox || !cardBox) {
    return
  }

  const composerCenter = composerBox.x + composerBox.width / 2
  const cardCenter = cardBox.x + cardBox.width / 2

  expect(cardBox.width, `${name} should not be wider than the composer rail`).toBeLessThanOrEqual(composerBox.width)
  expect(Math.abs(cardCenter - composerCenter), `${name} should align with the composer rail`).toBeLessThanOrEqual(tolerance)
}

export async function expectChatCardNotTooWide(page: Page, locator: Locator, name: string, minimumComposerMargin = 8) {
  await expectCardWithinComposerRail(page, locator, name)

  const composerBox = await page.getByTestId('chat-composer-surface').boundingBox()
  const cardBox = await locator.boundingBox()

  if (!composerBox || !cardBox) {
    return
  }

  expect(
    cardBox.width,
    `${name} should remain visually subordinate to the composer surface`,
  ).toBeLessThanOrEqual(composerBox.width - minimumComposerMargin)
}

export async function expectNoCardHorizontalOverflow(page: Page, tolerance = 2) {
  const metrics = await page.locator('.inline-chat-card').evaluateAll((cards, overflowTolerance) =>
    cards.map((card) => {
      const cardRect = card.getBoundingClientRect()
      const clippedChildren = Array.from(card.querySelectorAll<HTMLElement>('*'))
        .map((element) => {
          const rect = element.getBoundingClientRect()

          return {
            className: element.className.toString(),
            tagName: element.tagName.toLowerCase(),
            left: Math.floor(rect.left),
            right: Math.ceil(rect.right),
            width: Math.ceil(rect.width),
          }
        })
        .filter((item) => item.tagName !== 'option' && item.width > 0)
        .filter((item) => item.left < cardRect.left - overflowTolerance || item.right > cardRect.right + overflowTolerance)
        .slice(0, 6)

      return {
        className: card.className.toString(),
        clippedChildren,
      }
    }),
  tolerance)

  for (const card of metrics) {
    expect(card.clippedChildren, `${card.className} should not clip or overflow child controls`).toEqual([])
  }
}

export async function expectChatRhythmStable(page: Page) {
  const messages = page.locator('.chat-native-message')
  await expect(messages.first(), 'chat should render messages for rhythm QA').toBeVisible()
  await expectChatTextWithinComposerRail(page)

  const groups = await page.locator('.chat-message-list').evaluateAll((lists) =>
    lists.map((list) => {
      const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > .chat-native-message'))

      return items.map((item, index) => {
        const previous = items[index - 1]
        const next = items[index + 1]
        const rect = item.getBoundingClientRect()
        const previousRect = previous?.getBoundingClientRect()
        const role = item.getAttribute('data-role')
        const previousRole = previous?.getAttribute('data-role')
        const nextRole = next?.getAttribute('data-role')

        return {
          compactLabel: item.getAttribute('data-compact-label'),
          gapFromPrevious: previousRect ? rect.top - previousRect.bottom : null,
          groupPosition: item.getAttribute('data-group-position'),
          role,
          shouldCompact: role === previousRole,
          shouldStartGroup: role !== previousRole,
          shouldContinueGroup: role === nextRole,
        }
      })
    }),
  )
  const metrics = groups.flat()

  expect(metrics.length, 'chat should have enough messages for rhythm QA').toBeGreaterThan(0)

  for (const [index, item] of metrics.entries()) {
    expect(['single', 'first', 'middle', 'last'], `message ${index} should expose a valid group position`).toContain(item.groupPosition)
    expect(['true', 'false'], `message ${index} should expose compact-label state`).toContain(item.compactLabel)

    if (item.shouldCompact) {
      expect(item.compactLabel, `message ${index} should compact repeated same-role labels`).toBe('true')
      expect(['middle', 'last'], `message ${index} should be grouped as continuation`).toContain(item.groupPosition)
    }

    if (item.shouldStartGroup && item.shouldContinueGroup) {
      expect(item.groupPosition, `message ${index} should start a same-role group`).toBe('first')
    }

    if (item.gapFromPrevious !== null) {
      expect(item.gapFromPrevious, `message ${index} should not collide with previous message`).toBeGreaterThanOrEqual(-1)
      expect(item.gapFromPrevious, `message ${index} should not create an excessive scroll jump`).toBeLessThanOrEqual(80)
    }
  }
}

export async function expectChatTextWithinComposerRail(page: Page, tolerance = 2) {
  const metrics = await page.evaluate(() => {
    const composer = document.querySelector<HTMLElement>('[data-testid="chat-composer-surface"]')
    const composerRect = composer?.getBoundingClientRect()
    const messages = Array.from(document.querySelectorAll<HTMLElement>('.chat-native-message-user, .chat-native-message-ai.chat-native-message-text-only, .chat-native-message-ai.chat-native-message-with-cards'))
      .map((message) => {
        const content = message.querySelector<HTMLElement>(':scope > div')
        const contentRect = content?.getBoundingClientRect()

        return {
          contentBottom: contentRect?.bottom ?? 0,
          contentLeft: contentRect?.left ?? 0,
          contentRight: contentRect?.right ?? 0,
          contentWidth: contentRect?.width ?? 0,
          messageType: message.getAttribute('data-message-type') ?? '',
          role: message.getAttribute('data-role') ?? '',
          text: content?.innerText.slice(0, 80) ?? '',
        }
      })

    return {
      composerLeft: composerRect?.left ?? 0,
      composerRight: composerRect?.right ?? 0,
      composerWidth: composerRect?.width ?? 0,
      hasComposer: Boolean(composerRect),
      messages,
    }
  })

  expect(metrics.hasComposer, 'composer rail should exist for text lane QA').toBe(true)
  expect(metrics.messages.length, 'chat should render user or assistant text messages for rail QA').toBeGreaterThan(0)

  for (const [index, item] of metrics.messages.entries()) {
    expect(item.contentWidth, `${item.role} text ${index} should not be wider than the composer rail`).toBeLessThanOrEqual(metrics.composerWidth + tolerance)
    expect(item.contentLeft, `${item.role} text ${index} should not start outside the composer rail: ${item.text}`).toBeGreaterThanOrEqual(metrics.composerLeft - tolerance)
    expect(item.contentRight, `${item.role} text ${index} should not end outside the composer rail: ${item.text}`).toBeLessThanOrEqual(metrics.composerRight + tolerance)
  }
}

export async function expectMessageLabelsNotOvercrowded(page: Page) {
  const metrics = await page.locator('.chat-native-message').evaluateAll((messages) =>
    messages.map((message) => {
      const label = message.querySelector<HTMLElement>('.chat-message-label')
      const labelRect = label?.getBoundingClientRect()

      return {
        compactLabel: message.getAttribute('data-compact-label'),
        groupPosition: message.getAttribute('data-group-position'),
        labelHeight: labelRect?.height ?? 0,
        labelWidth: labelRect?.width ?? 0,
      }
    }),
  )

  expect(metrics.length, 'chat should render labels for rhythm QA').toBeGreaterThan(0)

  for (const [index, item] of metrics.entries()) {
    if (item.compactLabel === 'true') {
      expect(item.labelHeight, `compact label ${index} should not occupy a visible row`).toBeLessThanOrEqual(1)
      expect(item.labelWidth, `compact label ${index} should not occupy a visible row`).toBeLessThanOrEqual(1)
    } else {
      expect(item.labelHeight, `group-leading label ${index} should remain visible`).toBeGreaterThan(0)
    }
  }
}

export async function expectCardAttachedToAssistantMessage(page: Page) {
  const metrics = await page.locator('.chat-native-message-with-cards').evaluateAll((messages) =>
    messages.map((message) => {
      const intro = message.querySelector<HTMLElement>('p')
      const stack = message.querySelector<HTMLElement>('.chat-message-card-stack')
      const firstCard = stack?.firstElementChild instanceof HTMLElement ? stack.firstElementChild : null
      const introRect = intro?.getBoundingClientRect()
      const cardRect = firstCard?.getBoundingClientRect()

      return {
        className: message.className.toString(),
        distance: introRect && cardRect ? cardRect.top - introRect.bottom : null,
        hasCard: Boolean(firstCard),
        hasIntro: Boolean(intro),
      }
    }),
  )

  expect(metrics.length, 'chat should render card-bearing assistant messages').toBeGreaterThan(0)

  for (const [index, item] of metrics.entries()) {
    expect(item.hasCard, `card-bearing message ${index} should include a card stack`).toBe(true)

    if (item.hasIntro && item.distance !== null) {
      expect(item.distance, `card-bearing message ${index} should attach cards to intro text`).toBeGreaterThanOrEqual(0)
      expect(item.distance, `card-bearing message ${index} should keep cards close to intro text`).toBeLessThanOrEqual(28)
    }
  }
}

export async function expectNoExcessiveVerticalGaps(page: Page) {
  const groups = await page.locator('.chat-message-list').evaluateAll((lists) =>
    lists.map((list) => {
      const messages = Array.from(list.querySelectorAll<HTMLElement>(':scope > .chat-native-message'))

      return messages.slice(1).map((message, index) => {
        const previous = messages[index]
        const previousRect = previous.getBoundingClientRect()
        const rect = message.getBoundingClientRect()

        return {
          gap: rect.top - previousRect.bottom,
          messageType: message.getAttribute('data-message-type'),
        }
      })
    }),
  )
  const gaps = groups.flat()

  for (const [index, item] of gaps.entries()) {
    expect(item.gap, `chat gap ${index} before ${item.messageType ?? 'message'} should not be excessive`).toBeLessThanOrEqual(80)
  }
}

export async function expectFocusedControl(page: Page, locator: Locator, name: string) {
  await locator.scrollIntoViewIfNeeded()
  await locator.focus()
  await expect(locator, `${name} should receive keyboard focus`).toBeFocused()
  await expectVisibleInViewport(page, locator, name)

  const focusMetrics = await locator.evaluate((element) => {
    const candidates = [
      element,
      element.closest('.chat-composer-surface'),
      element.closest('.source-clip-flags label'),
      element.closest('.reference-focus-chip'),
      element.closest('.soundflow-detail-toggle summary'),
      element.closest('.sfx-details summary'),
    ].filter((candidate): candidate is Element => Boolean(candidate))

    return candidates.map((candidate) => {
      const styles = getComputedStyle(candidate)

      return {
        borderColor: styles.borderTopColor,
        boxShadow: styles.boxShadow,
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
      }
    })
  })

  const hasVisibleTreatment = focusMetrics.some((item) =>
    (item.outlineStyle !== 'none' && item.outlineWidth !== '0px') ||
    item.boxShadow !== 'none' ||
    item.borderColor.includes('0, 229, 255') ||
    item.borderColor.includes('56, 189, 248')
  )

  expect(hasVisibleTreatment, `${name} should expose visible focus treatment`).toBe(true)
}

export async function expectIconButtonsHaveAccessibleTitles(scope: Locator, name: string) {
  const buttons = await scope.locator('.icon-button').evaluateAll((elements) =>
    elements.map((element) => ({
      ariaLabel: element.getAttribute('aria-label') ?? '',
      title: element.getAttribute('title') ?? '',
    })),
  )

  expect(buttons.length, `${name} should expose compact icon buttons for title QA`).toBeGreaterThan(0)

  for (const [index, button] of buttons.entries()) {
    expect(button.ariaLabel.trim(), `${name} icon button ${index} should have an aria-label`).not.toBe('')
    expect(button.title.trim(), `${name} icon button ${index} should have a browser title`).not.toBe('')
  }
}

export async function expectDetailsSummaryKeyboardToggle(page: Page, summary: Locator, name: string) {
  await expect(summary, `${name} summary should be visible`).toBeVisible()
  await expectFocusedControl(page, summary, name)

  const before = await summary.evaluate((element) => {
    const details = element.closest('details') as HTMLDetailsElement | null
    return details?.open ?? null
  })

  expect(before, `${name} should be inside a details disclosure`).not.toBeNull()
  await summary.press('Enter')

  const after = await summary.evaluate((element) => {
    const details = element.closest('details') as HTMLDetailsElement | null
    return details?.open ?? null
  })

  expect(after, `${name} should toggle with Enter`).toBe(!before)
  await expectNoHorizontalOverflow(page)
}

export async function expectCardActionsReachable(page: Page, locator: Locator, name: string) {
  await expectLastContentReachableAboveComposer(page, locator, name)
  await expect(locator, `${name} should remain enabled or visible after reachability scroll`).toBeVisible()
}

export async function expectLastContentReachableAboveComposer(page: Page, locator: Locator, name: string) {
  await locator.scrollIntoViewIfNeeded()

  const thread = page.getByTestId('chat-thread')
  const composerBox = await page.getByTestId('chat-composer-surface').boundingBox()
  let targetBox = await locator.boundingBox()

  expect(composerBox, 'composer should have dimensions').not.toBeNull()
  expect(targetBox, `${name} should have dimensions`).not.toBeNull()

  if (!composerBox || !targetBox) {
    return
  }

  const overlap = targetBox.y + targetBox.height - composerBox.y
  if (overlap > -12) {
    await thread.evaluate((element, scrollBy) => {
      element.scrollTop += scrollBy
    }, overlap + 32)
    targetBox = await locator.boundingBox()
  }

  expect(targetBox, `${name} should remain measurable after scroll adjustment`).not.toBeNull()
  if (!targetBox) {
    return
  }

  expect(targetBox.y + targetBox.height, `${name} should be reachable above composer`).toBeLessThanOrEqual(composerBox.y - 8)
}

export async function applyChromiumPageScale(page: Page, scale = 1.25) {
  try {
    // Chromium page scale is practical zoom coverage; it is not identical to every browser's UI zoom.
    const session = await page.context().newCDPSession(page)
    await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: scale })
    return true
  } catch {
    return false
  }
}
