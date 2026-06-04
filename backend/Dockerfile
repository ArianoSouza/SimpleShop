# Estágio de Compilação
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Estágio de Produção
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
# O initDb.ts e outros arquivos são compilados para JS no dist, mas o index.js os chamará.

EXPOSE 3000

CMD ["node", "dist/index.js"]
