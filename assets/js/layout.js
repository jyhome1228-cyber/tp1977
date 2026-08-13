(() => {
  const base = document.body.dataset.base || './';
  const assetRoot = location.hostname.endsWith('github.io') ? '/tp1977/' : '/';
  const cacheVersion = '20260813-1015';
  const active = document.body.dataset.section || '';
  const isActive = (name) => active === name ? ' aria-current="page"' : '';
  const headerMount = document.querySelector('[data-site-header]');
  const footerMount = document.querySelector('[data-site-footer]');

  const ensureCss = (selector, dataKey, href) => {
    let link = document.querySelector(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      if (dataKey) link.dataset[dataKey] = 'true';
      document.head.appendChild(link);
    }
    link.href = href;
  };

  const syncBrandCss = () => {
    ensureCss('link[data-brand-clean]', 'brandClean', `${assetRoot}assets/css/brand-clean.css?v=${cacheVersion}`);
    ensureCss('link[data-footer-brand]', 'footerBrand', `${assetRoot}assets/css/footer-brand.css?v=${cacheVersion}`);
    ensureCss('link[data-site-enhancements]', 'siteEnhancements', `${assetRoot}assets/css/site-enhancements.css?v=${cacheVersion}`);
  };
  syncBrandCss();
  window.addEventListener('DOMContentLoaded', syncBrandCss, { once: true });

  if (!document.querySelector('style[data-header-size-override]')) {
    const style = document.createElement('style');
    style.dataset.headerSizeOverride = 'true';
    style.textContent = `
      @media (min-width:1101px){
        .desktop-nav .nav-item>a{font-size:16px!important;line-height:1.35!important;font-weight:650!important}
        .desktop-nav .dropdown a{font-size:15px!important;line-height:1.5!important}
      }
    `;
    document.head.appendChild(style);
  }

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
              <a class="footer-logo-link" href="${base}" aria-label="태평제지 홈">
                <img class="footer-logo" src="${assetRoot}assets/images/logo-taepyung.svg?v=${cacheVersion}" alt="태평제지 Taepyung Since 1977">
              </a>
              <span class="footer-eyebrow">TAEPYUNG PAPER · SINCE 1977</span>
              <p>사람과 환경을 생각하는 생활 위생용품 제조기업</p>
            </div>
            <div class="footer-utility">
              <form class="footer-search" action="${base}product/" method="get" role="search">
                <label for="footer-product-search">PRODUCT SEARCH</label>
                <div class="footer-search-control">
                  <input id="footer-product-search" name="q" type="search" placeholder="제품명 또는 종류 검색" autocomplete="off" list="footer-search-list">
                  <button type="submit" aria-label="제품 검색">검색 <span>→</span></button>
                </div>
                <datalist id="footer-search-list">
                  <option value="두루마리 화장지"></option>
                  <option value="점보롤"></option>
                  <option value="페이퍼타월"></option>
                  <option value="키친타월"></option>
                  <option value="미용티슈"></option>
                  <option value="물티슈"></option>
                  <option value="디스펜서"></option>
                </datalist>
              </form>
              <nav class="footer-nav" aria-label="푸터 메뉴">
                <a href="${base}company/"><small>01</small><span>개요</span></a>
                <a href="${base}business/"><small>02</small><span>운영현황</span></a>
                <a href="${base}product/"><small>03</small><span>제품소개</span></a>
                <a href="${base}esg/"><small>04</small><span>지속가능경영</span></a>
                <a href="${base}recruit/"><small>05</small><span>채용</span></a>
                <a href="${base}contact/"><small>06</small><span>고객만족</span></a>
              </nav>
            </div>
          </div>
          <div class="footer-details">
            <div class="footer-detail-group"><span class="footer-label">COMPANY</span><p>태평제지(주)</p><p>대표이사 · 이정욱</p><p>사업자등록번호 · 132-81-58657</p></div>
            <div class="footer-detail-group"><span class="footer-label">LOCATION</span><p>경기도 이천시 마장면 마도로 223번길 22</p><p>생활 위생용품 제조 · 생산 · 공급</p></div>
            <div class="footer-detail-group"><span class="footer-label">CONTACT</span><a href="tel:0315950797">T. 031-595-0797</a><a href="mailto:contact@blondy.co.kr">E. contact@blondy.co.kr</a><p>F. 031-632-4016</p></div>
          </div>
          <div class="footer-bottom">
            <div class="footer-legal">
              <a href="${base}privacy/">개인정보처리방침</a>
              <a href="${base}terms/">사이트 이용약관</a>
              <a href="${base}contact/">고객문의</a>
            </div>
            <span>© 2026 TAEPYUNG PAPER CO., LTD. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>`;
  }

  if (!document.querySelector('script[data-site-enhancements]')) {
    const script = document.createElement('script');
    script.src = `${assetRoot}assets/js/site-enhancements.js?v=${cacheVersion}`;
    script.dataset.siteEnhancements = 'true';
    document.head.appendChild(script);
  }
})();
