import { db } from './firebase-client.js?v=20260818-1228';
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let currentInquiryId = '';

async function loadItem(id){
  const snap=await getDoc(doc(db,'inquiries',id));
  return snap.exists()?{id,...snap.data()}:null;
}

function printable(item){
  const fields=[['접수유형',item.type],['문의구분',item.inquiryType],['제휴유형',item.partnershipType],['이름',item.name],['회사/기관',item.company],['연락처',item.phone],['이메일',item.email],['문의제품',item.product],['관련항목',item.relatedItem],['제목',item.subject],['내용',item.message],['상태',item.status]];
  const rows=fields.filter(([,v])=>v).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v).replace(/\n/g,'<br>')}</td></tr>`).join('');
  const title=item.subject||'문의 상세';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,'Malgun Gothic',sans-serif;color:#171917;margin:40px}header{border-bottom:2px solid #22793a;padding-bottom:20px;margin-bottom:22px}header small{color:#22793a;font-weight:700}h1{margin:8px 0 0;font-size:25px}table{width:100%;border-collapse:collapse}th,td{padding:11px 8px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top;font-size:12px}th{width:135px;color:#666}footer{margin-top:28px;color:#999;font-size:10px}@media print{body{margin:18mm}}</style></head><body><header><small>TAEPYUNG PAPER · ${esc(item.type||'문의·제휴')}</small><h1>${esc(title)}</h1></header><table>${rows}</table><footer>태평제지(주) · ${new Date().toLocaleString('ko-KR')}</footer><script>window.onload=()=>window.print()<\/script></body></html>`;
}

async function reply(id){
  const item=await loadItem(id);if(!item)return;
  if(!item.email)return alert('회신할 이메일 주소가 없습니다.');
  await updateDoc(doc(db,'inquiries',id),{status:item.status==='신규'?'확인중':item.status,updatedAt:serverTimestamp()}).catch(()=>{});
  const subject=`[태평제지 답변] ${item.subject||'문의'}`;
  const body='안녕하세요. 태평제지입니다.\n\n문의해주신 내용에 대해 답변드립니다.\n\n';
  location.href=`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function pdf(id){
  const item=await loadItem(id);if(!item)return;
  const win=window.open('','_blank','width=900,height=900');if(!win)return alert('팝업 차단을 해제해 주세요.');
  try{win.opener=null;}catch{}
  win.document.write(printable(item));win.document.close();
}

async function removeInquiry(id){
  const item=await loadItem(id);if(!item)return;
  if(!confirm(`“${item.subject||item.name||'문의'}” 항목을 삭제할까요?\n삭제한 문의는 복구할 수 없습니다.`)) return;
  await deleteDoc(doc(db,'inquiries',id));
  const modal=document.querySelector('[data-admin-detail-modal]');if(modal)modal.hidden=true;
}

function enhanceTable(){
  const view=document.querySelector('[data-admin-view="inquiries"]');if(!view)return;
  const table=view.querySelector('.admin-table');if(!table)return;
  const head=table.querySelector('thead tr');
  if(head&&!head.querySelector('[data-manage-head]'))head.insertAdjacentHTML('beforeend','<th data-manage-head>관리</th>');
  table.querySelectorAll('tbody tr[data-detail-id]').forEach(row=>{
    if(row.querySelector('[data-row-tools]'))return;
    const id=row.dataset.detailId;
    row.insertAdjacentHTML('beforeend',`<td data-row-tools><div class="admin-row-tools"><button type="button" data-direct-reply="${esc(id)}">회신</button><button type="button" data-direct-pdf="${esc(id)}">PDF</button><button class="is-danger" type="button" data-direct-delete="${esc(id)}">삭제</button></div></td>`);
  });
  table.querySelectorAll('tbody tr:not([data-detail-id])').forEach(row=>{
    const cell=row.querySelector('td[colspan]');if(cell&&head)cell.colSpan=head.children.length;
  });
}

function enhanceModal(){
  const modal=document.querySelector('[data-admin-detail-modal]');
  const actions=modal?.querySelector('.admin-detail-actions');
  if(!actions || actions.querySelector('[data-admin-delete]')) return;
  actions.insertAdjacentHTML('beforeend','<button class="is-danger" type="button" data-admin-delete>삭제</button>');
}

function run(){enhanceTable();enhanceModal();}
const observer=new MutationObserver(run);observer.observe(document.body,{childList:true,subtree:true});run();

document.addEventListener('click',e=>{
  const detail=e.target.closest('[data-detail-kind="inquiry"][data-detail-id]');
  if(detail) currentInquiryId=detail.dataset.detailId;
  const r=e.target.closest('[data-direct-reply]');
  const p=e.target.closest('[data-direct-pdf]');
  const d=e.target.closest('[data-direct-delete]');
  const modalDelete=e.target.closest('[data-admin-delete]');
  if(r){e.preventDefault();e.stopPropagation();reply(r.dataset.directReply);}
  if(p){e.preventDefault();e.stopPropagation();pdf(p.dataset.directPdf);}
  if(d){e.preventDefault();e.stopPropagation();removeInquiry(d.dataset.directDelete);}
  if(modalDelete&&currentInquiryId){e.preventDefault();e.stopPropagation();removeInquiry(currentInquiryId);}
});
