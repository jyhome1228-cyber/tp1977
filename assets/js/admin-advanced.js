import { app, db } from './firebase-client.js?v=20260818-1058';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  addDoc, collection, deleteDoc, doc, documentId, getDoc, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth = getAuth(app);
const BASE_PRODUCT_COUNT = 42;
const categoryLabels = {
  roll:'두루마리 화장지', jumbo:'점보롤 화장지', hand:'핸드타월', kitchen:'키친타월', facial:'미용티슈', etc:'물티슈 · 디스펜서'
};

let stopProducts = null;
let stopVisitors = null;
let stopTraffic = null;
let currentDetail = null;
let weeklyVisitorItems = [];
let weeklyTrafficItems = [];

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const kstKey = date => {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get = type => parts.find(p=>p.type===type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

function metric(view,label){
  return [...document.querySelectorAll(`[data-admin-view="${view}"] .metric-card`)].find(card=>card.querySelector('small')?.textContent.trim()===label)?.querySelector('strong');
}

function mountVisitorSummary(){
  const dashboard = document.querySelector('[data-admin-view="dashboard"]');
  if(!dashboard || dashboard.querySelector('[data-dashboard-visitors]')) return;
  const metrics = dashboard.querySelector('.metric-grid');
  metrics?.insertAdjacentHTML('afterend', `<div class="admin-visitor-summary" data-dashboard-visitors>
    <article><small>오늘 방문자</small><strong data-v-today>0</strong><em>일간</em></article>
    <article><small>최근 7일</small><strong data-v-week>0</strong><em>주간</em></article>
    <article><small>이번 달</small><strong data-v-month>0</strong><em>월간</em></article>
    <article><small>누적 방문</small><strong data-v-total>0</strong><em>전체</em></article>
  </div>`);
}

function renderVisitorSummary(items){
  const today = kstKey(new Date());
  const todayDate = new Date();
  const weekKeys = new Set(Array.from({length:7},(_,i)=>{const d=new Date(todayDate);d.setDate(d.getDate()-i);return kstKey(d);}));
  const month = today.slice(0,7);
  const todayCount = Number(items.find(v=>v.id===today)?.visitors || 0);
  const week = items.filter(v=>weekKeys.has(v.id)).reduce((s,v)=>s+Number(v.visitors||0),0);
  const monthCount = items.filter(v=>v.id.startsWith(month)).reduce((s,v)=>s+Number(v.visitors||0),0);
  const total = items.reduce((s,v)=>s+Number(v.visitors||0),0);
  const values = {'[data-v-today]':todayCount,'[data-v-week]':week,'[data-v-month]':monthCount,'[data-v-total]':total};
  Object.entries(values).forEach(([sel,val])=>{const el=document.querySelector(sel);if(el)el.textContent=val.toLocaleString('ko-KR');});
}
function adminKstNow(){
  return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Seoul'}));
}
function plainKey(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function shifted(date,days){
  const out=new Date(date);out.setDate(out.getDate()+days);return out;
}
function previousWeekRange(){
  const now=adminKstNow();
  const sinceMonday=(now.getDay()+6)%7;
  const thisMonday=shifted(now,-sinceMonday);
  const start=shifted(thisMonday,-7);
  const end=shifted(thisMonday,-1);
  const prevStart=shifted(start,-7);
  const prevEnd=shifted(start,-1);
  return {now,start:plainKey(start),end:plainKey(end),prevStart:plainKey(prevStart),prevEnd:plainKey(prevEnd)};
}
function countTop(items,key,limitCount=5){
  const map=new Map();
  items.forEach(item=>{
    const value=String(item?.[key]||'').trim();
    if(!value)return;
    map.set(value,(map.get(value)||0)+1);
  });
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limitCount);
}
function mountWeeklyReport(){
  const dashboard=document.querySelector('[data-admin-view="dashboard"]');
  if(!dashboard || dashboard.querySelector('[data-weekly-report]'))return;
  const visitorSummary=dashboard.querySelector('[data-dashboard-visitors]');
  const html=`<section class="admin-weekly-report" data-weekly-report>
    <div class="admin-weekly-head"><div><small>WEEKLY REPORT</small><h3>지난주 운영 리포트</h3><p data-weekly-period>지난주 방문 현황을 정리합니다.</p></div><span class="admin-weekly-badge">매주 월요일 자동 표시</span></div>
    <div class="admin-weekly-metrics">
      <article><span>방문자</span><strong data-weekly-visitors>0</strong><em data-weekly-compare>전주 대비 —</em></article>
      <article><span>페이지 조회</span><strong data-weekly-pageviews>0</strong><em data-weekly-avg>일 평균 —</em></article>
      <article><span>최고 방문일</span><strong data-weekly-peak>—</strong><em data-weekly-peak-count>—</em></article>
    </div>
    <div class="admin-weekly-insights">
      <div><span>유입 키워드</span><div data-weekly-keywords><em>수집된 키워드 없음</em></div></div>
      <div><span>주요 유입 경로</span><div data-weekly-sources><em>수집된 유입 경로 없음</em></div></div>
      <div><span>주요 조회 페이지</span><div data-weekly-landings><em>수집된 랜딩 페이지 없음</em></div></div>
    </div>
    <p class="admin-weekly-note">실제 키워드는 UTM term·내부 검색어만 표시합니다. 네이버·구글 자연검색의 정확한 검색어는 별도 검색도구 연동이 필요합니다.</p>
  </section>`;
  if(visitorSummary)visitorSummary.insertAdjacentHTML('afterend',html);
  else dashboard.querySelector('.admin-grid')?.insertAdjacentHTML('beforebegin',html);
  if(!document.querySelector('[data-weekly-report-style]')){
    const style=document.createElement('style');style.dataset.weeklyReportStyle='true';style.textContent=`
      .admin-weekly-report{margin:14px 0;padding:24px;border:1px solid rgba(23,25,23,.10);border-radius:12px;background:#fff}
      .admin-weekly-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}
      .admin-weekly-head small{display:block;margin-bottom:7px;color:#22793a;font-size:10px;font-weight:800;letter-spacing:.1em}
      .admin-weekly-head h3{margin:0 0 6px;font-size:18px;letter-spacing:-.03em}.admin-weekly-head p{margin:0;color:#7a807a;font-size:11px}
      .admin-weekly-badge{padding:7px 9px;border-radius:999px;background:#f3f8f4;color:#22793a;font-size:10px;font-weight:700;white-space:nowrap}
      .admin-weekly-metrics{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid rgba(23,25,23,.09);border-radius:10px;overflow:hidden}
      .admin-weekly-metrics article{padding:18px 20px;background:#fafbfa;border-right:1px solid rgba(23,25,23,.08)}.admin-weekly-metrics article:last-child{border-right:0}
      .admin-weekly-metrics span,.admin-weekly-insights>div>span{display:block;color:#858b85;font-size:10px;font-weight:650}.admin-weekly-metrics strong{display:block;margin:8px 0 4px;font-size:24px;letter-spacing:-.04em}.admin-weekly-metrics em{color:#667066;font-size:10px;font-style:normal}
      .admin-weekly-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.admin-weekly-insights>div{min-height:112px;padding:15px 16px;border:1px solid rgba(23,25,23,.09);border-radius:10px}
      .admin-weekly-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.admin-weekly-tags b{padding:6px 8px;border-radius:6px;background:#f5f6f5;color:#414641;font-size:10px;font-weight:600}.admin-weekly-tags b i{margin-left:4px;color:#8c928c;font-style:normal;font-weight:500}
      .admin-weekly-insights em{display:block;margin-top:12px;color:#9a9f9a;font-size:10px;font-style:normal}.admin-weekly-note{margin:12px 0 0;color:#939893;font-size:9px;line-height:1.5}
      .admin-weekly-modal[hidden]{display:none!important}.admin-weekly-modal{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:24px}.admin-weekly-modal:before{content:"";position:absolute;inset:0;background:rgba(12,16,13,.48);backdrop-filter:blur(4px)}
      .admin-weekly-modal-card{position:relative;width:min(560px,calc(100vw - 36px));padding:28px;border-radius:14px;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.22)}.admin-weekly-modal-card small{color:#22793a;font-size:10px;font-weight:800;letter-spacing:.1em}.admin-weekly-modal-card h2{margin:8px 0 8px;font-size:25px;letter-spacing:-.04em}.admin-weekly-modal-card>p{margin:0;color:#737a73;font-size:12px}
      .admin-weekly-modal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:22px 0}.admin-weekly-modal-stats div{padding:14px;border-radius:9px;background:#f6f7f6}.admin-weekly-modal-stats span{display:block;color:#8a908a;font-size:9px}.admin-weekly-modal-stats strong{display:block;margin-top:6px;font-size:20px}.admin-weekly-modal-card button{width:100%;min-height:42px;border:0;border-radius:8px;background:#22793a;color:#fff;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
      @media(max-width:760px){.admin-weekly-head{display:block}.admin-weekly-badge{display:inline-block;margin-top:12px}.admin-weekly-metrics,.admin-weekly-insights,.admin-weekly-modal-stats{grid-template-columns:1fr}.admin-weekly-metrics article{border-right:0;border-bottom:1px solid rgba(23,25,23,.08)}}
    `;document.head.appendChild(style);
  }
}
function reportTags(entries){
  return entries.length?`<div class="admin-weekly-tags">${entries.map(([name,count])=>`<b>${esc(name)}<i>${count}</i></b>`).join('')}</div>`:'<em>수집된 데이터 없음</em>';
}
function maybeShowMondayReport(range,stats){
  if(range.now.getDay()!==1)return;
  const key=`tp1977-weekly-report-${range.start}`;
  if(localStorage.getItem(key))return;
  localStorage.setItem(key,'shown');
  let modal=document.querySelector('[data-weekly-modal]');
  if(!modal){
    document.body.insertAdjacentHTML('beforeend',`<div class="admin-weekly-modal" data-weekly-modal hidden><section class="admin-weekly-modal-card"><small>MONDAY REPORT</small><h2>지난주 주간 리포트</h2><p data-weekly-modal-period></p><div class="admin-weekly-modal-stats"><div><span>방문자</span><strong data-weekly-modal-visitors></strong></div><div><span>페이지 조회</span><strong data-weekly-modal-pageviews></strong></div><div><span>전주 대비</span><strong data-weekly-modal-compare></strong></div></div><button type="button" data-weekly-modal-close>리포트 확인</button></section></div>`);
    modal=document.querySelector('[data-weekly-modal]');
    modal.querySelector('[data-weekly-modal-close]')?.addEventListener('click',()=>{modal.hidden=true;});
  }
  modal.querySelector('[data-weekly-modal-period]').textContent=`${range.start} ~ ${range.end}`;
  modal.querySelector('[data-weekly-modal-visitors]').textContent=stats.visitors.toLocaleString('ko-KR');
  modal.querySelector('[data-weekly-modal-pageviews]').textContent=stats.pageViews.toLocaleString('ko-KR');
  modal.querySelector('[data-weekly-modal-compare]').textContent=stats.compareText;
  modal.hidden=false;
}
function renderWeeklyReport(){
  mountWeeklyReport();
  const root=document.querySelector('[data-weekly-report]');if(!root)return;
  const range=previousWeekRange();
  const week=weeklyVisitorItems.filter(v=>v.id>=range.start&&v.id<=range.end);
  const previous=weeklyVisitorItems.filter(v=>v.id>=range.prevStart&&v.id<=range.prevEnd);
  const visitors=week.reduce((s,v)=>s+Number(v.visitors||0),0);
  const pageViews=week.reduce((s,v)=>s+Number(v.pageViews||0),0);
  const previousVisitors=previous.reduce((s,v)=>s+Number(v.visitors||0),0);
  const compare=previousVisitors?((visitors-previousVisitors)/previousVisitors)*100:null;
  const compareText=compare===null?'비교 데이터 없음':`${compare>=0?'+':''}${compare.toFixed(1)}%`;
  const peak=[...week].sort((a,b)=>Number(b.visitors||0)-Number(a.visitors||0))[0];
  root.querySelector('[data-weekly-period]').textContent=`${range.start} ~ ${range.end}`;
  root.querySelector('[data-weekly-visitors]').textContent=visitors.toLocaleString('ko-KR');
  root.querySelector('[data-weekly-pageviews]').textContent=pageViews.toLocaleString('ko-KR');
  root.querySelector('[data-weekly-compare]').textContent=`전주 대비 ${compareText}`;
  root.querySelector('[data-weekly-avg]').textContent=`일 평균 ${Math.round(pageViews/7).toLocaleString('ko-KR')}회`;
  root.querySelector('[data-weekly-peak]').textContent=peak?.id?.slice(5).replace('-','.')||'—';
  root.querySelector('[data-weekly-peak-count]').textContent=peak?`${Number(peak.visitors||0).toLocaleString('ko-KR')}명`:'데이터 없음';
  const events=weeklyTrafficItems.filter(v=>v.date>=range.start&&v.date<=range.end);
  const keywords=countTop(events.filter(v=>!['Google 검색','Naver 검색','Daum/Kakao 검색'].includes(v.keyword)),'keyword');
  const sources=countTop(events,'source');
  const landings=countTop(events,'landing');
  root.querySelector('[data-weekly-keywords]').innerHTML=reportTags(keywords);
  root.querySelector('[data-weekly-sources]').innerHTML=reportTags(sources);
  root.querySelector('[data-weekly-landings]').innerHTML=reportTags(landings);
  maybeShowMondayReport(range,{visitors,pageViews,compareText});
}

function mountProductManager(){
  const view = document.querySelector('[data-admin-view="products"]');
  if(!view || view.querySelector('[data-product-manager]')) return;
  view.querySelector('.content-grid-admin')?.remove();
  view.insertAdjacentHTML('beforeend', `<section class="admin-advanced-block" data-product-manager>
    <div class="admin-advanced-head"><div><h3>제품 추가 · 관리</h3><p>새 제품을 등록하면 해당 제품 카테고리 페이지 하단에 자동으로 추가됩니다.</p></div><button class="admin-primary-btn" type="button" data-product-form-toggle>+ 새 제품 등록</button></div>
    <form class="admin-form-grid" data-product-form hidden>
      <div class="admin-form-field"><label>카테고리 *</label><select name="category" required>${Object.entries(categoryLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="admin-form-field"><label>제품명 *</label><input name="name" required></div>
      <div class="admin-form-field full"><label>제품 이미지 URL *</label><input name="imageUrl" type="url" placeholder="https://..." required></div>
      <div class="admin-form-field"><label>규격 / 구성</label><input name="spec" placeholder="예: 30m · 3겹 · 30롤"></div>
      <div class="admin-form-field"><label>원단 / 소재</label><input name="material" placeholder="예: 천연펄프"></div>
      <div class="admin-form-field full"><label>추가 설명</label><textarea name="note" placeholder="친환경 인증, 온라인 전용 등"></textarea></div>
      <label class="admin-form-check full"><input type="checkbox" name="published" checked> 사이트에 바로 노출</label>
      <p class="admin-inline-status" data-product-status></p>
      <div class="admin-form-actions"><button class="admin-secondary-btn" type="button" data-product-cancel>취소</button><button class="admin-primary-btn" type="submit">제품 등록</button></div>
    </form>
    <div class="admin-product-list" data-product-list></div>
  </section>`);

  const form = view.querySelector('[data-product-form]');
  const toggle = view.querySelector('[data-product-form-toggle]');
  const cancel = view.querySelector('[data-product-cancel]');
  const status = view.querySelector('[data-product-status]');
  toggle?.addEventListener('click',()=>{form.hidden=false;form.querySelector('input[name="name"]')?.focus();});
  cancel?.addEventListener('click',()=>{form.hidden=true;form.reset();});
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity()) return;
    const data = new FormData(form);
    const category = String(data.get('category')||'roll');
    const published = data.get('published') === 'on';
    status.textContent='등록 중입니다.';status.dataset.kind='';
    try{
      await addDoc(collection(db,'products'),{
        category,
        catalogKey:`${category}:${published?'published':'hidden'}`,
        name:String(data.get('name')||'').trim(),
        imageUrl:String(data.get('imageUrl')||'').trim(),
        spec:String(data.get('spec')||'').trim(),
        material:String(data.get('material')||'').trim(),
        note:String(data.get('note')||'').trim(),
        published,
        source:'admin',
        createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      status.textContent='제품이 등록되었습니다.';status.dataset.kind='success';form.reset();form.querySelector('[name="published"]').checked=true;form.hidden=true;
    }catch(err){console.error(err);status.textContent='제품 등록에 실패했습니다.';status.dataset.kind='error';}
  });
}

function renderProducts(items){
  const list=document.querySelector('[data-product-list]');
  if(list){
    const sorted=[...items].sort((a,b)=>(a.category||'').localeCompare(b.category||'') || (a.name||'').localeCompare(b.name||''));
    list.innerHTML=sorted.length?sorted.map(item=>`<article class="admin-product-row">
      <div class="admin-product-thumb">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="">`:''}</div>
      <div><small>${esc(categoryLabels[item.category]||item.category||'제품')}</small><h4>${esc(item.name||'-')}</h4><p>${esc(item.spec||item.material||item.note||'추가 정보 없음')}</p></div>
      <div class="admin-product-actions"><button type="button" data-toggle-product="${esc(item.id)}">${item.published?'숨기기':'노출하기'}</button><button type="button" data-delete-product="${esc(item.id)}">삭제</button></div>
    </article>`).join(''):'<div class="empty-state"><b>관리자에서 추가한 제품이 없습니다.</b><p>기존 42개 제품은 정적 카탈로그로 유지되며, 새로 추가한 제품부터 이곳에서 관리됩니다.</p></div>';
  }
  const total=BASE_PRODUCT_COUNT+items.length;
  const dash=metric('dashboard','등록 제품');if(dash)dash.textContent=String(total);
  const heading=document.querySelector('[data-admin-view="products"] .admin-heading p');if(heading)heading.textContent=`기존 ${BASE_PRODUCT_COUNT}개 + 관리자 추가 ${items.length}개, 총 ${total}개 제품을 운영합니다.`;
}

document.addEventListener('click',async e=>{
  const toggle=e.target.closest('[data-toggle-product]');
  const del=e.target.closest('[data-delete-product]');
  if(toggle){
    const id=toggle.dataset.toggleProduct;const snap=await getDoc(doc(db,'products',id));if(!snap.exists())return;const data=snap.data();const published=!data.published;
    await updateDoc(doc(db,'products',id),{published,catalogKey:`${data.category}:${published?'published':'hidden'}`,updatedAt:serverTimestamp()});
  }
  if(del&&confirm('이 제품을 삭제할까요?')) await deleteDoc(doc(db,'products',del.dataset.deleteProduct));
  const detailTrigger=e.target.closest('[data-detail-kind][data-detail-id]');
  if(detailTrigger) currentDetail={kind:detailTrigger.dataset.detailKind,id:detailTrigger.dataset.detailId};
});

function mountSettings(){
  const view=document.querySelector('[data-admin-view="settings"]');
  if(!view || view.querySelector('[data-settings-manager]')) return;
  view.querySelector('.panel')?.remove();
  view.insertAdjacentHTML('beforeend',`<div class="admin-settings-grid" data-settings-manager>
    <section class="admin-settings-card"><header><small>SITE INFO</small><h3>기본 사이트 정보</h3></header><div class="body"><form class="admin-form-grid" data-site-settings-form style="padding:0">
      <div class="admin-form-field full"><label>회사명</label><input name="companyName" value="태평제지(주)"></div>
      <div class="admin-form-field"><label>대표 전화</label><input name="phone" value="031-595-0797"></div>
      <div class="admin-form-field"><label>대표 이메일</label><input name="email" value="contact@blondy.co.kr"></div>
      <div class="admin-form-field full"><label>주소</label><input name="address" value="경기도 이천시 마장면 마도로 223번길 22"></div>
      <div class="admin-form-field"><label>상담시간</label><input name="hours" value="월–금 09:00–17:00"></div>
      <div class="admin-form-field"><label>문의 회신 이메일</label><input name="replyEmail" value="contact@blondy.co.kr"></div>
      <p class="admin-inline-status" data-settings-status></p><div class="admin-form-actions"><button class="admin-primary-btn" type="submit">설정 저장</button></div>
    </form></div></section>
    <section class="admin-settings-card"><header><small>POLICY & INQUIRY</small><h3>문의 · 정책 문서 확인</h3></header><div class="body"><div class="admin-settings-links">
      <a href="../privacy/" target="_blank">개인정보처리방침 <span>열기 ↗</span></a><a href="../terms/" target="_blank">사이트 이용약관 <span>열기 ↗</span></a><a href="../inquiry/" target="_blank">문의·제휴 접수 화면 <span>열기 ↗</span></a><a href="../contact/" target="_blank">고객만족 문의 화면 <span>열기 ↗</span></a>
    </div></div></section>
    <section class="admin-settings-card"><header><small>ADMIN & SECURITY</small><h3>관리자 · 보안</h3></header><div class="body"><div class="admin-settings-info">
      <div><span>관리자 ID</span><strong>tp1977</strong></div><div><span>Firebase 계정</span><strong>tp5950797@naver.com</strong></div><div><span>로그인 방식</span><strong>Email / Password Authentication</strong></div><div><span>데이터 권한</span><strong>관리자 인증 기반 Firestore Rules</strong></div>
    </div></div></section>
    <section class="admin-settings-card"><header><small>OPERATIONS</small><h3>운영 구조</h3></header><div class="body"><div class="admin-settings-info">
      <div><span>문의</span><strong>실시간 조회 · 상태관리 · 이메일 회신 · PDF</strong></div><div><span>제품</span><strong>관리자 추가 제품 자동 노출</strong></div><div><span>방문자</span><strong>일간 · 주간 · 월간 · 누적 집계</strong></div><div><span>사이트</span><strong>GitHub Pages + Firebase</strong></div>
    </div></div></section>
  </div>`);

  const form=view.querySelector('[data-site-settings-form]');const status=view.querySelector('[data-settings-status]');
  getDoc(doc(db,'siteSettings','general')).then(s=>{if(!s.exists())return;const d=s.data();Object.keys(d).forEach(k=>{const input=form?.elements?.namedItem(k);if(input&&'value'in input)input.value=d[k]||'';});}).catch(()=>{});
  form?.addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());status.textContent='저장 중입니다.';try{await setDoc(doc(db,'siteSettings','general'),{...data,updatedAt:serverTimestamp()},{merge:true});status.textContent='사이트 설정이 저장되었습니다.';status.dataset.kind='success';}catch(err){console.error(err);status.textContent='설정 저장에 실패했습니다.';status.dataset.kind='error';}});
}

function detailDataFromModal(){
  const modal=document.querySelector('[data-admin-detail-modal]');if(!modal||modal.hidden)return null;
  const rows=[...modal.querySelectorAll('.admin-detail-row')];const out={};rows.forEach(row=>{const key=row.querySelector('span')?.textContent.trim();const val=row.querySelector('div')?.innerText.trim();if(key)out[key]=val;});
  return {modal,title:modal.querySelector('[data-admin-detail-title]')?.textContent.trim()||'문의 상세',type:modal.querySelector('[data-admin-detail-type]')?.textContent.trim()||'',rows:out};
}

function mountDetailActions(){
  const modal=document.querySelector('[data-admin-detail-modal]');if(!modal||modal.querySelector('.admin-detail-actions'))return;
  const card=modal.querySelector('.admin-detail-card');if(!card)return;
  card.insertAdjacentHTML('beforeend',`<div class="admin-detail-actions"><button class="is-primary" type="button" data-admin-reply>이메일 회신</button><button type="button" data-admin-complete>완료 처리</button><button type="button" data-admin-pdf>PDF 내보내기</button></div>`);
}

function printableHtml(data){
  const rows=Object.entries(data.rows).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v).replace(/\n/g,'<br>')}</td></tr>`).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(data.title)}</title><style>body{font-family:Arial,'Malgun Gothic',sans-serif;color:#171917;margin:40px}header{border-bottom:2px solid #22793a;padding-bottom:20px;margin-bottom:24px}small{color:#22793a;font-weight:700}h1{font-size:26px;margin:8px 0 0}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:12px 8px;text-align:left;vertical-align:top;font-size:12px}th{width:150px;color:#666}footer{margin-top:30px;color:#999;font-size:10px}@media print{body{margin:18mm}}</style></head><body><header><small>${esc(data.type)}</small><h1>${esc(data.title)}</h1></header><table>${rows}</table><footer>TAEPYUNG PAPER · ${new Date().toLocaleString('ko-KR')}</footer><script>window.onload=()=>window.print()<\/script></body></html>`;
}

document.addEventListener('click',async e=>{
  if(e.target.closest('[data-admin-reply]')){
    const data=detailDataFromModal();if(!data)return;const email=data.rows['이메일'];if(!email)return alert('회신할 이메일 주소가 없습니다.');
    if(currentDetail){const collectionName=currentDetail.kind==='inquiry'?'inquiries':'customerInquiries';updateDoc(doc(db,collectionName,currentDetail.id),{status:'확인중',updatedAt:serverTimestamp()}).catch(()=>{});}
    const subject=`[태평제지 답변] ${data.title}`;const body=`안녕하세요. 태평제지입니다.\n\n문의해주신 내용에 대해 답변드립니다.\n\n`;location.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  if(e.target.closest('[data-admin-complete]')&&currentDetail){const collectionName=currentDetail.kind==='inquiry'?'inquiries':'customerInquiries';await updateDoc(doc(db,collectionName,currentDetail.id),{status:'완료',updatedAt:serverTimestamp()});}
  if(e.target.closest('[data-admin-pdf]')){const data=detailDataFromModal();if(!data)return;const win=window.open('','_blank','noopener,noreferrer,width=900,height=900');if(!win)return alert('팝업 차단을 해제해 주세요.');win.document.write(printableHtml(data));win.document.close();}
});

const observer=new MutationObserver(()=>mountDetailActions());observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});

onAuthStateChanged(auth,user=>{
  if(stopProducts){stopProducts();stopProducts=null;}if(stopVisitors){stopVisitors();stopVisitors=null;}if(stopTraffic){stopTraffic();stopTraffic=null;}
  if(!user)return;
  mountVisitorSummary();mountWeeklyReport();mountProductManager();mountSettings();mountDetailActions();
  stopProducts=onSnapshot(collection(db,'products'),snap=>renderProducts(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>console.error('[Admin products]',err));
  stopVisitors=onSnapshot(query(collection(db,'visitors_daily'),orderBy(documentId(),'desc')),snap=>{
    weeklyVisitorItems=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderVisitorSummary(weeklyVisitorItems);renderWeeklyReport();
  },err=>console.error('[Admin visitors]',err));
  stopTraffic=onSnapshot(query(collection(db,'traffic_events'),orderBy('createdAt','desc'),limit(2000)),snap=>{
    weeklyTrafficItems=snap.docs.map(d=>({id:d.id,...d.data()}));renderWeeklyReport();
  },err=>{console.warn('[Admin traffic]',err?.code||err);weeklyTrafficItems=[];renderWeeklyReport();});
});
