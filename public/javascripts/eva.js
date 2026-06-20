// eva.js — A-SYNC TERMINAL, renewed 2026
// Vanilla JS · Canvas2D (DPR-aware) · Socket.IO realtime
// Drives: message field, received log, MAGI sync meters, char counter.

const $ = (id) => document.getElementById(id);

const canvas = $('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const flash = $('flash');
const presenceEl = $('presence-count');
const connDot = $('conn-dot');
const connLabel = $('conn-label');
const form = $('chat-form');
const input = $('text-box');
const signalBtn = $('signal-btn');
const charCount = $('char-count');
const feedList = $('feed-list');
const feedEmpty = $('feed-empty');
const magiVerdict = $('magi-verdict');
const magiRows = [...document.querySelectorAll('.magi__row')];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_BUBBLES = 80;
const MAX_FEED = 30;
const BASE_RADIUS = 52;
const FONT = '500 15px ui-monospace, "JetBrains Mono", "SF Mono", monospace';

/* ============================================================
   Canvas message field
   ============================================================ */
const bubbles = [];
let width = 0;
let height = 0;
const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
new ResizeObserver(resize).observe(canvas);

class Bubble {
  constructor(text = '', { x, y } = {}) {
    this.text = text;
    this.r = BASE_RADIUS + Math.random() * 26;
    this.x = x ?? Math.random() * width;
    this.y = y ?? height + this.r;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -0.4 - Math.random() * 0.85;
    this.life = 1;
    this.hue = text ? 14 + Math.random() * 16 : 188 + Math.random() * 40; // user msgs warm, ambient cyan
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx += (Math.random() - 0.5) * 0.02;
    if (this.x < this.r || this.x > width - this.r) this.vx *= -1;
    if (this.y + this.r < 0) this.life = 0;
  }

  draw(c) {
    const grd = c.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.r);
    grd.addColorStop(0, `hsla(${this.hue}, 92%, 70%, 0.5)`);
    grd.addColorStop(0.7, `hsla(${this.hue}, 92%, 50%, 0.16)`);
    grd.addColorStop(1, `hsla(${this.hue}, 92%, 40%, 0)`);
    c.fillStyle = grd;
    c.beginPath();
    c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = `hsla(${this.hue}, 100%, 82%, 0.8)`;
    c.lineWidth = 1.2;
    c.stroke();

    if (this.text) {
      c.fillStyle = '#eaf4ff';
      c.font = FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const t = this.text.length > 18 ? this.text.slice(0, 17) + '…' : this.text;
      c.fillText(t, this.x, this.y, this.r * 1.6);
    }
  }
}

for (let i = 0; i < 16; i++) {
  bubbles.push(new Bubble('', { x: Math.random() * width, y: Math.random() * height }));
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(40, now - last) / 16.67;
  last = now;

  ctx.clearRect(0, 0, width, height);

  const sweep = (now / 12) % height;
  ctx.fillStyle = 'rgba(47, 208, 255, 0.06)';
  ctx.fillRect(0, sweep, width, 1);

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.update(dt);
    b.draw(ctx);
    if (!b.life) bubbles.splice(i, 1);
  }

  if (!reduceMotion) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function spawn(text) {
  if (bubbles.length >= MAX_BUBBLES) bubbles.shift();
  bubbles.push(new Bubble(text, { x: Math.random() * width, y: height + 40 }));
}

/* ============================================================
   Received log
   ============================================================ */
const timeFmt = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Tokyo',
});

function pushFeed(text, at) {
  feedEmpty?.classList.add('is-hidden');
  const li = document.createElement('li');
  li.className = 'feed__item';

  const time = document.createElement('span');
  time.className = 'feed__time';
  time.textContent = timeFmt.format(at ? new Date(at) : new Date());

  const msg = document.createElement('span');
  msg.className = 'feed__text';
  msg.textContent = text;

  li.append(time, msg);
  feedList.prepend(li);

  while (feedList.children.length > MAX_FEED) {
    feedList.lastElementChild?.remove();
  }
}

/* ============================================================
   MAGI sync meters — react to presence + traffic
   ============================================================ */
const magi = {
  base: [0, 0, 0],
  load: 0,
  presence: 0,
};

function renderMagi() {
  let sum = 0;
  magiRows.forEach((row, i) => {
    const jitter = (Math.random() - 0.5) * 4;
    const v = Math.max(4, Math.min(99,
      Math.round(magi.base[i] + magi.presence * 6 + magi.load * 22 + jitter)));
    sum += v;
    row.querySelector('i').style.setProperty('--w', v + '%');
    row.querySelector('.magi__val').textContent = String(v).padStart(2, '0') + '%';
  });
  if (magiVerdict && magiVerdict.dataset.state !== 'alert') {
    const avg = sum / magiRows.length;
    if (avg >= 66) {
      magiVerdict.dataset.state = 'approved';
      magiVerdict.textContent = 'JUDGEMENT: APPROVED';
    } else {
      magiVerdict.dataset.state = 'pending';
      magiVerdict.textContent = 'JUDGEMENT: PENDING';
    }
  }
  magi.load *= 0.86; // traffic decays
}
magi.base = [38, 44, 50];
setInterval(() => { if (!reduceMotion || magi.load > 0.01) renderMagi(); }, 1200);
renderMagi();

function magiAlert() {
  if (!magiVerdict) return;
  magiVerdict.dataset.state = 'alert';
  magiVerdict.textContent = 'JUDGEMENT: ALERT';
  setTimeout(() => {
    magiVerdict.dataset.state = 'pending';
    magiVerdict.textContent = 'JUDGEMENT: PENDING';
    renderMagi();
  }, 2400);
}

/* ============================================================
   Char counter
   ============================================================ */
input?.addEventListener('input', () => {
  const n = input.value.length;
  charCount.textContent = `${n}/140`;
  charCount.classList.toggle('is-near', n >= 120);
});

/* ============================================================
   Socket.IO wiring
   ============================================================ */
function connect() {
  if (typeof io !== 'function') {
    setTimeout(connect, 200);
    return;
  }
  const socket = io({ transports: ['websocket', 'polling'] });

  const setState = (state, label) => {
    connDot.dataset.state = state;
    connLabel.textContent = label;
  };

  socket.on('connect', () => setState('online', '同期中'));
  socket.on('disconnect', () => setState('offline', '切断'));
  socket.on('connect_error', () => setState('offline', '接続失敗'));

  socket.on('message', ({ value, at }) => {
    spawn(value);
    pushFeed(value, at);
    magi.load = Math.min(1, magi.load + 0.5);
    renderMagi();
  });

  socket.on('presence', ({ count }) => {
    const n = count ?? 0;
    presenceEl.textContent = String(n);
    magi.presence = Math.min(8, n);
  });

  socket.on('alert', () => {
    flash.classList.add('is-on');
    document.body.dataset.phase = 'alert';
    magiAlert();
    setTimeout(() => flash.classList.remove('is-on'), 180);
    setTimeout(() => { document.body.dataset.phase = 'standby'; }, 2400);
  });

  socket.on('blackout', () => {
    flash.classList.add('is-blackout');
    setTimeout(() => flash.classList.remove('is-blackout'), 1200);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    socket.emit('message', { value });
    input.value = '';
    charCount.textContent = '0/140';
    charCount.classList.remove('is-near');
  });

  signalBtn?.addEventListener('click', () => socket.emit('signal', 'alert'));
}

connect();
