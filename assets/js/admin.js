(()=>{
  const version='20260818-1228';
  if(!document.querySelector('link[data-admin-data-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`../assets/css/admin-data.css?v=${version}`;
    link.dataset.adminDataCss='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('link[data-admin-advanced-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`../assets/css/admin-advanced.css?v=${version}`;
    link.dataset.adminAdvancedCss='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('link[data-admin-products-v2-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`../assets/css/admin-products-v2.css?v=${version}`;
    link.dataset.adminProductsV2Css='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-admin-advanced]')){
    const script=document.createElement('script');
    script.type='module';
    script.src=`../assets/js/admin-advanced.js?v=${version}`;
    script.dataset.adminAdvanced='true';
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-admin-row-actions]')){
    const script=document.createElement('script');
    script.type='module';
    script.src=`../assets/js/admin-row-actions.js?v=${version}`;
    script.dataset.adminRowActions='true';
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-admin-products-v2]')){
    const script=document.createElement('script');
    script.type='module';
    script.src=`../assets/js/admin-products-v2.js?v=${version}`;
    script.dataset.adminProductsV2='true';
    document.head.appendChild(script);
  }

  const adminIdInput=document.querySelector('[data-admin-id]');
  if(adminIdInput){
    adminIdInput.value='tp1977';
    adminIdInput.readOnly=true;
    adminIdInput.autocomplete='off';
    adminIdInput.setAttribute('aria-label','관리자 아이디 tp1977');
  }

  ['customer','content'].forEach(key=>{
    document.querySelectorAll(`[data-admin-nav="${key}"],[data-admin-view="${key}"]`).forEach(el=>el.remove());
  });

  const order=['dashboard','inquiries','products','visitors','settings'];
  order.forEach((key,index)=>{
    document.querySelectorAll(`.admin-sidebar [data-admin-nav="${key}"]`).forEach(button=>{
      const number=button.querySelector('span:last-child');
      if(number) number.textContent=String(index+1).padStart(2,'0');
    });
  });

  const views=[...document.querySelectorAll('[data-admin-view]')];
  const buttons=[...document.querySelectorAll('[data-admin-nav]')];
  const title=document.querySelector('[data-admin-title]');
  const date=document.querySelector('[data-admin-date]');
  const names={dashboard:'대시보드',inquiries:'문의·제휴',products:'제품관리',visitors:'방문자',settings:'사이트설정'};

  function open(key){
    const target=names[key]?key:'dashboard';
    views.forEach(v=>v.classList.toggle('is-active',v.dataset.adminView===target));
    buttons.forEach(b=>b.classList.toggle('is-active',b.dataset.adminNav===target));
    if(title)title.textContent=names[target]||'태평제지 Admin';
    history.replaceState(null,'',`#${target}`);
  }

  buttons.forEach(b=>b.addEventListener('click',()=>open(b.dataset.adminNav)));
  const initial=location.hash.replace('#','');
  open(initial);

  if(date){
    const d=new Date();
    date.textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(d);
  }

  document.querySelectorAll('[data-admin-search]').forEach(input=>input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    const table=input.closest('.panel')?.querySelector('tbody');
    table?.querySelectorAll('tr').forEach(row=>row.hidden=Boolean(q)&&!row.textContent.toLowerCase().includes(q));
  }));
})();
