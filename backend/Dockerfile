# Stage 1: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache wget
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache wget
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production


# Stage 3: Final runtime image
FROM node:20-alpine AS runtime
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app ./
EXPOSE 5000
CMD ["node", "index.js"]