const { Router } = require('express');
const queueService = require('../services/queueService');
const { validateCallNext, validateIdParam } = require('../middleware/validation');

const router = Router();

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
