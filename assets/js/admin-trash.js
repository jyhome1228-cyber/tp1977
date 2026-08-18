import { app, db, storage } from './firebase-client.js?v=20260818-1505';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, serverTimestamp, updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { deleteObject, ref as storageRef } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth = getAuth(app);
let inquiries = [];
let products = [];
let trashItems = [];
let stops = [];
let currentInquiryId = '';
let activeFilter = 'all';
let cleanupTimer = 0;
let modalCheckQueued = false;

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const millis = value => value?.toMillis?.() || 0;
const formatDate = value => {
  const date = value?.toDate?.();
  if(!date) return '-';
  return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);
};

function makeTrashItems(){
  const inquiryTrash = inquiries.filter(item=>item.trashed===true).map(item=>({
    id:item.id,kind:'inquiry',category:'문의',title:item.subject||item.name||'문의',
    summary:[item.company||item.name,item.type||item.inquiryType].filter(Boolean).join(' · '),
    deletedAt:item.deletedAt,raw:item
  }));
  const productTrash = products.filter(item=>item.trashed===true).map(item=>({
    id:item.id,kind:'product',category:'제품',title:item.name||'제품',
    summary:[item.category,item.spec,item.material].filter(Boolean).join(' · '),
    deletedAt:item.deletedAt,raw:item
  }));
  trashItems=[...inquiryTrash,...productTrash];
}

async function moveToTrash(kind,id){
  const collectionName = kind==='product' ? 'products' : 'inquiries';
  const ref = doc(db,collectionName,id);
  const snap = await getDoc(ref);
  if(!snap.exists()) return;
  const data=snap.data();
  if(kind==='product'){
    await updateDoc(ref,{
      trashed:true,
      deletedAt:serverTimestamp(),
      publishedBeforeTrash:data.published!==false,
      published:false,
      catalogKey:`${data.category||'roll'}:hidden`,
      updatedAt:serverTimestamp()
    });
  }else{
    await updateDoc(ref,{
      trashed:true,
      deletedAt:serverTimestamp(),
      trashedFromStatus:data.status||'신규',
      updatedAt:serverTimestamp()
    });
  }
}

async function restoreTrash(item){
  if(!item) return;
  const collectionName=item.kind==='product'?'products':'inquiries';
  const ref=doc(db,collectionName,item.id);
  if(item.kind==='product'){
    const published=item.raw?.publishedBeforeTrash!==false;
    await updateDoc(ref,{
      trashed:false,
      deletedAt:deleteField(),
      publishedBeforeTrash:deleteField(),
      published,
      catalogKey:`${item.raw?.category||'roll'}:${published?'published':'hidden'}`,
      updatedAt:serverTimestamp()
    });
  }else{
    await updateDoc(ref,{
      trashed:false,
      deletedAt:deleteField(),
      trashedFromStatus:deleteField(),
      updatedAt:serverTimestamp()
    });
  }
}

async function permanentlyDelete(item){
  if(!item) return;
  if(item.kind==='product' && item.raw?.storagePath){
    try{ await deleteObject(storageRef(storage,item.raw.storagePath)); }catch(error){ console.debug('[Trash] storage cleanup skipped',error?.code||error); }
  }
  await deleteDoc(doc(db,item.kind==='product'?'products':'inquiries',item.id));
}

function renderCounts(){
  const counts={all:trashItems.length,inquiry:trashItems.filter(i=>i.kind==='inquiry').length,product:trashItems.filter(i=>i.kind==='product').length};
  Object.entries(counts).forEach(([key,value])=>{
    const el=document.querySelector(`[data-trash-count="${key}"]`);
    if(el && el.textContent!==String(value)) el.textContent=String(value);
  });
}

function renderTrash(){
  makeTrashItems();
  const list=document.querySelector('[data-trash-list]');
  if(!list) return;
  const q=(document.querySelector('[data-trash-search]')?.value||'').trim().toLowerCase();
  const filtered=trashItems
    .filter(item=>activeFilter==='all'||item.kind===activeFilter)
    .filter(item=>!q||[item.title,item.summary,item.category].join(' ').toLowerCase().includes(q))
    .sort((a,b)=>millis(b.deletedAt)-millis(a.deletedAt));
  renderCounts();
  if(!filtered.length){list.innerHTML='<div class="admin-trash-empty">조건에 맞는 삭제 항목이 없습니다.</div>';return;}
  list.innerHTML=filtered.map(item=>`
    <article class="admin-trash-row">
      <span class="admin-trash-kind${item.kind==='product'?' is-product':''}">${item.kind==='product'?'제품':'문의'}</span>
      <div class="admin-trash-main"><small>${esc(item.category)}</small><h4>${esc(item.title)}</h4><p>${esc(item.summary||'추가 정보 없음')}</p></div>
      <span class="admin-trash-date">${formatDate(item.deletedAt)}</span>
      <div class="admin-trash-actions"><button type="button" data-trash-restore="${esc(item.kind)}:${esc(item.id)}">복원</button><button class="danger" type="button" data-trash-permanent="${esc(item.kind)}:${esc(item.id)}">영구 삭제</button></div>
    </article>`).join('');
}

