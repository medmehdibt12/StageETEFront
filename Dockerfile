# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Tools for native deps (harmless if unused)
RUN apk add --no-cache python3 make g++ libc6-compat

# Use Yarn 4 via Corepack (reads "packageManager": "yarn@4.1.1")
RUN corepack enable && corepack prepare yarn@4.1.1 --activate

# Copy only what's needed for install layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# Install (fail if lock would change)
RUN yarn install --immutable

# Now copy the rest and build
COPY . .
RUN yarn build  # Vite outputs to /app/dist

# ---------- serve with Caddy ----------
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
