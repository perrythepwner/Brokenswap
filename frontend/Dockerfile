FROM node:18-bookworm as base

RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn typechain