function cleanupMainViews(){
  const activeInquiryIds=new Set(inquiries.filter(item=>item.trashed!==true).map(item=>item.id));
  const inquiryView=document.querySelector('[data-admin-view="inquiries"]');
  const inquiryTbody=inquiryView?.querySelector('.admin-table tbody');
  inquiryTbody?.querySelectorAll('tr[data-detail-id]').forEach(row=>{if(!activeInquiryIds.has(row.dataset.detailId))row.remove();});
  if(inquiryTbody && !inquiryTbody.querySelector('tr[data-detail-id]')){
    const cols=inquiryView?.querySelectorAll('thead th').length||6;
    const empty=`<tr><td colspan="${cols}" class="admin-empty-cell">등록된 문의가 없습니다.</td></tr>`;
    if(inquiryTbody.innerHTML!==empty) inquiryTbody.innerHTML=empty;
  }

  const recent=document.querySelector('[data-admin-view="dashboard"] .admin-recent-list');
  recent?.querySelectorAll('[data-detail-id]').forEach(row=>{if(!activeInquiryIds.has(row.dataset.detailId))row.remove();});
  if(recent && !recent.querySelector('[data-detail-id]') && !recent.querySelector('.empty-state')) recent.innerHTML='<div class="empty-state"><b>등록된 문의가 없습니다.</b><p>새 문의나 제휴 요청이 접수되면 최근 순서대로 표시됩니다.</p></div>';

  const openCount=inquiries.filter(item=>item.trashed!==true&&!['완료','보관'].includes(item.status)).length;
  const openMetric=[...document.querySelectorAll('[data-admin-view="dashboard"] .metric-card')].find(card=>card.querySelector('small')?.textContent.trim()==='미처리 문의')?.querySelector('strong');
  if(openMetric && openMetric.textContent!==String(openCount))openMetric.textContent=String(openCount);

  const activeProducts=products.filter(item=>item.trashed!==true);
  const activeProductIds=new Set(activeProducts.map(item=>item.id));
  document.querySelectorAll('[data-apv2-row]').forEach(row=>{if(!activeProductIds.has(row.dataset.apv2Row))row.remove();});
  const countEl=document.querySelector('[data-apv2-count]');
  if(countEl){
    const visibleRows=document.querySelectorAll('[data-apv2-row]').length;
    const text=`${visibleRows}개 / 전체 ${activeProducts.length}개`;
    if(countEl.textContent!==text) countEl.textContent=text;
  }
  const productMetric=[...document.querySelectorAll('[data-admin-view="dashboard"] .metric-card')].find(card=>card.querySelector('small')?.textContent.trim()==='등록 제품')?.querySelector('strong');
  if(productMetric && productMetric.textContent!==String(activeProducts.length))productMetric.textContent=String(activeProducts.length);
  const productHeading=document.querySelector('[data-admin-view="products"] .admin-heading p');
  const headingText=`총 ${activeProducts.length}개 제품의 이름, 카테고리, 이미지와 노출 여부를 관리합니다.`;
  if(productHeading && productHeading.textContent!==headingText)productHeading.textContent=headingText;
}

function scheduleCleanup(){
  clearTimeout(cleanupTimer);
  cleanupTimer=setTimeout(cleanupMainViews,0);
}

function setupTrashUi(){
  document.querySelectorAll('[data-trash-filter]').forEach(button=>button.addEventListener('click',()=>{
    activeFilter=button.dataset.trashFilter||'all';
    document.querySelectorAll('[data-trash-filter]').forEach(item=>item.classList.toggle('is-active',item===button));
    renderTrash();
  }));
  document.querySelector('[data-trash-search]')?.addEventListener('input',renderTrash);
}

function improveCompletedModal(){
  const modal=document.querySelector('[data-admin-detail-modal]');
  if(!modal)return;
  const deleteButton=modal.querySelector('[data-admin-delete]');
  if(deleteButton && deleteButton.textContent!=='휴지통으로 이동') deleteButton.textContent='휴지통으로 이동';
}

