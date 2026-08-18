import { app, db, storage } from './firebase-client.js?v=20260818-1448';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  collection, doc, getDoc, onSnapshot, serverTimestamp, writeBatch, deleteDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { deleteObject, ref as storageRef } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth = getAuth(app);
let trashItems = [];
let stopTrash = null;
let currentInquiryId = '';
let activeFilter = 'all';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const millis = value => value?.toMillis?.() || 0;
const formatDate = value => {
  const date = value?.toDate?.();
  if(!date) return '-';
  return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);
};

function sourceInfo(kind){
  if(kind === 'product') return {collectionName:'products',label:'제품'};
  return {collectionName:'inquiries',label:'문의'};
}

async function moveToTrash(kind,id){
  const info = sourceInfo(kind);
  const sourceRef = doc(db,info.collectionName,id);
  const snap = await getDoc(sourceRef);
  if(!snap.exists()) return;
  const data = snap.data();
  const trashRef = doc(collection(db,'trash'));
  const title = kind === 'product' ? (data.name || '제품') : (data.subject || data.name || '문의');
  const summary = kind === 'product'
    ? [data.category,data.spec,data.material].filter(Boolean).join(' · ')
    : [data.company || data.name,data.type || data.inquiryType].filter(Boolean).join(' · ');
  const batch = writeBatch(db);
  batch.set(trashRef,{
    kind,
    category:info.label,
    sourceCollection:info.collectionName,
    sourceId:id,
    title,
    summary,
    snapshot:data,
    deletedAt:serverTimestamp()
  });
  batch.delete(sourceRef);
  await batch.commit();
}

async function restoreTrash(id){
  const trashRef = doc(db,'trash',id);
  const snap = await getDoc(trashRef);
  if(!snap.exists()) return;
  const item = snap.data();
  if(!item.sourceCollection || !item.sourceId || !item.snapshot) return;
  const batch = writeBatch(db);
  batch.set(doc(db,item.sourceCollection,item.sourceId),{
    ...item.snapshot,
    updatedAt:serverTimestamp()
  });
  batch.delete(trashRef);
  await batch.commit();
}

async function permanentlyDelete(id){
  const trashRef = doc(db,'trash',id);
  const snap = await getDoc(trashRef);
  if(!snap.exists()) return;
  const item = snap.data();
  if(item.kind === 'product' && item.snapshot?.storagePath){
    try{ await deleteObject(storageRef(storage,item.snapshot.storagePath)); }catch(error){ console.debug('[Trash] storage cleanup skipped',error?.code || error); }
  }
  await deleteDoc(trashRef);
}

function renderCounts(){
  const counts={all:trashItems.length,inquiry:trashItems.filter(i=>i.kind==='inquiry').length,product:trashItems.filter(i=>i.kind==='product').length};
  Object.entries(counts).forEach(([key,value])=>{
    const el=document.querySelector(`[data-trash-count="${key}"]`);if(el)el.textContent=String(value);
  });
}

function renderTrash(){
  const list=document.querySelector('[data-trash-list]');
  if(!list) return;
  const q=(document.querySelector('[data-trash-search]')?.value||'').trim().toLowerCase();
  const filtered=trashItems
    .filter(item=>activeFilter==='all'||item.kind===activeFilter)
    .filter(item=>!q||[item.title,item.summary,item.category].join(' ').toLowerCase().includes(q))
    .sort((a,b)=>millis(b.deletedAt)-millis(a.deletedAt));
  renderCounts();
  if(!filtered.length){
    list.innerHTML='<div class="admin-trash-empty">조건에 맞는 삭제 항목이 없습니다.</div>';
    return;
  }
  list.innerHTML=filtered.map(item=>`
    <article class="admin-trash-row">
      <span class="admin-trash-kind${item.kind==='product'?' is-product':''}">${item.kind==='product'?'제품':'문의'}</span>
      <div class="admin-trash-main"><small>${esc(item.category||'삭제 항목')}</small><h4>${esc(item.title||'-')}</h4><p>${esc(item.summary||'추가 정보 없음')}</p></div>
      <span class="admin-trash-date">${formatDate(item.deletedAt)}</span>
      <div class="admin-trash-actions"><button type="button" data-trash-restore="${esc(item.id)}">복원</button><button class="danger" type="button" data-trash-permanent="${esc(item.id)}">영구 삭제</button></div>
    </article>`).join('');
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
  if(!modal) return;
  const deleteButton=modal.querySelector('[data-admin-delete]');
  if(deleteButton) deleteButton.textContent='휴지통으로 이동';
}

