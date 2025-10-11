# ---- build (Vite or CRA) ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # Vite -> dist, CRA -> build

# ---- serve with Caddy ----
FROM caddy:2-alpine
# Put the SPA site config into the container
COPY Caddyfile /etc/caddy/Caddyfile
# Copy the static build output
# If CRA, change /dist to /build
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
