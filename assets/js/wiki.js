const measurementId = 'G-ZRH4L4ENS0';

const fieldGuideArcs = [
  {
    label: '⚙️ Arc I — The External Machine',
    children: [
      { label: 'What Do the Wealthy, the Sun, and Popular Kids Have in Common?', hrefPath: 'writing/what-do-the-wealthy/' },
      { label: 'Baseball Bats and Dominance Hierarchies', hrefPath: 'writing/baseball-bats/' },
      { label: 'Why the Medium Is the Message', hrefPath: 'writing/medium-is-the-message/' },
      { label: 'We Behave Like Ants: Feedback Loops and Collective Failure', hrefPath: 'writing/we-behave-like-ants/' },
      { label: 'What Does It All Mean?', hrefPath: 'writing/what-does-it-all-mean/' },
    ],
  },
  {
    label: '🏗️ Arc II — The Civic Response',
    children: [
      { label: 'If Luck Is Structural, What Do We Teach Our Kids?', hrefPath: 'writing/if-luck-is-structural/' },
      { label: 'Civic Design Failure: Why We Teach Money Too Late', hrefPath: 'writing/civic-design-failure/' },
      { label: 'Compounding Bad Luck Is Expensive for You Too', hrefPath: 'writing/compounding-bad-luck/' },
      { label: 'What Real Systems Taught Me About Incentives', hrefPath: 'writing/real-systems-incentives/' },
      { label: 'This Summer, We\'re Building Infrastructure', hrefPath: 'writing/building-infrastructure/' },
    ],
  },
  {
    label: '🧠 Arc III — The Human Engine',
    children: [
      { label: 'The Misaligned Compass', hrefPath: 'writing/the-misaligned-compass/' },
      { label: 'Debt, Slavery, and the Treasury', hrefPath: 'writing/debt-slavery-treasury/' },
      { label: 'Why Roman Law Still Runs the World', hrefPath: 'writing/why-roman-law-still-runs-the-world/' },
    ],
  },
  {
    label: '🧠 Arc IV — Education as Infrastructure',
    children: [
      { label: 'AI: This Isn\'t About Us', hrefPath: 'writing/ai-is-not-about-us/' },
    ],
  },
];

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
  const homeLink = Array.from(menuLinks.querySelectorAll('a')).find((link) => link.textContent.trim().includes('Home'));
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

function getMenuTree(siteRoot){
  const href = (path) => resolveSiteHref(siteRoot, path);
  const withHrefs = (entries) => entries.map((entry) => {
    const mapped = { ...entry };
    if (mapped.hrefPath) {
      mapped.href = href(mapped.hrefPath);
      delete mapped.hrefPath;
    }
    if (mapped.children) {
      mapped.children = withHrefs(mapped.children);
    }
    return mapped;
  });

  return [
    { label: 'Home', icon: '🏠', href: href('index.html'), className: 'menu-top-link' },
    { label: 'About', icon: '👤', href: href('about/index.html'), className: 'menu-top-link' },
    {
      label: 'Field Guide',
      icon: '🧭',
      children: [
        { label: 'Start Here', href: href('writing/') },
        ...withHrefs(fieldGuideArcs),
      ],
    },
    {
      label: 'Projects',
      icon: '💰',
      children: [
        { label: 'The Money Club', href: href('projects/the-money-club/') },
        { label: 'Capability Works', href: href('projects/capital-works/') },
      ],
    },
    {
      label: 'Work',
      icon: '🛠️',
      children: [
        { label: 'Selected Work', href: href('work/index.html') },
        { label: 'Loblaw', href: href('work/loblaw.html') },
        { label: 'Walmart', href: href('work/walmart.html') },
        { label: 'Canadian Tire', href: href('work/canadian-tire.html') },
        { label: 'China', href: href('work/china.html') },
      ],
    },
    { label: 'Contact', icon: '✉️', href: href('contact/index.html'), className: 'menu-footer-link' },
  ];
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
    link.setAttribute('aria-current', 'page');
    return { link, isCurrent: true };
  }
  return { link, isCurrent: false };
}

function getEntryLabel(entry){
  return entry.icon ? `${entry.icon} ${entry.label}` : entry.label;
}

