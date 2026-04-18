// eva.js — modernized 2026
// Vanilla JS, Canvas2D + DPR-aware rendering, Socket.IO real-time messaging.

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const flash = document.getElementById('flash');
const presence = document.getElementById('presence-count');
const connDot = document.getElementById('conn-dot');
const connLabel = document.getElementById('conn-label');
const form = document.getElementById('chat-form');
const input = document.getElementById('text-box');
const signalBtn = document.getElementById('signal-btn');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_BUBBLES = 80;
const BASE_RADIUS = 56;
const FONT = '500 16px ui-monospace, "JetBrains Mono", "SF Mono", monospace';

const bubbles = [];
let width = 0;
let height = 0;
let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

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
    this.r = BASE_RADIUS + Math.random() * 24;
    this.x = x ?? Math.random() * width;
    this.y = y ?? height + this.r;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -0.4 - Math.random() * 0.8;
    this.life = 1;
    this.hue = 190 + Math.random() * 40;
    this.born = performance.now();
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx += (Math.random() - 0.5) * 0.02;
    if (this.x < this.r || this.x > width - this.r) this.vx *= -1;
    if (this.y + this.r < 0) this.life = 0;
  }

  draw(ctx) {
    const grd = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.r);
    grd.addColorStop(0, `hsla(${this.hue}, 90%, 70%, 0.55)`);
    grd.addColorStop(0.7, `hsla(${this.hue}, 90%, 50%, 0.18)`);
    grd.addColorStop(1, `hsla(${this.hue}, 90%, 40%, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `hsla(${this.hue}, 100%, 80%, 0.85)`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (this.text) {
      ctx.fillStyle = '#e6f1ff';
      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const max = this.r * 1.6;
      const t = this.text.length > 18 ? this.text.slice(0, 17) + '…' : this.text;
      ctx.fillText(t, this.x, this.y, max);
    }
  }
}

// seed ambient bubbles
for (let i = 0; i < 18; i++) {
  bubbles.push(new Bubble('', { x: Math.random() * width, y: Math.random() * height }));
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(40, now - last) / 16.67;
  last = now;

  ctx.clearRect(0, 0, width, height);

  // subtle grid sweep
  const sweep = (now / 12) % height;
  ctx.fillStyle = 'rgba(0, 212, 255, 0.05)';
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

// ===== Socket.IO wiring =====
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

  socket.on('message', ({ value }) => spawn(value));
  socket.on('presence', ({ count }) => {
    presence.textContent = String(count ?? 0);
  });
  socket.on('alert', () => {
    flash.classList.add('is-on');
    setTimeout(() => flash.classList.remove('is-on'), 180);
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
  });

  signalBtn?.addEventListener('click', () => socket.emit('signal', 'alert'));
}

connect();
