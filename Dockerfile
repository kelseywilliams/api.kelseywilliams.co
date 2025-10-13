FROM node

COPY ./home/package.json .

RUN npm install

COPY ./home .

CMD ["npm", "start", "app.js"]