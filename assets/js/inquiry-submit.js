import { db } from './firebase-client.js?v=20260818-1315';
import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const form = document.querySelector('.iq-form');

function ensureSuccessModal() {
  let modal = document.querySelector('[data-iq-success-modal]');
  if (modal) return modal;

  const style = document.createElement('style');
  style.textContent = `
    .iq-success-modal[hidden]{display:none!important}
    .iq-success-modal{position:fixed;inset:0;z-index:3000;display:grid;place-items:center;padding:24px}
    .iq-success-dim{position:absolute;inset:0;border:0;background:rgba(15,22,16,.52);backdrop-filter:blur(4px);cursor:default}
    .iq-success-card{position:relative;z-index:1;width:min(520px,calc(100vw - 36px));padding:34px 34px 30px;border:1px solid rgba(23,25,23,.10);border-radius:16px;background:#fff;box-shadow:0 26px 80px rgba(0,0,0,.18)}
    .iq-success-icon{display:grid;place-items:center;width:46px;height:46px;margin-bottom:24px;border-radius:50%;background:#eef7f0;color:#22793a;font-size:22px;font-weight:700}
    .iq-success-kicker{display:block;margin-bottom:10px;color:#22793a;font-size:10px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}
    .iq-success-card h2{margin:0;font-size:28px;line-height:1.25;letter-spacing:-.045em;color:#171917}
    .iq-success-card>p{margin:14px 0 0;color:#676d67;font-size:14px;line-height:1.75;word-break:keep-all}
    .iq-success-call{margin-top:24px;padding:16px 18px;border:1px solid #dce8de;border-radius:10px;background:#f4faf5}
    .iq-success-call span{display:block;margin-bottom:6px;color:#647164;font-size:11px}
    .iq-success-call a{display:inline-block;color:#22793a;font-size:20px;font-weight:650;text-decoration:none;letter-spacing:-.02em}
    .iq-success-call small{display:block;margin-top:5px;color:#8a908a;font-size:10px}
    .iq-success-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:26px}
    .iq-success-actions a,.iq-success-actions button{min-height:42px;padding:0 16px;border-radius:8px;font:inherit;font-size:12px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer}
    .iq-success-actions a{border:1px solid #22793a;background:#22793a;color:#fff}
    .iq-success-actions button{border:1px solid rgba(23,25,23,.13);background:#fff;color:#333}
    body.iq-modal-open{overflow:hidden}
    @media(max-width:640px){.iq-success-card{padding:28px 22px 24px}.iq-success-card h2{font-size:24px}.iq-success-actions{display:grid;grid-template-columns:1fr 1fr}.iq-success-actions a,.iq-success-actions button{width:100%}}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="iq-success-modal" data-iq-success-modal hidden>
      <button class="iq-success-dim" type="button" data-iq-success-close aria-label="접수 완료 안내 닫기"></button>
      <section class="iq-success-card" role="dialog" aria-modal="true" aria-labelledby="iq-success-title">
        <div class="iq-success-icon" aria-hidden="true">✓</div>
        <span class="iq-success-kicker" data-iq-success-kicker>RECEIVED</span>
        <h2 id="iq-success-title">정상적으로 접수되었습니다.</h2>
        <p data-iq-success-message>접수 내용을 확인한 뒤 담당자가 순차적으로 연락드리겠습니다.</p>
        <div class="iq-success-call">
          <span>빠른 문의가 필요하신가요?</span>
          <a href="tel:0315950797">031-595-0797</a>
          <small>고객센터 · 월–금 09:00–17:00</small>
        </div>
        <div class="iq-success-actions">
          <button type="button" data-iq-success-close>확인</button>
          <a href="tel:0315950797">고객센터 연결</a>
        </div>
      </section>
    </div>`);

  modal = document.querySelector('[data-iq-success-modal]');
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove('iq-modal-open');
  };
  modal.querySelectorAll('[data-iq-success-close]').forEach(button => button.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
  return modal;
}

function showSuccessModal(type) {
  const modal = ensureSuccessModal();
  const isPartnership = type === '제휴 요청';
  const kicker = modal.querySelector('[data-iq-success-kicker]');
  const title = modal.querySelector('#iq-success-title');
  const message = modal.querySelector('[data-iq-success-message]');

  if (kicker) kicker.textContent = isPartnership ? 'PARTNERSHIP RECEIVED' : 'INQUIRY RECEIVED';
  if (title) title.textContent = isPartnership ? '제휴 요청이 정상적으로 접수되었습니다.' : '문의가 정상적으로 접수되었습니다.';
  if (message) message.textContent = isPartnership
    ? '제안해주신 내용을 확인한 뒤 담당 부서에서 순차적으로 연락드리겠습니다.'
    : '접수 내용을 확인한 뒤 담당자가 순차적으로 연락드리겠습니다.';

  modal.hidden = false;
  document.body.classList.add('iq-modal-open');
  requestAnimationFrame(() => modal.querySelector('[data-iq-success-close]')?.focus());
}

if (form) {
  form.removeAttribute('action');
  form.removeAttribute('method');
  form.removeAttribute('enctype');

  const guide = form.querySelector('.iq-head p');
  if (guide) guide.textContent = '작성하신 내용은 태평제지 담당자에게 바로 접수됩니다. 접수 후 내용을 확인하여 순차적으로 안내드립니다.';

  const button = form.querySelector('.iq-submit');
  const actions = form.querySelector('.iq-actions');
  const status = document.createElement('p');
  status.className = 'iq-save-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.style.cssText = 'margin:22px 0 0;padding:12px 14px;border-radius:9px;font-size:12px;line-height:1.6;display:none';
  actions?.insertAdjacentElement('beforebegin', status);

  const honey = document.createElement('input');
  honey.type = 'text';
  honey.name = 'website';
  honey.tabIndex = -1;
  honey.autocomplete = 'off';
  honey.setAttribute('aria-hidden', 'true');
  honey.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
  form.appendChild(honey);

  const setStatus = (message = '', kind = '') => {
    status.textContent = message;
    status.dataset.kind = kind;
    status.style.display = message ? 'block' : 'none';
    status.style.background = kind === 'error' ? '#fff2f0' : '#f5f6f5';
    status.style.color = kind === 'error' ? '#a4483b' : '#666';
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (honey.value) return;

    const data = new FormData(form);
    const type = String(data.get('접수유형') || '문의하기');
    const isPartnership = type === '제휴 요청';
    const payload = {
      type,
      inquiryType: isPartnership ? '' : String(data.get('문의구분') || ''),
      partnershipType: isPartnership ? String(data.get('제휴유형') || '') : '',
      name: String(data.get('이름') || '').trim(),
      company: String(data.get('회사기관명') || '').trim(),
      phone: String(data.get('연락처') || '').trim(),
      email: String(data.get('이메일') || '').trim(),
      product: String(data.get('문의제품') || '').trim(),
      relatedItem: isPartnership ? String(data.get('제휴관련항목') || '').trim() : '',
      subject: String(data.get('제목') || '').trim(),
      message: String(data.get('내용') || '').trim(),
      status: '신규',
      source: '문의·제휴',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (button) button.disabled = true;
    setStatus('접수 중입니다.', 'loading');

    try {
      await addDoc(collection(db, 'inquiries'), payload);
      setStatus('');
      showSuccessModal(type);
      form.reset();
      const firstType = form.querySelector('input[name="접수유형"][value="문의하기"]');
      if (firstType) {
        firstType.checked = true;
        firstType.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (error) {
      console.error('[Taepyung] inquiry save failed', error?.code || error);
      setStatus('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });
}
