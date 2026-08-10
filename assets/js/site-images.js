(() => {
  const root = location.hostname.endsWith('github.io') ? '/tp1977/' : '/';
  let path = location.pathname.replace(/^\/tp1977(?=\/|$)/, '').replace(/\/index\.html$/, '/');
  if (!path) path = '/';
  if (!path.endsWith('/')) path += '/';

  const img = (src, alt, eager = false) => `<img src="${src}" alt="${alt}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer">`;
  const ensureCss = () => {
    let link = document.querySelector('link[data-site-images]');
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; link.dataset.siteImages = 'true'; document.head.appendChild(link); }
    link.href = `${root}assets/css/site-images.css?v=20260810-1735`;
  };
  const preconnect = () => {
    if (document.querySelector('link[data-imweb-preconnect]')) return;
    const link = document.createElement('link');
    link.rel = 'preconnect'; link.href = 'https://cdn.imweb.me'; link.crossOrigin = 'anonymous'; link.dataset.imwebPreconnect = 'true';
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
      <div class="source-image-gallery__grid ${cls}">${data.images.map((src,i)=>`<figure class="source-image-gallery__item ${contain?'source-image-gallery__item--contain':''}">${img(src,`${data.label} 이미지 ${i+1}`,i===0)}</figure>`).join('')}</div>
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
      if (src) { thumb.innerHTML = img(src, alt, i < 2); thumb.classList.add('has-source-image'); }
      else if (!thumb.querySelector('img')) { item.classList.add('product-item--text-only'); thumb.setAttribute('aria-hidden','true'); }
    });
    if (data.images.length > items.length && !document.querySelector('.product-source-extra')) {
      const extra = data.images.slice(items.length), grid = document.querySelector('.product-catalog-grid');
      if (grid) grid.insertAdjacentHTML('afterend', `<div class="product-source-extra"><div class="product-source-extra__label">${data.label} Additional Images</div><div class="product-source-extra__grid">${extra.map((src,i)=>`<figure>${img(src,`${data.label} 추가 이미지 ${i+1}`)}</figure>`).join('')}</div></div>`);
    }
  };

  const heroMarkup = images => `<div class="home-hero-slider" data-home-hero><div class="home-hero-track">${images.map((src,i)=>`<div class="home-hero-slide ${i===0?'is-active':''}" data-hero-slide="${i}">${img(src,`태평제지 메인 비주얼 ${i+1}`,i===0)}</div>`).join('')}</div><div class="home-hero-overlay"><div class="wrap"><div class="home-hero-copy"><span class="home-hero-kicker">SINCE 1977 · LIFE HYGIENE CARE</span><h1>사람과 환경을 생각하는<br>생활 위생용품 전문 기업</h1><p>태평제지는 두루마리 화장지, 점보롤, 페이퍼타월, 키친타월, 물티슈까지 다양한 생활 위생용품을 정직한 품질과 안정적인 생산 시스템으로 공급합니다.</p><div class="home-hero-actions"><a class="is-primary" href="${root}company/">회사 소개 보기</a><a class="is-secondary" href="${root}product/">제품 카테고리 보기</a></div></div></div></div><div class="home-hero-dots">${images.map((_,i)=>`<button class="home-hero-dot ${i===0?'is-active':''}" type="button" aria-label="${i+1}번 슬라이드 보기" data-hero-dot="${i}"></button>`).join('')}</div></div>`;

  const introMarkup = () => `<section class="home-intro-enhanced"><div class="wrap home-intro-shell"><div class="home-intro-text"><span class="eyebrow">Taepyung Paper</span><h2>50년 가까이 쌓아온 경험으로<br>생활 위생의 기준을 만듭니다.</h2><p>태평제지는 1977년 설립 이후 생활 위생용품 분야에서 우수한 품질의 제품을 꾸준히 생산해온 대한민국 화장지 제조 기업입니다.</p><p>자동화 설비 기반의 생산 시스템과 체계적인 품질관리, 그리고 안정적인 물류 운영을 바탕으로 공공기관, 기업 고객, 온라인 시장까지 폭넓게 대응하고 있습니다.</p></div><div class="home-intro-stats"><div class="home-stat-card"><strong>1977</strong><span>설립 연도</span><p>오랜 제조 경험과 노하우를 바탕으로 신뢰를 쌓아왔습니다.</p></div><div class="home-stat-card"><strong>50+</strong><span>Years of Experience</span><p>생활 위생용품 제조 분야에서 축적된 업력을 보유하고 있습니다.</p></div><div class="home-stat-card"><strong>6+</strong><span>주요 제품 카테고리</span><p>두루마리, 점보롤, 핸드타월, 키친타월, 미용티슈, 물티슈 등.</p></div><div class="home-stat-card"><strong>B2B</strong><span>안정 공급 체계</span><p>공공기관, 기업, 유통시장 등 다양한 채널에 맞춘 생산과 공급이 가능합니다.</p></div></div></div></section>`;

  const mediaMarkup = images => {
    const labels = ['Main Production','Automated Process','Warehousing','Packaging','Distribution','Brand','Production','Logistics'];
    return `<section class="home-gallery"><div class="wrap"><div class="home-media-header"><div><h3>Production & Logistics</h3><p>생산, 포장, 보관, 물류까지 태평제지의 현장을 한눈에 보여줍니다.</p></div></div><div class="home-media-grid">${images.map((src,i)=>`<figure class="home-media-card ${i===0?'is-large':''}">${img(src,`태평제지 현장 이미지 ${i+1}`,i<2)}<figcaption class="home-media-card__label">${labels[i]||`Image ${i+1}`}</figcaption></figure>`).join('')}</div></div></section>`;
  };

  const initSlider = () => {
    const slider = document.querySelector('[data-home-hero]'); if (!slider) return;
    const slides = [...slider.querySelectorAll('[data-hero-slide]')], dots = [...slider.querySelectorAll('[data-hero-dot]')];
    if (slides.length <= 1) return;
    let current = 0, timer;
    const go = index => { current = (index + slides.length) % slides.length; slides.forEach((s,i)=>s.classList.toggle('is-active',i===current)); dots.forEach((d,i)=>d.classList.toggle('is-active',i===current)); };
    const start = () => { clearInterval(timer); timer = setInterval(()=>go(current+1),4200); };
    dots.forEach((d,i)=>d.addEventListener('click',()=>{go(i);start()}));
    slider.addEventListener('mouseenter',()=>clearInterval(timer)); slider.addEventListener('mouseleave',start); go(0); start();
  };

  const applyHome = images => {
    if (!images?.length) return;
    const hero = document.querySelector('.home-hero'); if (!hero) return;
    const legacyAbout = document.querySelector('.home-about'), galleryEl = document.querySelector('.home-gallery');
    const featured = images[images.length-1], others = images.slice(0,-1), heroImages = [featured,...others.slice(0,4)];
    hero.innerHTML = heroMarkup(heroImages);
    if (legacyAbout) legacyAbout.remove();
    hero.insertAdjacentHTML('afterend', introMarkup());
    const intro = document.querySelector('.home-intro-enhanced');
    if (galleryEl) galleryEl.outerHTML = mediaMarkup(others); else if (intro) intro.insertAdjacentHTML('afterend', mediaMarkup(others));
    initSlider();
  };

  ensureCss(); preconnect();
  fetch(`${root}assets/data/site-images.json?v=20260810-1735`).then(r=>r.json()).then(data=>{
    if (path === '/') return applyHome(data.home);
    if (data.products?.[path]) return applyProducts(data.products[path]);
    if (data.pages?.[path]) insertPageGallery(data.pages[path]);
  }).catch(()=>{});
})();
