FROM node:20-bookworm-slim

WORKDIR /app

# Prisma needs OpenSSL at runtime on slim images.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install deps first (npm install is more tolerant than npm ci on CI builders).
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/main"]
