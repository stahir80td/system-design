# ------------------------------------------------------------
# Stage 1: Build the Vite front-end
# ------------------------------------------------------------
FROM node:20-alpine AS web-build
WORKDIR /app

# Install web deps
COPY web/package*.json ./web/
RUN cd web && npm ci --no-audit --no-fund

# Copy source and build
COPY web ./web
RUN cd web && npm run build

# ------------------------------------------------------------
# Stage 2: Install server deps
# ------------------------------------------------------------
FROM node:20-alpine AS server-deps
WORKDIR /app

# Install server deps only (for a smaller final image)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund

# ------------------------------------------------------------
# Stage 3: Final runnable image
# ------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

# Copy server runtime (node_modules first for better layer caching)
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server ./server

# Copy built web assets into a public/ (or static/) dir that the server will serve
COPY --from=web-build /app/web/dist ./server/public

# Optionally, drop a tiny runtime config file that both FE/BE can read if needed
# (Avoids Vite/Render env vars; you can import or read it on the server and expose via /api/config)
# COPY config.json ./server/config.json

# Security best-practice: run as a non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

# Render will provide PORT; your server must respect it (fall back to 8080 locally)
ENV NODE_ENV=production

# Your server must bind to 0.0.0.0 and use process.env.PORT
EXPOSE 8080
CMD ["node", "server/index.js"]
