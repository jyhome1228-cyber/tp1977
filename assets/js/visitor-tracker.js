import { db } from './firebase-client.js?v=20260817-2154';
import { doc, increment, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const pick = type => parts.find(part => part.type === type)?.value || '';
const date = `${pick('year')}-${pick('month')}-${pick('day')}`;
const visitKey = `tp1977-visit-${date}`;
const isNewVisitorToday = !localStorage.getItem(visitKey);

try {
  await setDoc(doc(db, 'visitors_daily', date), {
    date,
    visitors: increment(isNewVisitorToday ? 1 : 0),
    pageViews: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
  if (isNewVisitorToday) localStorage.setItem(visitKey, '1');
} catch (error) {
  console.debug('[Taepyung] visitor tracking skipped', error?.code || error);
}
