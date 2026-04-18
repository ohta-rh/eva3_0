import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import indexRouter from './routes/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const RELEASE_AT = process.env.RELEASE_AT ?? '2026-12-17T00:00:00+09:00';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'ws:', 'wss:'],
        'font-src': ["'self'", 'data:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(
  express.static(join(__dirname, 'public'), {
    maxAge: NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
  }),
);

app.use((req, res, next) => {
  res.locals.releaseAt = RELEASE_AT;
  next();
});

app.use('/', indexRouter);

app.use((req, res) => {
  res.status(404).render('index', { releaseAt: RELEASE_AT });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: false },
  maxHttpBufferSize: 1e5,
  pingInterval: 25_000,
  pingTimeout: 20_000,
});

const RATE_LIMIT_WINDOW_MS = 5_000;
const RATE_LIMIT_MAX = 8;
const MAX_MESSAGE_LENGTH = 140;

const sanitize = (value) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);

io.on('connection', (socket) => {
  const bucket = { count: 0, resetAt: Date.now() + RATE_LIMIT_WINDOW_MS };

  socket.emit('presence', { count: io.engine.clientsCount });
  socket.broadcast.emit('presence', { count: io.engine.clientsCount });

  socket.on('message', (data) => {
    const now = Date.now();
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
    }
    if (++bucket.count > RATE_LIMIT_MAX) return;

    const value = sanitize(data?.value);
    if (!value) return;
    io.emit('message', { value, at: now });
  });

  socket.on('signal', (kind) => {
    if (kind === 'blackout' || kind === 'alert') {
      io.emit(kind, { at: Date.now() });
    }
  });

  socket.on('disconnect', () => {
    io.emit('presence', { count: io.engine.clientsCount });
  });
});

server.listen(PORT, () => {
  console.log(`eva3.0 listening on :${PORT} (${NODE_ENV})`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received, closing server`);
  io.close();
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
