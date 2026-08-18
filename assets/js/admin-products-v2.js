import { app, db, storage } from './firebase-client.js?v=20260818-1228';
import { BASE_PRODUCTS } from './product-catalog-data.js?v=20260818-1115';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp,
  setDoc, updateDoc, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  deleteObject, getDownloadURL, ref as storageRef, uploadBytes
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth = getAuth(app);
const categoryLabels = {
  roll:'두루마리 화장지', jumbo:'점보롤 화장지', hand:'핸드타월',
  kitchen:'키친타월', facial:'미용티슈', etc:'물티슈 · 디스펜서'
};
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
let items = [];
let stopProducts = null;
let editingId = null;
let selectedFile = null;
let currentImageMode = 'url';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeFileName = name => String(name || 'product-image').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-100);

function productMetric(){
  return [...document.querySelectorAll('[data-admin-view="dashboard"] .metric-card')]
    .find(card => card.querySelector('small')?.textContent.trim() === '등록 제품')
    ?.querySelector('strong');
}

async function ensureBaseCatalog(){
  const markerRef = doc(db,'siteMeta','productCatalogV1');
  const marker = await getDoc(markerRef);
  if(marker.exists()) return false;
  const batch = writeBatch(db);
  BASE_PRODUCTS.forEach(product => {
    batch.set(doc(db,'products',product.id),{
      ...product,
      published:true,
      catalogKey:`${product.category}:published`,
      origin:'base',
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
  });
  batch.set(markerRef,{
    version:1,
    seededCount:BASE_PRODUCTS.length,
    seededAt:serverTimestamp()
  });
  await batch.commit();
  return true;
}

function view(){ return document.querySelector('[data-admin-view="products"]'); }

function mount(){
  const root = view();
  if(!root) return;
  root.querySelectorAll('[data-product-manager]:not([data-product-manager-v2])').forEach(el=>el.remove());
  root.querySelector('.content-grid-admin')?.remove();
  if(root.querySelector('[data-product-manager-v2]')) return;

  root.insertAdjacentHTML('beforeend',`
    <section class="admin-products-v2" data-product-manager-v2>
      <div class="apv2-seed" data-apv2-seed hidden>기존 제품 정보를 관리자 목록으로 불러오는 중입니다.</div>
      <div class="apv2-head">
        <div><h3>제품 목록</h3><p>현재 사이트에 등록된 제품을 먼저 확인하고, 수정·삭제·노출 상태를 관리할 수 있습니다.</p></div>
        <button class="apv2-add" type="button" data-apv2-add>+ 제품 추가</button>
      </div>
      <div class="apv2-toolbar">
        <select data-apv2-category aria-label="제품 카테고리 필터"><option value="all">전체 카테고리</option>${Object.entries(categoryLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
        <input type="search" data-apv2-search placeholder="제품명, 규격, 소재 검색">
        <span class="apv2-count" data-apv2-count>0개</span>
      </div>
      <div class="apv2-list" data-apv2-list><div class="apv2-empty">제품 정보를 불러오는 중입니다.</div></div>
    </section>
    <div class="apv2-modal" data-apv2-modal hidden>
      <button class="apv2-backdrop" type="button" data-apv2-close aria-label="닫기"></button>
      <section class="apv2-card" role="dialog" aria-modal="true" aria-labelledby="apv2-title">
        <header><div><small>PRODUCT MANAGER</small><h3 id="apv2-title" data-apv2-title>제품 추가</h3></div><button class="apv2-close" type="button" data-apv2-close aria-label="닫기">×</button></header>
        <form class="apv2-form" data-apv2-form>
          <div class="apv2-field"><label>카테고리 *</label><select name="category" required>${Object.entries(categoryLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
          <div class="apv2-field"><label>정렬 순서</label><input name="order" type="number" min="1" step="1" value="1"></div>
          <div class="apv2-field full"><label>제품명 *</label><input name="name" required></div>

          <div class="apv2-image-field full">
            <label>제품 이미지 *</label>
            <div class="apv2-image-modes" role="group" aria-label="이미지 등록 방식">
              <button type="button" class="is-active" data-image-mode="url">이미지 URL</button>
              <button type="button" data-image-mode="upload">파일 업로드</button>
            </div>
            <div data-image-url-panel>
              <input class="apv2-image-url" name="imageUrl" type="url" placeholder="https://..." required>
              <small>외부 이미지 주소나 CDN 주소를 그대로 입력할 수 있습니다.</small>
            </div>
            <div class="apv2-upload-panel" data-image-upload-panel hidden>
              <label class="apv2-dropzone" data-dropzone>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-image-file hidden>
                <span class="apv2-drop-icon">＋</span>
                <strong>이미지를 이곳에 끌어놓거나 클릭해 선택</strong>
                <small>JPG · PNG · WEBP · GIF / 최대 8MB</small>
              </label>
            </div>
            <div class="apv2-image-preview" data-image-preview hidden><img alt="제품 이미지 미리보기"><div><b data-image-preview-name></b><button type="button" data-image-clear>이미지 선택 해제</button></div></div>
          </div>

          <div class="apv2-field"><label>규격 / 구성</label><input name="spec" placeholder="예: 30m · 3겹 · 30롤"></div>
          <div class="apv2-field"><label>원단 / 소재</label><input name="material" placeholder="예: 천연펄프"></div>
          <div class="apv2-field full"><label>추가 설명</label><textarea name="note" placeholder="친환경 인증, 온라인 전용 등"></textarea></div>
          <label class="apv2-check"><input type="checkbox" name="published" checked> 사이트에 노출</label>
          <p class="apv2-form-status" data-apv2-status></p>
          <div class="apv2-form-actions"><button class="apv2-cancel" type="button" data-apv2-close>취소</button><button class="apv2-save" type="submit" data-apv2-save>저장</button></div>
        </form>
      </section>
    </div>`);

  root.querySelector('[data-apv2-add]')?.addEventListener('click',()=>openForm());
  root.querySelector('[data-apv2-category]')?.addEventListener('change',render);
  root.querySelector('[data-apv2-search]')?.addEventListener('input',render);
  document.querySelectorAll('[data-apv2-close]').forEach(btn=>btn.addEventListener('click',closeForm));
  document.querySelector('[data-apv2-form]')?.addEventListener('submit',saveForm);

  document.querySelectorAll('[data-image-mode]').forEach(button=>button.addEventListener('click',()=>setImageMode(button.dataset.imageMode)));
  document.querySelector('[data-image-file]')?.addEventListener('change',event=>acceptFile(event.target.files?.[0]));
  document.querySelector('[data-image-clear]')?.addEventListener('click',clearSelectedFile);
  const dropzone = document.querySelector('[data-dropzone]');
  ['dragenter','dragover'].forEach(type=>dropzone?.addEventListener(type,event=>{event.preventDefault();dropzone.classList.add('is-dragging');}));
  ['dragleave','drop'].forEach(type=>dropzone?.addEventListener(type,event=>{event.preventDefault();dropzone.classList.remove('is-dragging');}));
  dropzone?.addEventListener('drop',event=>acceptFile(event.dataTransfer?.files?.[0]));
}

function setImageMode(mode){
  currentImageMode = mode === 'upload' ? 'upload' : 'url';
  document.querySelectorAll('[data-image-mode]').forEach(button=>button.classList.toggle('is-active',button.dataset.imageMode===currentImageMode));
  const urlPanel=document.querySelector('[data-image-url-panel]');
  const uploadPanel=document.querySelector('[data-image-upload-panel]');
  const urlInput=document.querySelector('[data-apv2-form] [name="imageUrl"]');
  if(urlPanel) urlPanel.hidden=currentImageMode!=='url';
  if(uploadPanel) uploadPanel.hidden=currentImageMode!=='upload';
  const existing = editingId ? items.find(item=>item.id===editingId) : null;
  if(urlInput) urlInput.required = currentImageMode==='url' && !(existing?.imageUrl && !urlInput.value);
}

function acceptFile(file){
  const status=document.querySelector('[data-apv2-status]');
  if(!file) return;
  if(!file.type.startsWith('image/')){
    if(status){status.textContent='이미지 파일만 업로드할 수 있습니다.';status.dataset.kind='error';}
    return;
  }
  if(file.size>MAX_IMAGE_SIZE){
    if(status){status.textContent='이미지는 8MB 이하로 올려주세요.';status.dataset.kind='error';}
    return;
  }
  selectedFile=file;
  if(status){status.textContent='';status.dataset.kind='';}
  const preview=document.querySelector('[data-image-preview]');
  const img=preview?.querySelector('img');
  const name=document.querySelector('[data-image-preview-name]');
  if(preview) preview.hidden=false;
  if(img) img.src=URL.createObjectURL(file);
  if(name) name.textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)}MB`;
}

function clearSelectedFile(){
  selectedFile=null;
  const fileInput=document.querySelector('[data-image-file]');
  if(fileInput) fileInput.value='';
  const preview=document.querySelector('[data-image-preview]');
  if(preview) preview.hidden=true;
}

async function uploadProductImage(file, productId){
  const path=`product-images/${productId}/${Date.now()}-${safeFileName(file.name)}`;
  const fileRef=storageRef(storage,path);
  await uploadBytes(fileRef,file,{contentType:file.type,cacheControl:'public,max-age=31536000'});
  return {imageUrl:await getDownloadURL(fileRef),storagePath:path};
}

function visibleItems(){
  const root = view();
  const category = root?.querySelector('[data-apv2-category]')?.value || 'all';
  const q = (root?.querySelector('[data-apv2-search]')?.value || '').trim().toLowerCase();
  return [...items]
    .filter(item => category === 'all' || item.category === category)
    .filter(item => !q || [item.name,item.spec,item.material,item.note].join(' ').toLowerCase().includes(q))
    .sort((a,b)=>{
      const ca = Object.keys(categoryLabels).indexOf(a.category), cb = Object.keys(categoryLabels).indexOf(b.category);
      return ca-cb || Number(a.order||999)-Number(b.order||999) || String(a.name||'').localeCompare(String(b.name||''),'ko');
    });
}

function render(){
  mount();
  const root = view();
  const list = root?.querySelector('[data-apv2-list]');
  const filtered = visibleItems();
  if(root?.querySelector('[data-apv2-count]')) root.querySelector('[data-apv2-count]').textContent = `${filtered.length}개 / 전체 ${items.length}개`;
  const metric = productMetric(); if(metric) metric.textContent = String(items.length);
  const heading = root?.querySelector('.admin-heading p'); if(heading) heading.textContent = `총 ${items.length}개 제품의 이름, 카테고리, 이미지와 노출 여부를 관리합니다.`;
  if(!list) return;
  if(!filtered.length){ list.innerHTML='<div class="apv2-empty">조건에 맞는 제품이 없습니다.</div>'; return; }
  list.innerHTML = filtered.map(item=>`
    <article class="apv2-row" data-apv2-row="${esc(item.id)}">
      <div class="apv2-thumb">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.name||'제품')}" loading="lazy">`:''}</div>
      <div class="apv2-main"><small>${esc(categoryLabels[item.category]||item.category||'제품')}</small><h4>${esc(item.name||'-')}</h4><p>${esc(item.spec||item.material||item.note||'추가 정보 없음')}</p></div>
      <div class="apv2-order">순서 ${Number(item.order||0) || '-'}</div>
      <span class="apv2-state${item.published?'':' is-hidden'}">${item.published?'노출중':'숨김'}</span>
      <div class="apv2-actions">
        <button type="button" data-apv2-toggle="${esc(item.id)}">${item.published?'숨기기':'노출하기'}</button>
        <button type="button" data-apv2-edit="${esc(item.id)}">수정</button>
        <button class="danger" type="button" data-apv2-delete="${esc(item.id)}">삭제</button>
      </div>
    </article>`).join('');

  list.querySelectorAll('[data-apv2-edit]').forEach(btn=>btn.addEventListener('click',()=>openForm(btn.dataset.apv2Edit)));
  list.querySelectorAll('[data-apv2-toggle]').forEach(btn=>btn.addEventListener('click',()=>toggleProduct(btn.dataset.apv2Toggle)));
  list.querySelectorAll('[data-apv2-delete]').forEach(btn=>btn.addEventListener('click',()=>removeProduct(btn.dataset.apv2Delete)));
}

function showExistingImage(item){
  const preview=document.querySelector('[data-image-preview]');
  const img=preview?.querySelector('img');
  const name=document.querySelector('[data-image-preview-name]');
  if(!item?.imageUrl){if(preview)preview.hidden=true;return;}
  if(preview) preview.hidden=false;
  if(img) img.src=item.imageUrl;
  if(name) name.textContent=item.storagePath?'현재 업로드 이미지':'현재 이미지 URL';
}

function openForm(id=''){
  const modal = document.querySelector('[data-apv2-modal]');
  const form = modal?.querySelector('[data-apv2-form]');
  const title = modal?.querySelector('[data-apv2-title]');
  const status = modal?.querySelector('[data-apv2-status]');
  if(!modal || !form) return;
  form.reset();
  selectedFile=null;
  editingId = id || null;
  if(status){status.textContent='';status.dataset.kind='';}
  const item = items.find(product=>product.id===id);
  if(item){
    title.textContent='제품 수정';
    form.elements.category.value=item.category||'roll';
    form.elements.order.value=Number(item.order||1);
    form.elements.name.value=item.name||'';
    form.elements.imageUrl.value=item.imageUrl||'';
    form.elements.spec.value=item.spec||'';
    form.elements.material.value=item.material||'';
    form.elements.note.value=item.note||'';
    form.elements.published.checked=item.published!==false;
    setImageMode(item.storagePath?'upload':'url');
    showExistingImage(item);
  }else{
    title.textContent='제품 추가';
    form.elements.published.checked=true;
    setImageMode('url');
    clearSelectedFile();
    const category = view()?.querySelector('[data-apv2-category]')?.value;
    if(category && category!=='all') form.elements.category.value=category;
    const sameCategory = items.filter(p=>p.category===form.elements.category.value);
    form.elements.order.value = Math.max(0,...sameCategory.map(p=>Number(p.order||0)))+1;
  }
  modal.hidden=false;
  requestAnimationFrame(()=>form.elements.name?.focus());
}

function closeForm(){
  const modal=document.querySelector('[data-apv2-modal]');
  if(modal) modal.hidden=true;
  editingId=null;
  selectedFile=null;
}

async function saveForm(event){
  event.preventDefault();
  const form=event.currentTarget;
  const existing=editingId?items.find(product=>product.id===editingId):null;
  const urlInput=form.elements.imageUrl;
  if(currentImageMode==='url'){
    urlInput.required=true;
  }else{
    urlInput.required=false;
    if(!selectedFile && !existing?.imageUrl){
      const status=form.querySelector('[data-apv2-status]');
      status.textContent='업로드할 이미지를 선택해 주세요.';status.dataset.kind='error';
      return;
    }
  }
  if(!form.reportValidity()) return;

  const status=form.querySelector('[data-apv2-status]');
  const save=form.querySelector('[data-apv2-save]');
  const data=new FormData(form);
  const category=String(data.get('category')||'roll');
  const published=data.get('published')==='on';
  const productRef=editingId?doc(db,'products',editingId):doc(collection(db,'products'));
  let imageUrl=currentImageMode==='url'?String(data.get('imageUrl')||'').trim():(existing?.imageUrl||'');
  let storagePath=currentImageMode==='upload'?(existing?.storagePath||''):'';
  let oldStoragePath=existing?.storagePath||'';

  save.disabled=true;
  status.textContent=editingId?'수정 중입니다.':'등록 중입니다.';
  status.dataset.kind='';
  try{
    if(selectedFile){
      status.textContent='이미지를 업로드하는 중입니다.';
      const uploaded=await uploadProductImage(selectedFile,productRef.id);
      imageUrl=uploaded.imageUrl;
      storagePath=uploaded.storagePath;
    }
    const payload={
      category,
      catalogKey:`${category}:${published?'published':'hidden'}`,
      order:Number(data.get('order')||1),
      name:String(data.get('name')||'').trim(),
      imageUrl,
      storagePath,
      spec:String(data.get('spec')||'').trim(),
      material:String(data.get('material')||'').trim(),
      note:String(data.get('note')||'').trim(),
      published,
      updatedAt:serverTimestamp()
    };
    if(editingId){
      await updateDoc(productRef,payload);
    }else{
      await setDoc(productRef,{...payload,origin:'admin',createdAt:serverTimestamp()});
    }
    if(oldStoragePath && oldStoragePath!==storagePath){
      deleteObject(storageRef(storage,oldStoragePath)).catch(()=>{});
    }
    status.textContent=editingId?'제품 정보가 수정되었습니다.':'제품이 등록되었습니다.';
    status.dataset.kind='success';
    setTimeout(closeForm,350);
  }catch(error){
    console.error('[Admin product save]',error?.code||error);
    status.textContent=String(error?.code||'').includes('storage/')?'이미지 업로드에 실패했습니다. Storage 설정을 확인해 주세요.':'저장에 실패했습니다. Firestore 권한을 확인해 주세요.';
    status.dataset.kind='error';
  }finally{save.disabled=false;}
}

async function toggleProduct(id){
  const item=items.find(product=>product.id===id); if(!item) return;
  const published=!item.published;
  await updateDoc(doc(db,'products',id),{published,catalogKey:`${item.category}:${published?'published':'hidden'}`,updatedAt:serverTimestamp()});
}

async function removeProduct(id){
  const item=items.find(product=>product.id===id); if(!item) return;
  if(!confirm(`“${item.name}” 제품을 삭제할까요?\n삭제하면 사이트 제품 목록에서도 사라집니다.`)) return;
  await deleteDoc(doc(db,'products',id));
  if(item.storagePath) deleteObject(storageRef(storage,item.storagePath)).catch(()=>{});
}

const productViewObserver = new MutationObserver(()=>{
  const root=view(); if(!root) return;
  root.querySelectorAll('[data-product-manager]:not([data-product-manager-v2])').forEach(el=>el.remove());
});
if(view()) productViewObserver.observe(view(),{childList:true,subtree:true});

onAuthStateChanged(auth,async user=>{
  if(stopProducts){stopProducts();stopProducts=null;}
  if(!user) return;
  mount();
  const seedNotice=view()?.querySelector('[data-apv2-seed]');
  try{
    if(seedNotice) seedNotice.hidden=false;
    const seeded=await ensureBaseCatalog();
    if(seedNotice){seedNotice.textContent=seeded?'기존 42개 제품을 관리자 관리 목록으로 전환했습니다.':'제품 관리 데이터를 불러왔습니다.';setTimeout(()=>{seedNotice.hidden=true;},1600);}
  }catch(error){
    console.error('[Admin product seed]',error?.code||error);
    if(seedNotice){seedNotice.hidden=false;seedNotice.textContent='기존 제품 목록 초기화에 실패했습니다. Firestore Rules를 확인해 주세요.';}
  }
  stopProducts=onSnapshot(collection(db,'products'),snapshot=>{
    items=snapshot.docs.map(s=>({id:s.id,...s.data()}));
    render();
  },error=>{
    console.error('[Admin products v2]',error?.code||error);
    const list=view()?.querySelector('[data-apv2-list]');if(list)list.innerHTML='<div class="apv2-empty">제품 목록을 불러오지 못했습니다. Firestore 설정을 확인해 주세요.</div>';
  });
});
