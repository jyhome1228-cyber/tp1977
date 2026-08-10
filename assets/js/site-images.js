(() => {
  const root = location.hostname.endsWith('github.io') ? '/tp1977/' : '/';
  let path = location.pathname.replace(/^\/tp1977(?=\/|$)/, '').replace(/\/index\.html$/, '/');
  if (!path) path = '/';
  if (!path.endsWith('/')) path += '/';

  const img = (src, alt, eager = false) => `<img src="${src}" alt="${alt}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer">`;

  const ensureCss = () => {
    let link = document.querySelector('link[data-site-images]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.siteImages = 'true';
      document.head.appendChild(link);
    }
    link.href = `${root}assets/css/site-images.css?v=20260810-1815`;
  };

  const preconnect = () => {
    if (document.querySelector('link[data-imweb-preconnect]')) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://cdn.imweb.me';
    link.crossOrigin = 'anonymous';
    link.dataset.imwebPreconnect = 'true';
    document.head.appendChild(link);
  };

  const headingMap = {
    '/business/customer/': ['Customer Network','기업과 소비자, 다양한 고객 접점을 연결합니다.','기업·기관 납품 경험과 온라인 유통 채널을 바탕으로 다양한 고객이 필요한 생활 위생용품을 안정적으로 공급합니다.'],
    '/business/marketing/': ['Marketing','제품의 가치가 고객에게 닿는 방식을 고민합니다.','브랜드와 유통 채널, 고객 경험을 연결하며 태평제지와 브론디의 제품 가치를 일관되게 전달합니다.'],
    '/business/production/': ['Production System','자동화 설비 기반의 안정적인 생산 환경','태평제지는 자동화 생산 설비를 통해 제품의 품질 편차를 최소화하고, 대량 생산과 안정 공급을 동시에 실현하고 있습니다.'],
    '/business/logistics/': ['Logistics','창고 · 출하 · 납품까지 연결되는 공급 시스템','다양한 유통 채널과 기업 납품 환경에 대응할 수 있도록 효율적인 보관과 출하 체계를 운영합니다.'],
    '/business/quality/': ['Quality Control','공정부터 출고까지 이어지는 품질 기준','생산 공정과 검수 단계를 체계적으로 운영하여 일상에 닿는 제품의 안전성과 신뢰를 높이고 있습니다.']
  };

  const gallery = (data, contain = false) => {
    const cls = data.images.length >= 6 ? 'is-dense' : data.images.length === 1 ? 'is-single' : '';
    const head = headingMap[path];
    return `<section class="source-image-gallery"><div class="wrap">
      ${head ? `<div class="source-image-gallery__header"><div><span class="source-image-gallery__eyebrow">${head[0]}</span><h2 class="source-image-gallery__title">${head[1]}</h2><p class="source-image-gallery__desc">${head[2]}</p></div></div>` : ''}
      <div class="source-image-gallery__grid ${cls}">${data.images.map((src,i)=>`<figure class="source-image-gallery__item ${contain ? 'source-image-gallery__item--contain' : ''}">${img(src,`${data.label} 이미지 ${i+1}`,i===0)}</figure>`).join('')}</div>
    </div></section>`;
  };

  const insertPageGallery = data => {
    if (!data?.images?.length || document.querySelector('.source-image-gallery')) return;
    let anchor = document.querySelector('.sub-nav') || document.querySelector('.sub-hero') || document.querySelector('main > section');
    if (path === '/company/brand/' || path === '/contact/') anchor = document.querySelector('.content-section') || anchor;
    if (!anchor) return;
    const contain = path.startsWith('/company/') || path === '/contact/';
    anchor.insertAdjacentHTML('afterend', gallery(data, contain));
  };

  const applyProducts = data => {
    const items = [...document.querySelectorAll('.product-item')];
    if (!items.length) return;
    items.forEach((item,i) => {
      const thumb = item.querySelector('.product-thumb');
      if (!thumb) return;
      const src = data.images[i];
      const alt = thumb.dataset.imageAlt || item.querySelector('h2,h3')?.textContent?.trim() || `${data.label} 제품`;
      if (src) {
        thumb.innerHTML = img(src, alt, i < 2);
        thumb.classList.add('has-source-image');
      } else if (!thumb.querySelector('img')) {
        item.classList.add('product-item--text-only');
        thumb.setAttribute('aria-hidden','true');
      }
    });
    if (data.images.length > items.length && !document.querySelector('.product-source-extra')) {
      const extra = data.images.slice(items.length);
      const grid = document.querySelector('.product-catalog-grid');
      if (grid) grid.insertAdjacentHTML('afterend', `<div class="product-source-extra"><div class="product-source-extra__label">${data.label} Additional Images</div><div class="product-source-extra__grid">${extra.map((src,i)=>`<figure>${img(src,`${data.label} 추가 이미지 ${i+1}`)}</figure>`).join('')}</div></div>`);
    }
  };

  const heroMarkup = images => `
    <div class="home-hero-slider" data-home-hero>
      <div class="home-hero-track">
        ${images.map((src,i)=>`<div class="home-hero-slide ${i===0?'is-active':''}" data-hero-slide="${i}">${img(src,`태평제지 메인 비주얼 ${i+1}`,i===0)}</div>`).join('')}
      </div>
      <div class="home-hero-dots" aria-label="메인 배너 이동">
        ${images.map((_,i)=>`<button class="home-hero-dot ${i===0?'is-active':''}" type="button" aria-label="${i+1}번 이미지" data-hero-dot="${i}"></button>`).join('')}
      </div>
    </div>`;

  const introMarkup = () => `
    <section class="home-intro-enhanced tp-reveal">
      <div class="wrap home-intro-shell">
        <div class="home-intro-text">
          <span class="eyebrow">Taepyung Paper</span>
          <h2>50년 가까이 쌓아온 경험으로<br>생활 위생의 기준을 만듭니다.</h2>
          <p>태평제지는 1977년 설립 이후 생활 위생용품 분야에서 우수한 품질의 제품을 꾸준히 생산해온 대한민국 화장지 제조 기업입니다.</p>
          <p>자동화 설비 기반의 생산 시스템과 체계적인 품질관리, 안정적인 물류 운영을 바탕으로 공공기관, 기업 고객, 온라인 시장까지 폭넓게 대응하고 있습니다.</p>
          <a class="home-inline-link" href="${root}company/">태평제지 자세히 보기 <span>→</span></a>
        </div>
        <div class="home-intro-stats">
          <div class="home-stat-card"><strong>1977</strong><span>설립 연도</span><p>오랜 제조 경험과 노하우를 바탕으로 신뢰를 쌓아왔습니다.</p></div>
          <div class="home-stat-card"><strong>50+</strong><span>Years of Experience</span><p>생활 위생용품 제조 분야에서 축적된 업력을 보유하고 있습니다.</p></div>
          <div class="home-stat-card"><strong>6+</strong><span>주요 제품 카테고리</span><p>두루마리, 점보롤, 핸드타월, 키친타월, 미용티슈, 물티슈 등.</p></div>
          <div class="home-stat-card"><strong>B2B</strong><span>안정 공급 체계</span><p>공공기관, 기업, 유통시장에 맞춘 생산과 공급이 가능합니다.</p></div>
        </div>
      </div>
    </section>`;

  const mediaMarkup = images => {
    const labels = ['Raw Material','Automated Process','Warehousing','Packaging','Production','Logistics','Distribution','Manufacturing'];
    return `
      <section class="home-operations tp-reveal" data-operations-carousel>
        <div class="wrap">
          <div class="home-section-head">
            <div>
              <span class="home-section-kicker">Production & Logistics</span>
              <h2>생산부터 출하까지,<br>안정적인 흐름을 만듭니다.</h2>
              <p>자동화 생산 설비와 물류 시스템을 통해 일정한 품질과 안정적인 공급을 이어갑니다.</p>
            </div>
            <div class="home-carousel-controls">
              <button type="button" data-operations-prev aria-label="이전 이미지">←</button>
              <button type="button" data-operations-next aria-label="다음 이미지">→</button>
            </div>
          </div>
          <div class="home-operations-viewport">
            <div class="home-operations-track" data-operations-track>
              ${images.map((src,i)=>`<figure class="home-operation-card">${img(src,`태평제지 생산 및 물류 이미지 ${i+1}`,i<2)}<figcaption><span>${String(i+1).padStart(2,'0')}</span><strong>${labels[i] || 'Taepyung Paper'}</strong></figcaption></figure>`).join('')}
            </div>
          </div>
          <div class="home-operations-progress"><span data-operations-progress></span></div>
        </div>
      </section>`;
  };

  const productMarkup = products => {
    const categories = [
      ['/product/roll/','두루마리 화장지','Roll Tissue'],
      ['/product/jumbo-roll/','점보롤 화장지','Jumbo Roll'],
      ['/product/hand-towel/','페이퍼타월','Paper Towel'],
      ['/product/kitchen-towel/','키친타월','Kitchen Towel'],
      ['/product/facial-tissue/','미용티슈','Facial Tissue'],
      ['/product/etc/','물티슈 · 디스펜서','Wet Tissue & Dispenser']
    ];
    return `
      <section class="home-products tp-reveal">
        <div class="wrap">
          <div class="home-section-head home-section-head--products">
            <div>
              <span class="home-section-kicker">Products</span>
              <h2>일상의 다양한 공간을 위한<br>태평제지의 제품군</h2>
              <p>가정용부터 공공시설·기업용까지 사용 환경에 맞는 생활 위생용품을 제공합니다.</p>
            </div>
            <a class="home-section-link" href="${root}product/">전체 제품 보기 <span>→</span></a>
          </div>
          <div class="home-product-grid">
            ${categories.map(([route,title,en],i)=>{
              const data = products?.[route];
              const src = data?.images?.[0] || '';
              return `<a class="home-product-card" href="${root}${route.replace(/^\//,'')}">
                <div class="home-product-image">${src ? img(src,title,i<2) : ''}</div>
                <div class="home-product-info"><span>${en}</span><h3>${title}</h3><b>→</b></div>
              </a>`;
            }).join('')}
          </div>
        </div>
      </section>`;
  };

  const contactMarkup = () => `
    <section class="home-contact tp-reveal">
      <div class="wrap home-contact-grid">
        <div class="home-contact-copy">
          <span class="home-section-kicker">Contact</span>
          <h2>제품과 납품에 관한 문의를<br>편하게 전달해 주세요.</h2>
          <p>제품 규격, 기업·기관 납품, 일반 문의 등 태평제지와 관련한 상담을 안내해드립니다.</p>
          <a class="home-contact-button" href="${root}contact/">고객만족 페이지 보기 <span>→</span></a>
        </div>
        <div class="home-contact-info">
          <a href="tel:0315950797"><span>CALL</span><strong>031-595-0797</strong></a>
          <a href="mailto:contact@blondy.co.kr"><span>EMAIL</span><strong>contact@blondy.co.kr</strong></a>
          <div><span>LOCATION</span><strong>경기도 이천시 마장면 마도로 223번길 22</strong></div>
        </div>
      </div>
    </section>`;

  const initHeroSlider = () => {
    const slider = document.querySelector('[data-home-hero]');
    if (!slider) return;
    const slides = [...slider.querySelectorAll('[data-hero-slide]')];
    const dots = [...slider.querySelectorAll('[data-hero-dot]')];
    if (slides.length <= 1) return;
    let current = 0;
    let timer;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = index => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===current));
      dots.forEach((dot,i)=>dot.classList.toggle('is-active',i===current));
    };
    const start = () => {
      clearInterval(timer);
      if (!reduced) timer = setInterval(()=>go(current+1),4800);
    };
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{go(i);start();}));
    slider.addEventListener('mouseenter',()=>clearInterval(timer));
    slider.addEventListener('mouseleave',start);
    document.addEventListener('visibilitychange',()=>document.hidden ? clearInterval(timer) : start());
    go(0);
    start();
  };

  const initOperationsCarousel = () => {
    const section = document.querySelector('[data-operations-carousel]');
    if (!section) return;
    const track = section.querySelector('[data-operations-track]');
    const cards = [...track.children];
    const prev = section.querySelector('[data-operations-prev]');
    const next = section.querySelector('[data-operations-next]');
    const progress = section.querySelector('[data-operations-progress]');
    if (!cards.length) return;
    let index = 0;
    let timer;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visible = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 1000 ? 2 : 3;
    const maxIndex = () => Math.max(0,cards.length-visible());
    const update = () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      const cardWidth = cards[0].getBoundingClientRect().width;
      index = Math.min(index,maxIndex());
      track.style.transform = `translate3d(${-index*(cardWidth+gap)}px,0,0)`;
      if (progress) progress.style.width = `${((index+visible())/cards.length)*100}%`;
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index >= maxIndex();
    };
    const move = delta => { index = Math.max(0,Math.min(maxIndex(),index+delta)); update(); };
    const start = () => {
      clearInterval(timer);
      if (!reduced && maxIndex()>0) timer = setInterval(()=>{
        index = index >= maxIndex() ? 0 : index+1;
        update();
      },3800);
    };
    prev?.addEventListener('click',()=>{move(-1);start();});
    next?.addEventListener('click',()=>{move(1);start();});
    window.addEventListener('resize',update,{passive:true});
    section.addEventListener('mouseenter',()=>clearInterval(timer));
    section.addEventListener('mouseleave',start);
    update();
    start();
  };

  const initHomeReveal = () => {
    const items = [...document.querySelectorAll('.tp-reveal')];
    if (!items.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach(item=>item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:.1,rootMargin:'0px 0px -8%'});
    items.forEach(item=>observer.observe(item));
  };

  const applyHome = data => {
    const images = data.home || [];
    if (!images.length) return;
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    const legacyAbout = document.querySelector('.home-about');
    const legacyGallery = document.querySelector('.home-gallery');

    const featured = images[images.length-1];
    const others = images.slice(0,-1);
    const heroImages = [featured, ...others.slice(0,3)];

    hero.innerHTML = heroMarkup(heroImages);
    legacyAbout?.remove();
    legacyGallery?.remove();

    hero.insertAdjacentHTML('afterend', introMarkup() + mediaMarkup(others) + productMarkup(data.products) + contactMarkup());

    initHeroSlider();
    initOperationsCarousel();
    initHomeReveal();
  };

  ensureCss();
  preconnect();

  fetch(`${root}assets/data/site-images.json?v=20260810-1815`)
    .then(response=>response.json())
    .then(data=>{
      if (path === '/') return applyHome(data);
      if (data.products?.[path]) return applyProducts(data.products[path]);
      if (data.pages?.[path]) insertPageGallery(data.pages[path]);
    })
    .catch(()=>{});
})();