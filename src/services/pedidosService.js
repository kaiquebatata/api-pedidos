const repository = require('../repositories/pedidosRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const TIPOS = ['entrega', 'retirada', 'local'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const STATUS_INICIAL = 'recebido';

// Máquina de estados: status atual -> próximos status permitidos
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

function validarNovoPedido(dados) {
  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }

  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    throw new ValidationError('O campo "cliente" é obrigatório e deve ser um texto não vazio.');
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new ValidationError('O campo "valor" deve ser um número maior que zero.');
  }
  if (!TIPOS.includes(tipo)) {
    throw new ValidationError(`O campo "tipo" é inválido. Valores aceitos: ${TIPOS.join(', ')}.`);
  }
  if (!PRIORIDADES.includes(prioridade)) {
    throw new ValidationError(
      `O campo "prioridade" é inválido. Valores aceitos: ${PRIORIDADES.join(', ')}.`
    );
  }

  return { cliente: cliente.trim(), tipo, valor, prioridade };
}

// Um id válido é um inteiro positivo composto apenas por dígitos.
// Qualquer outra coisa (ex.: "abc", "1.5", "-1") não corresponde a pedido existente.
function converterId(idTexto) {
  return /^\d+$/.test(String(idTexto)) ? Number(idTexto) : null;
}

function criarPedido(dados) {
  const validado = validarNovoPedido(dados);
  return repository.criar({ ...validado, status: STATUS_INICIAL });
}

function listarPedidos() {
  return repository.listar();
}

function buscarPedido(idTexto) {
  const id = converterId(idTexto);
  const pedido = id === null ? null : repository.buscarPorId(id);
  if (!pedido) {
    throw new NotFoundError(`Pedido com id "${idTexto}" não encontrado.`);
  }
  return pedido;
}

function atualizarStatus(idTexto, dados) {
  // Ordem: 1) o pedido existe (404)  2) o corpo é válido (400)  3) a transição é permitida (400)
  const pedido = buscarPedido(idTexto);

  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }
  const { status } = dados;
  if (!STATUS.includes(status)) {
    throw new ValidationError(
      `O campo "status" é inválido. Valores aceitos: ${STATUS.join(', ')}.`
    );
  }

  const permitidos = TRANSICOES[pedido.status];
  if (!permitidos.includes(status)) {
    const lista = permitidos.length ? permitidos.join(', ') : 'nenhum (status final)';
    throw new ValidationError(
      `Transição inválida: de "${pedido.status}" para "${status}". Transições permitidas: ${lista}.`
    );
  }

  return repository.atualizar(pedido.id, { status });
}

module.exports = {
  TIPOS,
  PRIORIDADES,
  STATUS,
  TRANSICOES,
  criarPedido,
  listarPedidos,
  buscarPedido,
  atualizarStatus,
};
