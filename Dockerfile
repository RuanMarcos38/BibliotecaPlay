FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
RUN mkdir -p public
# A build-only local URL satisfies schema validation; no production secrets are
# sent to the image build and no database operation is performed by this step.
RUN DATABASE_URL='postgresql://bibliotecaplay_runtime:build-only@127.0.0.1:5432/postgres?schema=bibliotecaplay' NEXT_TELEMETRY_DISABLED=1 pnpm build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/certs ./certs
USER node
EXPOSE 3000
CMD ["node", "server.js"]
