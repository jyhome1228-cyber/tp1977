import { db } from './firebase-client.js?v=20260818-1115';
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
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

if(category && grid){
  const q = query(collection(db,'products'),where('published','==',true));
  onSnapshot(q,snapshot=>{
    const items=snapshot.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(item=>item.category===category)
      .sort((a,b)=>Number(a.order||999)-Number(b.order||999)||String(a.name||'').localeCompare(String(b.name||''),'ko'));

    // Before the managed catalog is initialized, leave the static page content as a safe fallback.
    if(!items.length) return;

    grid.innerHTML=items.map(item=>`
      <article class="product-item" data-firestore-product="${esc(item.id)}">
        <div class="product-thumb has-source-image"><img src="${esc(item.imageUrl||'')}" alt="${esc(item.name||'제품')}" loading="lazy" decoding="async"></div>
        <div class="product-info">
          <h2>${esc(item.name||'')}</h2>
          ${item.spec?`<p class="product-spec">${esc(item.spec)}</p>`:''}
          ${item.material?`<p class="product-spec">${esc(item.material)}</p>`:''}
          ${item.note?`<p class="product-spec product-note">${esc(item.note)}</p>`:''}
        </div>
      </article>`).join('');
  },error=>console.debug('[Taepyung] managed product catalog unavailable',error?.code||error));
}
