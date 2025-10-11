# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Tools needed for many packages during install/build (harmless if unused)
RUN apk add --no-cache python3 make g++ libc6-compat git bash

# Use Yarn 4 via Corepack (reads packageManager: "yarn@4.1.1")
RUN corepack enable && corepack prepare yarn@4.1.1 --activate

# Copy only what's needed for install layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# First try strict/CI mode. If this fails on your first run (fresh lock), temporarily drop --immutable, then restore it.
RUN yarn install --immutable

# Bring in source and build
COPY . .
# Vite build
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn build    # outputs to /app/dist

# ---------- serve with Caddy ----------
FROM caddy:2-alpine
# SPA caddy config baked into the image
COPY Caddyfile /etc/caddy/Caddyfile
# Serve the built assets (Vite -> dist)
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
