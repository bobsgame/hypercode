# Stage 1: Pruner (Optional but good for caching, skip for now to keep simple)
# Stage 1: Builder
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json ./

# Copy package manifests (Naive approach: copy all package.jsons to correct structure)
# We use a trick or just copy everything if the context is small enough.
# For now, let's copy specific known packages to avoid cache invalidation on every file change during install.
COPY packages/core/package.json packages/core/
COPY packages/ui/package.json packages/ui/
COPY packages/cli/package.json packages/cli/
COPY packages/types/package.json packages/types/
COPY packages/adapters/gemini/package.json packages/adapters/gemini/
COPY packages/adapters/claude/package.json packages/adapters/claude/
COPY apps/web/package.json apps/web/

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages
# We assume 'build' script in root calls turbo to build everything
RUN pnpm run build

# Stage 2: Core Runner
FROM node:20-slim AS core
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app ./

# Expose Core port
EXPOSE 3000

# Start Core
CMD ["node", "packages/core/dist/index.js"]

# Stage 3: Web Runner
FROM node:20-slim AS web
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy built artifacts from builder
# Next.js standalone build is ideal but for now we copy the repo
COPY --from=builder /app ./

# Expose Web port
EXPOSE 3000

# Start Web
WORKDIR /app/apps/web
CMD ["pnpm", "start"]
