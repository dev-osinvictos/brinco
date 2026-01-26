# Brinco Likes API

## Variáveis de ambiente
- `DATABASE_URL` (obrigatório)
- `PORT` (opcional, default 3000)
- `FRONTEND_ORIGIN` (opcional, default `*`)
- `NODE_ENV` (`production` para usar SSL no Postgres)

## Banco
Execute `schema.sql` no Postgres antes de subir.

## Rotas
- `GET /health`
- `GET /likes/:docId`
- `POST /likes/:docId`
