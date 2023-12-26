FROM golang:1.20-alpine AS build

WORKDIR /app
COPY . .

RUN go mod download
RUN go build -o /app/proxy

FROM alpine:latest

WORKDIR /app
COPY --from=build /app/proxy .

CMD ["./proxy"]
