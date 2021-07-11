FROM node:14

WORKDIR /app

COPY patches /app/patches
COPY nodemon.json package.json tsconfig.json yarn.lock /app/
COPY src /app/src

RUN yarn install

ENTRYPOINT ["yarn", "start"]
