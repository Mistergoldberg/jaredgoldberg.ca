const measurementId = 'G-ZRH4L4ENS0';

function ensureAnalytics(){
  if (window.__siteAnalyticsInitialized) return;

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(){
      window.dataLayer.push(arguments);
    };
  }

  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const existing = document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`);
  if (!existing) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  window.__siteAnalyticsInitialized = true;
}

function trackAnalytics(eventName, payload){
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, payload || {});
}

function getMenuElements(){
  const menu = document.getElementById('side-menu');
  const trigger = document.querySelector('.menu-icon');
  return { menu, trigger };
}

function syncMenuA11yState(){
  const { menu, trigger } = getMenuElements();
  if (!menu) return;

  const isOpen = menu.classList.contains('open');
  menu.setAttribute('aria-hidden', String(!isOpen));
  document.documentElement.classList.toggle('menu-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);

  if (trigger) {
    trigger.setAttribute('aria-expanded', String(isOpen));
    trigger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }
}

function openMenu(){
  const { menu } = getMenuElements();
  if (!menu) return;
  const menuLinks = menu.querySelector('.menu-links');
  if (menuLinks instanceof HTMLElement) {
    menuLinks.scrollTop = 0;
  }
  menu.classList.add('open');
  syncMenuA11yState();
  trackAnalytics('menu_open', { source: 'essays_header' });

  const closeButton = menu.querySelector('.close-icon');
  if (closeButton instanceof HTMLElement) {
    closeButton.focus();
  }
}

function closeMenu(){
  const { menu, trigger } = getMenuElements();
  if (!menu) return;
  menu.classList.remove('open');
  syncMenuA11yState();

  if (trigger instanceof HTMLElement) {
    trigger.focus();
  }
}

function toggleMenu(){
  const { menu } = getMenuElements();
  if (!menu) return;

  if (menu.classList.contains('open')) {
    closeMenu();
  } else {
    openMenu();
  }
}

function normalizePathname(pathname){
  return pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
}

function resolveSiteRoot(menuLinks){
  const homeLink = Array.from(menuLinks.querySelectorAll('a')).find((link) => link.textContent.trim() === 'Home');
  if (!homeLink) return new URL('./', window.location.href);

  const href = homeLink.getAttribute('href') || 'index.html';
  const homeUrl = new URL(href, window.location.href);

  if (homeUrl.pathname.endsWith('/index.html')) {
    return new URL('./', homeUrl);
  }

  return homeUrl.pathname.endsWith('/') ? homeUrl : new URL('./', homeUrl);
}

function resolveSiteHref(siteRoot, path){
  return new URL(path, siteRoot).href;
}

function isCurrentLink(href){
  try {
    const targetPath = normalizePathname(new URL(href, window.location.href).pathname);
    const currentPath = normalizePathname(window.location.pathname);
    return targetPath === currentPath;
  } catch {
    return false;
  }
}

function appendMenuLink(parent, label, href, className){
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  link.className = className;
  if (isCurrentLink(href)) {
    link.classList.add('is-current');
    return { link, isCurrent: true };
  }
  return { link, isCurrent: false };
}

function buildHierarchicalMenu(){
  const menuLinks = document.querySelector('#side-menu .menu-links');
  if (!menuLinks || menuLinks.dataset.enhanced === 'true') return;

  const siteRoot = resolveSiteRoot(menuLinks);
  const href = (path) => resolveSiteHref(siteRoot, path);
  const menuTree = [
    { label: 'Home', href: href('index.html'), className: 'menu-top-link' },
    { label: '👤 About', href: href('about/index.html'), className: 'menu-top-link' },
    {
      label: '🛠️ Work',
      children: [
        { label: 'Loblaw', href: href('work/loblaw.html') },
        { label: 'Walmart', href: href('work/walmart.html') },
        { label: 'Canadian Tire', href: href('work/canadian-tire.html') },
        { label: 'China', href: href('work/china.html') },
      ],
    },
    {
      label: '🧠 Writing',
      children: [
        { label: 'What Do the Wealthy, the Sun, and Popular Kids Have in Common?', href: href('writing/what-do-the-wealthy/index.html') },
        { label: 'Baseball Bats and Dominance Hierarchies', href: href('writing/baseball-bats/index.html') },
        { label: 'Why the Medium Is the Message', href: href('writing/medium-is-the-message/index.html') },
        { label: 'We Behave Like Ants: Feedback Loops and Collective Failure', href: href('writing/we-behave-like-ants/index.html') },
        { label: 'What Does It All Mean?', href: href('writing/what-does-it-all-mean/index.html') },
        { label: 'If Luck Is Structural, What Do We Teach Our Kids?', href: href('writing/if-luck-is-structural/index.html') },
        { label: 'Civic Design Failure: Why We Teach Money Too Late', href: href('writing/civic-design-failure/index.html') },
        { label: 'Compounding Bad Luck Is Expensive for You Too', href: href('writing/compounding-bad-luck/index.html') },
        { label: 'What Real Systems Taught Me About Incentives', href: href('writing/real-systems-incentives/index.html') },
        { label: 'This Summer, We\'re Building Infrastructure', href: href('writing/building-infrastructure/index.html') },
        { label: 'The Misaligned Compass', href: href('writing/the-misaligned-compass/index.html') },
        { label: 'Debt, Slavery, and the Treasury', href: href('writing/debt-slavery-treasury/index.html') },
        { label: 'Why Roman Law Still Runs the World', href: href('writing/why-roman-law-still-runs-the-world/index.html') },
        { label: 'AI: This Isn\'t About Us', href: href('writing/ai-is-not-about-us/index.html') },
      ],
    },
    {
      label: '💰 Projects',
      children: [
        { label: 'The Money Club', href: href('projects/the-money-club/index.html') },
        { label: 'Capital Works', href: href('projects/capital-works/index.html') },
      ],
    },
    { label: 'Contact', href: href('contact/index.html'), className: 'menu-footer-link' },
  ];

  menuLinks.innerHTML = '';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close-icon';
  close.setAttribute('aria-label', 'Close menu');
  close.textContent = '✕';
  menuLinks.appendChild(close);

  menuTree.forEach((entry) => {
    if (!entry.children) {
      const { link } = appendMenuLink(menuLinks, entry.label, entry.href, entry.className || 'menu-top-link');
      menuLinks.appendChild(link);
      return;
    }

    const details = document.createElement('details');
    details.className = 'menu-tree';

    const summary = document.createElement('summary');
    summary.textContent = entry.label;
    details.appendChild(summary);

    const childList = document.createElement('div');
    childList.className = 'menu-tree-links';

    let containsCurrentPage = false;
    entry.children.forEach((child) => {
      const { link, isCurrent } = appendMenuLink(childList, child.label, child.href, 'menu-leaf-link');
      childList.appendChild(link);
      if (isCurrent) containsCurrentPage = true;
    });

    details.appendChild(childList);
    if (containsCurrentPage) details.open = true;
    menuLinks.appendChild(details);
  });

  menuLinks.dataset.enhanced = 'true';
}

function enhanceDesktopSidebar(){
  const sidebar = document.querySelector('.wiki-sidebar');
  if (!sidebar) return;

  let currentLink = null;
  sidebar.querySelectorAll('a[href]').forEach((link) => {
    if (!isCurrentLink(link.getAttribute('href'))) return;
    link.classList.add('is-current');
    link.setAttribute('aria-current', 'page');
    currentLink = link;
  });

  sidebar.querySelectorAll('details.toc-group').forEach((details) => {
    if (!details.querySelector('.is-current')) return;
    details.open = true;
    details.classList.add('contains-current');
  });

  if (currentLink && window.matchMedia('(min-width: 1024px)').matches) {
    window.requestAnimationFrame(() => {
      currentLink.scrollIntoView({ block: 'nearest' });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ensureAnalytics();
  buildHierarchicalMenu();
  enhanceDesktopSidebar();
  syncMenuA11yState();

  document.querySelectorAll('[data-track]').forEach((target) => {
    target.addEventListener('click', () => {
      const eventName = target.getAttribute('data-track');
      if (!eventName) return;

      trackAnalytics(eventName, {
        label: target.textContent ? target.textContent.trim() : 'cta',
      });
    });
  });
});

// Close menu with ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
  }
});

// Close menu by clicking outside the links (the dark backdrop)
document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;

  const trigger = e.target.closest('.menu-icon');
  if (trigger) {
    toggleMenu();
    return;
  }

  const closeButton = e.target.closest('.close-icon');
  if (closeButton) {
    closeMenu();
    return;
  }

  const menu = document.getElementById('side-menu');
  if (!menu) return;
  if (menu.classList.contains('open') && e.target === menu) {
    closeMenu();
  }
});
