import { app, db } from './firebase-client.js?v=20260818-1058';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth = getAuth(app);
const BASE_PRODUCT_COUNT = 42;
const categoryLabels = {
  roll:'두루마리 화장지', jumbo:'점보롤 화장지', hand:'핸드타월', kitchen:'키친타월', facial:'미용티슈', etc:'물티슈 · 디스펜서'
};

let stopProducts = null;
let stopVisitors = null;
let currentDetail = null;

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
  if(stopProducts){stopProducts();stopProducts=null;}if(stopVisitors){stopVisitors();stopVisitors=null;}
  if(!user)return;
  mountVisitorSummary();mountProductManager();mountSettings();mountDetailActions();
  stopProducts=onSnapshot(collection(db,'products'),snap=>renderProducts(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>console.error('[Admin products]',err));
  stopVisitors=onSnapshot(query(collection(db,'visitors_daily'),orderBy('__name__','desc')),snap=>renderVisitorSummary(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>console.error('[Admin visitors]',err));
});
