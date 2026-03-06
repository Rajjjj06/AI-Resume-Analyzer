FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-slim AS production
WORKDIR /app

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs nodejs

COPY --chown=nodejs:nodejs . .
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules

RUN rm -rf .env tests/
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]