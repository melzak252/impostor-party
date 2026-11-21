FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY tests ./tests

RUN bun run typecheck && bun test ./tests && bun run build

FROM oven/bun:1.3-alpine
WORKDIR /app/dist

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/impostor.sqlite

RUN mkdir -p /data && chown bun:bun /data
COPY --chown=bun:bun --from=builder /app/dist ./

USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "index.js"]
