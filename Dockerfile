# 1. Usamos Node 20
FROM node:20-slim

# Instalamos dependencias necesarias para algunas librerías nativas (como bcrypt o pg)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo devDependencies para poder usar tsx y vite)
RUN npm install

# Copiamos todo el proyecto
COPY . .

# Ejecutamos el script de build que mencionaste
# Este script debería generar la carpeta /dist con index.cjs y los assets de React
RUN npm run build

# Exponemos el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production

# Comando de inicio
CMD [ "npm", "start" ]