FROM node:22-alpine

WORKDIR /app

# Instalar expo-cli globalmente
RUN npm install -g expo-cli

COPY package*.json ./
RUN npm install

COPY . .

# Expor portas do Expo
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Para desenvolvimento web
CMD ["npm", "run", "web"]
