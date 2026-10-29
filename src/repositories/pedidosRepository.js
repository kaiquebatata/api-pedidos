// Camada de persistência em memória.
// Só guarda e recupera dados; não conhece HTTP nem regras de negócio.
let pedidos = [];
let proximoId = 1;

function criar(dados) {
  const pedido = { id: proximoId++, ...dados };
  pedidos.push(pedido);
  return { ...pedido };
}

function listar() {
  return pedidos.map((p) => ({ ...p }));
}

function buscarPorId(id) {
  const pedido = pedidos.find((p) => p.id === id);
  return pedido ? { ...pedido } : null;
}

function atualizar(id, campos) {
  const indice = pedidos.findIndex((p) => p.id === id);
  if (indice === -1) return null;
  pedidos[indice] = { ...pedidos[indice], ...campos };
  return { ...pedidos[indice] };
}

// Usado apenas nos testes para isolar os cenários
function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, atualizar, limpar };