/* Only watch for a newly-created detail modal. Do not mutate dashboard/product DOM from this observer. */
const uiObserver=new MutationObserver(()=>{
  if(modalCheckQueued)return;
  modalCheckQueued=true;
  requestAnimationFrame(()=>{
    modalCheckQueued=false;
    improveCompletedModal();
  });
});
uiObserver.observe(document.body,{childList:true,subtree:true});
setupTrashUi();

/* Legacy hard-delete actions are intercepted and turned into soft delete. */
document.addEventListener('click',async event=>{
  const detail=event.target.closest('[data-detail-kind="inquiry"][data-detail-id]');
  if(detail)currentInquiryId=detail.dataset.detailId||'';

  const productDelete=event.target.closest('[data-apv2-delete]');
  if(productDelete){
    event.preventDefault();event.stopImmediatePropagation();
    const id=productDelete.dataset.apv2Delete;
    if(id&&confirm('이 제품을 휴지통으로 이동할까요?\n사이트 제품 목록에서는 즉시 숨겨집니다.')){
      try{await moveToTrash('product',id);}catch(error){console.error('[Trash product]',error?.code||error);alert('휴지통으로 이동하지 못했습니다. 다시 시도해 주세요.');}
    }
    return;
  }

  const inquiryDelete=event.target.closest('[data-direct-delete]');
  if(inquiryDelete){
    event.preventDefault();event.stopImmediatePropagation();
    const id=inquiryDelete.dataset.directDelete;
    if(id&&confirm('이 문의를 휴지통으로 이동할까요?')){
      try{await moveToTrash('inquiry',id);}catch(error){console.error('[Trash inquiry]',error?.code||error);alert('휴지통으로 이동하지 못했습니다. 다시 시도해 주세요.');}
    }
    return;
  }

  const modalDelete=event.target.closest('[data-admin-delete]');
  if(modalDelete){
    event.preventDefault();event.stopImmediatePropagation();
    if(currentInquiryId&&confirm('이 문의를 휴지통으로 이동할까요?')){
      try{await moveToTrash('inquiry',currentInquiryId);const modal=document.querySelector('[data-admin-detail-modal]');if(modal)modal.hidden=true;}catch(error){console.error('[Trash modal]',error?.code||error);alert('휴지통으로 이동하지 못했습니다. 다시 시도해 주세요.');}
    }
    return;
  }
},true);

/* Completion now exposes a clear next action. */
document.addEventListener('click',event=>{
  const complete=event.target.closest('[data-admin-complete]');
  if(!complete)return;
  setTimeout(()=>{
    if(complete.textContent!=='완료됨') complete.textContent='완료됨';
    complete.disabled=true;
    const modal=document.querySelector('[data-admin-detail-modal]');
    const statusRow=[...(modal?.querySelectorAll('.admin-detail-row')||[])].find(row=>row.querySelector('span')?.textContent.trim()==='상태');
    const statusValue=statusRow?.querySelector('div');
    if(statusValue && statusValue.textContent!=='완료')statusValue.textContent='완료';
    const actions=modal?.querySelector('.admin-detail-actions');
    if(actions&&!modal.querySelector('.admin-detail-next'))actions.insertAdjacentHTML('afterend','<div class="admin-detail-next">처리가 완료되었습니다. 정리하려면 <b>휴지통으로 이동</b>해 주세요.</div>');
    improveCompletedModal();
  },450);
});

document.addEventListener('click',async event=>{
  const restore=event.target.closest('[data-trash-restore]');
  const permanent=event.target.closest('[data-trash-permanent]');
  if(restore){
    const [kind,id]=restore.dataset.trashRestore.split(':');
    const item=trashItems.find(i=>i.kind===kind&&i.id===id);
    if(item&&confirm(`“${item.title}”을(를) 원래 위치로 복원할까요?`)){
      try{await restoreTrash(item);}catch(error){console.error(error);alert('복원하지 못했습니다.');}
    }
  }
  if(permanent){
    const [kind,id]=permanent.dataset.trashPermanent.split(':');
    const item=trashItems.find(i=>i.kind===kind&&i.id===id);
    if(item&&confirm(`“${item.title}”을(를) 영구 삭제할까요?\n이 작업은 복구할 수 없습니다.`)){
      try{await permanentlyDelete(item);}catch(error){console.error(error);alert('영구 삭제하지 못했습니다.');}
    }
  }
});

onAuthStateChanged(auth,user=>{
  stops.forEach(stop=>{try{stop();}catch{}});stops=[];
  if(!user)return;
  stops.push(onSnapshot(collection(db,'inquiries'),snapshot=>{
    inquiries=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    renderTrash();scheduleCleanup();
  }));
  stops.push(onSnapshot(collection(db,'products'),snapshot=>{
    products=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    renderTrash();scheduleCleanup();
  }));
});