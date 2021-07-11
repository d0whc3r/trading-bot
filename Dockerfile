FROM node:14 as builder

WORKDIR /app

COPY patches /app/patches
COPY nodemon.json package.json tsconfig.json yarn.lock rollup.config.js rollup-base.config.js dts-bundle-generator.js /app/
COPY src /app/src

RUN yarn install
RUN yarn build

FROM node:14

WORKDIR /app

COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package.json .

ENTRYPOINT ["node", "dist/server.cjs.js"]
