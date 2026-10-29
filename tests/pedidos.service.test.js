const service = require('../src/services/pedidosService');
const repository = require('../src/repositories/pedidosRepository');
const { ValidationError, NotFoundError } = require('../src/errors/AppError');

const valido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('pedidosService.criarPedido', () => {
  test('cria pedido válido com status inicial "recebido"', () => {
    const pedido = service.criarPedido(valido);
    expect(pedido).toEqual({ id: 1, ...valido, status: 'recebido' });
  });

  test('remove espaços nas extremidades do cliente', () => {
    expect(service.criarPedido({ ...valido, cliente: '  Ana  ' }).cliente).toBe('Ana');
  });

  test.each([
    ['cliente vazio', { cliente: '' }],
    ['cliente só com espaços', { cliente: '   ' }],
    ['cliente ausente', { cliente: undefined }],
    ['cliente não-texto', { cliente: 123 }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -10 }],
    ['valor em texto', { valor: '350' }],
    ['valor NaN', { valor: NaN }],
    ['tipo desconhecido', { tipo: 'drone' }],
    ['prioridade desconhecida', { prioridade: 'urgentissima' }],
  ])('rejeita %s', (_nome, alteracao) => {
    expect(() => service.criarPedido({ ...valido, ...alteracao })).toThrow(ValidationError);
  });

  test('rejeita corpo que não é objeto', () => {
    expect(() => service.criarPedido(null)).toThrow(ValidationError);
    expect(() => service.criarPedido([])).toThrow(ValidationError);
  });
});

describe('pedidosService.buscarPedido', () => {
  test('lança NotFoundError para id inexistente ou malformado', () => {
    expect(() => service.buscarPedido('999')).toThrow(NotFoundError);
    expect(() => service.buscarPedido('abc')).toThrow(NotFoundError);
    expect(() => service.buscarPedido('1.5')).toThrow(NotFoundError);
  });
});

describe('pedidosService.atualizarStatus (transições)', () => {
  test('percorre o fluxo completo recebido -> entregue', () => {
    service.criarPedido(valido);
    expect(service.atualizarStatus('1', { status: 'em_preparacao' }).status).toBe('em_preparacao');
    expect(service.atualizarStatus('1', { status: 'enviado' }).status).toBe('enviado');
    expect(service.atualizarStatus('1', { status: 'entregue' }).status).toBe('entregue');
  });

  test('permite cancelar enquanto recebido ou em preparação', () => {
    service.criarPedido(valido);
    service.criarPedido(valido);
    service.atualizarStatus('2', { status: 'em_preparacao' });
    expect(service.atualizarStatus('1', { status: 'cancelado' }).status).toBe('cancelado');
    expect(service.atualizarStatus('2', { status: 'cancelado' }).status).toBe('cancelado');
  });

  test('não permite pular etapas', () => {
    service.criarPedido(valido);
    expect(() => service.atualizarStatus('1', { status: 'entregue' })).toThrow(ValidationError);
  });

  test('não permite cancelar pedido já enviado', () => {
    service.criarPedido(valido);
    service.atualizarStatus('1', { status: 'em_preparacao' });
    service.atualizarStatus('1', { status: 'enviado' });
    expect(() => service.atualizarStatus('1', { status: 'cancelado' })).toThrow(ValidationError);
  });

  test('status finais não aceitam novas transições', () => {
    service.criarPedido(valido);
    service.atualizarStatus('1', { status: 'cancelado' });
    expect(() => service.atualizarStatus('1', { status: 'recebido' })).toThrow(ValidationError);
  });

  test('não permite repetir o mesmo status', () => {
    service.criarPedido(valido);
    expect(() => service.atualizarStatus('1', { status: 'recebido' })).toThrow(ValidationError);
  });

  test('status desconhecido é inválido', () => {
    service.criarPedido(valido);
    expect(() => service.atualizarStatus('1', { status: 'voando' })).toThrow(ValidationError);
  });

  test('id inexistente lança NotFoundError', () => {
    expect(() => service.atualizarStatus('42', { status: 'cancelado' })).toThrow(NotFoundError);
  });
});
