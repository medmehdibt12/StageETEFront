# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Tools commonly needed by packages (harmless if unused)
RUN apk add --no-cache python3 make g++ libc6-compat git bash

# Use Yarn 4 via Corepack (honors package.json "packageManager": "yarn@4.1.1")
RUN corepack enable && corepack prepare yarn@4.1.1 --activate

# Copy just what's needed for install layer
COPY package.json yarn.lock .yarnrc.yml ./

# Use a buildx cache for Yarn to avoid re-downloading on each CI build
# If this step fails, see the fallback in section 3 below.
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    YARN_ENABLE_GLOBAL_CACHE=true \
    yarn install --immutable

# Bring in the rest and build (Vite -> dist)
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn build

# ---------- serve with Caddy ----------
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
