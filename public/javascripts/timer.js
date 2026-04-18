// timer.js — modernized 2026
// Uses release time injected into <time#release-at>. No jQuery, no globals.

const el = {
  day: document.getElementById('cd-day'),
  hour: document.getElementById('cd-hour'),
  min: document.getElementById('cd-min'),
  sec: document.getElementById('cd-sec'),
  date: document.getElementById('release-at'),
};

const target = (() => {
  const raw = el.date?.dateTime || el.date?.getAttribute('datetime');
  const t = raw ? new Date(raw) : new Date('2026-12-17T00:00:00+09:00');
  return Number.isNaN(t.getTime()) ? new Date('2026-12-17T00:00:00+09:00') : t;
})();

if (el.date) {
  try {
    const fmt = new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Tokyo',
    });
    el.date.textContent = `公開: ${fmt.format(target)}`;
  } catch {
    /* ignore */
  }
}

const pad = (n) => String(n).padStart(2, '0');

function tick() {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    el.day.textContent = '00';
    el.hour.textContent = el.min.textContent = el.sec.textContent = '00';
    return;
  }
  const day = Math.floor(diff / 86_400_000);
  const hour = Math.floor((diff % 86_400_000) / 3_600_000);
  const min = Math.floor((diff % 3_600_000) / 60_000);
  const sec = Math.floor((diff % 60_000) / 1000);
  el.day.textContent = pad(day);
  el.hour.textContent = pad(hour);
  el.min.textContent = pad(min);
  el.sec.textContent = pad(sec);
}

tick();
setInterval(tick, 1000);
