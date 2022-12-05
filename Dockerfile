FROM ubuntu:18.04
FROM node:14

WORKDIR /usr/src/mtss
COPY . /usr/src/mtss/

RUN npm install

EXPOSE 9000

CMD ["npm", "run", "start"]