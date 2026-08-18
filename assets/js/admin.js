(()=>{
  if(!document.querySelector('link[data-admin-data-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='../assets/css/admin-data.css?v=20260818-1058';
    link.dataset.adminDataCss='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('link[data-admin-advanced-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='../assets/css/admin-advanced.css?v=20260818-1058';
    link.dataset.adminAdvancedCss='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-admin-advanced]')){
    const script=document.createElement('script');
    script.type='module';
    script.src='../assets/js/admin-advanced.js?v=20260818-1058';
    script.dataset.adminAdvanced='true';
    document.head.appendChild(script);
  }

  const adminIdInput=document.querySelector('[data-admin-id]');
  if(adminIdInput){
    adminIdInput.value='tp1977';
    adminIdInput.readOnly=true;
    adminIdInput.autocomplete='off';
    adminIdInput.setAttribute('aria-label','관리자 아이디 tp1977');
  }

  const views=[...document.querySelectorAll('[data-admin-view]')];
  const buttons=[...document.querySelectorAll('[data-admin-nav]')];
  const title=document.querySelector('[data-admin-title]');
  const date=document.querySelector('[data-admin-date]');
  const names={dashboard:'대시보드',inquiries:'문의·제휴',customer:'고객문의',products:'제품관리',content:'콘텐츠관리',visitors:'방문자',settings:'사이트설정'};

  function open(key){
    views.forEach(v=>v.classList.toggle('is-active',v.dataset.adminView===key));
    buttons.forEach(b=>b.classList.toggle('is-active',b.dataset.adminNav===key));
    if(title)title.textContent=names[key]||'태평제지 Admin';
    history.replaceState(null,'',`#${key}`);
  }

  buttons.forEach(b=>b.addEventListener('click',()=>open(b.dataset.adminNav)));
  const initial=location.hash.replace('#','');
  open(names[initial]?initial:'dashboard');

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