function buildHierarchicalMenu(){
  const menuLinks = document.querySelector('#side-menu .menu-links');
  if (!menuLinks || menuLinks.dataset.enhanced === 'true') return;

  const siteRoot = resolveSiteRoot(menuLinks);
  const menuTree = getMenuTree(siteRoot);

  menuLinks.innerHTML = '';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close-icon';
  close.setAttribute('aria-label', 'Close menu');
  close.textContent = '✕';
  menuLinks.appendChild(close);

  function appendEntry(parent, entry, depth){
    if (!entry.children) {
      const defaultClass = depth === 0 ? 'menu-top-link' : 'menu-leaf-link';
      const { link, isCurrent } = appendMenuLink(parent, getEntryLabel(entry), entry.href, entry.className || defaultClass);
      if (depth > 1) link.classList.add('menu-leaf-link--nested');
      parent.appendChild(link);
      return isCurrent;
    }

    const details = document.createElement('details');
    details.className = 'menu-tree';
    if (depth > 0) details.classList.add('menu-tree--nested');

    const summary = document.createElement('summary');
    summary.textContent = getEntryLabel(entry);
    details.appendChild(summary);

    const childList = document.createElement('div');
    childList.className = 'menu-tree-links';

    let containsCurrentPage = false;
    entry.children.forEach((child) => {
      const isCurrent = appendEntry(childList, child, depth + 1);
      if (isCurrent) containsCurrentPage = true;
    });

    details.appendChild(childList);
    if (containsCurrentPage) {
      details.open = true;
      details.classList.add('contains-current');
    }
    parent.appendChild(details);
    return containsCurrentPage;
  }

  menuTree.forEach((entry) => appendEntry(menuLinks, entry, 0));

  menuLinks.dataset.enhanced = 'true';
}

function buildDesktopSidebar(){
  const sidebarList = document.querySelector('.wiki-sidebar .toc-list');
  const menuLinks = document.querySelector('#side-menu .menu-links');
  if (!sidebarList || !menuLinks || sidebarList.dataset.enhanced === 'true') return;

  const siteRoot = resolveSiteRoot(menuLinks);
  const menuTree = getMenuTree(siteRoot);
  sidebarList.innerHTML = '';

  function createLink(entry, className){
    const link = document.createElement('a');
    link.href = entry.href;
    link.className = className;

    if (entry.icon) {
      const icon = document.createElement('span');
      icon.className = 'toc-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = entry.icon;
      link.appendChild(icon);
    }

    const label = document.createElement('span');
    label.textContent = entry.label;
    link.appendChild(label);

    if (isCurrentLink(entry.href)) {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }

    return link;
  }

  function appendEntry(parent, entry, depth){
    const item = document.createElement('li');

    if (!entry.children) {
      item.appendChild(createLink(entry, depth === 0 ? 'toc-group-link' : ''));
      parent.appendChild(item);
      return item.querySelector('.is-current') !== null;
    }

    const details = document.createElement('details');
    details.className = 'toc-group';
    if (depth > 0) details.classList.add('toc-group--nested');

    const summary = document.createElement('summary');
    if (entry.icon) {
      const icon = document.createElement('span');
      icon.className = 'toc-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = entry.icon;
      summary.appendChild(icon);
    }
    const label = document.createElement('span');
    label.textContent = entry.label;
    summary.appendChild(label);
    details.appendChild(summary);

    const childList = document.createElement('ul');
    childList.className = 'toc-sublist';
    if (depth > 0) childList.classList.add('toc-sublist--nested');

    let containsCurrentPage = false;
    entry.children.forEach((child) => {
      if (appendEntry(childList, child, depth + 1)) {
        containsCurrentPage = true;
      }
    });

    details.appendChild(childList);
    if (containsCurrentPage) {
      details.open = true;
      details.classList.add('contains-current');
    }

    item.appendChild(details);
    parent.appendChild(item);
    return containsCurrentPage;
  }

  menuTree.forEach((entry) => appendEntry(sidebarList, entry, 0));
  sidebarList.dataset.enhanced = 'true';
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
  buildDesktopSidebar();
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
