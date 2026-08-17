import { db } from './firebase-client.js?v=20260817-2154';
import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const form = document.getElementById('inquiryForm');
const statusBox = document.getElementById('formStatus');

if (form) {
  const button = form.querySelector('.inquiry-submit');
  const setStatus = (message = '', kind = '') => {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.dataset.kind = kind;
    statusBox.classList.toggle('show', Boolean(message));
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      company: String(data.get('company') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim(),
      product: String(data.get('product') || '').trim(),
      category: String(data.get('category') || '').trim(),
      message: String(data.get('message') || '').trim(),
      status: '신규',
      source: '고객만족',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (button) button.disabled = true;
    setStatus('접수 중입니다.', 'loading');

    try {
      await addDoc(collection(db, 'customerInquiries'), payload);
      setStatus('정상적으로 접수되었습니다. 확인 후 담당자가 연락드리겠습니다.', 'success');
      form.reset();
      const params = new URLSearchParams(location.search);
      const selected = params.get('product') || '';
      const product = document.getElementById('product');
      if (selected && product) product.value = selected;
    } catch (error) {
      console.error('[Taepyung] customer inquiry save failed', error?.code || error);
      setStatus('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  });
}
