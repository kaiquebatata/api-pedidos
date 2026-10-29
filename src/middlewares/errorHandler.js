const { AppError } = require('../errors/AppError');

// 404 para rotas que não existem
function notFoundRoute(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// Middleware central de erros (4 parâmetros é obrigatório no Express)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Erros esperados: validação (400) e não encontrado (404)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  // JSON malformado enviado pelo cliente: é erro do usuário (400)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Erro inesperado: não vaza detalhes internos ao cliente
  console.error('Erro inesperado:', err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { notFoundRoute, errorHandler };
