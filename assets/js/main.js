(() => {
  const isGithubPages = location.hostname.endsWith('github.io');
  const assetRoot = isGithubPages ? '/tp1977/' : '/';
  const cacheVersion = '20260810-1830';

  const upsertMeta = (selector, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  const upsertLink = (selector, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement('link'); document.head.appendChild(el); }
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  const normalizedPath = location.pathname.replace(/^\/tp1977(?=\/|$)/, '').replace(/\/index\.html$/, '/') || '/';
  const keywordGroups = {
    company: '태평제지 회사소개, 태평제지 스토리, 태평제지 역사, 태평제지 비전, 태평제지 핵심가치, 브론디 브랜드',
    business: '태평제지 운영현황, 화장지 생산, 위생용품 생산, 화장지 물류, 화장지 품질, 기업납품, B2B 위생용품',
    product: '브론디, 두루마리 화장지, 점보롤 화장지, 페이퍼타월, 핸드타월, 키친타월, 미용티슈, 물티슈, 디스펜서',
    esg: '태평제지 지속가능경영, 친환경 화장지, 환경마크 화장지, 재생펄프, 친환경 위생용품',
    recruit: '태평제지 채용, 태평제지 인재상, 태평제지 복리후생, 화장지 제조 채용',
    contact: '태평제지 고객만족, 태평제지 고객센터, 태평제지 문의, 브론디 문의'
  };
  let sectionKeywords = '';
  if (normalizedPath.startsWith('/company/')) sectionKeywords = keywordGroups.company;
  else if (normalizedPath.startsWith('/business/')) sectionKeywords = keywordGroups.business;
  else if (normalizedPath.startsWith('/product/')) sectionKeywords = keywordGroups.product;
  else if (normalizedPath.startsWith('/esg/')) sectionKeywords = keywordGroups.esg;
  else if (normalizedPath.startsWith('/recruit/')) sectionKeywords = keywordGroups.recruit;
  else if (normalizedPath.startsWith('/contact/')) sectionKeywords = keywordGroups.contact;
  const baseKeywords = '태평제지, Taepyung Paper, 브론디, Blondy, 화장지 제조업체, 생활 위생용품, 화장지, 위생용품, 대한민국 화장지 제조';
  const keywords = sectionKeywords ? `${baseKeywords}, ${sectionKeywords}` : `${baseKeywords}, 두루마리 화장지, 점보롤 화장지, 페이퍼타월, 키친타월, 미용티슈`;
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
  upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' });
  upsertMeta('meta[name="author"]', { name: 'author', content: '태평제지(주)' });
  upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#22793a' });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: '태평제지 | Taepyung Paper' });
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'ko_KR' });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: document.title });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  const description = document.head.querySelector('meta[name="description"]')?.content || '1977년부터 생활 위생용품을 제조해온 태평제지 공식 웹사이트입니다.';
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  const canonicalPath = normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`;
  const canonicalUrl = `https://www.tp1977.com${canonicalPath}`;
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
  upsertLink('link[rel="icon"]', { rel: 'icon', type: 'image/svg+xml', href: `${assetRoot}favicon.svg?v=${cacheVersion}` });
  upsertLink('link[rel="shortcut icon"]', { rel: 'shortcut icon', href: `${assetRoot}favicon.svg?v=${cacheVersion}` });
  upsertLink('link[rel="manifest"]', { rel: 'manifest', href: `${assetRoot}site.webmanifest?v=${cacheVersion}` });

  const ensureStylesheet = (selector, dataKey, href) => {
    let link = document.querySelector(selector);
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; if (dataKey) link.dataset[dataKey] = 'true'; document.head.appendChild(link); }
    link.href = href; return link;
  };
  ensureStylesheet('link[data-brand-clean]', 'brandClean', `${assetRoot}assets/css/brand-clean.css?v=${cacheVersion}`);
  ensureStylesheet('link[data-content-refine]', 'contentRefine', `${assetRoot}assets/css/content-refine.css?v=${cacheVersion}`);
  ensureStylesheet('link[data-footer-brand]', 'footerBrand', `${assetRoot}assets/css/footer-brand.css?v=${cacheVersion}`);
  ensureStylesheet('link[data-site-images]', 'siteImages', `${assetRoot}assets/css/site-images.css?v=${cacheVersion}`);

  if (!document.querySelector('script[data-site-images-loader]')) {
    const imageScript = document.createElement('script');
    imageScript.src = `${assetRoot}assets/js/site-images.js?v=${cacheVersion}`;
    imageScript.dataset.siteImagesLoader = 'true';
    document.head.appendChild(imageScript);
  }

  const brand = document.querySelector('.site-header .brand');
  if (brand) {
    brand.classList.add('brand-image'); brand.classList.remove('logo-fallback');
    let logoImg = brand.querySelector('img');
    if (!logoImg) { brand.innerHTML = '<img alt="태평제지 Taepyung Since 1977">'; logoImg = brand.querySelector('img'); }
    logoImg.src = `${assetRoot}assets/images/logo-taepyung.svg?v=${cacheVersion}`;
    logoImg.onerror = () => { brand.classList.add('logo-fallback'); logoImg.remove(); };
  }

  const footer = document.querySelector('.site-footer');
  if (footer && !footer.querySelector('.footer-shell')) {
    footer.innerHTML = `<div class="wrap footer-shell"><div class="footer-primary"><div class="footer-brand"><strong>TAEPYUNG PAPER</strong><p>사람과 환경을 생각합니다.</p><small>SINCE 1977 · 생활 위생용품 전문 제조기업</small></div><div class="footer-nav"><a href="${assetRoot}company/">개요</a><a href="${assetRoot}business/">운영현황</a><a href="${assetRoot}product/">제품소개</a><a href="${assetRoot}esg/">지속가능경영</a><a href="${assetRoot}recruit/">채용</a><a href="${assetRoot}contact/">고객만족</a></div></div><div class="footer-details"><div class="footer-detail-group"><span class="footer-label">COMPANY</span><p>태평제지(주)</p><p>대표이사: 이정욱</p><p>사업자등록번호: 132-81-58657</p></div><div class="footer-detail-group"><span class="footer-label">LOCATION</span><p>경기도 이천시 마장면 마도로 223번길 22</p><p>생활 위생용품 제조 · 생산 · 공급</p></div><div class="footer-detail-group"><span class="footer-label">CONTACT</span><a href="tel:0315950797">031-595-0797</a><a href="mailto:contact@blondy.co.kr">contact@blondy.co.kr</a><p>FAX. 031-632-4016</p></div></div><div class="footer-bottom"><div class="footer-legal"><a href="${assetRoot}privacy/">개인정보처리방침</a><a href="${assetRoot}contact/">고객문의</a></div><span>© 2026 TAEPYUNG PAPER CO., LTD. ALL RIGHTS RESERVED.</span></div></div>`;
  }

  document.querySelectorAll('.hero-orbit, .brand-symbol').forEach((element) => element.remove());
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  let lastY = window.scrollY;
  const closeMenu = () => { if (!header || !menuButton) return; header.classList.remove('menu-active'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','메뉴 열기'); document.body.classList.remove('menu-open'); };
  if (header) {
    const syncHeader = () => { const y = window.scrollY; header.classList.toggle('is-scrolled', y > 20); if (!header.classList.contains('menu-active') && y > 240) header.classList.toggle('is-hidden', y > lastY && y - lastY > 2); else header.classList.remove('is-hidden'); lastY = y; };
    syncHeader(); window.addEventListener('scroll', syncHeader, { passive: true });
  }
  if (menuButton && header) menuButton.addEventListener('click', () => { const opened = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!opened)); menuButton.setAttribute('aria-label', opened ? '메뉴 열기' : '메뉴 닫기'); header.classList.toggle('menu-active', !opened); document.body.classList.toggle('menu-open', !opened); });
  if (mobilePanel) mobilePanel.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });

  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (!entry.isIntersecting) return; entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((element, index) => { element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`; observer.observe(element); });
  } else reveals.forEach((element) => element.classList.add('is-visible'));
  document.querySelectorAll('.mobile-nav details').forEach((detail) => { detail.addEventListener('toggle', () => { if (!detail.open) return; document.querySelectorAll('.mobile-nav details').forEach((other) => { if (other !== detail) other.open = false; }); }); });
})();
