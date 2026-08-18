(() => {
  const isGithubPages = location.hostname.endsWith('github.io');
  const assetRoot = isGithubPages ? '/tp1977/' : '/';
  const cacheVersion = '20260818-1433';
  const siteOrigin = 'https://tp1977.com';
  const defaultOgImage = 'https://cdn.imweb.me/upload/S2025061194bb8d274d3cd/a08e6868cebcd.jpg';
  const naverVerification = 'd35273ec40bb3015baefa801e55cc7e7aa36d43b';

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
    contact: '태평제지 고객만족, 태평제지 고객센터, 태평제지 문의, 브론디 문의',
    inquiry: '태평제지 문의, 태평제지 제휴, 제품 문의, 납품 문의, 기업 구매, 브랜드 협업'
  };
  const descriptionFallbacks = {
    '/': '1977년부터 두루마리 화장지, 점보롤, 핸드타월 등 생활 위생용품을 제조·공급해온 태평제지 공식 홈페이지입니다.',
    '/company/': '1977년 설립된 생활 위생용품 제조기업 태평제지의 회사소개, 역사, 브랜드와 핵심가치를 소개합니다.',
    '/business/': '태평제지의 고객, 마케팅, 생산, 물류, 품질 관리 체계와 안정적인 위생용품 공급 역량을 소개합니다.',
    '/product/': '브론디 두루마리 화장지, 점보롤, 핸드타월, 키친타월, 미용티슈 등 태평제지 주요 제품을 확인하세요.',
    '/esg/': '친환경 제조와 지속가능한 생활 위생용품을 위한 태평제지의 지속가능경영 방향을 소개합니다.',
    '/recruit/': '태평제지의 인재상과 채용 정보를 확인하세요.',
    '/contact/': '태평제지 제품, 품질, 납품 및 서비스 관련 고객 안내를 확인하세요.',
    '/inquiry/': '태평제지 제품·납품 문의와 유통·브랜드·사업 제휴 요청을 온라인으로 접수합니다.'
  };

  let sectionKeywords = '';
  if (normalizedPath.startsWith('/company/')) sectionKeywords = keywordGroups.company;
  else if (normalizedPath.startsWith('/business/')) sectionKeywords = keywordGroups.business;
  else if (normalizedPath.startsWith('/product/')) sectionKeywords = keywordGroups.product;
  else if (normalizedPath.startsWith('/esg/')) sectionKeywords = keywordGroups.esg;
  else if (normalizedPath.startsWith('/recruit/')) sectionKeywords = keywordGroups.recruit;
  else if (normalizedPath.startsWith('/contact/')) sectionKeywords = keywordGroups.contact;
  else if (normalizedPath.startsWith('/inquiry/')) sectionKeywords = keywordGroups.inquiry;

  const baseKeywords = '태평제지, Taepyung Paper, 브론디, Blondy, 화장지 제조업체, 생활 위생용품, 화장지, 위생용품, 대한민국 화장지 제조';
  const keywords = sectionKeywords ? `${baseKeywords}, ${sectionKeywords}` : `${baseKeywords}, 두루마리 화장지, 점보롤 화장지, 핸드타월, 키친타월, 미용티슈`;
  upsertMeta('meta[name="naver-site-verification"]', { name: 'naver-site-verification', content: naverVerification });
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
  upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' });
  upsertMeta('meta[name="author"]', { name: 'author', content: '태평제지(주)' });
  upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#22793a' });

  let description = document.head.querySelector('meta[name="description"]')?.content?.trim() || '';
  if (!description) {
    const fallbackKey = Object.keys(descriptionFallbacks).find(key => key !== '/' && normalizedPath.startsWith(key)) || '/';
    description = descriptionFallbacks[normalizedPath] || descriptionFallbacks[fallbackKey] || descriptionFallbacks['/'];
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
  }

  const canonicalPath = normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`;
  const canonicalUrl = `${siteOrigin}${canonicalPath}`;
  const pageTitle = document.title?.trim() || '태평제지 | 화장지·생활 위생용품 제조기업';
  const existingOgImage = document.head.querySelector('meta[property="og:image"]')?.content?.trim();
  const ogImage = existingOgImage || defaultOgImage;

  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: '태평제지 | Taepyung Paper' });
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'ko_KR' });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: '태평제지 | Taepyung Paper' });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
  upsertLink('link[rel="icon"]', { rel: 'icon', type: 'image/svg+xml', href: `${assetRoot}favicon.svg?v=${cacheVersion}` });
  upsertLink('link[rel="shortcut icon"]', { rel: 'shortcut icon', href: `${assetRoot}favicon.svg?v=${cacheVersion}` });
  upsertLink('link[rel="manifest"]', { rel: 'manifest', href: `${assetRoot}site.webmanifest?v=${cacheVersion}` });

  if (!document.querySelector('script[data-seo-structured]')) {
    const structured = document.createElement('script');
    structured.type = 'application/ld+json';
    structured.dataset.seoStructured = 'true';
    structured.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteOrigin}/#organization`,
          name: '태평제지(주)',
          alternateName: 'Taepyung Paper',
          url: `${siteOrigin}/`,
          logo: `${siteOrigin}/assets/images/logo-taepyung.svg`,
          foundingDate: '1977',
          email: 'contact@blondy.co.kr',
          telephone: '031-595-0797',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '마도로 223번길 22',
            addressLocality: '이천시',
            addressRegion: '경기도',
            addressCountry: 'KR'
          }
        },
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: pageTitle,
          description,
          isPartOf: { '@id': `${siteOrigin}/#website` },
          about: { '@id': `${siteOrigin}/#organization` },
          inLanguage: 'ko-KR'
        },
        {
          '@type': 'WebSite',
          '@id': `${siteOrigin}/#website`,
          url: `${siteOrigin}/`,
          name: '태평제지',
          alternateName: 'Taepyung Paper',
          publisher: { '@id': `${siteOrigin}/#organization` },
          inLanguage: 'ko-KR'
        }
      ]
    });
    document.head.appendChild(structured);
  }

  const ensureStylesheet = (selector, dataKey, href) => {
    let link = document.querySelector(selector);
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; if (dataKey) link.dataset[dataKey] = 'true'; document.head.appendChild(link); }
    link.href = href; return link;
  };
  ensureStylesheet('link[data-brand-clean]', 'brandClean', `${assetRoot}assets/css/brand-clean.css?v=${cacheVersion}`);
  ensureStylesheet('link[data-content-refine]', 'contentRefine', `${assetRoot}assets/css/content-refine.css?v=${cacheVersion}`);
  ensureStylesheet('link[data-footer-brand]', 'footerBrand', `${assetRoot}assets/css/footer-brand.css?v=${cacheVersion}`);
  ensureStylesheet('link[data-site-images]', 'siteImages', `${assetRoot}assets/css/site-images.css?v=${cacheVersion}`);

  const ensureModule = (dataName, src) => {
    if (document.querySelector(`script[data-${dataName}]`)) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.setAttribute(`data-${dataName}`, 'true');
    document.head.appendChild(script);
  };

  ensureModule('visitor-tracker', `${assetRoot}assets/js/visitor-tracker.js?v=${cacheVersion}`);
  if (normalizedPath === '/inquiry/') ensureModule('inquiry-submit', `${assetRoot}assets/js/inquiry-submit.js?v=${cacheVersion}`);
  if (normalizedPath === '/contact/') ensureModule('contact-submit', `${assetRoot}assets/js/contact-submit.js?v=${cacheVersion}`);
  if (normalizedPath.startsWith('/product/') && normalizedPath !== '/product/') ensureModule('product-runtime', `${assetRoot}assets/js/product-runtime.js?v=${cacheVersion}`);

  /* Product detail/list pages now own their exact supplied thumbnails in HTML.
     Do not let the legacy image loader replace them by array index. */
  if (!normalizedPath.startsWith('/product/') && !document.querySelector('script[data-site-images-loader]')) {
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
    footer.innerHTML = `<div class="wrap footer-shell"><div class="footer-primary"><div class="footer-brand"><strong>TAEPYUNG PAPER</strong><p>사람과 환경을 생각합니다.</p><small>SINCE 1977 · 생활 위생용품 전문 제조기업</small></div><div class="footer-nav"><a href="${assetRoot}company/">개요</a><a href="${assetRoot}business/">운영현황</a><a href="${assetRoot}product/">제품소개</a><a href="${assetRoot}esg/">지속가능경영</a><a href="${assetRoot}recruit/">채용</a><a href="${assetRoot}contact/">고객만족</a><a href="${assetRoot}inquiry/">문의·제휴</a></div></div><div class="footer-details"><div class="footer-detail-group"><span class="footer-label">COMPANY</span><p>태평제지(주)</p><p>대표이사: 이정욱</p><p>사업자등록번호: 132-81-58657</p></div><div class="footer-detail-group"><span class="footer-label">LOCATION</span><p>경기도 이천시 마장면 마도로 223번길 22</p><p>생활 위생용품 제조 · 생산 · 공급</p></div><div class="footer-detail-group"><span class="footer-label">CONTACT</span><a href="tel:0315950797">031-595-0797</a><a href="mailto:contact@blondy.co.kr">contact@blondy.co.kr</a><p>FAX. 031-632-4016</p></div></div><div class="footer-bottom"><div class="footer-legal"><a href="${assetRoot}privacy/">개인정보처리방침</a><a href="${assetRoot}terms/">사이트 이용약관</a><a href="${assetRoot}inquiry/">고객문의</a></div><span>© 2026 TAEPYUNG PAPER CO., LTD. ALL RIGHTS RESERVED.</span></div></div>`;
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
