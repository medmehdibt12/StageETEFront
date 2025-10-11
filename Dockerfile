FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat git bash
RUN corepack enable && corepack prepare yarn@4.1.1 --activate

# install layer
COPY package.json yarn.lock .yarnrc.yml ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    YARN_ENABLE_GLOBAL_CACHE=true \
    yarn --version && yarn install --immutable

# build
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
