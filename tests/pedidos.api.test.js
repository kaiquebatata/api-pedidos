const request = require('supertest');
const { createApp } = require('../src/app');
const repository = require('../src/repositories/pedidosRepository');

const app = createApp();
const valido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('POST /pedidos', () => {
  test('201 com pedido criado', async () => {
    const res = await request(app).post('/pedidos').send(valido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...valido, status: 'recebido' });
  });

  test('ids são sequenciais', async () => {
    await request(app).post('/pedidos').send(valido);
    const res = await request(app).post('/pedidos').send(valido);
    expect(res.body.id).toBe(2);
  });

  test.each([
    ['cliente vazio', { cliente: '   ' }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -5 }],
    ['valor textual', { valor: 'abc' }],
    ['tipo inválido', { tipo: 'xyz' }],
    ['prioridade inválida', { prioridade: 'xyz' }],
  ])('400 com mensagem JSON para %s', async (_n, alteracao) => {
    const res = await request(app).post('/pedidos').send({ ...valido, ...alteracao });
    expect(res.status).toBe(400);
    expect(typeof res.body.erro).toBe('string');
    expect(res.body.erro.length).toBeGreaterThan(0);
  });

  test('400 quando o corpo está vazio', async () => {
    const res = await request(app).post('/pedidos').send({});
    expect(res.status).toBe(400);
  });

  test('400 (e não 500) para JSON malformado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{cliente: sem aspas');
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/JSON/);
  });
});

describe('GET /pedidos', () => {
  test('200 com lista vazia', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200 com os pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(valido);
    await request(app).post('/pedidos').send({ ...valido, cliente: 'Maria' });
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[1].cliente).toBe('Maria');
  });
});

describe('GET /pedidos/:id', () => {
  test('200 para pedido existente', async () => {
    await request(app).post('/pedidos').send(valido);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test('404 para id inexistente', async () => {
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('404 para id não numérico', async () => {
    const res = await request(app).get('/pedidos/abc');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /pedidos/:id/status', () => {
  test('200 para transição válida', async () => {
    await request(app).post('/pedidos').send(valido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');

    const consulta = await request(app).get('/pedidos/1');
    expect(consulta.body.status).toBe('em_preparacao');
  });

  test('400 para status desconhecido', async () => {
    await request(app).post('/pedidos').send(valido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'xyz' });
    expect(res.status).toBe(400);
  });

  test('400 para corpo sem status', async () => {
    await request(app).post('/pedidos').send(valido);
    const res = await request(app).patch('/pedidos/1/status').send({});
    expect(res.status).toBe(400);
  });

  test('400 para transição não permitida e status não muda', async () => {
    await request(app).post('/pedidos').send(valido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'entregue' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Transição inválida/);

    const consulta = await request(app).get('/pedidos/1');
    expect(consulta.body.status).toBe('recebido');
  });

  test('404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });
    expect(res.status).toBe(404);
  });
});

describe('Rotas desconhecidas e erros inesperados', () => {
  test('404 JSON para rota inexistente', async () => {
    const res = await request(app).get('/nada');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('500 para erro inesperado, sem vazar detalhes', async () => {
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spy = jest.spyOn(repository, 'listar').mockImplementation(() => {
      throw new Error('falha interna secreta');
    });
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('Erro interno do servidor.');
    expect(JSON.stringify(res.body)).not.toMatch(/secreta/);
    spy.mockRestore();
    spyErr.mockRestore();
  });
});
