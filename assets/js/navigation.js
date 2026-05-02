(function () {
  "use strict";

  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        "a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )
    ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
  }

  function init() {
    const panel = document.querySelector("[data-menu-panel]");
    const sheet = panel ? panel.querySelector(".menu-panel__sheet") : null;
    const nav = sheet ? sheet.querySelector(".menu-panel__nav") : null;
    const toggle = document.querySelector("[data-menu-toggle]");

    if (!panel || !sheet || !toggle) {
      return;
    }

    const closeTargets = panel.querySelectorAll("[data-menu-close]");
    let previouslyFocused = null;
    let lockedScrollY = 0;
    let menuTouchStartX = null;
    let menuTouchStartY = null;
    let menuTouchLastX = null;
    let menuTouchLastY = null;
    let menuGestureIntent = null;

    sheet.setAttribute("tabindex", "-1");

    const isOpen = () => panel.classList.contains("is-open");
    const resetMenuTouchState = () => {
      menuTouchStartX = null;
      menuTouchStartY = null;
      menuTouchLastX = null;
      menuTouchLastY = null;
      menuGestureIntent = null;
    };

    const lockPageScroll = () => {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add("is-scroll-locked");
      document.body.classList.add("is-scroll-locked");
      document.body.style.top = "-" + lockedScrollY + "px";
    };

    const unlockPageScroll = () => {
      document.documentElement.classList.remove("is-scroll-locked");
      document.body.classList.remove("is-scroll-locked");
      document.body.style.top = "";
      window.scrollTo({
        top: lockedScrollY,
        left: 0,
        behavior: "auto"
      });
    };

    const onPanelTouchStart = (event) => {
      if (!isOpen() || !event.touches || event.touches.length !== 1) {
        return;
      }

      menuTouchStartX = event.touches[0].clientX;
      menuTouchStartY = event.touches[0].clientY;
      menuTouchLastX = menuTouchStartX;
      menuTouchLastY = menuTouchStartY;
      menuGestureIntent = null;
    };

    const onPanelTouchMove = (event) => {
      if (!isOpen() || !event.touches || event.touches.length !== 1) {
        return;
      }

      if (!(nav instanceof HTMLElement) || !(event.target instanceof Element) || !nav.contains(event.target)) {
        event.preventDefault();
        return;
      }

      const touch = event.touches[0];
      if (menuTouchStartX === null || menuTouchStartY === null) {
        menuTouchStartX = touch.clientX;
        menuTouchStartY = touch.clientY;
        menuTouchLastX = touch.clientX;
        menuTouchLastY = touch.clientY;
      }

      const deltaFromStartX = touch.clientX - menuTouchStartX;
      const deltaFromStartY = touch.clientY - menuTouchStartY;
      const deltaStepY = touch.clientY - (menuTouchLastY === null ? menuTouchStartY : menuTouchLastY);
      menuTouchLastX = touch.clientX;
      menuTouchLastY = touch.clientY;

      if (menuGestureIntent === null) {
        const absX = Math.abs(deltaFromStartX);
        const absY = Math.abs(deltaFromStartY);

        if (absX < 6 && absY < 6) {
          return;
        }

        if (absX > absY * 1.2) {
          menuGestureIntent = "blocked";
        } else {
          menuGestureIntent = "vertical";
        }
      }

      if (menuGestureIntent === "blocked") {
        event.preventDefault();
        return;
      }

      const maxScrollTop = Math.max(0, nav.scrollHeight - nav.clientHeight);
      if (maxScrollTop <= 0) {
        event.preventDefault();
        return;
      }

      const atTop = nav.scrollTop <= 0;
      const atBottom = nav.scrollTop >= maxScrollTop - 1;

      if ((atTop && deltaStepY > 0) || (atBottom && deltaStepY < 0)) {
        event.preventDefault();
      }
    };

    const openMenu = () => {
      if (isOpen()) {
        return;
      }

      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-menu-open");
      lockPageScroll();
      document.dispatchEvent(new CustomEvent("site:menu_open"));

      if (nav instanceof HTMLElement) {
        nav.scrollTop = 0;
      }

      const focusable = getFocusableElements(sheet);
      if (focusable.length) {
        focusable[0].focus();
      } else {
        sheet.focus();
      }
    };

    const closeMenu = () => {
      if (!isOpen()) {
        return;
      }

      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-menu-open");
      unlockPageScroll();
      resetMenuTouchState();

      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };

    toggle.addEventListener("click", () => {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeTargets.forEach((target) => {
      target.addEventListener("click", closeMenu);
    });

    panel.addEventListener("touchstart", onPanelTouchStart, { passive: true, capture: true });
    panel.addEventListener("touchmove", onPanelTouchMove, { passive: false, capture: true });
    panel.addEventListener("touchend", resetMenuTouchState, { passive: true, capture: true });
    panel.addEventListener("touchcancel", resetMenuTouchState, { passive: true, capture: true });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (!isOpen()) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(sheet);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && !isOpen()) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  window.SiteNavigation = {
    init
  };
})();
