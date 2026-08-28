# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /src
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/api ./cmd/api

# Runtime stage
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=builder /out/api /app/api

RUN mkdir -p /app/data /site && chown -R app:app /app /site

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/app/api"]
