import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Evangelion 3.0: You Can (Not) Redo.',
    releaseAt: res.locals.releaseAt,
  });
});

router.get('/healthz', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

export default router;
