(() => {
  const collapseHero = () => {
    const slider = document.querySelector('[data-home-hero]');
    if (!slider || slider.dataset.singleHeroApplied === 'true') return false;
    const slides = [...slider.querySelectorAll('[data-hero-slide]')];
    if (!slides.length) return false;

    slider.dispatchEvent(new MouseEvent('mouseenter'));
    slides.slice(1).forEach(slide => slide.remove());
    slides[0].classList.add('is-active');
    slides[0].style.opacity = '1';
    slides[0].style.visibility = 'visible';
    slides[0].style.pointerEvents = 'auto';
    slider.querySelector('.home-hero-dots')?.remove();
    slider.dataset.singleHeroApplied = 'true';
    slider.setAttribute('aria-label', '태평제지 메인 비주얼');
    return true;
  };

  if (collapseHero()) return;

  const observer = new MutationObserver(() => {
    if (!collapseHero()) return;
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();