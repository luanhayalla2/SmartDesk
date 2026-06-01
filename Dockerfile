# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copiar package*.json e instalar dependências
COPY package*.json ./
RUN npm install --production

# Copiar código fonte
COPY . .

# Expor porta da aplicação
EXPOSE 3000

# Comando padrão
CMD ["npm", "run", "dev"]
