const service = require('../services/pedidosService');

// Controller: traduz HTTP <-> service. Não contém regra de negócio.
// Erros lançados pelo service são encaminhados ao errorHandler via next(err).

function criar(req, res, next) {
  try {
    const pedido = service.criarPedido(req.body);
    res.status(201).json(pedido);
  } catch (err) {
    next(err);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(service.listarPedidos());
  } catch (err) {
    next(err);
  }
}

function buscarPorId(req, res, next) {
  try {
    res.status(200).json(service.buscarPedido(req.params.id));
  } catch (err) {
    next(err);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const pedido = service.atualizarStatus(req.params.id, req.body);
    res.status(200).json(pedido);
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
