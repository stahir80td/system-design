# ------------------------------------------------------------
# Stage 1: Build the Vite front-end
# ------------------------------------------------------------
FROM node:20-alpine AS web-build
WORKDIR /app

# Install web deps
COPY web/package*.json ./web/
RUN cd web && npm ci --no-audit --no-fund

# Copy web source and build
COPY web ./web
RUN cd web && npm run build

# ------------------------------------------------------------
# Stage 2: Build the Go backend
# ------------------------------------------------------------
FROM golang:1.21-alpine AS go-build
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files and download dependencies
COPY server/go.mod server/go.sum ./
RUN go mod download

# Copy the main.go and server directory contents
COPY server/main.go ./
COPY server/data ./data
COPY server/internal ./internal

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# ------------------------------------------------------------
# Stage 3: Final runtime image
# ------------------------------------------------------------
FROM alpine:latest
WORKDIR /app

# Install ca-certificates for HTTPS calls (needed for Gemini API)
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN addgroup -g 1000 -S appuser && \
    adduser -S appuser -u 1000 -G appuser

# Copy the Go binary from build stage
COPY --from=go-build /app/main ./main

# Copy built web assets into ./public (served by Go backend)
COPY --from=web-build /app/web/dist ./public

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

# Render provides PORT env var dynamically
ENV NODE_ENV=production
EXPOSE 8080

CMD ["./main"]