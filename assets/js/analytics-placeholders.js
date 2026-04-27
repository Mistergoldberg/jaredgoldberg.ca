(function () {
  "use strict";

  const measurementId = "G-ZRH4L4ENS0";
  const scrollMilestones = [25, 50, 75];
  const firedMilestones = new Set();
  const viewedSections = new Set();

  function ensureAnalytics() {
    if (window.__siteAnalyticsInitialized) {
      return;
    }

    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    if (typeof window.gtag !== "function") {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }

    window.gtag("js", new Date());
    window.gtag("config", measurementId);

    const existing = document.querySelector(
      'script[src="https://www.googletagmanager.com/gtag/js?id=' + measurementId + '"]'
    );

    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(script);
    }

    window.__siteAnalyticsInitialized = true;
  }

  function track(eventName, payload) {
    const eventPayload = payload || {};

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, eventPayload);
    }

    if (window.DEBUG_ANALYTICS) {
      // eslint-disable-next-line no-console
      console.info("[analytics-placeholder]", eventName, eventPayload);
    }
  }

  function bindScrollMilestones() {
    const eventByMilestone = {
      25: "scroll_25",
      50: "scroll_50",
      75: "scroll_75"
    };

    const onScroll = () => {
      const root = document.documentElement;
      const scrollableHeight = root.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        return;
      }

      const progress = (window.scrollY / scrollableHeight) * 100;

      scrollMilestones.forEach((milestone) => {
        if (progress >= milestone && !firedMilestones.has(milestone)) {
          firedMilestones.add(milestone);
          track(eventByMilestone[milestone], { percent_scrolled: milestone });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function bindSectionViews() {
    const sections = document.querySelectorAll("[data-track-section]");

    if (!sections.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      sections.forEach((section) => {
        const sectionName = section.getAttribute("data-track-section");
        if (sectionName) {
          track("section_view", { section_name: sectionName, observer: "fallback" });
        }
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const sectionName = entry.target.getAttribute("data-track-section");

          if (!sectionName || viewedSections.has(sectionName)) {
            return;
          }

          viewedSections.add(sectionName);
          track("section_view", { section_name: sectionName });
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -12% 0px"
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function bindMenuEvents() {
    document.addEventListener("site:menu_open", () => {
      track("menu_open", { source: "site_header" });
    });
  }

  function bindCTAEvents() {
    const trackedTargets = document.querySelectorAll("[data-track]");

    trackedTargets.forEach((target) => {
      target.addEventListener("click", () => {
        const eventName = target.getAttribute("data-track");

        if (!eventName) {
          return;
        }

        const parentSection = target.closest("[data-track-section]");
        track(eventName, {
          label: target.textContent ? target.textContent.trim() : "cta",
          section: parentSection ? parentSection.getAttribute("data-track-section") : "unknown"
        });
      });
    });
  }

  function init() {
    ensureAnalytics();
    bindScrollMilestones();
    bindSectionViews();
    bindMenuEvents();
    bindCTAEvents();
  }

  window.AnalyticsPlaceholder = {
    init,
    track
  };
})();
