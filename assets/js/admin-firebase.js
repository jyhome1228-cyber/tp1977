import { app, db } from './firebase-client.js?v=20260817-2154';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  documentId
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth = getAuth(app);
const ADMIN_ID = 'tp1977';
const ADMIN_EMAIL = 'tp5950797@naver.com';
const STATUS_OPTIONS = ['신규', '확인중', '완료', '보관'];

const loginScreen = document.querySelector('[data-admin-login-screen]');
const adminApp = document.querySelector('[data-admin-app]');
const loginForm = document.querySelector('[data-admin-login-form]');
const idInput = document.querySelector('[data-admin-id]');
const passwordInput = document.querySelector('[data-admin-password]');
const loginMessage = document.querySelector('[data-admin-login-message]');
const loginButton = document.querySelector('[data-admin-login-button]');
const logoutButton = document.querySelector('[data-admin-logout]');

let unsubscribe = [];
let inquiryItems = [];
let customerItems = [];
let visitorItems = [];

const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const toMillis = value => value?.toMillis?.() || 0;
const formatDateTime = value => {
  const date = value?.toDate?.();
  if (!date) return '방금 전';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const kstDateKey = date => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const pick = type => parts.find(part => part.type === type)?.value || '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
};

function setMessage(message = '', type = '') {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.dataset.type = type;
  loginMessage.hidden = !message;
}

function showLogin() {
  stopDataListeners();
  document.body.classList.remove('admin-authenticated');
  document.body.classList.add('admin-guest');
  if (loginScreen) loginScreen.hidden = false;
  if (adminApp) adminApp.hidden = true;
  requestAnimationFrame(() => idInput?.focus());
}

function showAdmin() {
  document.body.classList.remove('admin-guest');
  document.body.classList.add('admin-authenticated');
  if (loginScreen) loginScreen.hidden = true;
  if (adminApp) adminApp.hidden = false;
  setMessage('');
  startDataListeners();
}

function findMetric(view, label) {
  return [...document.querySelectorAll(`[data-admin-view="${view}"] .metric-card`)]
    .find(card => card.querySelector('small')?.textContent.trim() === label)
    ?.querySelector('strong');
}

function statusSelect(item, collectionName) {
  return `<select class="admin-status-select" data-status-id="${escapeHTML(item.id)}" data-status-collection="${collectionName}" aria-label="처리 상태">
    ${STATUS_OPTIONS.map(status => `<option value="${status}"${status === item.status ? ' selected' : ''}>${status}</option>`).join('')}
  </select>`;
}

