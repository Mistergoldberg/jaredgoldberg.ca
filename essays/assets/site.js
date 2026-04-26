const measurementId = 'G-M5T0TD6Z6G';

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
  return pathname.replace(/\/+$/, '');
}

function resolveMenuPrefix(menuLinks){
  const homeLink = Array.from(menuLinks.querySelectorAll('a')).find((link) => link.textContent.trim() === 'Home');
  if (!homeLink) return '';
  const href = homeLink.getAttribute('href') || 'index.html';
  return href.endsWith('index.html') ? href.slice(0, -'index.html'.length) : '';
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

  const prefix = resolveMenuPrefix(menuLinks);
  const menuTree = [
    { label: 'Home', href: `${prefix}../index.html`, className: 'menu-top-link' },
    { label: '👤 About', href: `${prefix}index.html`, className: 'menu-top-link' },
    {
      label: '🛠️ Work',
      children: [
        { label: 'Loblaw', href: `${prefix}systems/loblaw.html` },
        { label: 'Walmart', href: `${prefix}systems/walmart.html` },
        { label: 'Canadian Tire', href: `${prefix}systems/canadian-tire.html` },
        { label: 'China', href: `${prefix}systems/china.html` },
      ],
    },
    {
      label: '🧠 Writing',
      children: [
        { label: 'What Do the Wealthy, the Sun, and Popular Kids Have in Common?', href: `${prefix}writing/what-do-the-wealthy.html` },
        { label: 'Baseball Bats and Dominance Hierarchies', href: `${prefix}writing/baseball-bats.html` },
        { label: 'Why the Medium Is the Message', href: `${prefix}writing/medium-is-the-message.html` },
        { label: 'We Behave Like Ants: Feedback Loops and Collective Failure', href: `${prefix}writing/we-behave-like-ants.html` },
        { label: 'What Does It All Mean?', href: `${prefix}writing/what-does-it-all-mean.html` },
        { label: 'If Luck Is Structural, What Do We Teach Our Kids?', href: `${prefix}writing/if-luck-is-structural.html` },
        { label: 'Civic Design Failure: Why We Teach Money Too Late', href: `${prefix}writing/civic-design-failure.html` },
        { label: 'Compounding Bad Luck Is Expensive for You Too', href: `${prefix}writing/compounding-bad-luck.html` },
        { label: 'What Real Systems Taught Me About Incentives', href: `${prefix}writing/real-systems-incentives.html` },
        { label: 'This Summer, We\'re Building Infrastructure', href: `${prefix}writing/building-infrastructure.html` },
        { label: 'The Misaligned Compass', href: `${prefix}writing/the-misaligned-compass.html` },
        { label: 'Debt, Slavery, and the Treasury', href: `${prefix}writing/debt-slavery-treasury.html` },
        { label: 'Why Roman Law Still Runs the World (coming)', href: `${prefix}writing/why-roman-law-still-runs-the-world.html` },
      ],
    },
    {
      label: '💰 Projects',
      children: [
        { label: 'The Money Club', href: `${prefix}community/the-money-club.html` },
        { label: 'Capital Works', href: `${prefix}community/capital-works.html` },
      ],
    },
    { label: 'Contact', href: `${prefix}dm.html`, className: 'menu-footer-link' },
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

document.addEventListener('DOMContentLoaded', () => {
  ensureAnalytics();
  buildHierarchicalMenu();
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
