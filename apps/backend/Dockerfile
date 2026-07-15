# -- build stage --
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# -- production stage --
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

RUN mkdir -p /app/uploads

EXPOSE 5000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
