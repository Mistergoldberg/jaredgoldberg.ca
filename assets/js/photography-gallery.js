(function () {
  "use strict";

  const PAGE_CLASS = "page-photography";
  const HERO_SLIDE_CHANGE_EVENT = "hero:slidechange";
  const MOBILE_MEDIA_QUERY = "(max-width: 47.99rem) and (orientation: portrait)";
  const LANDSCAPE_SIZES = "100vw";
  const PORTRAIT_SIZES = "100vw";

  function getFirstSrcFromSrcset(srcset) {
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
  }

  function setImagePriority(image, priority) {
    if (!image) {
      return;
    }

    if (priority === "active") {
      image.loading = "eager";
      image.decoding = "sync";
      image.fetchPriority = "high";
      return;
    }

    image.loading = "lazy";
    image.decoding = "async";
    image.fetchPriority = "low";
  }

  function createSourceElement(type, media, srcset, sizes) {
    if (!srcset) {
      return null;
    }

    const source = document.createElement("source");
    source.type = type;
    if (media) {
      source.media = media;
    }
    source.srcset = srcset;
    source.sizes = sizes;
    return source;
  }

  function createResponsivePicture(plan, priority) {
    const picture = document.createElement("picture");
    picture.setAttribute("data-photo-picture", "");

    const mobileAvifSource = createSourceElement(
      "image/avif",
      MOBILE_MEDIA_QUERY,
      plan.portraitAvifSrcset,
      PORTRAIT_SIZES
    );
    if (mobileAvifSource) {
      picture.appendChild(mobileAvifSource);
    }

    const mobileWebpSource = createSourceElement(
      "image/webp",
      MOBILE_MEDIA_QUERY,
      plan.portraitWebpSrcset,
      PORTRAIT_SIZES
    );
    if (mobileWebpSource) {
      picture.appendChild(mobileWebpSource);
    }

    const desktopAvifSource = createSourceElement("image/avif", "", plan.landscapeAvifSrcset, LANDSCAPE_SIZES);
    if (desktopAvifSource) {
      picture.appendChild(desktopAvifSource);
    }

    const desktopWebpSource = createSourceElement("image/webp", "", plan.landscapeWebpSrcset, LANDSCAPE_SIZES);
    if (desktopWebpSource) {
      picture.appendChild(desktopWebpSource);
    }

    const image = document.createElement("img");
    image.src = plan.fallbackSrc;
    image.alt = plan.altText;
    setImagePriority(image, priority);
    picture.appendChild(image);

    return picture;
  }

  function getInitialActiveIndex(stage, slides) {
    const initialSlideId = stage.getAttribute("data-hero-initial-slide-id");
    if (initialSlideId) {
      const slideIndex = slides.findIndex((slide) => slide.getAttribute("data-slide-id") === initialSlideId);
      if (slideIndex >= 0) {
        return slideIndex;
      }
    }

    const activeClassIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    if (activeClassIndex >= 0) {
      return activeClassIndex;
    }

    return 0;
  }

  function readSlidePlan(slide) {
    const fallbackSrc = slide.getAttribute("data-photo-fallback") || "";
    if (!fallbackSrc) {
      return null;
    }

    const existingImage = slide.querySelector(".project-slide__media img");
    const altText =
      slide.getAttribute("data-photo-alt") ||
      (existingImage ? existingImage.getAttribute("alt") || "" : "") ||
      "Still photograph";

    return {
      altText,
      fallbackSrc,
      portraitAvifSrcset: slide.getAttribute("data-photo-portrait-avif-srcset") || "",
      portraitWebpSrcset: slide.getAttribute("data-photo-portrait-webp-srcset") || "",
      landscapeAvifSrcset: slide.getAttribute("data-photo-landscape-avif-srcset") || "",
      landscapeWebpSrcset: slide.getAttribute("data-photo-landscape-webp-srcset") || ""
    };
  }

  function renderSlideFromPlan(slide, plan, priority) {
    const mediaContainer = slide.querySelector(".project-slide__media");
    if (!mediaContainer || !plan) {
      return;
    }

    mediaContainer.replaceChildren(createResponsivePicture(plan, priority));
  }

  function setRenderedSlidePriority(slide, priority) {
    const image = slide.querySelector(".project-slide__media img");
    setImagePriority(image, priority);
  }

  function renderSlideIfNeeded(slides, plansByIndex, renderedIndices, index, priority) {
    const totalSlides = slides.length;
    const wrappedIndex = ((index % totalSlides) + totalSlides) % totalSlides;
    const slide = slides[wrappedIndex];
    const plan = plansByIndex.get(wrappedIndex);
    if (!slide || !plan) {
      return;
    }

    if (!renderedIndices.has(wrappedIndex)) {
      renderSlideFromPlan(slide, plan, priority);
      renderedIndices.add(wrappedIndex);
      return;
    }

    setRenderedSlidePriority(slide, priority);
  }

  function hydrateSlidesAroundActiveIndex(slides, plansByIndex, renderedIndices, activeIndex) {
    if (!slides.length) {
      return;
    }

    renderSlideIfNeeded(slides, plansByIndex, renderedIndices, activeIndex, "active");
    renderSlideIfNeeded(slides, plansByIndex, renderedIndices, activeIndex + 1, "queued");
    renderSlideIfNeeded(slides, plansByIndex, renderedIndices, activeIndex - 1, "queued");
  }

  function setupPhotographyGallery() {
    const body = document.body;
    if (!body || !body.classList.contains(PAGE_CLASS)) {
      return;
    }

    const stage = document.querySelector("[data-hero]");
    if (!stage) {
      return;
    }

    const slides = Array.from(stage.querySelectorAll("[data-hero-slide]"));
    if (!slides.length) {
      return;
    }

    const plansBySlideIndex = new Map();
    const renderedIndices = new Set();

    slides.forEach((slide, slideIndex) => {
      const plan = readSlidePlan(slide);
      if (!plan) {
        return;
      }

      plansBySlideIndex.set(slideIndex, plan);
      if (slide.querySelector(".project-slide__media picture")) {
        renderedIndices.add(slideIndex);
      }
    });

    const activeIndex = getInitialActiveIndex(stage, slides);
    hydrateSlidesAroundActiveIndex(slides, plansBySlideIndex, renderedIndices, activeIndex);

    const previewImage = stage.querySelector("[data-hero-preview-image]");
    if (previewImage && slides.length > 1) {
      const nextSlide = slides[(activeIndex + 1) % slides.length];
      const shouldUsePortraitPreview = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
      const nextPreviewPath = shouldUsePortraitPreview
        ? getFirstSrcFromSrcset(nextSlide.getAttribute("data-photo-portrait-webp-srcset")) ||
          nextSlide.getAttribute("data-preview-image-mobile") ||
          nextSlide.getAttribute("data-preview-image")
        : getFirstSrcFromSrcset(nextSlide.getAttribute("data-photo-landscape-webp-srcset")) ||
          nextSlide.getAttribute("data-preview-image");
      if (nextPreviewPath) {
        previewImage.setAttribute("src", nextPreviewPath);
      }
      previewImage.hidden = false;
      previewImage.removeAttribute("aria-hidden");
      previewImage.loading = "eager";
      previewImage.decoding = "async";
      previewImage.fetchPriority = "high";
    }

    stage.addEventListener(HERO_SLIDE_CHANGE_EVENT, (event) => {
      const requestedIndex = Number(event.detail && event.detail.activeIndex);
      if (!Number.isFinite(requestedIndex)) {
        return;
      }

      hydrateSlidesAroundActiveIndex(slides, plansBySlideIndex, renderedIndices, requestedIndex);
    });
  }

  window.__pageImageSetupPromise = Promise.resolve().then(setupPhotographyGallery);
})();
