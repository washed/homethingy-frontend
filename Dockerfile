FROM --platform=$BUILDPLATFORM node:18 AS build
ARG TARGETPLATFORM
ARG BUILDPLATFORM

COPY . /usr/src/app/

WORKDIR /usr/src/app/

RUN npm install
RUN npm run build
RUN npm ci --omit=dev

FROM --platform=$BUILDPLATFORM node:18-alpine
WORKDIR /usr/src/app/
COPY --from=build /usr/src/app/package.json /usr/src/app/package.json
COPY --from=build /usr/src/app/node_modules/ /usr/src/app/node_modules/
COPY --from=build /usr/src/app/build/ /usr/src/app/build/
ENTRYPOINT ["node", "build"]
