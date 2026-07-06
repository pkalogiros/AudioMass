FROM golang:1.22-alpine
WORKDIR /app/src
COPY src/ ./
ENTRYPOINT ["go", "run", "audiomass-server.go"]