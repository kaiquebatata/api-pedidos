# API de Gerenciamento de Pedidos

Projeto prático avaliativo — Tópicos Avançados em Sistemas de Informação II.

- **Aluno:** _<seu nome>_
- **RA:** _<seu RA>_

API REST para gerenciar os pedidos de uma pequena loja, feita com **Node.js + Express (JavaScript)**,
com armazenamento **em memória** (os dados são perdidos ao reiniciar o servidor).

## Instalação e execução

Requisitos: Node.js 18+.

```bash
npm install
npm start        # sobe em http://localhost:3000 (use PORT=4000 npm start para mudar a porta)
npm test         # executa os testes automatizados (Jest + Supertest)
```

## Rotas

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| POST | `/pedidos` | Cadastra um pedido (RF01) | 201, 400 |
| GET | `/pedidos` | Lista os pedidos (RF02) | 200 |
| GET | `/pedidos/:id` | Consulta um pedido (RF03) | 200, 404 |
| PATCH | `/pedidos/:id/status` | Atualiza o status (RF04) | 200, 400, 404 |

### Exemplos

**POST /pedidos**

```json
{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```

Resposta `201`:

```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

**PATCH /pedidos/1/status**

```json
{ "status": "em_preparacao" }
```

Resposta `200`: o pedido completo com o novo status.

**Erro (400 / 404 / 500)** — sempre JSON com a chave `erro`:

```json
{ "erro": "O campo \"valor\" deve ser um número maior que zero." }
```

## Regras de negócio e validações

**Valores reconhecidos**

| Campo | Valores aceitos |
|---|---|
| `tipo` | `entrega`, `retirada`, `local` |
| `prioridade` | `baixa`, `normal`, `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

**Validações (POST /pedidos)** — todos os campos são obrigatórios:

- `cliente`: texto não vazio, mesmo após remover espaços nas extremidades (o valor é salvo já sem espaços).
- `valor`: precisa ser do tipo **número** (JSON) e maior que zero. Texto como `"350"` é rejeitado.
- `tipo` e `prioridade`: devem estar nas listas acima (comparação exata, em minúsculas).
- Falha de validação → `400` com mensagem explicativa. Todo pedido novo nasce com `status = "recebido"`.

**Transições de status (PATCH)**

```
recebido ──► em_preparacao ──► enviado ──► entregue
    │              │
    └──────────────┴──► cancelado
```

| De | Para (permitido) |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | — (final) |
| `cancelado` | — (final) |

**Ordem de verificação no PATCH:** (1) o pedido existe? senão `404`; (2) `status` é um valor conhecido? senão `400`;
(3) a transição é permitida? senão `400`. Repetir o status atual também é transição inválida.

**Identificadores:** `id` é inteiro positivo gerado em sequência. Um id inexistente **ou mal formado**
(`abc`, `1.5`, `-1`) responde `404`, pois nenhum pedido corresponde a ele.

**Erros:** `AppError`/`ValidationError`/`NotFoundError` representam erros esperados (400/404).
JSON malformado no corpo → `400`. Qualquer outro erro é tratado como inesperado: o detalhe é registrado
no console e o cliente recebe `500` com mensagem genérica (sem vazar informações internas).
Rotas inexistentes respondem `404` em JSON.

## Arquitetura

Arquitetura em camadas; cada camada só conversa com a imediatamente abaixo:

```
src/
├── server.js                  # inicia o servidor (porta)
├── app.js                     # monta o Express: JSON, rotas, tratamento de erros
├── routes/pedidosRoutes.js    # mapeia método+URL -> controller
├── controllers/pedidosController.js   # HTTP: lê req, escolhe status code, chama service
├── services/pedidosService.js         # regras de negócio: validações e transições de status
├── repositories/pedidosRepository.js  # armazenamento em memória (array)
├── errors/AppError.js         # ValidationError (400) e NotFoundError (404)
└── middlewares/errorHandler.js        # converte erros em respostas HTTP (400/404/500)
tests/                         # Jest + Supertest
evidencias/                    # prints do Postman
postman_collection.json        # coleção para testes manuais
```

| Camada | Responsabilidade | Não deve conter |
|---|---|---|
| Routes | Definir endpoints | Lógica |
| Controller | Traduzir HTTP ↔ service | Regras de negócio |
| Service | Validar dados, aplicar regras de status | Objetos `req`/`res` |
| Repository | Guardar/recuperar dados | Validação ou HTTP |

**Padrão implementado:** Routes → Controller → Service → Repository (*layered architecture*), com
**middleware centralizado de erros**. As regras lançam exceções tipadas e o `errorHandler` decide o código HTTP,
mantendo controllers simples. O repository devolve **cópias** dos objetos, evitando que alterações externas
modifiquem o armazenamento sem passar pelo `atualizar`. Trocar a memória por um banco exigiria mexer apenas no repository.

## Testes

`npm test` roda 44 testes:

- `tests/pedidos.service.test.js` — testes unitários das regras (validações, fluxo completo de status, transições proibidas, ids malformados).
- `tests/pedidos.api.test.js` — testes de integração HTTP com Supertest (201/200/400/404/500, JSON malformado, rota inexistente).

**Testes manuais:** importe `postman_collection.json` no Postman (variável `baseUrl` = `http://localhost:3000`).
Os prints estão em `evidencias/` (ver `evidencias/LEIA-ME.md`).

## Uso de IA

Utilizei IA (Claude, da Anthropic) como apoio. _<Ajuste esta seção para refletir exatamente o que você fez.>_

**Tarefas em que a IA ajudou:** geração inicial da estrutura em camadas, rascunho dos testes Jest e da coleção do Postman, e redação do README.

**Sugestões e decisões (revisadas e testadas por mim):**

- **Aceita:** middleware central de erros com classes `ValidationError`/`NotFoundError`, para que o controller não decida códigos HTTP em cada `catch` e erros inesperados virem `500` sem vazar detalhes.
- **Aceita com modificação:** máquina de transições de status. O fluxo `recebido → em_preparacao → enviado → entregue`, com `cancelado` permitido só até `em_preparacao`, foi definido como regra de negócio documentada acima; conferi cada transição nos testes.
- **Decisão adotada:** `valor` só aceita tipo número (rejeita `"350"`), porque o enunciado exige valor "numérico" e converter texto esconderia dados inválidos.
- **Rejeitada/alterada (exemplo — substitua pelo seu caso real):** _<descreva uma sugestão que você recusou ou mudou e por quê>_.
