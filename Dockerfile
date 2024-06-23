FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && \
    apk add --no-cache ffmpeg

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
