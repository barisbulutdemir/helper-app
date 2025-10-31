FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p uploads/documents uploads/photos && \
    chmod -R 777 /app

EXPOSE 3001

CMD ["node", "server.js"]
