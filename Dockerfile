FROM oven/bun:1 as base

WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY README.md ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER bun

CMD ["bun", "run", "src/index.ts"]

