# ---------- build ----------
FROM node:20-bullseye AS build
WORKDIR /app

# Use Yarn 4 via Corepack
RUN corepack enable && corepack prepare yarn@4.1.1 --activate

# Copy install metadata first (cache-friendly)
COPY package.json yarn.lock .yarnrc.yml ./

# Helpful CI env (timeouts, memory)
ENV YARN_ENABLE_GLOBAL_CACHE=true \
    YARN_NPM_REGISTRY_SERVER=https://registry.npmjs.org \
    YARN_NETWORK_TIMEOUT=600000 \
    NODE_OPTIONS=--max-old-space-size=4096

# Install (strict). Remove the cache mount if you prefer simpler builds.
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable --inline-builds

# Build (Vite -> dist)
COPY . .
RUN yarn build

# ---------- serve with Caddy ----------
FROM caddy:2
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
