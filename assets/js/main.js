(function () {
  "use strict";

  function initZoomLock() {
    const root = document.documentElement;
    if (!root) {
      return;
    }

    const landscapeTouchQuery = window.matchMedia(
      "(max-width: 63.99rem) and (max-height: 31.99rem) and (orientation: landscape) and (pointer: coarse)"
    );
    const shouldBypassZoomLock = () => landscapeTouchQuery.matches;

    root.style.touchAction = "manipulation";

    const preventGesture = (event) => {
      if (shouldBypassZoomLock()) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (event) => {
        if (shouldBypassZoomLock()) {
          return;
        }

        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      { passive: false }
    );

    document.addEventListener(
      "touchmove",
      (event) => {
        if (shouldBypassZoomLock()) {
          return;
        }

        if (event.touches && event.touches.length > 1) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "wheel",
      (event) => {
        if (shouldBypassZoomLock()) {
          return;
        }

        if (event.ctrlKey) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  }

  function initProjectStage() {
    const stage = document.querySelector("[data-hero]");
    if (!stage) {
      return;
    }

    const slides = Array.from(stage.querySelectorAll("[data-hero-slide]"));
    const previewButton = stage.querySelector("[data-hero-next]");
    const previewImage = stage.querySelector("[data-hero-preview-image]");
    const previewMark = stage.querySelector("[data-hero-preview-mark]");
    const previewEmoji = stage.querySelector("[data-hero-preview-emoji]");
    const previewWord = stage.querySelector("[data-hero-preview-word]");
    const previewLabel = stage.querySelector("[data-hero-preview-label]");
    const progress = stage.querySelector("[data-stage-progress]");
    const flashOverlay = stage.querySelector("[data-hero-flash]");

    if (!slides.length || !previewButton || !previewLabel || !progress || (!previewImage && !previewMark)) {
      return;
    }

    const initialSlideId = stage.getAttribute("data-hero-initial-slide-id");
    let activeIndex = -1;

    if (initialSlideId) {
      activeIndex = slides.findIndex((slide) => slide.getAttribute("data-slide-id") === initialSlideId);
    }

    if (activeIndex < 0) {
      activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    }

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const formatIndex = (index) => String(index).padStart(2, "0");
    const mobilePortraitQuery = window.matchMedia("(max-width: 47.99rem) and (orientation: portrait)");
    const mobileLandscapeQuery = window.matchMedia(
      "(max-width: 63.99rem) and (max-height: 31.99rem) and (orientation: landscape) and (pointer: coarse)"
    );
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isPortraitMobileMode = () => mobilePortraitQuery.matches;
    const isLandscapeMobileMode = () => mobileLandscapeQuery.matches;
    const isTouchSlideMode = () => isPortraitMobileMode() || isLandscapeMobileMode();
    const prefersReducedMotion = () => reducedMotionQuery.matches;
    const isHomePage = Boolean(document.body && document.body.classList.contains("page-home"));
    const isPhotographyPage = Boolean(document.body && document.body.classList.contains("page-photography"));
    const shouldAutoAdvance = isHomePage || isPhotographyPage;
    const RAPID_AUTO_ADVANCE_DELAY_MS = 675;
    const LOOP_AUTO_ADVANCE_DELAY_MS = 1750;
    const FLASH_DURATION_MS = 153;
    let touchStartY = null;
    let touchStartX = null;
    let touchLastY = null;
    let touchLastX = null;
    let isTrackingTouch = false;
    let wheelDeltaAccumulator = 0;
    let wheelResetTimer = null;
    let wheelCooldownUntil = 0;
    let autoAdvanceTimer = null;
    let flashResetTimer = null;
    let hasCompletedRapidSequence = false;
    const previewWarmCache = new Map();
    const MAX_WARMED_PREVIEWS = 8;

    const getSlideLabel = (slide) => {
      return slide.getAttribute("data-preview-label") || slide.getAttribute("data-slide-title") || "Project";
    };

    const getFirstSrcFromSrcset = (srcset) => {
      if (!srcset) {
        return "";
      }

      const firstCandidate = srcset
        .split(",")
        .map((entry) => entry.trim())
        .find(Boolean);

      if (!firstCandidate) {
        return "";
      }

      const [url] = firstCandidate.split(/\s+/);
      return url || "";
    };

    const getSlideImage = (slide) => {
      if (isPhotographyPage) {
        if (isPortraitMobileMode()) {
          const portraitPreviewSrc =
            getFirstSrcFromSrcset(slide.getAttribute("data-photo-portrait-webp-srcset")) ||
            getFirstSrcFromSrcset(slide.getAttribute("data-photo-portrait-avif-srcset"));
          if (portraitPreviewSrc) {
            return portraitPreviewSrc;
          }
        }

        const landscapePreviewSrc =
          getFirstSrcFromSrcset(slide.getAttribute("data-photo-landscape-webp-srcset")) ||
          getFirstSrcFromSrcset(slide.getAttribute("data-photo-landscape-avif-srcset"));
        if (landscapePreviewSrc) {
          return landscapePreviewSrc;
        }
      }

      if (isPortraitMobileMode()) {
        const directMobileImage = slide.getAttribute("data-preview-image-mobile");
        if (directMobileImage) {
          return directMobileImage;
        }
      }

      const directImage = slide.getAttribute("data-preview-image");
      if (directImage) {
        return directImage;
      }

      const image = slide.querySelector("img");
      return image ? image.getAttribute("src") || "" : "";
    };

    const warmPreviewImage = (imagePath) => {
      if (!isPhotographyPage || !imagePath || previewWarmCache.has(imagePath)) {
        return;
      }

      const image = new Image();
      image.decoding = "async";
      image.src = imagePath;
      previewWarmCache.set(imagePath, image);

      if (previewWarmCache.size > MAX_WARMED_PREVIEWS) {
        const oldestPath = previewWarmCache.keys().next().value;
        if (oldestPath) {
          previewWarmCache.delete(oldestPath);
        }
      }
    };

    const getSlidePreviewKind = (slide) => {
      return slide.getAttribute("data-preview-kind") || "image";
    };

    const getSlidePreviewEmoji = (slide) => {
      return slide.getAttribute("data-preview-emoji") || "🧠";
    };

    const getSlidePreviewWord = (slide) => {
      return slide.getAttribute("data-preview-word") || "project";
    };

    const getSlideActionLink = (slide) => {
      return slide.querySelector(".project-slide__action[href]");
    };

    const openSlideAction = (slide) => {
      const actionLink = getSlideActionLink(slide);
      if (!actionLink) {
        return;
      }

      actionLink.click();
    };

    const shouldIgnoreSlideClickTarget = (eventTarget) => {
      if (!(eventTarget instanceof Element)) {
        return false;
      }

      return Boolean(eventTarget.closest("a, button, input, select, textarea, label"));
    };

    const syncPreview = () => {
      const nextIndex = (activeIndex + 1) % slides.length;
      const nextSlide = slides[nextIndex];
      const nextLabel = getSlideLabel(nextSlide);
      const nextImage = getSlideImage(nextSlide);
      const nextKind = getSlidePreviewKind(nextSlide);

      if (nextKind === "text" && previewMark && previewEmoji && previewWord) {
        previewMark.hidden = false;
        previewEmoji.textContent = getSlidePreviewEmoji(nextSlide);
        previewWord.textContent = getSlidePreviewWord(nextSlide);
        if (previewImage) {
          previewImage.hidden = true;
          previewImage.setAttribute("aria-hidden", "true");
        }
      } else {
        if (previewMark) {
          previewMark.hidden = true;
        }
        if (previewImage) {
          previewImage.hidden = false;
          previewImage.removeAttribute("aria-hidden");
        }
      }

      if (nextImage && previewImage) {
        previewImage.setAttribute("src", nextImage);
      }

      if (isPhotographyPage) {
        warmPreviewImage(nextImage);
        const nextNextSlide = slides[(nextIndex + 1) % slides.length];
        if (nextNextSlide) {
          warmPreviewImage(getSlideImage(nextNextSlide));
        }
      }

      const showLandscapePreviewLabel =
        isPhotographyPage && isLandscapeMobileMode();
      previewLabel.hidden = !showLandscapePreviewLabel;
      previewLabel.setAttribute("aria-hidden", showLandscapePreviewLabel ? "false" : "true");

      previewLabel.textContent = "Next: " + nextLabel;
      previewButton.setAttribute("aria-label", "View next project: " + nextLabel);
      progress.textContent = formatIndex(activeIndex + 1) + " / " + formatIndex(slides.length);
    };

    const clearAutoAdvanceTimer = () => {
      if (autoAdvanceTimer) {
        window.clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
    };

    const triggerTransitionFlash = () => {
      if (!isHomePage || !flashOverlay) {
        return;
      }

      flashOverlay.classList.remove("is-active");
      void flashOverlay.offsetWidth;
      flashOverlay.classList.add("is-active");

      if (flashResetTimer) {
        window.clearTimeout(flashResetTimer);
      }

      flashResetTimer = window.setTimeout(() => {
        flashOverlay.classList.remove("is-active");
      }, FLASH_DURATION_MS);
    };

    const scheduleAutoAdvance = () => {
      if (!shouldAutoAdvance || slides.length < 2 || prefersReducedMotion()) {
        return;
      }

      clearAutoAdvanceTimer();
      const activeDelay = isHomePage && !hasCompletedRapidSequence ? RAPID_AUTO_ADVANCE_DELAY_MS : LOOP_AUTO_ADVANCE_DELAY_MS;
      autoAdvanceTimer = window.setTimeout(() => {
        if (document.body && document.body.classList.contains("is-menu-open")) {
          scheduleAutoAdvance();
          return;
        }

        if (isHomePage && !hasCompletedRapidSequence && activeIndex >= slides.length - 1) {
          hasCompletedRapidSequence = true;
        }

        goToNextSlide();
      }, activeDelay);
    };

    const setActiveSlide = (index, options) => {
      const transitionOptions = options || {};
      const shouldFlash = transitionOptions.flash !== false;
      activeIndex = index;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        slide.setAttribute("tabindex", isActive ? "0" : "-1");
        slide.setAttribute("role", "link");
      });

      syncPreview();
      if (shouldFlash) {
        triggerTransitionFlash();
      }
      stage.dispatchEvent(
        new CustomEvent("hero:slidechange", {
          detail: {
            activeIndex,
            totalSlides: slides.length
          }
        })
      );
      scheduleAutoAdvance();
    };

    const handleMobilePreviewChange = () => {
      syncPreview();
    };

    const handleReducedMotionChange = () => {
      if (prefersReducedMotion()) {
        clearAutoAdvanceTimer();
        if (flashResetTimer) {
          window.clearTimeout(flashResetTimer);
          flashResetTimer = null;
        }
        if (flashOverlay) {
          flashOverlay.classList.remove("is-active");
        }
        return;
      }

      scheduleAutoAdvance();
    };

    const addMediaQueryChangeListener = (query, callback) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", callback);
      } else if (typeof query.addListener === "function") {
        query.addListener(callback);
      }
    };

    addMediaQueryChangeListener(mobilePortraitQuery, handleMobilePreviewChange);
    addMediaQueryChangeListener(mobileLandscapeQuery, handleMobilePreviewChange);
    addMediaQueryChangeListener(reducedMotionQuery, handleReducedMotionChange);

    if (isPhotographyPage && previewImage) {
      previewImage.loading = "eager";
      previewImage.decoding = "async";
      previewImage.fetchPriority = "high";
    }

    const goToNextSlide = (options) => {
      const nextIndex = (activeIndex + 1) % slides.length;
      setActiveSlide(nextIndex, options);
    };

    const goToPreviousSlide = (options) => {
      const previousIndex = (activeIndex - 1 + slides.length) % slides.length;
      setActiveSlide(previousIndex, options);
    };

    const resetTouchState = () => {
      touchStartY = null;
      touchStartX = null;
      touchLastY = null;
      touchLastX = null;
      isTrackingTouch = false;
    };

    const startTouchState = (x, y) => {
      touchStartX = x;
      touchStartY = y;
      touchLastX = x;
      touchLastY = y;
      isTrackingTouch = true;
    };

    const onTouchStart = (event) => {
      if (!isTouchSlideMode() || document.body.classList.contains("is-menu-open") || event.touches.length !== 1) {
        return;
      }

      startTouchState(event.touches[0].clientX, event.touches[0].clientY);
    };

    const onTouchMove = (event) => {
      if (
        !isTouchSlideMode() ||
        !isTrackingTouch ||
        event.touches.length !== 1 ||
        document.body.classList.contains("is-menu-open")
      ) {
        return;
      }

      touchLastX = event.touches[0].clientX;
      touchLastY = event.touches[0].clientY;
      event.preventDefault();
    };

    const commitSwipe = (endX, endY) => {
      if (!isTrackingTouch || touchStartY === null || touchStartX === null) {
        resetTouchState();
        return;
      }

      const deltaY = endY - touchStartY;
      const deltaX = endX - touchStartX;
      resetTouchState();

      if (isLandscapeMobileMode()) {
        if (Math.abs(deltaX) < 24 || Math.abs(deltaX) <= Math.abs(deltaY)) {
          return;
        }

        if (deltaX < 0) {
          goToNextSlide();
        } else {
          goToPreviousSlide();
        }
        return;
      }

      if (Math.abs(deltaY) < 24 || Math.abs(deltaY) <= Math.abs(deltaX)) {
        return;
      }

      if (deltaY < 0) {
        goToNextSlide();
      } else {
        goToPreviousSlide();
      }
    };

    const onTouchEnd = (event) => {
      if (!isTouchSlideMode() || !isTrackingTouch) {
        return;
      }

      if (document.body.classList.contains("is-menu-open")) {
        resetTouchState();
        return;
      }

      const touch = event.changedTouches && event.changedTouches[0];

      if (!touch) {
        commitSwipe(touchLastX || 0, touchLastY || 0);
        return;
      }

      commitSwipe(touch.clientX, touch.clientY);
    };

    const onTouchCancel = () => {
      resetTouchState();
    };

    const onWheel = (event) => {
      if (isTouchSlideMode() || document.body.classList.contains("is-menu-open")) {
        return;
      }

      if (Math.abs(event.deltaY) < 2) {
        return;
      }

      event.preventDefault();

      wheelDeltaAccumulator += event.deltaY;

      if (wheelResetTimer) {
        window.clearTimeout(wheelResetTimer);
      }

      wheelResetTimer = window.setTimeout(() => {
        wheelDeltaAccumulator = 0;
      }, 140);

      const now = Date.now();
      if (now < wheelCooldownUntil) {
        return;
      }

      if (Math.abs(wheelDeltaAccumulator) < 30) {
        return;
      }

      if (wheelDeltaAccumulator > 0) {
        goToNextSlide();
      } else {
        goToPreviousSlide();
      }

      wheelDeltaAccumulator = 0;
      wheelCooldownUntil = now + 420;
    };

    previewButton.addEventListener("click", () => {
      goToNextSlide();
    });

    slides.forEach((slide) => {
      slide.addEventListener("click", (event) => {
        if (!slide.classList.contains("is-active") || shouldIgnoreSlideClickTarget(event.target)) {
          return;
        }

        openSlideAction(slide);
      });

      slide.addEventListener("keydown", (event) => {
        if (!slide.classList.contains("is-active") || shouldIgnoreSlideClickTarget(event.target)) {
          return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        openSlideAction(slide);
      });
    });

    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    stage.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("site:menu_open", resetTouchState);

    setActiveSlide(activeIndex, { flash: false });
  }

  function shouldEnableZoomLock() {
    return Boolean(document.body && document.body.hasAttribute("data-zoom-lock"));
  }

  function waitForPageImageSetup() {
    const setupPromise = window.__pageImageSetupPromise;
    if (!setupPromise || typeof setupPromise.then !== "function") {
      return Promise.resolve();
    }

    // Keep startup resilient even if page image setup is delayed.
    const timeoutPromise = new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    return Promise.race([setupPromise, timeoutPromise]).catch(() => {});
  }

  function initModules() {
    if (shouldEnableZoomLock()) {
      initZoomLock();
    }

    if (window.SiteNavigation && typeof window.SiteNavigation.init === "function") {
      window.SiteNavigation.init();
    }

    if (window.AnalyticsPlaceholder && typeof window.AnalyticsPlaceholder.init === "function") {
      window.AnalyticsPlaceholder.init();
    }

    waitForPageImageSetup().then(() => {
      initProjectStage();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModules);
  } else {
    initModules();
  }
})();
