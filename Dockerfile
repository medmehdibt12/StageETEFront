FROM node:20-bullseye AS build
WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.1.1 --activate

COPY package.json yarn.lock .yarnrc.yml ./

# (Optional) helpful env, but not required
ENV YARN_ENABLE_GLOBAL_CACHE=true \
    NODE_OPTIONS=--max-old-space-size=4096

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable --inline-builds

COPY . .
RUN yarn build

FROM caddy:2
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
EXPOSE 80
