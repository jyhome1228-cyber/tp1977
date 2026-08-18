import { db } from './firebase-client.js?v=20260818-1058';
import { collection, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const path = location.pathname.replace(/^\/tp1977(?=\/|$)/,'').replace(/\/index\.html$/,'/');
const categoryMap = {
  '/product/roll/':'roll',
  '/product/jumbo-roll/':'jumbo',
  '/product/hand-towel/':'hand',
  '/product/kitchen-towel/':'kitchen',
  '/product/facial-tissue/':'facial',
  '/product/etc/':'etc'
};
const category = categoryMap[path];
const grid = document.querySelector('.product-catalog-grid');
if(category && grid){
  const q = query(collection(db,'products'),where('catalogKey','==',`${category}:published`));
  onSnapshot(q,snapshot=>{
    grid.querySelectorAll('[data-admin-product]').forEach(el=>el.remove());
    const items=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
      const am=a.createdAt?.toMillis?.()||0,bm=b.createdAt?.toMillis?.()||0;return am-bm;
    });
    items.forEach(item=>{
      const article=document.createElement('article');
      article.className='product-item';article.dataset.adminProduct=item.id;
      article.innerHTML=`<div class="product-thumb has-source-image"><img src="${String(item.imageUrl||'').replace(/"/g,'&quot;')}" alt="${String(item.name||'제품').replace(/"/g,'&quot;')}" loading="lazy"></div><div class="product-info"><h2>${String(item.name||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</h2>${item.spec?`<p class="product-spec">${String(item.spec).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p>`:''}${item.material?`<p class="product-spec">${String(item.material).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p>`:''}${item.note?`<p class="product-spec product-note">${String(item.note).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p>`:''}</div>`;
      grid.appendChild(article);
    });
  },error=>console.debug('[Taepyung] admin products unavailable',error?.code||error));
}
