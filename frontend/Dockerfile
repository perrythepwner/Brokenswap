FROM node:18-bookworm as base

RUN mkdir -p /app/
RUN mkdir -p /app/connection-info-by-team/
RUN mkdir -p /app/constants/

WORKDIR /app/

COPY . .

RUN yarn install
RUN yarn build