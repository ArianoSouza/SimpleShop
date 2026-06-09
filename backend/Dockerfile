FROM node:22-alpine

WORKDIR /app

# Instalar dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copiar o restante do código
COPY . .

EXPOSE 3000

# O comando será sobrescrito pelo docker-compose.yml, mas deixamos um padrão
CMD ["npm", "run", "dev"]
