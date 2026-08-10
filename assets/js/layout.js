(() => {
  const base = document.body.dataset.base || './';
  const assetRoot = location.hostname.endsWith('github.io') ? '/tp1977/' : '/';
  const cacheVersion = '20260810-1625';
  const active = document.body.dataset.section || '';
  const isActive = (name) => active === name ? ' aria-current="page"' : '';
  const headerMount = document.querySelector('[data-site-header]');
  const footerMount = document.querySelector('[data-site-footer]');

  let cleanCss = document.querySelector('link[data-brand-clean]');
  if (!cleanCss) {
    cleanCss = document.createElement('link');
    cleanCss.rel = 'stylesheet';
    cleanCss.dataset.brandClean = 'true';
    document.head.appendChild(cleanCss);
  }
  cleanCss.href = `${assetRoot}assets/css/brand-clean.css?v=${cacheVersion}`;

  const logo = () => `
    <a class="brand brand-image" href="${base}" aria-label="태평제지 홈">
      <img src="${assetRoot}assets/images/logo-taepyung.svg?v=${cacheVersion}"
           alt="태평제지 Taepyung Since 1977"
           onerror="this.parentElement.classList.add('logo-fallback');this.remove();">
    </a>`;

  if (headerMount) {
    headerMount.outerHTML = `
      <header class="site-header sub-header" data-header>
        <div class="header-inner">
          ${logo()}
          <nav class="desktop-nav" aria-label="주요 메뉴">
            <div class="nav-item has-dropdown">
              <a href="${base}company/"${isActive('company')}>개요</a>
              <div class="dropdown">
                <a href="${base}company/ceo/">CEO 인사말</a>
                <a href="${base}company/story/">태평제지 스토리</a>
                <a href="${base}company/brand/">브랜드 소개</a>
                <a href="${base}company/vision/">비전 및 핵심 가치</a>
              </div>
            </div>
            <div class="nav-item has-dropdown">
              <a href="${base}business/"${isActive('business')}>운영현황</a>
              <div class="dropdown">
                <a href="${base}business/customer/">고객</a>
                <a href="${base}business/marketing/">마케팅</a>
                <a href="${base}business/production/">생산</a>
                <a href="${base}business/logistics/">물류</a>
                <a href="${base}business/quality/">품질</a>
              </div>
            </div>
            <div class="nav-item has-dropdown">
              <a href="${base}product/"${isActive('product')}>제품소개</a>
              <div class="dropdown">
                <a href="${base}product/roll/">두루마리 화장지</a>
                <a href="${base}product/jumbo-roll/">점보롤 화장지</a>
                <a href="${base}product/hand-towel/">페이퍼타월</a>
                <a href="${base}product/kitchen-towel/">키친타월</a>
                <a href="${base}product/facial-tissue/">미용티슈</a>
                <a href="${base}product/etc/">물티슈 · 디스펜서</a>
              </div>
            </div>
            <div class="nav-item"><a href="${base}esg/"${isActive('esg')}>지속가능경영</a></div>
            <div class="nav-item"><a href="${base}recruit/"${isActive('recruit')}>채용</a></div>
            <div class="nav-item"><a href="${base}contact/"${isActive('contact')}>고객만족</a></div>
          </nav>
          <button class="menu-button" type="button" aria-label="메뉴 열기" aria-expanded="false" data-menu-button><span></span><span></span><span></span></button>
        </div>
        <div class="mobile-panel" data-mobile-panel>
          <nav class="mobile-nav" aria-label="모바일 메뉴">
            <details><summary>개요</summary><a href="${base}company/ceo/">CEO 인사말</a><a href="${base}company/story/">태평제지 스토리</a><a href="${base}company/brand/">브랜드 소개</a><a href="${base}company/vision/">비전 및 핵심 가치</a></details>
            <details><summary>운영현황</summary><a href="${base}business/customer/">고객</a><a href="${base}business/marketing/">마케팅</a><a href="${base}business/production/">생산</a><a href="${base}business/logistics/">물류</a><a href="${base}business/quality/">품질</a></details>
            <details><summary>제품소개</summary><a href="${base}product/roll/">두루마리 화장지</a><a href="${base}product/jumbo-roll/">점보롤 화장지</a><a href="${base}product/hand-towel/">페이퍼타월</a><a href="${base}product/kitchen-towel/">키친타월</a><a href="${base}product/facial-tissue/">미용티슈</a><a href="${base}product/etc/">물티슈 · 디스펜서</a></details>
            <a class="mobile-single" href="${base}esg/">지속가능경영</a>
            <a class="mobile-single" href="${base}recruit/">채용</a>
            <a class="mobile-single" href="${base}contact/">고객만족</a>
          </nav>
        </div>
      </header>`;
  }

  if (footerMount) {
    footerMount.outerHTML = `
      <footer class="site-footer">
        <div class="wrap footer-shell">
          <div class="footer-primary">
            <div class="footer-brand">
              <strong>TAEPYUNG PAPER</strong>
              <p>사람과 환경을 생각합니다.</p>
              <small>SINCE 1977 · 생활 위생용품 전문 제조기업</small>
            </div>
            <div class="footer-nav">
              <a href="${base}company/">개요</a><a href="${base}business/">운영현황</a><a href="${base}product/">제품소개</a>
              <a href="${base}esg/">지속가능경영</a><a href="${base}recruit/">채용</a><a href="${base}contact/">고객만족</a>
            </div>
          </div>
          <div class="footer-details">
            <div class="footer-detail-group"><span class="footer-label">COMPANY</span><p>태평제지(주)</p><p>대표이사: 이정욱</p><p>사업자등록번호: 132-81-58657</p></div>
            <div class="footer-detail-group"><span class="footer-label">LOCATION</span><p>경기도 이천시 마장면 마도로 223번길 22</p><p>생활 위생용품 제조 · 생산 · 공급</p></div>
            <div class="footer-detail-group"><span class="footer-label">CONTACT</span><a href="tel:0315950797">031-595-0797</a><a href="mailto:contact@blondy.co.kr">contact@blondy.co.kr</a><p>FAX. 031-632-4016</p></div>
          </div>
          <div class="footer-bottom">
            <div class="footer-legal"><a href="${base}privacy/">개인정보처리방침</a><a href="${base}contact/">고객문의</a></div>
            <span>© 2026 TAEPYUNG PAPER CO., LTD. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>`;
  }

  window.insertPageMedia = (src, alt) => {
    if (document.querySelector('.page-media-section')) return;
    const anchor = document.querySelector('.sub-nav') || document.querySelector('.sub-hero');
    if (!anchor) return;
    const section = document.createElement('section');
    section.className = 'page-media-section';
    section.innerHTML = `<div class="wrap"><figure class="page-media-frame"><img src="${src}" alt="${alt}" loading="eager"></figure></div>`;
    anchor.insertAdjacentElement('afterend', section);
  };

  let path = location.pathname.replace(/\/index\.html$/, '/').replace(/^\/tp1977(?=\/)/, '');
  if (!path.endsWith('/')) path += '/';
  const mediaScripts = {
    '/company/ceo/':'company-ceo','/company/brand/':'company-brand',
    '/business/customer/':'business-customer','/business/marketing/':'business-marketing','/business/production/':'business-production','/business/logistics/':'business-logistics','/business/quality/':'business-quality',
    '/product/roll/':'product-roll','/product/jumbo-roll/':'product-jumbo-roll','/product/hand-towel/':'product-hand-towel','/product/kitchen-towel/':'product-kitchen-towel','/product/facial-tissue/':'product-facial-tissue','/product/etc/':'product-etc',
    '/esg/':'esg','/recruit/':'recruit','/contact/':'contact'
  };
  if (mediaScripts[path]) {
    const s = document.createElement('script');
    s.src = `${assetRoot}assets/js/media/${mediaScripts[path]}.js?v=${cacheVersion}`;
    document.head.appendChild(s);
  }
})();