const uiObserver=new MutationObserver(improveCompletedModal);
uiObserver.observe(document.body,{childList:true,subtree:true});
setupTrashUi();
improveCompletedModal();

/* Intercept legacy hard-delete actions and convert them to soft-delete. */
document.addEventListener('click',async event=>{
  const detail=event.target.closest('[data-detail-kind="inquiry"][data-detail-id]');
  if(detail) currentInquiryId=detail.dataset.detailId||'';

  const productDelete=event.target.closest('[data-apv2-delete]');
  if(productDelete){
    event.preventDefault();event.stopImmediatePropagation();
    const id=productDelete.dataset.apv2Delete;
    if(id&&confirm('이 제품을 휴지통으로 이동할까요?\n사이트 제품 목록에서는 즉시 숨겨집니다.')){
      try{await moveToTrash('product',id);}catch(error){console.error(error);alert('휴지통으로 이동하지 못했습니다.');}
    }
    return;
  }

  const inquiryDelete=event.target.closest('[data-direct-delete]');
  if(inquiryDelete){
    event.preventDefault();event.stopImmediatePropagation();
    const id=inquiryDelete.dataset.directDelete;
    if(id&&confirm('이 문의를 휴지통으로 이동할까요?')){
      try{await moveToTrash('inquiry',id);}catch(error){console.error(error);alert('휴지통으로 이동하지 못했습니다.');}
    }
    return;
  }

  const modalDelete=event.target.closest('[data-admin-delete]');
  if(modalDelete){
    event.preventDefault();event.stopImmediatePropagation();
    if(currentInquiryId&&confirm('이 문의를 휴지통으로 이동할까요?')){
      try{
        await moveToTrash('inquiry',currentInquiryId);
        const modal=document.querySelector('[data-admin-detail-modal]');if(modal)modal.hidden=true;
      }catch(error){console.error(error);alert('휴지통으로 이동하지 못했습니다.');}
    }
    return;
  }
},true);

/* After completion, expose the next action instead of leaving the modal static. */
document.addEventListener('click',event=>{
  const complete=event.target.closest('[data-admin-complete]');
  if(!complete) return;
  setTimeout(()=>{
    complete.textContent='완료됨';
    complete.disabled=true;
    const modal=document.querySelector('[data-admin-detail-modal]');
    const statusRow=[...(modal?.querySelectorAll('.admin-detail-row')||[])].find(row=>row.querySelector('span')?.textContent.trim()==='상태');
    if(statusRow) statusRow.querySelector('div').textContent='완료';
    const actions=modal?.querySelector('.admin-detail-actions');
    if(actions&&!modal.querySelector('.admin-detail-next')) actions.insertAdjacentHTML('afterend','<div class="admin-detail-next">처리가 완료되었습니다. 더 이상 목록에 둘 필요가 없으면 <b>휴지통으로 이동</b>해 정리할 수 있습니다.</div>');
    improveCompletedModal();
  },450);
});

document.addEventListener('click',async event=>{
  const restore=event.target.closest('[data-trash-restore]');
  const permanent=event.target.closest('[data-trash-permanent]');
  if(restore){
    const item=trashItems.find(i=>i.id===restore.dataset.trashRestore);
    if(!item) return;
    if(confirm(`“${item.title||'항목'}”을(를) 원래 위치로 복원할까요?`)){
      try{await restoreTrash(item.id);}catch(error){console.error(error);alert('복원하지 못했습니다.');}
    }
  }
  if(permanent){
    const item=trashItems.find(i=>i.id===permanent.dataset.trashPermanent);
    if(!item) return;
    if(confirm(`“${item.title||'항목'}”을(를) 영구 삭제할까요?\n이 작업은 복구할 수 없습니다.`)){
      try{await permanentlyDelete(item.id);}catch(error){console.error(error);alert('영구 삭제하지 못했습니다.');}
    }
  }
});

onAuthStateChanged(auth,user=>{
  if(stopTrash){stopTrash();stopTrash=null;}
  if(!user) return;
  stopTrash=onSnapshot(collection(db,'trash'),snapshot=>{
    trashItems=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    renderTrash();
  },error=>{
    console.error('[Admin trash]',error?.code||error);
    const list=document.querySelector('[data-trash-list]');
    if(list) list.innerHTML='<div class="admin-trash-empty">휴지통 데이터를 불러오지 못했습니다. Firestore Rules를 확인해 주세요.</div>';
  });
});
