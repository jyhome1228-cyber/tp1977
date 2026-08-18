import { db } from './firebase-client.js?v=20260818-1058';
import { doc, getDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

async function loadItem(kind,id){
  const collectionName=kind==='inquiry'?'inquiries':'customerInquiries';
  const snap=await getDoc(doc(db,collectionName,id));
  return snap.exists()?{id,kind,collectionName,...snap.data()}:null;
}

function printable(item){
  const fields=item.kind==='inquiry'?[['접수유형',item.type],['문의구분',item.inquiryType],['제휴유형',item.partnershipType],['이름',item.name],['회사/기관',item.company],['연락처',item.phone],['이메일',item.email],['문의제품',item.product],['관련항목',item.relatedItem],['제목',item.subject],['내용',item.message],['상태',item.status]]:[['이름',item.name],['회사',item.company],['연락처',item.phone],['이메일',item.email],['문의제품',item.product],['문의유형',item.category],['내용',item.message],['상태',item.status]];
  const rows=fields.filter(([,v])=>v).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v).replace(/\n/g,'<br>')}</td></tr>`).join('');
  const title=item.subject||item.product||'문의 상세';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,'Malgun Gothic',sans-serif;color:#171917;margin:40px}header{border-bottom:2px solid #22793a;padding-bottom:20px;margin-bottom:22px}header small{color:#22793a;font-weight:700}h1{margin:8px 0 0;font-size:25px}table{width:100%;border-collapse:collapse}th,td{padding:11px 8px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top;font-size:12px}th{width:135px;color:#666}footer{margin-top:28px;color:#999;font-size:10px}@media print{body{margin:18mm}}</style></head><body><header><small>TAEPYUNG PAPER</small><h1>${esc(title)}</h1></header><table>${rows}</table><footer>태평제지(주) · ${new Date().toLocaleString('ko-KR')}</footer><script>window.onload=()=>window.print()<\/script></body></html>`;
}

async function reply(kind,id){
  const item=await loadItem(kind,id);if(!item)return;
  if(!item.email)return alert('회신할 이메일 주소가 없습니다.');
  await updateDoc(doc(db,item.collectionName,id),{status:item.status==='신규'?'확인중':item.status,updatedAt:serverTimestamp()}).catch(()=>{});
  const subject=`[태평제지 답변] ${item.subject||item.product||'문의'}`;
  const body='안녕하세요. 태평제지입니다.\n\n문의해주신 내용에 대해 답변드립니다.\n\n';
  location.href=`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function pdf(kind,id){
  const item=await loadItem(kind,id);if(!item)return;
  const win=window.open('','_blank','width=900,height=900');if(!win)return alert('팝업 차단을 해제해 주세요.');
  try{win.opener=null;}catch{}
  win.document.write(printable(item));win.document.close();
}

function enhanceTable(viewName,kind){
  const view=document.querySelector(`[data-admin-view="${viewName}"]`);if(!view)return;
  const table=view.querySelector('.admin-table');if(!table)return;
  const head=table.querySelector('thead tr');
  if(head&&!head.querySelector('[data-manage-head]'))head.insertAdjacentHTML('beforeend','<th data-manage-head>관리</th>');
  table.querySelectorAll('tbody tr[data-detail-id]').forEach(row=>{
    if(row.querySelector('[data-row-tools]'))return;
    const id=row.dataset.detailId;const rowKind=row.dataset.detailKind||kind;
    row.insertAdjacentHTML('beforeend',`<td data-row-tools><div class="admin-row-tools"><button type="button" data-direct-reply="${esc(rowKind)}:${esc(id)}">회신</button><button type="button" data-direct-pdf="${esc(rowKind)}:${esc(id)}">PDF</button></div></td>`);
  });
  table.querySelectorAll('tbody tr:not([data-detail-id])').forEach(row=>{
    const cell=row.querySelector('td[colspan]');if(cell&&head)cell.colSpan=head.children.length;
  });
}

function run(){enhanceTable('inquiries','inquiry');enhanceTable('customer','customer');}
const observer=new MutationObserver(run);observer.observe(document.body,{childList:true,subtree:true});run();

document.addEventListener('click',e=>{
  const r=e.target.closest('[data-direct-reply]');const p=e.target.closest('[data-direct-pdf]');
  if(r){e.preventDefault();e.stopPropagation();const [kind,id]=r.dataset.directReply.split(':');reply(kind,id);}
  if(p){e.preventDefault();e.stopPropagation();const [kind,id]=p.dataset.directPdf.split(':');pdf(kind,id);}
});
