import { db } from './firebase-client.js?v=20261014-analytics';
import { addDoc, collection, doc, increment, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const pick = type => parts.find(part => part.type === type)?.value || '';
const date = `${pick('year')}-${pick('month')}-${pick('day')}`;
const visitKey = `tp1977-visit-${date}`;
const isNewVisitorToday = !localStorage.getItem(visitKey);

const clean = (value, max = 120) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
const params = new URLSearchParams(location.search);

function referrerHost() {
  try {
    if (!document.referrer) return '';
    const url = new URL(document.referrer);
    if (url.hostname === location.hostname) return '';
    return clean(url.hostname.replace(/^www\./, ''), 120);
  } catch {
    return '';
  }
}
function detectSource(host) {
  const utmSource = clean(params.get('utm_source'), 80);
  if (utmSource) return utmSource;
  if (!host) return 'direct';
  if (/(^|\.)google\./i.test(host)) return 'Google';
  if (/(^|\.)naver\.com$/i.test(host)) return 'Naver';
  if (/(^|\.)daum\.net$/i.test(host) || /kakao/i.test(host)) return 'Daum/Kakao';
  if (/instagram\.com$/i.test(host)) return 'Instagram';
  if (/facebook\.com$/i.test(host)) return 'Facebook';
  return host;
}
function detectKeyword(host) {
  const utmTerm = clean(params.get('utm_term'), 100);
  if (utmTerm) return utmTerm;
  if (location.pathname.includes('/product/')) {
    const internal = clean(params.get('q'), 100);
    if (internal) return internal;
  }
  if (/(^|\.)google\./i.test(host)) return 'Google 검색';
  if (/(^|\.)naver\.com$/i.test(host)) return 'Naver 검색';
  if (/(^|\.)daum\.net$/i.test(host) || /kakao/i.test(host)) return 'Daum/Kakao 검색';
  return '';
}

const host = referrerHost();
const trafficEvent = {
  date,
  source: detectSource(host),
  keyword: detectKeyword(host),
  campaign: clean(params.get('utm_campaign'), 100),
  landing: clean(location.pathname || '/', 160),
  referrerHost: host,
  createdAt: serverTimestamp()
};

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

try {
  await addDoc(collection(db, 'traffic_events'), trafficEvent);
} catch (error) {
  console.debug('[Taepyung] traffic detail tracking skipped', error?.code || error);
}
