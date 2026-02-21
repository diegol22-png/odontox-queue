const { Router } = require('express');
const queueService = require('../services/queueService');
const { validateCallNext, validateIdParam } = require('../middleware/validation');
const env = require('../config/env');

const router = Router();

router.get('/role', (req, res) => {
  const user = req.auth.user;
  let role = 'reception';
  if (user === env.panel.user) role = 'admin';
  else if (user === env.panel.operatorUser) role = 'operator';
  res.json({ role });
});

router.get('/history', (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: { message: 'Data inválida. Use o formato YYYY-MM-DD.', code: 'INVALID_DATE' } });
    }
    const data = queueService.getHistoryByDate(date);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/queues', (req, res, next) => {
  try {
    const queues = queueService.getAllQueues();
    res.json(queues);
  } catch (err) {
    next(err);
  }
});

router.post('/call-next', validateCallNext, async (req, res, next) => {
  try {
    const result = await queueService.callNext(req.body.examTypeId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/complete/:id', validateIdParam, (req, res, next) => {
  try {
    const result = queueService.completePatient(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/cancel/:id', validateIdParam, (req, res, next) => {
  try {
    const result = queueService.cancelPatient(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
