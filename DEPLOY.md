# Borg Deployment Guide

> **Version**: 2.7.32
> **Scope**: Local Development & Production Deployment

---

## 1. Prerequisites

- **Node.js**: v20 or higher (LTS recommended)
- **Package Manager**: pnpm (v10+)
- **Build Tool**: Turborepo (global install optional, used via scripts)
- **Database**: SQLite (default for local) or PostgreSQL (production)
- **Environment**: Windows, Linux, or macOS
- **Docker** (optional): For containerized production deployment

## 2. Local Development (The "Mission Control" Setup)

Borg is designed to run locally as your personal AI Operating System.

### Quick Start
```bash
# 1. Install dependencies & submodules
git submodule update --init --recursive
pnpm install

# 2. Build shared packages
pnpm run build

# 3. Start the stack (Backend + Dashboard + CLI)
# This runs 'turbo run dev' which orchestrates all apps
pnpm run dev

# 4. Verify cross-service readiness
node scripts/verify_dev_readiness.mjs

# Optional machine-readable output
node scripts/verify_dev_readiness.mjs --json --soft
```

### Access Points
- **Dashboard**: `http://localhost:3000` (Next.js App)
- **Borg Server**: `http://localhost:3001` (Core API & WebSocket)
- **MCP Server**: `stdio` (via CLI wrapper) or `SSE` (if configured)
- **MetaMCP Frontend**: `http://localhost:12008`
- **MetaMCP Backend**: `http://localhost:12009/health`

---

## 3. Production Deployment (Self-Hosting)

### Docker (Recommended)

Borg ships with a multi-stage `Dockerfile.prod` that creates separate container targets for the core API and the web dashboard.

#### Build Targets

| Target | Base Image | Exposes | Purpose |
|--------|-----------|---------|---------|
| `core-runner` | node:20-slim | 3000 | Borg Core API + WebSocket server |
| `web-runner` | node:20-slim | 8080 | Next.js standalone dashboard |

#### Build & Run
```bash
# Build the core API container
docker build -f Dockerfile.prod --target core-runner -t borg-core:latest .

# Build the web dashboard container
docker build -f Dockerfile.prod --target web-runner -t borg-web:latest .

# Run
docker run -d -p 3000:3000 --name borg-core borg-core:latest
docker run -d -p 8080:8080 --name borg-web borg-web:latest
```

Both containers include built-in healthchecks (30s interval, 5s timeout, 3 retries).

### Manual Server Deployment
1. **Build**:
   ```bash
   pnpm install
   pnpm run build
   ```
2. **Environment Variables**:
   Create a `.env` file in `packages/core` and `apps/web`:
   ```env
   # Core
   PORT=3001
   DATABASE_URL=file:./dev.db
   JWT_SECRET=your_secret_key
   
   # Web
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
3. **Start**:
   ```bash
   # Start logic only
   cd packages/core
   npm start
   
   # Start UI
   cd apps/web
   npm start
   ```

---

## 4. MCP Server Integration

To use Borg as an MCP Server inside **Claude Desktop** or **Cursor**:

### Claude Desktop Config
Edit `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "borg-core": {
      "command": "node",
      "args": [
        "C:/path/to/borg/packages/cli/dist/index.js",
        "mcp",
        "start"
      ]
    }
  }
}
```

### Cursor Config
Add via "Borg" extension or manual MCP settings using the same command tuple.

---

## 5. Troubleshooting

- **Port 3001 In Use**: The core server creates a WebSocket on 3001. Ensure no other instance is running.
- **Circular Dependencies**: If `pnpm build` fails, check `packages/core` for circular imports (Ref: Phase 63 fix).
- **Database Locks**: SQLite may lock if multiple processes access `dev.db` in write mode.
- **Docker Build Fails**: Ensure `turbo` can prune the workspace. Run `pnpm dlx turbo prune @borg/web @borg/core --docker` locally first to validate.

---

*"Assimilate your infrastructure."*
