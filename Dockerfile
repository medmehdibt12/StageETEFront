# ---- build (Vite or CRA) ----
FROM node:20-alpine AS build
WORKDIR /app

# Install build tools for native deps (safe even if you don't need them)
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy lockfile + manifest first for better caching
COPY package*.json ./

# If you use npm: keep npm ci, but make it verbose for debugging
# (If you use pnpm/yarn, replace the next two lines accordingly)
ENV NPM_CONFIG_LOGLEVEL=verbose
RUN npm ci --no-audit --no-fund

# Now copy the rest and build
COPY . .
RUN npm run build

# ---- serve with Caddy ----
FROM caddy:2-alpine
# SPA Caddyfile inside the image
COPY Caddyfile /etc/caddy/Caddyfile
# Vite outputs to /dist; CRA to /build (change if CRA)
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
