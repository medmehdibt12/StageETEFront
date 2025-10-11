# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Tools for native builds + git (harmless if unused)
RUN apk add --no-cache python3 make g++ libc6-compat git bash

# Use Yarn 4 via Corepack (reads packageManager from package.json)
RUN corepack enable && corepack prepare yarn@4.1.1 --activate

# Copy install metadata first (for better caching)
COPY package.json yarn.lock .yarnrc.yml ./

# Sanity checks (fail early with clear messages)
RUN ls -la && \
    [ -f package.json ] || (echo "package.json missing" && exit 1); \
    [ -f yarn.lock ]     || (echo "yarn.lock missing (commit it!)" && exit 1); \
    [ -f .yarnrc.yml ]   || (echo ".yarnrc.yml missing (create one)" && exit 1)

# Print versions and Yarn config
RUN node -v && corepack yarn -v && corepack yarn config -v || true

# Yarn settings that help CI
ENV YARN_ENABLE_GLOBAL_CACHE=true \
    YARN_NPM_REGISTRY_SERVER=https://registry.npmjs.org \
    YARN_NETWORK_TIMEOUT=600000

# Use buildx cache for Yarn downloads
# If this fails, see the fallback recipe below.
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable --inline-builds --verbose

# Bring in the rest and build (Vite -> dist)
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn build

# ---------- serve with Caddy ----------
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
