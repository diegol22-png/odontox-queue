const { body, param, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: errors.array()[0].msg,
        code: 'VALIDATION_ERROR',
        details: errors.array(),
      },
    });
  }
  next();
}

const validateQueueEntry = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Telefone e obrigatorio')
    .customSanitizer(value => value.replace(/\D/g, ''))
    .matches(/^\d{10,11}$/).withMessage('Telefone deve ter 10 ou 11 digitos (DDD + numero)'),
  body('examTypeId')
    .notEmpty().withMessage('Tipo de exame e obrigatorio')
    .isInt({ min: 1 }).withMessage('Tipo de exame invalido')
    .toInt(),
  handleValidation,
];

const validateExamType = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome do exame e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  handleValidation,
];

const validateCallNext = [
  body('examTypeId')
    .notEmpty().withMessage('Tipo de exame e obrigatorio')
    .isInt({ min: 1 }).withMessage('Tipo de exame invalido')
    .toInt(),
  handleValidation,
];

const validateIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID invalido')
    .toInt(),
  handleValidation,
];

module.exports = {
  validateQueueEntry,
  validateExamType,
  validateCallNext,
  validateIdParam,
};
