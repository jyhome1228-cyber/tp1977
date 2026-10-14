import { app, db } from './firebase-client.js?v=20260818-1505';
import {
  getAuth,
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
const LOGIN_TIMEOUT = 12000;

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
let visitorItems = [];
let adminVisible = false;
const inquiryBuckets = { inquiries: [], customerInquiries: [] };
const inquirySnapshotReady = { inquiries: false, customerInquiries: false };
let notificationButton = null;

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
const timeout = ms => new Promise((_, reject) => {
  const error = new Error('Login request timed out');
  error.code = 'auth/timeout';
  setTimeout(() => reject(error), ms);
});

function setMessage(message = '', type = '') {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.dataset.type = type;
  loginMessage.hidden = !message;
}
function setLoginBusy(busy) {
  if (loginButton) loginButton.disabled = busy;
  if (idInput) idInput.disabled = busy;
  if (passwordInput) passwordInput.disabled = busy;
}
function stopDataListeners() {
  unsubscribe.forEach(stop => { try { stop(); } catch {} });
  unsubscribe = [];
}
function showLogin({ keepMessage = false } = {}) {
  if (adminVisible) stopDataListeners();
  adminVisible = false;
  document.body.classList.remove('admin-authenticated');
  document.body.classList.add('admin-guest');
  if (loginScreen) loginScreen.hidden = false;
  if (adminApp) adminApp.hidden = true;
  setLoginBusy(false);
  if (!keepMessage) setMessage('');
  requestAnimationFrame(() => passwordInput?.focus());
}
function showAdmin() {
  const firstOpen = !adminVisible;
  adminVisible = true;
  document.body.classList.remove('admin-guest');
  document.body.classList.add('admin-authenticated');
  if (loginScreen) loginScreen.hidden = true;
  if (adminApp) adminApp.hidden = false;
  setLoginBusy(false);
  setMessage('');
  mountNotificationControl();
  startDataListeners();
  if (firstOpen) window.dispatchEvent(new CustomEvent('tp-admin-authenticated'));
}
function findMetric(view, label) {
  return [...document.querySelectorAll(`[data-admin-view="${view}"] .metric-card`)]
    .find(card => card.querySelector('small')?.textContent.trim() === label)
    ?.querySelector('strong');
}
function statusSelect(item) {
  return `<select class="admin-status-select" data-status-id="${escapeHTML(item.id)}" data-status-collection="${escapeHTML(item.collectionName || 'inquiries')}" aria-label="처리 상태">
    ${STATUS_OPTIONS.map(status => `<option value="${status}"${status === item.status ? ' selected' : ''}>${status}</option>`).join('')}
  </select>`;
}
function renderInquiryTable() {
  const tbody = document.querySelector('[data-admin-view="inquiries"] .admin-table tbody');
  if (!tbody) return;
  if (!inquiryItems.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-empty-cell">등록된 문의가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = inquiryItems.map(item => `
    <tr class="admin-data-row" data-detail-kind="${item.collectionName === 'customerInquiries' ? 'customer' : 'inquiry'}" data-detail-id="${escapeHTML(item.id)}">
      <td>${formatDateTime(item.createdAt)}</td>
      <td><span class="admin-type-pill">${escapeHTML(item.type || '문의하기')}</span></td>
      <td><strong>${escapeHTML(item.company || item.name || '-')}</strong><small>${escapeHTML(item.company ? item.name : '')}</small></td>
      <td>${escapeHTML(item.subject || '-')}</td>
      <td>${statusSelect(item)}</td>
    </tr>`).join('');
}
function renderOpenCount() {
  const count = inquiryItems.filter(item => !['완료', '보관'].includes(item.status)).length;
  const target = findMetric('dashboard', '미처리 문의');
  if (target) target.textContent = String(count);
}
function renderRecent() {
  const panel = document.querySelector('[data-admin-view="dashboard"] .admin-grid .panel:first-child');
  if (!panel) return;
  const old = panel.querySelector('.empty-state, .admin-recent-list');
  const recent = [...inquiryItems].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 6);
  const wrapper = document.createElement('div');
  wrapper.className = 'admin-recent-list';
  wrapper.innerHTML = recent.length ? recent.map(item => `
    <button type="button" class="admin-recent-item" data-detail-kind="inquiry" data-detail-id="${escapeHTML(item.id)}">
      <span><b>${escapeHTML(item.type || item.source || '문의·제휴')}</b><small>${formatDateTime(item.createdAt)}</small></span>
      <strong>${escapeHTML(item.subject || item.message || '-')}</strong>
      <em>${escapeHTML(item.company || item.name || '-')} · ${escapeHTML(item.status || '신규')}</em>
    </button>`).join('') : '<div class="empty-state"><b>등록된 문의가 없습니다.</b><p>새 문의나 제휴 요청이 접수되면 최근 순서대로 표시됩니다.</p></div>';
  old?.replaceWith(wrapper);
}
function ensureVisitorTable() {
  const panel = document.querySelector('[data-admin-view="visitors"] .panel');
  if (!panel) return null;
  let tbody = panel.querySelector('tbody[data-visitor-tbody]');
  if (tbody) return tbody;
  panel.querySelector('.empty-state')?.remove();
  panel.innerHTML = `<div class="panel-head"><h3>최근 방문 현황</h3></div><div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>날짜</th><th>방문자</th><th>페이지 조회</th></tr></thead><tbody data-visitor-tbody></tbody></table></div>`;
  return panel.querySelector('tbody[data-visitor-tbody]');
}
function renderVisitors() {
  const today = kstDateKey(new Date());
  const todayDate = new Date();
  const last7 = new Set(Array.from({ length: 7 }, (_, index) => {
    const d = new Date(todayDate); d.setDate(d.getDate() - index); return kstDateKey(d);
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
    const target = findMetric('visitors', label); if (target) target.textContent = Number(value).toLocaleString('ko-KR');
  });
  const tbody = ensureVisitorTable();
  if (!tbody) return;
  const recent = [...visitorItems].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 14);
  tbody.innerHTML = recent.length ? recent.map(item => `<tr><td>${escapeHTML(item.id)}</td><td><strong>${Number(item.visitors || 0).toLocaleString('ko-KR')}</strong></td><td>${Number(item.pageViews || 0).toLocaleString('ko-KR')}</td></tr>`).join('') : '<tr><td colspan="3" class="admin-empty-cell">방문 데이터가 아직 없습니다.</td></tr>';
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
function openDetail(id) {
  const item = inquiryItems.find(entry => entry.id === id);
  if (!item) return;
  const modal = ensureDetailModal();
  const type = modal.querySelector('[data-admin-detail-type]');
  const title = modal.querySelector('[data-admin-detail-title]');
  const body = modal.querySelector('[data-admin-detail-body]');
  if (type) type.textContent = item.type || '문의·제휴';
  if (title) title.textContent = item.subject || '문의 상세';
  const rows = [
    ['접수일', formatDateTime(item.createdAt)], ['상태', item.status], ['이름', item.name], ['회사 / 기관', item.company],
    ['연락처', item.phone], ['이메일', item.email], ['문의 구분', item.inquiryType || item.category], ['제휴 유형', item.partnershipType],
    ['문의 제품', item.product], ['관련 제품 / 브랜드', item.relatedItem], ['문의 내용', item.message]
  ];
  body.innerHTML = rows.filter(([, value]) => value).map(([label, value]) => `<div class="admin-detail-row${label.includes('내용') ? ' is-message' : ''}"><span>${escapeHTML(label)}</span><div>${escapeHTML(value).replace(/\n/g, '<br>')}</div></div>`).join('');
  modal.hidden = false;
}
function renderDataError(kind) {
  const message = '데이터를 불러올 수 없습니다. 데이터베이스 설정을 확인해 주세요.';
  if (kind === 'inquiry') {
    const tbody = document.querySelector('[data-admin-view="inquiries"] .admin-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="admin-empty-cell">${message}</td></tr>`;
  } else if (kind === 'visitor') {
    const tbody = ensureVisitorTable(); if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="admin-empty-cell">${message}</td></tr>`;
  }
}
function notificationPermissionLabel() {
  if (!('Notification' in window)) return '알림 미지원';
  if (Notification.permission === 'granted') return '알림 켜짐';
  if (Notification.permission === 'denied') return '알림 차단됨';
  return '문의 알림 켜기';
}
function updateNotificationButton() {
  if (!notificationButton) return;
  notificationButton.textContent = notificationPermissionLabel();
  notificationButton.disabled = !('Notification' in window) || Notification.permission === 'denied';
  notificationButton.dataset.state = 'Notification' in window ? Notification.permission : 'unsupported';
}
function mountNotificationControl() {
  if (notificationButton) { updateNotificationButton(); return; }
  const actions = document.querySelector('.admin-top-actions');
  if (!actions) return;
  const style = document.createElement('style');
  style.textContent = `
    .admin-notification-toggle{min-height:36px;padding:0 13px;border:1px solid rgba(23,25,23,.13);border-radius:8px;background:#fff;color:#3d433d;font:inherit;font-size:11px;font-weight:650;cursor:pointer}
    .admin-notification-toggle[data-state="granted"]{border-color:rgba(34,121,58,.24);background:#f4faf5;color:#22793a}
    .admin-notification-toggle:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);
  notificationButton = document.createElement('button');
  notificationButton.type = 'button';
  notificationButton.className = 'admin-notification-toggle';
  notificationButton.addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }
    updateNotificationButton();
    if (Notification.permission === 'granted') {
      try {
        new Notification('태평제지 문의 알림', {
          body: '새 문의가 접수되면 이 브라우저로 알려드립니다.',
          tag: 'tp1977-notification-ready',
          icon: '../favicon.svg'
        });
      } catch {}
    }
  });
  actions.insertBefore(notificationButton, logoutButton || null);
  updateNotificationButton();
}
function notifyNewInquiry(item) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const who = item.company || item.name || '고객';
  const kind = item.type || item.source || '온라인 문의';
  const subject = item.subject || item.category || item.message || '새 문의가 접수되었습니다.';
  try {
    const notice = new Notification('태평제지 새 문의', {
      body: `${kind} · ${who}\n${String(subject).slice(0, 90)}`,
      tag: `tp1977-${item.collectionName || 'inquiries'}-${item.id}`,
      icon: '../favicon.svg',
      requireInteraction: true
    });
    notice.onclick = () => {
      window.focus();
      location.hash = '#inquiries';
      notice.close();
    };
  } catch {}
}
function rebuildInquiryItems() {
  inquiryItems = [...inquiryBuckets.inquiries, ...inquiryBuckets.customerInquiries]
    .filter(item => !item.trashed)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  renderInquiryTable();
  renderOpenCount();
  renderRecent();
}
function bindInquiryCollection(collectionName) {
  unsubscribe.push(onSnapshot(
    query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(200)),
    snapshot => {
      const mapped = snapshot.docs.map(snapshotDoc => ({
        id: snapshotDoc.id,
        collectionName,
        ...snapshotDoc.data()
      }));
      inquiryBuckets[collectionName] = mapped;
      if (inquirySnapshotReady[collectionName]) {
        snapshot.docChanges()
          .filter(change => change.type === 'added')
          .map(change => ({ id: change.doc.id, collectionName, ...change.doc.data() }))
          .filter(item => !item.trashed)
          .forEach(notifyNewInquiry);
      } else {
        inquirySnapshotReady[collectionName] = true;
      }
      rebuildInquiryItems();
    },
    error => { console.error(`[Taepyung Admin] ${collectionName}`, error?.code || error); renderDataError('inquiry'); }
  ));
}
function startDataListeners() {
  stopDataListeners();
  inquirySnapshotReady.inquiries = false;
  inquirySnapshotReady.customerInquiries = false;
  bindInquiryCollection('inquiries');
  bindInquiryCollection('customerInquiries');
  unsubscribe.push(onSnapshot(
    query(collection(db, 'visitors_daily'), orderBy(documentId(), 'asc')),
    snapshot => { visitorItems = snapshot.docs.map(snapshotDoc => ({ id: snapshotDoc.id, ...snapshotDoc.data() })); renderVisitors(); },
    error => { console.error('[Taepyung Admin] visitors', error?.code || error); renderDataError('visitor'); }
  ));
}

