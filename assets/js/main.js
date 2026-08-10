(() => {
  const isGithubPages = location.hostname.endsWith('github.io');
  const assetRoot = isGithubPages ? '/tp1977/' : '/';
  const cacheVersion = '20260810-1442';

  let cleanCss = document.querySelector('link[data-brand-clean]');
  if (!cleanCss) {
    cleanCss = document.createElement('link');
    cleanCss.rel = 'stylesheet';
    cleanCss.dataset.brandClean = 'true';
    document.head.appendChild(cleanCss);
  }
  cleanCss.href = `${assetRoot}assets/css/brand-clean.css?v=${cacheVersion}`;

  const brand = document.querySelector('.site-header .brand');
  if (brand) {
    brand.classList.add('brand-image');
    brand.classList.remove('logo-fallback');
    let logoImg = brand.querySelector('img');
    if (!logoImg) {
      brand.innerHTML = '<img alt="태평제지 Taepyung Since 1977">';
      logoImg = brand.querySelector('img');
    }
    logoImg.src = `${assetRoot}assets/images/logo-taepyung.svg?v=${cacheVersion}`;
    logoImg.onerror = () => {
      brand.classList.add('logo-fallback');
      logoImg.remove();
    };
  }

  const companyInfo = document.querySelector('.company-info');
  if (companyInfo) {
    const items = companyInfo.children;
    if (items[0]) items[0].textContent = '태평제지(주)';
    if (items[1]) items[1].textContent = '대표이사: 이정욱';
    if (items[2]) items[2].textContent = '소재지: 경기도 이천시 마장면 마도로 223번길 22';
    if (items[3]) items[3].textContent = '전화: 031-595-0797';
    if (items[4]) items[4].textContent = '팩스번호: 031-632-4016';
    if (items[5]) items[5].textContent = '전자우편: contact@blondy.co.kr';
    if (items[6]) items[6].textContent = '사업자등록번호: 132-81-58657';
  }

  document.querySelectorAll('.hero-orbit, .brand-symbol').forEach((element) => element.remove());

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  let lastY = window.scrollY;

  const closeMenu = () => {
    if (!header || !menuButton) return;
    header.classList.remove('menu-active');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
    document.body.classList.remove('menu-open');
  };

  if (header) {
    const syncHeader = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 20);
      if (!header.classList.contains('menu-active') && y > 240) {
        header.classList.toggle('is-hidden', y > lastY && y - lastY > 2);
      } else {
        header.classList.remove('is-hidden');
      }
      lastY = y;
    };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  if (menuButton && header) {
    menuButton.addEventListener('click', () => {
      const opened = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!opened));
      menuButton.setAttribute('aria-label', opened ? '메뉴 열기' : '메뉴 닫기');
      header.classList.toggle('menu-active', !opened);
      document.body.classList.toggle('menu-open', !opened);
    });
  }

  if (mobilePanel) {
    mobilePanel.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) closeMenu();
  });

  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      observer.observe(element);
    });
  } else {
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  document.querySelectorAll('.mobile-nav details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      document.querySelectorAll('.mobile-nav details').forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });
})();
