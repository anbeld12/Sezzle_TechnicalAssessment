# Stage 1: Build Go binary
FROM golang:alpine AS builder

WORKDIR /app

# Download dependencies with cache layer
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build statically linked binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/calculator-server ./cmd/server

# Stage 2: Minimal hardened runtime image
FROM alpine:3.21

# Install CA certificates and wget for healthcheck, and create non-root user
RUN apk --no-cache add ca-certificates wget && \
    addgroup -S appgroup && adduser -S appuser -G appgroup -u 10001

WORKDIR /app

COPY --from=builder /bin/calculator-server /app/calculator-server

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["/app/calculator-server"]