adminApp?.addEventListener('change', async event => {
  const select = event.target.closest('[data-status-id]');
  if (!select) return;
  select.disabled = true;
  try {
    await updateDoc(doc(db, select.dataset.statusCollection, select.dataset.statusId), { status: select.value, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('[Taepyung Admin] status update failed', error?.code || error);
    alert('처리 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  } finally { select.disabled = false; }
});
adminApp?.addEventListener('click', event => {
  if (event.target.closest('select, option, a')) return;
  const trigger = event.target.closest('[data-detail-kind="inquiry"][data-detail-id]');
  if (trigger) openDetail(trigger.dataset.detailId);
});

loginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const adminId = idInput?.value.trim() || '';
  const password = passwordInput?.value || '';
  if (adminId !== ADMIN_ID || !password) {
    setMessage('아이디 또는 비밀번호를 확인해 주세요.', 'error');
    return;
  }
  setLoginBusy(true);
  setMessage('로그인 중입니다.', 'loading');
  try {
    const credential = await Promise.race([
      signInWithEmailAndPassword(auth, ADMIN_EMAIL, password),
      timeout(LOGIN_TIMEOUT)
    ]);
    if (credential?.user?.email === ADMIN_EMAIL) {
      showAdmin();
    } else {
      await signOut(auth).catch(() => {});
      throw Object.assign(new Error('Unauthorized account'), { code: 'auth/unauthorized' });
    }
  } catch (error) {
    console.error('[Taepyung Admin] login failed', error?.code || error);
    const code = String(error?.code || '');
    if (code === 'auth/timeout' || code === 'auth/network-request-failed') {
      setMessage('로그인 서버 응답이 지연되고 있습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.', 'error');
    } else if (code === 'auth/too-many-requests') {
      setMessage('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } else {
      setMessage('아이디 또는 비밀번호를 확인해 주세요.', 'error');
    }
    if (passwordInput) { passwordInput.value = ''; passwordInput.focus(); }
  } finally {
    setLoginBusy(false);
  }
});
logoutButton?.addEventListener('click', async () => {
  setMessage('');
  await signOut(auth).catch(() => {});
  showLogin();
});

onAuthStateChanged(auth, user => {
  if (user?.email === ADMIN_EMAIL) showAdmin();
  else {
    if (user) signOut(auth).catch(() => {});
    if (!adminVisible) showLogin({ keepMessage: true });
    else showLogin();
  }
});

/* Never leave the login UI locked forever, even if an SDK request stalls. */
setTimeout(() => {
  if (!adminVisible && loginButton?.disabled) {
    setLoginBusy(false);
    setMessage('로그인 응답이 지연되었습니다. 다시 시도해 주세요.', 'error');
  }
}, LOGIN_TIMEOUT + 1500);

window.TP_ADMIN_FIREBASE = { app, auth, db };