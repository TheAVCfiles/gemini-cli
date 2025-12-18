FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
