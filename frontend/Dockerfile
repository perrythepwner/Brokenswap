FROM node:18-bookworm as base

RUN mkdir -p /app/
RUN mkdir -p /app/connection-info-by-team/
WORKDIR /app/

COPY . .
RUN yarn install
RUN yarn typechain