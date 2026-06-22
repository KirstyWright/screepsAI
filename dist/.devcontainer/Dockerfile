FROM node:22-alpine

RUN apk add --update --no-cache git ca-certificates openssl openssh
# Activate pnpm via corepack (uses the version pinned in package.json's
# "packageManager" field). rollup runs through pnpm scripts, not globally.
RUN corepack enable
