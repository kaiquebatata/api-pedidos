// Erros "esperados" da aplicação (validação, não encontrado, etc.).
// Qualquer outro erro é tratado como inesperado (HTTP 500).
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

module.exports = { AppError, ValidationError, NotFoundError };
