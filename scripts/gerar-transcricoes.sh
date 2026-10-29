#!/usr/bin/env bash
# Executa os 5 cenários de evidência contra a API em execução e salva a
# requisição/resposta em evidencias/*.txt (apoio textual; os prints do Postman
# continuam sendo necessários). Uso: npm start  (outro terminal)  bash scripts/gerar-transcricoes.sh
BASE="${BASE:-http://localhost:3000}"
OUT="$(dirname "$0")/../evidencias"
mkdir -p "$OUT"

run() { # arquivo método url [corpo]
  local arq="$1" metodo="$2" url="$3" corpo="$4"
  {
    echo "$metodo $url"
    [ -n "$corpo" ] && { echo "Corpo:"; echo "$corpo"; }
    echo "---"
    if [ -n "$corpo" ]; then
      curl -s -o /tmp/resp.json -w "HTTP %{http_code}\n" -X "$metodo" -H 'Content-Type: application/json' -d "$corpo" "$BASE$url"
    else
      curl -s -o /tmp/resp.json -w "HTTP %{http_code}\n" -X "$metodo" "$BASE$url"
    fi
    cat /tmp/resp.json; echo
  } > "$OUT/$arq"
}

run 01-criacao.txt POST /pedidos '{"cliente":"Carlos Silva","tipo":"entrega","valor":350,"prioridade":"normal"}'
run 02-validacao.txt POST /pedidos '{"cliente":"   ","tipo":"entrega","valor":-1,"prioridade":"normal"}'
run 03-listagem.txt GET /pedidos
run 04-consulta-inexistente.txt GET /pedidos/9999
run 05-atualizacao.txt PATCH /pedidos/1/status '{"status":"em_preparacao"}'
echo "Transcrições geradas em $OUT"
