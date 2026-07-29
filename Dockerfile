# syntax=docker/dockerfile:1

# --- Build stage: install all deps and compile TypeScript to dist/ ---
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# --- Runtime stage: production deps only + compiled output ---
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

COPY --from=build /app/dist ./dist

# Run as the non-root user that the node image already provides.
USER node

EXPOSE 3338
CMD ["node", "dist/main.js"]
