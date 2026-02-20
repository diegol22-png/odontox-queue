const { Router } = require('express');
const queueService = require('../services/queueService');
const { validateQueueEntry, validateIdParam } = require('../middleware/validation');

const router = Router();

router.post('/', validateQueueEntry, async (req, res, next) => {
  try {
    const result = await queueService.enqueue(req.body.name, req.body.phone, req.body.examTypeId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validateIdParam, (req, res, next) => {
  try {
    const status = queueService.getPatientStatus(req.params.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
