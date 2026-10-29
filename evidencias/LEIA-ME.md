# Evidências (Postman)

Os prints exigidos pelo enunciado devem ser capturados **por você, no Postman**, executando a API
localmente (`npm start`) com a coleção `postman_collection.json` (Import → arquivo). Salve nesta pasta:

| Arquivo | Cenário | Requisição da coleção |
|---|---|---|
| `01-criacao.png` | POST válido → 201 | 01 |
| `02-validacao.png` | POST inválido → 400 | 02 |
| `03-listagem.png` | GET lista → 200 | 03 |
| `04-consulta-inexistente.png` | GET id inexistente → 404 | 04 |
| `05-atualizacao.png` | PATCH status válido → 200 | 05 |

Cada print precisa mostrar **método, URL, corpo (quando houver), resposta e código HTTP** de forma legível.

Execute as requisições na ordem 01 → 05 (a 05 usa o pedido de id 1 criado na 01).

Os arquivos `.txt` desta pasta são transcrições textuais geradas por `scripts/gerar-transcricoes.sh`
contra a API real; servem de referência do que o Postman deve mostrar, mas **não substituem os prints**.