function renderInquiryTable() {
  const tbody = document.querySelector('[data-admin-view="inquiries"] .admin-table tbody');
  if (!tbody) return;
  if (!inquiryItems.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="admin-empty-cell">등록된 문의가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = inquiryItems.map(item => `
    <tr class="admin-data-row" data-detail-kind="inquiry" data-detail-id="${escapeHTML(item.id)}">
      <td>${formatDateTime(item.createdAt)}</td>
      <td><span class="admin-type-pill">${escapeHTML(item.type || '문의하기')}</span></td>
      <td><strong>${escapeHTML(item.company || item.name || '-')}</strong><small>${escapeHTML(item.company ? item.name : '')}</small></td>
      <td>${escapeHTML(item.subject || '-')}</td>
      <td>${statusSelect(item, 'inquiries')}</td>
    </tr>`).join('');
}

function ensureCustomerTable() {
  const panel = document.querySelector('[data-admin-view="customer"] .panel');
  if (!panel) return null;
  let tbody = panel.querySelector('tbody[data-customer-tbody]');
  if (tbody) return tbody;
  panel.querySelector('.empty-state')?.remove();
  panel.insertAdjacentHTML('beforeend', `
    <div class="admin-table-scroll">
      <table class="admin-table">
        <thead><tr><th>접수일</th><th>유형</th><th>고객 / 회사</th><th>문의 제품</th><th>내용</th><th>상태</th></tr></thead>
        <tbody data-customer-tbody></tbody>
      </table>
    </div>`);
  return panel.querySelector('tbody[data-customer-tbody]');
}

function renderCustomerTable() {
  const tbody = ensureCustomerTable();
  if (!tbody) return;
  if (!customerItems.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-empty-cell">등록된 고객문의가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = customerItems.map(item => `
    <tr class="admin-data-row" data-detail-kind="customer" data-detail-id="${escapeHTML(item.id)}">
      <td>${formatDateTime(item.createdAt)}</td>
      <td>${escapeHTML(item.category || '-')}</td>
      <td><strong>${escapeHTML(item.name || '-')}</strong><small>${escapeHTML(item.company || '')}</small></td>
      <td>${escapeHTML(item.product || '-')}</td>
      <td class="admin-message-preview">${escapeHTML(item.message || '-')}</td>
      <td>${statusSelect(item, 'customerInquiries')}</td>
    </tr>`).join('');
}

function renderOpenCount() {
  const count = [...inquiryItems, ...customerItems].filter(item => !['완료', '보관'].includes(item.status)).length;
  const target = findMetric('dashboard', '미처리 문의');
  if (target) target.textContent = String(count);
}

function renderRecent() {
  const panel = document.querySelector('[data-admin-view="dashboard"] .admin-grid .panel:first-child');
  if (!panel) return;
  const old = panel.querySelector('.empty-state, .admin-recent-list');
  const recent = [
    ...inquiryItems.map(item => ({ ...item, _kind: 'inquiry', _label: item.type || '문의·제휴' })),
    ...customerItems.map(item => ({ ...item, _kind: 'customer', _label: item.category || '고객문의' }))
  ].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 6);

  const wrapper = document.createElement('div');
  wrapper.className = 'admin-recent-list';
  wrapper.innerHTML = recent.length ? recent.map(item => `
    <button type="button" class="admin-recent-item" data-detail-kind="${item._kind}" data-detail-id="${escapeHTML(item.id)}">
      <span><b>${escapeHTML(item._label)}</b><small>${formatDateTime(item.createdAt)}</small></span>
      <strong>${escapeHTML(item.subject || item.product || item.message || '-')}</strong>
      <em>${escapeHTML(item.company || item.name || '-')} · ${escapeHTML(item.status || '신규')}</em>
    </button>`).join('') : '<div class="empty-state"><b>등록된 문의가 없습니다.</b><p>새 문의가 접수되면 최근 순서대로 표시됩니다.</p></div>';
  old?.replaceWith(wrapper);
}

function ensureVisitorTable() {
  const panel = document.querySelector('[data-admin-view="visitors"] .panel');
  if (!panel) return null;
  let tbody = panel.querySelector('tbody[data-visitor-tbody]');
  if (tbody) return tbody;
  panel.querySelector('.empty-state')?.remove();
  panel.innerHTML = `
    <div class="panel-head"><h3>최근 방문 현황</h3></div>
    <div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>날짜</th><th>방문자</th><th>페이지 조회</th></tr></thead><tbody data-visitor-tbody></tbody></table></div>`;
  return panel.querySelector('tbody[data-visitor-tbody]');
}

function renderVisitors() {
  const today = kstDateKey(new Date());
  const todayDate = new Date();
  const last7 = new Set(Array.from({ length: 7 }, (_, index) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - index);
    return kstDateKey(d);
  }));
  const monthPrefix = today.slice(0, 7);
  const byDate = new Map(visitorItems.map(item => [item.id, item]));
  const todayCount = Number(byDate.get(today)?.visitors || 0);
  const weekCount = visitorItems.filter(item => last7.has(item.id)).reduce((sum, item) => sum + Number(item.visitors || 0), 0);
  const monthCount = visitorItems.filter(item => item.id.startsWith(monthPrefix)).reduce((sum, item) => sum + Number(item.visitors || 0), 0);
  const totalCount = visitorItems.reduce((sum, item) => sum + Number(item.visitors || 0), 0);

  const dashboardToday = findMetric('dashboard', '오늘 방문자');
  if (dashboardToday) dashboardToday.textContent = todayCount.toLocaleString('ko-KR');
  const values = { '오늘': todayCount, '최근 7일': weekCount, '이번 달': monthCount, '누적': totalCount };
  Object.entries(values).forEach(([label, value]) => {
    const target = findMetric('visitors', label);
    if (target) target.textContent = Number(value).toLocaleString('ko-KR');
  });

  const tbody = ensureVisitorTable();
  if (!tbody) return;
  const recent = [...visitorItems].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 14);
  tbody.innerHTML = recent.length ? recent.map(item => `
    <tr><td>${escapeHTML(item.id)}</td><td><strong>${Number(item.visitors || 0).toLocaleString('ko-KR')}</strong></td><td>${Number(item.pageViews || 0).toLocaleString('ko-KR')}</td></tr>`).join('') : '<tr><td colspan="3" class="admin-empty-cell">방문 데이터가 아직 없습니다.</td></tr>';
}

function ensureDetailModal() {
  let modal = document.querySelector('[data-admin-detail-modal]');
  if (modal) return modal;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="admin-detail-modal" data-admin-detail-modal hidden>
      <button class="admin-detail-backdrop" type="button" data-admin-detail-close aria-label="닫기"></button>
      <section class="admin-detail-card" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
        <header><div><small data-admin-detail-type></small><h2 id="admin-detail-title" data-admin-detail-title>문의 상세</h2></div><button type="button" data-admin-detail-close aria-label="닫기">×</button></header>
        <div class="admin-detail-body" data-admin-detail-body></div>
      </section>
    </div>`);
  modal = document.querySelector('[data-admin-detail-modal]');
  modal.querySelectorAll('[data-admin-detail-close]').forEach(button => button.addEventListener('click', () => { modal.hidden = true; }));
  return modal;
}

function openDetail(kind, id) {
  const item = (kind === 'inquiry' ? inquiryItems : customerItems).find(entry => entry.id === id);
  if (!item) return;
  const modal = ensureDetailModal();
  const type = modal.querySelector('[data-admin-detail-type]');
  const title = modal.querySelector('[data-admin-detail-title]');
  const body = modal.querySelector('[data-admin-detail-body]');
  if (type) type.textContent = kind === 'inquiry' ? (item.type || '문의·제휴') : (item.category || '고객문의');
  if (title) title.textContent = item.subject || item.product || '문의 상세';

  const rows = kind === 'inquiry' ? [
    ['접수일', formatDateTime(item.createdAt)], ['상태', item.status], ['이름', item.name], ['회사 / 기관', item.company],
    ['연락처', item.phone], ['이메일', item.email], ['문의 구분', item.inquiryType], ['제휴 유형', item.partnershipType],
    ['문의 제품', item.product], ['관련 제품 / 브랜드', item.relatedItem], ['문의 내용', item.message]
  ] : [
    ['접수일', formatDateTime(item.createdAt)], ['상태', item.status], ['이름', item.name], ['회사', item.company],
    ['연락처', item.phone], ['이메일', item.email], ['문의 제품', item.product], ['문의 유형', item.category], ['문의 내용', item.message]
  ];
  body.innerHTML = rows.filter(([, value]) => value).map(([label, value]) => `
    <div class="admin-detail-row${label.includes('내용') ? ' is-message' : ''}"><span>${escapeHTML(label)}</span><div>${escapeHTML(value).replace(/\n/g, '<br>')}</div></div>`).join('');
  modal.hidden = false;
}

function renderDataError(kind) {
  const message = '데이터를 불러올 수 없습니다. 데이터베이스 설정을 확인해 주세요.';
  if (kind === 'inquiry') {
    const tbody = document.querySelector('[data-admin-view="inquiries"] .admin-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="admin-empty-cell">${message}</td></tr>`;
  } else if (kind === 'customer') {
    const tbody = ensureCustomerTable();
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="admin-empty-cell">${message}</td></tr>`;
  } else if (kind === 'visitor') {
    const tbody = ensureVisitorTable();
    if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="admin-empty-cell">${message}</td></tr>`;
  }
}

function stopDataListeners() {
  unsubscribe.forEach(stop => { try { stop(); } catch {} });
  unsubscribe = [];
}

function startDataListeners() {
  stopDataListeners();

  unsubscribe.push(onSnapshot(
    query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(200)),
    snapshot => {
      inquiryItems = snapshot.docs.map(snapshotDoc => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
      renderInquiryTable(); renderOpenCount(); renderRecent();
    },
    error => { console.error('[Taepyung Admin] inquiries', error?.code || error); renderDataError('inquiry'); }
  ));

  unsubscribe.push(onSnapshot(
    query(collection(db, 'customerInquiries'), orderBy('createdAt', 'desc'), limit(200)),
    snapshot => {
      customerItems = snapshot.docs.map(snapshotDoc => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
      renderCustomerTable(); renderOpenCount(); renderRecent();
    },
    error => { console.error('[Taepyung Admin] customer inquiries', error?.code || error); renderDataError('customer'); }
  ));

  unsubscribe.push(onSnapshot(
    query(collection(db, 'visitors_daily'), orderBy(documentId(), 'asc')),
    snapshot => {
      visitorItems = snapshot.docs.map(snapshotDoc => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
      renderVisitors();
    },
    error => { console.error('[Taepyung Admin] visitors', error?.code || error); renderDataError('visitor'); }
  ));
}

adminApp?.addEventListener('change', async event => {
  const select = event.target.closest('[data-status-id]');
  if (!select) return;
  select.disabled = true;
  try {
    await updateDoc(doc(db, select.dataset.statusCollection, select.dataset.statusId), {
      status: select.value,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[Taepyung Admin] status update failed', error?.code || error);
    alert('처리 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    select.disabled = false;
  }
});

adminApp?.addEventListener('click', event => {
  if (event.target.closest('select, option, a')) return;
  const trigger = event.target.closest('[data-detail-kind][data-detail-id]');
  if (trigger) openDetail(trigger.dataset.detailKind, trigger.dataset.detailId);
});

await setPersistence(auth, browserLocalPersistence);

loginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const adminId = idInput?.value.trim() || '';
  const password = passwordInput?.value || '';
  if (adminId !== ADMIN_ID) {
    setMessage('아이디 또는 비밀번호를 확인해 주세요.', 'error');
    return;
  }
  if (loginButton) loginButton.disabled = true;
  setMessage('로그인 중입니다.', 'loading');
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
  } catch (error) {
    console.error('[Taepyung Admin] login failed', error?.code || error);
    setMessage('아이디 또는 비밀번호를 확인해 주세요.', 'error');
    if (passwordInput) { passwordInput.value = ''; passwordInput.focus(); }
  } finally {
    if (loginButton) loginButton.disabled = false;
  }
});

logoutButton?.addEventListener('click', async () => { await signOut(auth); });

onAuthStateChanged(auth, user => {
  if (user && user.email === ADMIN_EMAIL) showAdmin();
  else {
    if (user) signOut(auth).catch(() => {});
    showLogin();
  }
});

window.TP_ADMIN_FIREBASE = { app, auth, db };
