(() => {
  const root = document.querySelector('.company-infographic-page');
  if (!root) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    document.querySelectorAll('.story-era, .vision-block').forEach((el) => el.classList.add('is-inview'));
    return;
  }

  root.classList.add('company-motion');

  const targets = [...document.querySelectorAll('.story-era, .vision-block')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-inview');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -10% 0px'
  });

  targets.forEach((target) => observer.observe(target));

  const subHero = document.querySelector('.sub-hero .wrap');
  if (subHero) {
    subHero.animate([
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 650,
      easing: 'cubic-bezier(.2,.7,.2,1)',
      fill: 'both'
    });
  }
})();
