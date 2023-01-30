FROM --platform=$BUILDPLATFORM node:18-alpine AS dev
ARG TARGETPLATFORM
ARG BUILDPLATFORM
WORKDIR /usr/src/app/
COPY package.json /usr/src/app/package.json
RUN npm install

FROM dev as prod-install
RUN npm ci --omit=dev

FROM dev as build
COPY . /usr/src/app/
RUN npm run build

FROM --platform=$BUILDPLATFORM node:18-alpine
WORKDIR /usr/src/app/
COPY --from=prod-install /usr/src/app/package.json /usr/src/app/package.json
COPY --from=prod-install /usr/src/app/node_modules/ /usr/src/app/node_modules/
COPY --from=build /usr/src/app/build/ /usr/src/app/build/
ENTRYPOINT ["node", "build"]
