FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN go mod tidy
RUN go build -o /out/exchange ./cmd/exchange

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/exchange ./exchange
ENV BROKER_CALLBACK_URL=http://broker:8000/exec
EXPOSE 8081
CMD ["./exchange"]
