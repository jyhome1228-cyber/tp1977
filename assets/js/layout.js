(() => {
  const base = document.body.dataset.base || './';
  const active = document.body.dataset.section || '';
  const isActive = (name) => active === name ? ' aria-current="page"' : '';
  const headerMount = document.querySelector('[data-site-header]');
  const footerMount = document.querySelector('[data-site-footer]');

  if (headerMount) {
    headerMount.outerHTML = `
      <header class="site-header sub-header" data-header>
        <div class="header-inner">
          <a class="brand" href="${base}" aria-label="태평제지 홈">
            <span class="brand-mark" aria-hidden="true">TP</span>
            <span class="brand-wordmark">TAEPYUNG PAPER</span>
          </a>
          <nav class="desktop-nav" aria-label="주요 메뉴">
            <div class="nav-item has-dropdown"><a href="${base}company/"${isActive('company')}>개요</a><div class="dropdown"><a href="${base}company/ceo/">CEO 인사말</a><a href="${base}company/story/">태평제지 스토리</a><a href="${base}company/brand/">브랜드 소개</a><a href="${base}company/vision/">비전 및 핵심 가치</a></div></div>
            <div class="nav-item has-dropdown"><a href="${base}business/"${isActive('business')}>운영현황</a><div class="dropdown"><a href="${base}business/customer/">고객</a><a href="${base}business/marketing/">마케팅</a><a href="${base}business/production/">생산</a><a href="${base}business/logistics/">물류</a><a href="${base}business/quality/">품질</a></div></div>
            <div class="nav-item has-dropdown"><a href="${base}product/"${isActive('product')}>제품소개</a><div class="dropdown"><a href="${base}product/roll/">두루마리</a><a href="${base}product/jumbo-roll/">점보롤</a><a href="${base}product/hand-towel/">핸드타월</a><a href="${base}product/kitchen-towel/">키친타월</a><a href="${base}product/facial-tissue/">미용티슈</a><a href="${base}product/etc/">물티슈 · 디스펜서</a></div></div>
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
            <details><summary>제품소개</summary><a href="${base}product/roll/">두루마리</a><a href="${base}product/jumbo-roll/">점보롤</a><a href="${base}product/hand-towel/">핸드타월</a><a href="${base}product/kitchen-towel/">키친타월</a><a href="${base}product/facial-tissue/">미용티슈</a><a href="${base}product/etc/">물티슈 · 디스펜서</a></details>
            <a class="mobile-single" href="${base}esg/">지속가능경영</a><a class="mobile-single" href="${base}recruit/">채용</a><a class="mobile-single" href="${base}contact/">고객만족</a>
          </nav>
        </div>
      </header>`;
  }

  if (footerMount) {
    footerMount.outerHTML = `
      <footer class="site-footer">
        <div class="wrap footer-top"><div class="footer-brand"><strong>TAEPYUNG PAPER</strong><p>사람과 환경을 생각합니다.</p></div><div class="footer-nav"><a href="${base}company/">개요</a><a href="${base}business/">운영현황</a><a href="${base}product/">제품소개</a><a href="${base}esg/">지속가능경영</a><a href="${base}recruit/">채용</a><a href="${base}contact/">고객만족</a></div></div>
        <div class="wrap footer-bottom"><div class="company-info"><span>태평제지(주)</span><span>대표이사 이정욱</span><span>경기도 이천시 마장면 마도로 223번길 22</span><span>T. 031-595-0797</span><span>F. 031-632-4016</span><a href="mailto:contact@blondy.co.kr">E. contact@blondy.co.kr</a><span>사업자등록번호 132-81-58657</span></div><div class="footer-legal"><a href="${base}privacy/">개인정보처리방침</a><span>© 2026 TAEPYUNG PAPER CO., LTD.</span></div></div>
      </footer>`;
  }

  window.insertPageMedia = (src, alt) => {
    if (document.querySelector('.page-media-section')) return;
    if (!document.querySelector('#tp-media-style')) {
      const style = document.createElement('style');
      style.id = 'tp-media-style';
      style.textContent = `
        .page-media-section{padding:38px 0 0;background:var(--paper)}
        .page-media-frame{margin:0;overflow:hidden;background:#f2f2ef;border:1px solid var(--line)}
        .page-media-frame img{display:block;width:100%;height:auto}
        .page-media-section + .content-section{padding-top:90px}
        @media(max-width:760px){.page-media-section{padding-top:20px}.page-media-section + .content-section{padding-top:64px}}
      `;
      document.head.appendChild(style);
    }
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
    '/company/ceo/':'company-ceo',
    '/company/story/':'company-story',
    '/company/brand/':'company-brand',
    '/company/vision/':'company-vision',
    '/business/customer/':'business-customer',
    '/business/marketing/':'business-marketing',
    '/business/production/':'business-production',
    '/business/logistics/':'business-logistics',
    '/business/quality/':'business-quality',
    '/product/roll/':'product-roll',
    '/product/jumbo-roll/':'product-jumbo-roll',
    '/product/hand-towel/':'product-hand-towel',
    '/product/kitchen-towel/':'product-kitchen-towel',
    '/product/facial-tissue/':'product-facial-tissue',
    '/product/etc/':'product-etc',
    '/esg/':'esg',
    '/recruit/':'recruit',
    '/contact/':'contact'
  };
  if (mediaScripts[path]) {
    const s = document.createElement('script');
    s.src = `${base}assets/js/media/${mediaScripts[path]}.js`;
    document.head.appendChild(s);
  }
})();
