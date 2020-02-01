# Note: this Dockerfile is similar to our production file, but
# we also add a bunch of extra stuff like gosu, .npmrc, etc.
# BUILD PHASE
FROM node:12-alpine as build

WORKDIR /tmp/build

## Install source
COPY . /tmp/build/

## Install Deps,
RUN npm ci

## Run TypeScript Build
RUN npm run build

# TEST PHASE
FROM node:12-alpine as test
ARG SKIP_INTEGRATION_TESTS=false

WORKDIR /opt/svc/

## Copy artifacts from build layer
COPY --from=build /tmp/build/ /opt/svc/

RUN npm run lint

ENV JEST_JUNIT_OUTPUT="reports/unit/results.xml"
RUN npm run coverage -- --runInBand --ci --testResultsProcessor="jest-junit"

ENV JEST_JUNIT_OUTPUT="reports/unit/results-integ.xml"
RUN [ "$SKIP_INTEGRATION_TESTS" = true ] || echo "Integration tests ran"

# ARTIFACT PHASE
FROM node:12-alpine as artifact

WORKDIR /opt/svc

## Copy artifacts from build layer
COPY --from=build /tmp/build/dist/ /opt/svc/dist/
COPY --from=build /tmp/build/node_modules/ /opt/svc/node_modules/
COPY --from=build /tmp/build/package-lock.json /opt/svc/
COPY --from=build /tmp/build/package.json /opt/svc/
COPY --from=test /opt/svc/reports /opt/svc/reports
COPY --from=test /opt/svc/coverage /opt/svc/coverage

## Remove dev dependencies
RUN npm prune --production

EXPOSE 8080
ENTRYPOINT ["node"]
CMD ["server.js"]