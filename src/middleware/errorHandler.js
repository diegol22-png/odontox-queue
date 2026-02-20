class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      message: err.message || 'Erro interno do servidor',
      code: err.code || 'INTERNAL_ERROR',
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  if (statusCode === 500) {
    console.error('Erro interno:', err);
  }

  res.status(statusCode).json(response);
}

module.exports = { AppError, errorHandler };
