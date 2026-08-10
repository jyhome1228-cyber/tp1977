(() => {
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
