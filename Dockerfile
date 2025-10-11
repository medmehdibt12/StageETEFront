# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Tools for native deps (safe even if unused)
RUN apk add --no-cache python3 make g++ libc6-compat

# Enable Corepack (manages Yarn 4)
RUN corepack enable

# Copy Yarn 4 metadata first for better caching
# Make sure these files are committed to your repo:
#  - yarn.lock
#  - .yarnrc.yml
#  - .yarn/**  (if you use zero-installs; contains plugins/releases/cache)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/

# Install deps (immutable = fail if lockfile would change)
RUN yarn install --immutable

# App source & build
COPY . .
RUN yarn build   # Vite: builds to /app/dist

# ---------- serve with Caddy ----------
FROM caddy:2-alpine
# SPA config inside the image
COPY Caddyfile /etc/caddy/Caddyfile
# Serve the built assets
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
