(() => {
  const root = location.hostname.endsWith('github.io') ? '/tp1977/' : '/';
  let path = location.pathname.replace(/^\/tp1977(?=\/|$)/, '').replace(/\/index\.html$/, '/');
  if (!path) path = '/';
  if (!path.endsWith('/')) path += '/';
  const isCompany = path.startsWith('/company/');
  const isProduct = path.startsWith('/product/');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const productCategories = [
    ['/product/', '전체'],
    ['/product/roll/', '두루마리 화장지'],
    ['/product/jumbo-roll/', '점보롤 화장지'],
    ['/product/hand-towel/', '페이퍼타월'],
    ['/product/kitchen-towel/', '키친타월'],
    ['/product/facial-tissue/', '미용티슈'],
    ['/product/etc/', '물티슈 · 디스펜서']
  ];

  const removeLegacy = () => {
    document.querySelectorAll('.product-source-extra,.page-media-section').forEach(el => el.remove());
    document.querySelectorAll('[class*="product-source-extra"]').forEach(el => el.remove());
  };

  const ensureProductCategoryNav = () => {
    if (!isProduct || path === '/product/' || document.querySelector('.product-category-switch')) return false;
    const section = document.querySelector('.product-catalog-section');
    if (!section) return false;

    const nav = document.createElement('nav');
    nav.className = 'product-category-switch';
    nav.setAttribute('aria-label', '제품 카테고리');
    nav.innerHTML = `
      <div class="wrap">
        <div class="product-category-switch__scroll">
          ${productCategories.map(([route, label]) => {
            const active = route === path;
            return `<a href="${root}${route.replace(/^\//,'')}" class="${active ? 'is-active' : ''}" ${active ? 'aria-current="page"' : ''}>${label}</a>`;
          }).join('')}
        </div>
      </div>`;
    section.insertAdjacentElement('beforebegin', nav);
    return true;
  };

  const enhanceCompanyGallery = () => {
    if (!isCompany) return false;
    const gallery = document.querySelector('.source-image-gallery:not(.is-company-carousel)');
    if (!gallery) return false;
    const images = [...gallery.querySelectorAll('img')].map(img => ({ src: img.currentSrc || img.src, alt: img.alt || '' })).filter(x => x.src);
    if (!images.length) return false;

    gallery.classList.add('is-company-carousel');
    const wrap = gallery.querySelector('.wrap') || gallery;
    const pageTitle = document.querySelector('.sub-hero h1')?.textContent?.trim() || 'Company';
    const cover = path === '/company/story/';

    wrap.innerHTML = `
      <div class="wrap company-carousel-section">
        <div class="company-carousel" data-company-carousel>
          <div class="company-carousel__head">
            <span class="company-carousel__label">${pageTitle} · Visual</span>
            ${images.length > 1 ? `<div class="company-carousel__controls"><button class="company-carousel__button" type="button" data-company-prev aria-label="이전 이미지">←</button><button class="company-carousel__button" type="button" data-company-next aria-label="다음 이미지">→</button></div>` : ''}
          </div>
          <div class="company-carousel__viewport">
            <div class="company-carousel__track" data-company-track>
              ${images.map((image,index)=>`<figure class="company-carousel__slide ${cover ? 'is-cover' : ''}" data-company-slide="${index}"><img src="${image.src}" alt="${image.alt}" loading="${index===0?'eager':'lazy'}" decoding="async"></figure>`).join('')}
            </div>
          </div>
          ${images.length > 1 ? `<div class="company-carousel__dots">${images.map((_,index)=>`<button type="button" class="company-carousel__dot ${index===0?'is-active':''}" data-company-dot="${index}" aria-label="${index+1}번 이미지 보기"></button>`).join('')}</div>` : ''}
        </div>
      </div>`;

    if (images.length <= 1) return true;
    const carousel = gallery.querySelector('[data-company-carousel]');
    const track = carousel.querySelector('[data-company-track]');
    const dots = [...carousel.querySelectorAll('[data-company-dot]')];
    const prev = carousel.querySelector('[data-company-prev]');
    const next = carousel.querySelector('[data-company-next]');
    let index = 0;
    let timer;
    const go = value => {
      index = (value + images.length) % images.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot,i)=>dot.classList.toggle('is-active', i===index));
    };
    const start = () => {
      clearInterval(timer);
      if (!reducedMotion) timer = setInterval(()=>go(index+1), 4500);
    };
    prev?.addEventListener('click',()=>{go(index-1);start();});
    next?.addEventListener('click',()=>{go(index+1);start();});
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{go(i);start();}));
    carousel.addEventListener('mouseenter',()=>clearInterval(timer));
    carousel.addEventListener('mouseleave',start);
    start();
    return true;
  };

  const ensureModal = () => {
    let modal = document.querySelector('[data-product-modal]');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'product-modal';
    modal.dataset.productModal = 'true';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
      <div class="product-modal__backdrop" data-product-modal-close></div>
      <div class="product-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <button type="button" class="product-modal__close" data-product-modal-close aria-label="닫기">×</button>
        <div class="product-modal__grid">
          <div class="product-modal__visual"><img data-product-modal-image alt=""></div>
          <div class="product-modal__content">
            <span class="product-modal__eyebrow">TAEPYUNG PAPER · PRODUCT</span>
            <h2 id="product-modal-title" class="product-modal__title" data-product-modal-title></h2>
            <ul class="product-modal__specs" data-product-modal-specs></ul>
            <p class="product-modal__note" data-product-modal-note hidden></p>
            <div class="product-modal__actions">
              <a class="product-modal__inquiry" data-product-modal-inquiry href="${root}contact/">제품 문의하기 →</a>
              <button type="button" class="product-modal__close-link" data-product-modal-close>닫기</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  };

  const specRow = line => {
    const text = line.trim();
    const colon = text.indexOf(':');
    if (colon > -1) return [text.slice(0,colon).trim(), text.slice(colon+1).trim()];
    if (/친환경|온라인|인증|전용/.test(text)) return ['비고', text.replace(/^\(|\)$/g,'')];
    return ['제품정보', text];
  };

  const enhanceProductCards = () => {
    if (!isProduct) return false;
    const items = [...document.querySelectorAll('.product-item:not(.is-detail-ready)')];
    if (!items.length) return false;
    const modal = ensureModal();
    const imageEl = modal.querySelector('[data-product-modal-image]');
    const titleEl = modal.querySelector('[data-product-modal-title]');
    const specsEl = modal.querySelector('[data-product-modal-specs]');
    const noteEl = modal.querySelector('[data-product-modal-note]');
    const inquiry = modal.querySelector('[data-product-modal-inquiry]');
    const closeButton = modal.querySelector('.product-modal__close');
    let lastFocus = null;

    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('product-modal-open');
      lastFocus?.focus?.();
    };
    const open = item => {
      lastFocus = item;
      const title = item.querySelector('.product-info h2,.product-info h3')?.textContent?.trim() || '제품';
      const image = item.querySelector('.product-thumb img');
      const lines = [...item.querySelectorAll('.product-spec')].map(el=>el.textContent.trim()).filter(Boolean);
      const specs = lines.map(specRow);
      titleEl.textContent = title;
      imageEl.src = image?.currentSrc || image?.src || '';
      imageEl.alt = title;
      specsEl.innerHTML = specs.filter(([label])=>label!=='비고').map(([label,value])=>`<li><strong>${label}</strong><span>${value}</span></li>`).join('');
      const notes = specs.filter(([label])=>label==='비고').map(([,value])=>value);
      if (notes.length) { noteEl.hidden = false; noteEl.textContent = notes.join(' · '); }
      else { noteEl.hidden = true; noteEl.textContent = ''; }
      inquiry.href = `${root}contact/?product=${encodeURIComponent(title)}`;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('product-modal-open');
      requestAnimationFrame(()=>closeButton?.focus());
    };

    if (!modal.dataset.bound) {
      modal.querySelectorAll('[data-product-modal-close]').forEach(el=>el.addEventListener('click',close));
      document.addEventListener('keydown',event=>{ if (event.key === 'Escape' && modal.classList.contains('is-open')) close(); });
      modal.dataset.bound = 'true';
    }

    items.forEach(item => {
      item.classList.add('is-detail-ready');
      item.setAttribute('role','button');
      item.setAttribute('tabindex','0');
      item.setAttribute('aria-label',`${item.querySelector('h2,h3')?.textContent?.trim() || '제품'} 상세 보기`);
      if (!item.querySelector('.product-detail-hint')) {
        const info = item.querySelector('.product-info');
        info?.insertAdjacentHTML('beforeend','<span class="product-detail-hint">제품 자세히 보기</span>');
      }
      item.addEventListener('click',event=>{
        if (event.target.closest('a,button')) return;
        open(item);
      });
      item.addEventListener('keydown',event=>{
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(item); }
      });
    });
    return true;
  };

  const hideBrokenImages = () => {
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.errorBound) return;
      img.dataset.errorBound = 'true';
      img.addEventListener('error',()=>{
        const frame = img.closest('.source-image-gallery__item,.company-carousel__slide,.product-thumb,.home-product-image');
        if (frame) frame.style.display = 'none';
      });
    });
  };

  const run = () => {
    removeLegacy();
    ensureProductCategoryNav();
    enhanceCompanyGallery();
    enhanceProductCards();
    hideBrokenImages();
  };

  run();
  const observer = new MutationObserver(()=>run());
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
