FROM node:22-bookworm-slim

ENV NODE_ENV=production

COPY ./home/package.json .

COPY ./home/package-lock.json .

RUN npm ci

COPY ./home .

USER node

CMD ["node", "app.js"]