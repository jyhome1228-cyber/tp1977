(()=>{
  const version='20260818-1512';
  const addStyle=(key,file)=>{
    if(document.querySelector(`link[data-${key}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`../assets/css/${file}?v=${version}`;
    link.setAttribute(`data-${key}`,'true');
    document.head.appendChild(link);
  };
  const addModule=(key,file)=>{
    if(document.querySelector(`script[data-${key}]`))return;
    const script=document.createElement('script');
    script.type='module';
    script.src=`../assets/js/${file}?v=${version}`;
    script.setAttribute(`data-${key}`,'true');
    document.head.appendChild(script);
  };

  if(!document.querySelector('link[rel="icon"]')){
    const favicon=document.createElement('link');
    favicon.rel='icon';
    favicon.type='image/svg+xml';
    favicon.href=`../favicon.svg?v=${version}`;
    document.head.appendChild(favicon);
  }
  if(!document.querySelector('link[rel="shortcut icon"]')){
    const shortcut=document.createElement('link');
    shortcut.rel='shortcut icon';
    shortcut.href=`../favicon.svg?v=${version}`;
    document.head.appendChild(shortcut);
  }

  addStyle('admin-data-css','admin-data.css');
  addStyle('admin-advanced-css','admin-advanced.css');
  addStyle('admin-products-v2-css','admin-products-v2.css');
  addStyle('admin-trash-css','admin-trash.css');

  let authenticatedModulesLoaded=false;
  const loadAuthenticatedModules=()=>{
    if(authenticatedModulesLoaded)return;
    authenticatedModulesLoaded=true;
    addModule('admin-advanced','admin-advanced.js');
    addModule('admin-row-actions','admin-row-actions.js');
    addModule('admin-products-v2','admin-products-v2.js');
    addModule('admin-trash','admin-trash.js');
  };
  window.addEventListener('tp-admin-authenticated',loadAuthenticatedModules);
  if(document.body.classList.contains('admin-authenticated'))loadAuthenticatedModules();

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
  document.querySelectorAll('.admin-sidebar .admin-nav button > span').forEach(number=>number.remove());

  const views=[...document.querySelectorAll('[data-admin-view]')];
  const buttons=[...document.querySelectorAll('[data-admin-nav]')];
  const title=document.querySelector('[data-admin-title]');
  const date=document.querySelector('[data-admin-date]');
  const names={dashboard:'대시보드',inquiries:'문의·제휴',products:'제품관리',visitors:'방문자',trash:'휴지통',settings:'사이트설정'};

  function open(key){
    const target=names[key]?key:'dashboard';
    views.forEach(v=>v.classList.toggle('is-active',v.dataset.adminView===target));
    buttons.forEach(b=>b.classList.toggle('is-active',b.dataset.adminNav===target));
    if(title)title.textContent=names[target]||'태평제지 Admin';
    history.replaceState(null,'',`#${target}`);
  }

  buttons.forEach(b=>b.addEventListener('click',()=>open(b.dataset.adminNav)));
  open(location.hash.replace('#',''));

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