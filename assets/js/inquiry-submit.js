import { db } from './firebase-client.js?v=20260817-2154';
import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const form = document.querySelector('.iq-form');
if (form) {
  form.removeAttribute('action');
  form.removeAttribute('method');
  form.removeAttribute('enctype');

  const button = form.querySelector('.iq-submit');
  const actions = form.querySelector('.iq-actions');
  const status = document.createElement('p');
  status.className = 'iq-save-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
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
  };

  form.addEventListener('submit', async (event) => {
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
      setStatus('정상적으로 접수되었습니다. 확인 후 담당자가 연락드리겠습니다.', 'success');
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
