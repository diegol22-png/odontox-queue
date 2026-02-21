const { Router } = require('express');
const examModel = require('../models/examModel');
const { validateExamType, validateIdParam } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = Router();

router.get('/', (req, res) => {
  const exams = examModel.getAll();
  res.json(exams);
});

router.post('/', validateExamType, (req, res, next) => {
  try {
    const exam = examModel.create(req.body.name);
    res.status(201).json(exam);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return next(new AppError('Ja existe um exame com este nome', 409, 'DUPLICATE_EXAM'));
    }
    next(err);
  }
});

router.delete('/:id', validateIdParam, (req, res, next) => {
  const exam = examModel.getById(req.params.id);
  if (!exam) {
    return next(new AppError('Exame nao encontrado', 404, 'NOT_FOUND'));
  }
  examModel.deactivate(req.params.id);
  res.json({ success: true });
});

router.patch('/:id', validateIdParam, (req, res, next) => {
  const exam = examModel.getById(req.params.id);
  if (!exam) {
    return next(new AppError('Exame nao encontrado', 404, 'NOT_FOUND'));
  }

  if (req.body.name) {
    examModel.rename(req.params.id, req.body.name);
  }
  if (req.body.active !== undefined) {
    if (req.body.active) {
      examModel.activate(req.params.id);
    } else {
      examModel.deactivate(req.params.id);
    }
  }
  if (req.body.queue_message !== undefined || req.body.call_message !== undefined) {
    const current = examModel.getById(req.params.id);
    examModel.updateMessages(
      req.params.id,
      req.body.queue_message !== undefined ? req.body.queue_message : current.queue_message,
      req.body.call_message !== undefined ? req.body.call_message : current.call_message,
    );
  }

  const updated = examModel.getById(req.params.id);
  res.json(updated);
});

module.exports = router;
